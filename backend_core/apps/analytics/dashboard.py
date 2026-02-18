import json  # <--- NEW IMPORT
from django.db.models import Sum, Count
from apps.rfqs.models import RFQ, Shipment, Bid

def dashboard_callback(request, context):
    """
    Injects KPI data and Charts into the Unfold Admin Dashboard.
    """
    # 1. Calculate KPI Data
    total_rfqs = RFQ.objects.count()
    active_shipments = Shipment.objects.filter(rfq__status='OPEN').count()
    total_spend = Bid.objects.filter(is_winner=True).aggregate(Sum('amount'))['amount__sum'] or 0
    
    # 2. Prepare Chart Data (Bids per Vendor)
    vendor_stats = Bid.objects.values('vendor__username').annotate(bid_count=Count('id')).order_by('-bid_count')[:5]
    
    chart_data = {
        "labels": [v['vendor__username'] for v in vendor_stats],
        "datasets": [
            {
                "label": "Bids Placed",
                "data": [v['bid_count'] for v in vendor_stats],
                "backgroundColor": "#9333ea", 
            }
        ]
    }

    # 3. Update Context
    context.update({
        "kpi": [
            {
                "title": "Total RFQs",
                "metric": total_rfqs,
                "footer": "All time",
                "icon": "inventory_2",
            },
            {
                "title": "Active Shipments",
                "metric": active_shipments,
                "footer": "Currently bidding",
                "icon": "local_shipping",
            },
            {
                "title": "Total Spend",
                "metric": f"${total_spend:,.2f}",
                "footer": "Awarded Bids",
                "icon": "attach_money",
            },
        ],
        # USE JSON DUMPS HERE - Safer and cleaner
        "vendor_chart": json.dumps(chart_data),
    })

    return context