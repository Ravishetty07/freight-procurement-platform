from rest_framework import permissions

class IsVendorOnly(permissions.BasePermission):
    """
    Allows access only to users with the role 'VENDOR'.
    """
    def has_permission(self, request, view):
        # Must be logged in AND have role='VENDOR'
        return request.user.is_authenticated and request.user.role == 'VENDOR'

class IsShipperOrAdmin(permissions.BasePermission):
    """
    Allows access only to Organization (Shipper) or Admin.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['ADMIN', 'ORG']