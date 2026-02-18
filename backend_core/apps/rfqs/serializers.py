from rest_framework import serializers
from .models import RFQ, Shipment, Bid
from apps.users.models import User

class BidSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.username', read_only=True)
    vendor_company = serializers.CharField(source='vendor.company_name', read_only=True)

    class Meta:
        model = Bid
        fields = [
            'id', 'shipment', 'vendor', 'vendor_name', 'vendor_company', 
            'amount', 'currency', 'transit_time_days', 'free_days_demurrage', 
            'valid_until', 'is_winner', 'rank', 'submitted_at'
        ]
        read_only_fields = ['vendor', 'is_winner', 'rank', 'submitted_at']

    def validate(self, data):
        user = self.context['request'].user
        if user.role != 'VENDOR':
            raise serializers.ValidationError("Only registered Vendors are allowed to place bids.")
        return data


class ShipmentSerializer(serializers.ModelSerializer):
    # This helps fetch bids safely
    my_bid = serializers.SerializerMethodField()
    all_bids = serializers.SerializerMethodField()

    class Meta:
        model = Shipment
        fields = [
            'id', 'rfq', 'origin_port', 'destination_port', 
            'container_type', 'volume', 'target_price', 
            'ai_predicted_price', 
            'my_bid', 'all_bids'
        ]
        # AI Price is calculated by backend, user cannot edit it
        read_only_fields = ['ai_predicted_price']

    def get_my_bid(self, obj):
        """Returns the bid made by the CURRENT user (if any)."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Note: related_name='bids' is defined in your models.py
            bid = obj.bids.filter(vendor=request.user).first()
            if bid:
                return BidSerializer(bid).data
        return None

    def get_all_bids(self, obj):
        """
        Returns ALL bids only if the user is Admin or the Owner (Org).
        Vendors see nothing here (Blind Bidding), unless visible_bids is True.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 1. Admin / Owner sees everything
            if request.user.role in ['ADMIN', 'ORG']:
                return BidSerializer(obj.bids.all(), many=True).data
            
            # 2. If 'visible_bids' is ON, Vendors can see others
            if obj.rfq.visible_bids and request.user.role == 'VENDOR':
                return BidSerializer(obj.bids.all(), many=True).data

        return []


class RFQSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    shipments = ShipmentSerializer(many=True, read_only=True)

    class Meta:
        model = RFQ
        fields = [
            'id', 'created_by', 'created_by_username', 'title', 'status', 
            'created_at', 'deadline', 'current_round', 'is_public',
            'visible_target_price', 'visible_bids', 'shipments'
        ]
        read_only_fields = ['created_by', 'created_at', 'shipments']