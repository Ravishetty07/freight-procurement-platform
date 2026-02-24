from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from apps.rfqs.models import Bid

class ChatMessageViewSet(viewsets.ModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Basic security: only return messages for bids the user is involved in
        user = self.request.user
        if user.role == 'VENDOR':
            return ChatMessage.objects.filter(bid__vendor=user)
        # ORG sees messages for bids on their RFQs
        return ChatMessage.objects.filter(bid__shipment__rfq__created_by=user)

    def perform_create(self, serializer):
        # Automatically set the sender to the logged-in user
        serializer.save(sender=self.request.user)

    # Custom Endpoint: GET /api/chat/bid/<bid_id>/
    @action(detail=False, methods=['get'], url_path='bid/(?P<bid_id>[^/.]+)')
    def for_bid(self, request, bid_id=None):
        messages = self.get_queryset().filter(bid_id=bid_id)
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)