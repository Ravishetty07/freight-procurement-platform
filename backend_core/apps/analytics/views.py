from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, F, Avg, Min
from apps.rfqs.models import RFQ, Shipment, Bid

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Basic Counts
        total_rfqs = RFQ.objects.filter(created_by=user).count()
        total_shipments = Shipment.objects.filter(rfq__created_by=user).count()
        
        # 2. Savings Calculation (AI Target vs Best Bid)
        # Find shipments that have both a target price and at least one bid
        completed_shipments = Shipment.objects.filter(
            rfq__created_by=user, 
            target_price__isnull=False, 
            bids__isnull=False
        ).distinct()
        
        total_savings = 0
        total_spend = 0
        
        for shipment in completed_shipments:
            # Get the lowest bid for this shipment
            best_bid = shipment.bids.order_by('amount').first()
            if best_bid:
                # Savings = (AI Predicted Price) - (Actual Bid Price)
                # If AI said $5000 and Vendor bid $4500, we saved $500.
                potential_saving = float(shipment.target_price) - float(best_bid.amount)
                if potential_saving > 0:
                    total_savings += potential_saving
                total_spend += float(best_bid.amount)

        # 3. Bids by Vendor (Who is active?)
        top_vendors = Bid.objects.filter(shipment__rfq__created_by=user).values(
            'vendor__username', 'vendor__company_name'
        ).annotate(bid_count=Count('id')).order_by('-bid_count')[:5]

        return Response({
            "kpi": {
                "total_rfqs": total_rfqs,
                "active_shipments": total_shipments,
                "total_savings": round(total_savings, 2),
                "total_spend": round(total_spend, 2)
            },
            "vendors": top_vendors
        })