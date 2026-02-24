from django.db import models
from django.conf import settings
from apps.rfqs.models import Bid

class ChatMessage(models.Model):
    # Link the chat directly to a specific Bid
    bid = models.ForeignKey(Bid, related_name='messages', on_delete=models.CASCADE)
    
    # Who sent the message? (Can be the Shipper/Org or the Carrier/Vendor)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at'] # Oldest messages at the top, newest at the bottom

    def __str__(self):
        return f"Message by {self.sender.username} on Bid #{self.bid.id}"