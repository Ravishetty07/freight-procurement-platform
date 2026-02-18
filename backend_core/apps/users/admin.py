from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, OrganizationProfile, VendorProfile, SystemSettings

# Unregister the default Group model (optional, keeps admin clean)
from django.contrib.auth.models import Group
admin.site.unregister(Group)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Admin View for our Custom User Model"""
    
    # Add our custom fields to the "Edit User" page
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Profile', {'fields': ('role', 'company_name', 'phone')}),
    )
    
    # Add our custom fields to the "Add User" page
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'company_name', 'phone')}),
    )
    
    # Columns to show in the list view
    list_display = ('username', 'email', 'role', 'company_name', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'company_name')
    ordering = ('username',)

@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'industry')

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'scac_code', 'verified')

@admin.register(SystemSettings)
class SettingsAdmin(admin.ModelAdmin):
    """Singleton Admin for System Configuration"""
    def has_add_permission(self, request):
        # If a row already exists, don't allow adding another
        return not SystemSettings.objects.exists()