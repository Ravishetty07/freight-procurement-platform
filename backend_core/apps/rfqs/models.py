from django.db import models
from django.conf import settings

class RFQ(models.Model):
    """The main container for a freight request."""
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        OPEN = "OPEN", "Open for Bidding"
        CLOSED = "CLOSED", "Closed / Awarded"
        CANCELLED = "CANCELLED", "Cancelled"

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, help_text="e.g., Q3 Import Logistics - Asia to US")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    
    created_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateTimeField(help_text="Bidding closes at this time")
    
    current_round = models.IntegerField(default=1, help_text="Current active bidding round")
    is_public = models.BooleanField(default=False, help_text="If true, any vendor can see it")

    # --- VISIBILITY SETTINGS (Moved here) ---
    visible_target_price = models.BooleanField(default=False, help_text="If True, vendors see the Target Price")
    visible_bids = models.BooleanField(default=False, help_text="If True, vendors see other vendors' bids")

    def __str__(self):
        return f"{self.title} (Round {self.current_round})"

class Shipment(models.Model):
    """A specific lane or container within an RFQ."""
    rfq = models.ForeignKey(RFQ, related_name="shipments", on_delete=models.CASCADE)
    
    origin_port = models.CharField(max_length=100)
    destination_port = models.CharField(max_length=100)
    
    # Equipment Types
    container_type = models.CharField(max_length=50, default="40HC") 
    volume = models.IntegerField(default=1, help_text="Number of containers")
    
    # Pricing Fields
    ai_predicted_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Internal AI Reference")
    target_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Manual Price set by Admin")

    def __str__(self):
        return f"{self.origin_port} -> {self.destination_port} ({self.container_type})"
    
class Bid(models.Model):
    """An offer from a Vendor for a specific Shipment."""
    shipment = models.ForeignKey(Shipment, related_name="bids", on_delete=models.CASCADE)
    vendor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Financials
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total Freight Cost")
    currency = models.CharField(max_length=3, default="USD")
    
    # Logistics Details (SaaS Features)
    transit_time_days = models.IntegerField(help_text="Estimated days at sea")
    free_days_demurrage = models.IntegerField(default=7, help_text="Free days at destination before charges")
    valid_until = models.DateField()
    
    # Status
    is_winner = models.BooleanField(default=False)
    rank = models.IntegerField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['amount']
        # STRICT RULE: A vendor can only have ONE bid per shipment.
        unique_together = ('shipment', 'vendor') 

    def __str__(self):
        return f"{self.vendor.username} - ${self.amount}"