import os
import django
import sys

# 1. Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, OrganizationProfile, VendorProfile
from apps.rfqs.models import RFQ

def run_seed():
    print("🚨 FLUSHING DATABASE (Deleting old data)...")
    
    # Delete all data to start fresh
    # Note: Deleting User cascades to profiles, so we just need to delete RFQs and Users
    RFQ.objects.all().delete()
    User.objects.all().delete()
    print("✅ Old data wiped.")

    print("\n🌱 CREATING NEW USERS...")

    # --- 1. SUPER ADMIN ---
    admin = User.objects.create_superuser(
        username='super_admin',
        email='admin@shipsy.com',
        password='password123',
        role='ADMIN',
        company_name='Shipsy HQ'
    )
    print(f"👑 Super Admin Created: {admin.username}")

    # --- 2. ORGANIZATION (The Shipper) ---
    org_user = User.objects.create_user(
        username='tesla_org',
        email='musk@tesla.com',
        password='password123',
        role='ORG',
        company_name='Tesla Logistics'
    )
    
    # FIX: Use update_or_create to handle the Signal's auto-creation
    OrganizationProfile.objects.update_or_create(
        user=org_user,
        defaults={
            'industry': 'Automotive',
            'address': '1 Tesla Road, Austin, TX'
        }
    )
    print(f"🏭 Organization Created: {org_user.username}")

    # --- 3. VENDOR 1 (The Forwarder) ---
    ven1 = User.objects.create_user(
        username='maersk_vendor',
        email='contact@maersk.com',
        password='password123',
        role='VENDOR',
        company_name='Maersk Line'
    )
    # FIX: Use update_or_create
    VendorProfile.objects.update_or_create(
        user=ven1,
        defaults={
            'scac_code': 'MAEU',
            'services_offered': 'Ocean FCL, Logistics',
            'verified': True
        }
    )
    print(f"🚚 Vendor 1 Created: {ven1.username}")

    # --- 4. VENDOR 2 (Competitor) ---
    ven2 = User.objects.create_user(
        username='dhl_vendor',
        email='contact@dhl.com',
        password='password123',
        role='VENDOR',
        company_name='DHL Global'
    )
    # FIX: Use update_or_create
    VendorProfile.objects.update_or_create(
        user=ven2,
        defaults={
            'scac_code': 'DHLF',
            'services_offered': 'Air Freight, LCL',
            'verified': True
        }
    )
    print(f"✈️ Vendor 2 Created: {ven2.username}")

    print("\n✅ SETUP COMPLETE. You can now login with 'tesla_org' to create RFQs, or 'maersk_vendor' to bid.")

if __name__ == '__main__':
    run_seed()