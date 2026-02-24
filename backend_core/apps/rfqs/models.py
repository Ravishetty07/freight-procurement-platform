from django.db import models
from django.conf import settings

class RFQ(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        OPEN = "OPEN", "Open for Bidding"
        CLOSED = "CLOSED", "Closed / Awarded"
        CANCELLED = "CANCELLED", "Cancelled"

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, help_text="e.g., Q3 Import Logistics - Asia to US")
    description = models.TextField(blank=True, null=True, help_text="Detailed instructions for vendors")
    
    # NEW: File Attachment for RFQ (Specs, Packing List, etc.)
    file = models.FileField(upload_to='rfq_docs/', blank=True, null=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateTimeField()
    
    # Visibility Settings
    visible_target_price = models.BooleanField(default=False)
    visible_bids = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class Shipment(models.Model):
    """A specific lane within an RFQ."""
    rfq = models.ForeignKey(RFQ, related_name="shipments", on_delete=models.CASCADE)
    
    origin_port = models.CharField(max_length=100)
    destination_port = models.CharField(max_length=100)
    
    # SIMPLIFIED: Defaulting to 40HC, but keeping the field for logic
    container_type = models.CharField(max_length=50, default="40HC") 
    volume = models.IntegerField(default=1)
    
    # Removed AI Price from here (will be calculated only in Dashboard for analysis)
    target_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.origin_port} -> {self.destination_port}"
    
class Bid(models.Model):
    # --- NEW: Counter Offer Status Choices ---
    class CounterStatus(models.TextChoices):
        NONE = "NONE", "No Counter Offer"
        PENDING = "PENDING", "Counter Offer Pending"
        ACCEPTED = "ACCEPTED", "Counter Offer Accepted"
        REJECTED = "REJECTED", "Counter Offer Rejected"

    shipment = models.ForeignKey(Shipment, related_name="bids", on_delete=models.CASCADE)
    vendor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    
    transit_time_days = models.IntegerField(help_text="Estimated days at sea")
    free_days_demurrage = models.IntegerField(default=14, help_text="Free days at destination")
    valid_until = models.DateField()
    file = models.FileField(upload_to='bid_docs/', blank=True, null=True)

    # --- NEW: Counter Offer Fields ---
    counter_offer_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    counter_offer_status = models.CharField(max_length=20, choices=CounterStatus.choices, default=CounterStatus.NONE)
    
    # --- NEW: Field to store the generated PDF Contract ---
    contract_file = models.FileField(upload_to='contracts/', blank=True, null=True)

    is_winner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bid {self.amount} by {self.vendor.username}"