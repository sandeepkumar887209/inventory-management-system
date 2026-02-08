from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffOrAdmin(BasePermission):
    """
    Allow read-only access to authenticated users.
    Write access only to staff or admin users.
    """

    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS to authenticated users
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Allow POST, PUT, PATCH, DELETE only to staff/admin
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
