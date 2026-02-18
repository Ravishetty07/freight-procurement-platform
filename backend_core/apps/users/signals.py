from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, OrganizationProfile, VendorProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatic Trigger:
    When a User is saved, check if it's new. 
    If yes, create the corresponding profile based on their Role.
    """
    if created:
        print(f"⚡ Signal Triggered: Creating profile for {instance.username} ({instance.role})")
        
        if instance.role == User.Roles.VENDOR:
            VendorProfile.objects.create(user=instance, scac_code="TEMP", services_offered="General Freight")
        
        elif instance.role == User.Roles.ORGANIZATION:
            OrganizationProfile.objects.create(user=instance, industry="General", address="Please Update")