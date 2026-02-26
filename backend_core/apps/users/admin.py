from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User, OrganizationProfile, VendorProfile, SystemSettings

# Unregister the default Group model (optional, keeps admin clean)
from django.contrib.auth.models import Group
admin.site.unregister(Group)

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin, ModelAdmin):
    # This allows you to edit username and role directly in the list
    list_display = ('username', 'email', 'role', 'company_name', 'is_active', 'is_staff')
    list_editable = ('role', 'company_name', 'is_active', 'is_staff')
    
    # Unlocks all fields for editing in the detail view
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "email", "phone")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Roles & Company", {"fields": ("role", "company_name")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(ModelAdmin):
    list_display = ('id', 'user', 'industry')
    
    # 🚀 GOD MODE: Quickly edit Shipper industries
    list_editable = ('industry',)
    
    search_fields = ('user__username', 'user__company_name', 'industry')

@admin.register(VendorProfile)
class VendorProfileAdmin(ModelAdmin):
    list_display = ('user', 'scac_code', 'verified')
    list_editable = ('verified', 'scac_code') # Verify vendors with one click

@admin.register(SystemSettings)
class SystemSettingsAdmin(ModelAdmin):
    # We add ID as the first field so it can be the link
    list_display = ('id', 'site_name')
    # site_name is now the second field, so it's safe to edit
    list_editable = ('site_name',)
    # We explicitly tell Django that 'id' is the clickable link
    list_display_links = ('id',)