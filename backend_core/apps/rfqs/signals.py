from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Bid

@receiver(post_save, sender=Bid)
def bid_notification(sender, instance, created, **kwargs):
    """
    Triggered whenever a new Bid is placed.
    Sends a WebSocket message to the RFQ group.
    """
    if created:
        print(f"📡 New Bid Detected: ${instance.amount} on Shipment #{instance.shipment.id}")
        
        channel_layer = get_channel_layer()
        group_name = f"rfq_{instance.shipment.rfq.id}"

        # Send message to the group
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "bid_update", # Matches the method name in consumers.py
                "message": {
                    "shipment_id": instance.shipment.id,
                    "amount": float(instance.amount),
                    "vendor": instance.vendor.username
                    # FIXED: Removed the "rank" line from here!
                }
            }
        )