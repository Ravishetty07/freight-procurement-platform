import pandas as pd
from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RFQ, Shipment, Bid
from .serializers import RFQSerializer, ShipmentSerializer, BidSerializer
from .permissions import IsOrganizationOrReadOnly
from .pdf_service import generate_contract_pdf

class RFQViewSet(viewsets.ModelViewSet):
    serializer_class = RFQSerializer
    # 🔒 SECURE: Only Org can create, Vendors can only read
    permission_classes = [IsOrganizationOrReadOnly] 
    parser_classes = [MultiPartParser, FormParser] # Allows file uploads

    def get_queryset(self):
        user = self.request.user
        
        # 🚀 THE FIX: Fetch everything in one single, fast database query
        optimized_queryset = RFQ.objects.select_related('created_by').prefetch_related(
            'shipments',
            'shipments__bids',
            'shipments__bids__vendor'
        ).order_by('-created_at')

        if user.role == 'VENDOR':
            # Vendors see OPEN RFQs
            return optimized_queryset.filter(status='OPEN')
        if user.role == 'ADMIN':
            return optimized_queryset.all()
            
        # Org sees ONLY their own
        return optimized_queryset.filter(created_by=user)

    def perform_create(self, serializer):
        # Automatically assign the creator
        serializer.save(created_by=self.request.user)
        
        
class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    # 🔒 SECURE: Only Org can add shipments
    permission_classes = [IsOrganizationOrReadOnly]

    def perform_create(self, serializer):
        # Simply save the shipment. NO AI LOGIC HERE anymore.
        serializer.save()


class BidViewSet(viewsets.ModelViewSet):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'VENDOR':
            return Bid.objects.filter(vendor=user)
        return Bid.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role == 'ORG':
             raise permissions.exceptions.PermissionDenied("Organizations cannot place bids.")
        serializer.save(vendor=self.request.user)

    @action(detail=True, methods=['post'])
    def award(self, request, pk=None):
        bid = self.get_object()
        
        # Security: Make sure only the Org who created the RFQ can award it
        if bid.shipment.rfq.created_by != request.user:
            return Response({"error": "Not authorized to award this bid."}, status=403)
        
        # 1. Un-award any other bids for this specific shipment
        bid.shipment.bids.update(is_winner=False)
        
        # 2. Mark this specific bid as the winner
        bid.is_winner = True
        
        # 3. 🚀 AUTO-GENERATE THE PDF CONTRACT
        if not bid.contract_file:
            pdf_file = generate_contract_pdf(bid)
            if pdf_file:
                bid.contract_file = pdf_file

        bid.save()
        
        return Response({"message": "Bid successfully awarded and Contract generated!"})

    # ----------------------------------------------------
    # COUNTER-OFFER LOGIC
    # ----------------------------------------------------
    @action(detail=True, methods=['post'])
    def make_counter(self, request, pk=None):
        bid = self.get_object()
        # Security: Only the Shipper who owns the RFQ can make a counter-offer
        if bid.shipment.rfq.created_by != request.user:
            return Response({"error": "Not authorized."}, status=403)
        
        counter_amount = request.data.get('counter_amount')
        if not counter_amount:
            return Response({"error": "counter_amount is required."}, status=400)

        bid.counter_offer_amount = counter_amount
        bid.counter_offer_status = 'PENDING'
        bid.save()
        return Response({"message": "Counter offer sent successfully.", "counter_amount": bid.counter_offer_amount})

    @action(detail=True, methods=['post'])
    def accept_counter(self, request, pk=None):
        bid = self.get_object()
        if bid.vendor != request.user:
            return Response({"error": "Not authorized."}, status=403)
        
        if bid.counter_offer_status != 'PENDING':
            return Response({"error": "No pending counter offer to accept."}, status=400)

        bid.amount = bid.counter_offer_amount
        bid.counter_offer_status = 'ACCEPTED'
        bid.save()
        return Response({"message": "Counter offer accepted. Bid amount updated."})

    @action(detail=True, methods=['post'])
    def reject_counter(self, request, pk=None):
        bid = self.get_object()
        if bid.vendor != request.user:
            return Response({"error": "Not authorized."}, status=403)

        if bid.counter_offer_status != 'PENDING':
            return Response({"error": "No pending counter offer to reject."}, status=400)

        bid.counter_offer_status = 'REJECTED'
        bid.save()
        return Response({"message": "Counter offer rejected."})