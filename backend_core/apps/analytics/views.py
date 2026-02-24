from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.rfqs.models import RFQ, Bid
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from django.db.models.functions import TruncDate

User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        seven_days_ago = now - timedelta(days=6) # Last 7 days including today

        if user.role == 'VENDOR':
            active_bids = Bid.objects.filter(vendor=user, is_winner=False).count()
            won_bids = Bid.objects.filter(vendor=user, is_winner=True).count()
            
            # REAL DATA: Bids submitted per day (Last 7 Days)
            bids_by_day = Bid.objects.filter(vendor=user, created_at__date__gte=seven_days_ago) \
                .annotate(date=TruncDate('created_at')) \
                .values('date') \
                .annotate(count=Count('id'))
            
            chart_data = []
            for i in range(7):
                day = (seven_days_ago + timedelta(days=i)).date()
                daily_count = next((item['count'] for item in bids_by_day if item['date'] == day), 0)
                chart_data.append({"name": day.strftime("%a"), "bids": daily_count})

            return Response({
                "active_bids": active_bids,
                "won_bids": won_bids,
                "pie_data": [
                    {"name": "Won Awards", "value": won_bids if won_bids > 0 else 1}, # Fallback to 1 to render empty ring
                    {"name": "Pending Bids", "value": active_bids if active_bids > 0 else 1}
                ],
                "chart_data": chart_data
            })

        else:
            # FOR SHIPPERS (ORG/ADMIN)
            total_rfqs = RFQ.objects.filter(created_by=user).count()
            total_bids = Bid.objects.filter(shipment__rfq__created_by=user).count()
            total_vendors = User.objects.filter(role='VENDOR').count()
            
            # REAL DATA: RFQ Status Breakdown for Pie Chart
            open_rfqs = RFQ.objects.filter(created_by=user, status='OPEN').count()
            closed_rfqs = RFQ.objects.filter(created_by=user, status='CLOSED').count()
            draft_rfqs = RFQ.objects.filter(created_by=user, status='DRAFT').count()
            
            # REAL DATA: RFQs created per day (Last 7 Days)
            rfqs_by_day = RFQ.objects.filter(created_by=user, created_at__date__gte=seven_days_ago) \
                .annotate(date=TruncDate('created_at')) \
                .values('date') \
                .annotate(count=Count('id'))
                
            chart_data = []
            for i in range(7):
                day = (seven_days_ago + timedelta(days=i)).date()
                daily_count = next((item['count'] for item in rfqs_by_day if item['date'] == day), 0)
                chart_data.append({"name": day.strftime("%a"), "rfqs": daily_count})

            return Response({
                "total_rfqs": total_rfqs,
                "total_bids": total_bids,
                "total_users": total_vendors,
                "pie_data": [
                    {"name": "Open/Live", "value": open_rfqs if open_rfqs > 0 else 1},
                    {"name": "Closed/Awarded", "value": closed_rfqs if closed_rfqs > 0 else 1},
                    {"name": "Drafts", "value": draft_rfqs if draft_rfqs > 0 else 1},
                ],
                "chart_data": chart_data
            })