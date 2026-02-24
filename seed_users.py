import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, VendorProfile, OrganizationProfile

def create_users():
    print("🌱 Starting Database Seed...")

    # 1. Create Admin
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("✅ Admin created (admin / admin123)")
    else:
        print("ℹ️ Admin already exists")

    # 2. Create Tesla (Organization)
    if not User.objects.filter(username='tesla_org').exists():
        user = User.objects.create_user(
            username='tesla_org',
            email='logistics@tesla.com',
            password='password123',
            role='ORG',
            company_name='Tesla Inc.'
        )
        OrganizationProfile.objects.create(user=user, company_name='Tesla Inc.')
        print("✅ Tesla Org created (tesla_org / password123)")
    else:
        print("ℹ️ Tesla Org already exists")

    # 3. Create Maersk (Vendor)
    if not User.objects.filter(username='maersk_vendor').exists():
        user = User.objects.create_user(
            username='maersk_vendor',
            email='sales@maersk.com',
            password='password123',
            role='VENDOR',
            company_name='Maersk Line'
        )
        VendorProfile.objects.create(user=user, company_name='Maersk Line')
        print("✅ Maersk Vendor created (maersk_vendor / password123)")
    else:
        print("ℹ️ Maersk Vendor already exists")

    print("\n🚀 Database is ready for login!")

if __name__ == '__main__':
    create_users()