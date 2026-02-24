from rest_framework import permissions

class IsOrganizationOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow Organizations (or Admins) to create/edit RFQs.
    Vendors can only view (GET) or place bids.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Write permissions (POST, PUT, DELETE) are only for ORG or ADMIN
        return request.user.role in ['ORG', 'ADMIN'] or request.user.is_staff