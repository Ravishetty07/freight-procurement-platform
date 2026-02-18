from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom User Model with Roles"""
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        ORGANIZATION = "ORG", "Organization (Shipper)"
        VENDOR = "VENDOR", "Vendor (Freight Forwarder)"

    role = models.CharField(max_length=10, choices=Roles.choices, default=Roles.ADMIN)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class OrganizationProfile(models.Model):
    """Details for Shippers (The ones creating RFQs)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='org_profile')
    industry = models.CharField(max_length=100)
    address = models.TextField()
    
    def __str__(self):
        return f"{self.user.company_name} Profile"

class VendorProfile(models.Model):
    """Details for Freight Forwarders (The ones bidding)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    scac_code = models.CharField(max_length=10, help_text="Standard Carrier Alpha Code")
    services_offered = models.TextField(help_text="e.g., FCL, LCL, Air Freight")
    verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.company_name} (Vendor)"

class SystemSettings(models.Model):
    """Global settings controlled by Admin"""
    site_name = models.CharField(max_length=100, default="Shipsy Clone")
    maintenance_mode = models.BooleanField(default=False, help_text="If True, only Admins can log in")
    allow_new_registrations = models.BooleanField(default=True)

    def __str__(self):
        return "System Configuration"

    class Meta:
        verbose_name_plural = "System Settings"