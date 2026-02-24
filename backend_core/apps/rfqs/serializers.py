from rest_framework import serializers
from .models import RFQ, Shipment, Bid

class BidSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.username', read_only=True)
    vendor_company = serializers.CharField(source='vendor.company_name', read_only=True)
    
    origin_port = serializers.CharField(source='shipment.origin_port', read_only=True)
    destination_port = serializers.CharField(source='shipment.destination_port', read_only=True)
    rfq_title = serializers.CharField(source='shipment.rfq.title', read_only=True)
    rfq_id = serializers.IntegerField(source='shipment.rfq.id', read_only=True)

    class Meta:
        model = Bid
        fields = [
            'id', 'shipment', 'vendor', 'vendor_name', 'vendor_company', 
            'amount', 'currency', 'transit_time_days', 'free_days_demurrage', 
            'valid_until', 'file', 'is_winner', 'created_at',
            'origin_port', 'destination_port', 'rfq_title', 'rfq_id',
            'counter_offer_amount', 'counter_offer_status', # <--- I ADDED THE COMMA HERE
            'contract_file'
        ]
        read_only_fields = ['vendor', 'is_winner', 'created_at', 'counter_offer_status', 'contract_file']
        
    def validate(self, data):
        user = self.context['request'].user
        if user.role == 'ORG':
            raise serializers.ValidationError("Organizations cannot submit bids.")
        return data

class ShipmentSerializer(serializers.ModelSerializer):
    my_bid = serializers.SerializerMethodField()
    all_bids = serializers.SerializerMethodField()

    class Meta:
        model = Shipment
        fields = [
            'id', 'rfq', 'origin_port', 'destination_port', 
            'container_type', 'volume', 'target_price', 
            'my_bid', 'all_bids'
        ]

    def get_my_bid(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            bid = obj.bids.filter(vendor=request.user).first()
            if bid:
                # ADD context=self.context HERE
                return BidSerializer(bid, context=self.context).data 
        return None

    def get_all_bids(self, obj):
        request = self.context.get('request')
        user = request.user
        
        # 1. Admin / Org (Owner) sees all bids
        if user.role in ['ADMIN', 'ORG']:
            # ADD context=self.context HERE
            return BidSerializer(obj.bids.all(), many=True, context=self.context).data
        
        # 2. Vendor sees bids ONLY if "Visible Bids" is ON
        if obj.rfq.visible_bids and user.role == 'VENDOR':
            # ADD context=self.context HERE
            return BidSerializer(obj.bids.all(), many=True, context=self.context).data

        return []

class RFQSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    shipments = ShipmentSerializer(many=True, read_only=True)

    class Meta:
        model = RFQ
        fields = [
            'id', 'created_by', 'created_by_username', 'title', 'description', 
            'file', 'status', 'created_at', 'deadline', 
            'visible_target_price', 'visible_bids', 'shipments'
        ]
        read_only_fields = ['created_by', 'created_at', 'shipments']