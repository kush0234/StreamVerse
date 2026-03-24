from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access the view.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'SUPERADMIN']
        )


class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow superadmin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'SUPERADMIN'
        )


class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Custom permission to allow both admin and superadmin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'SUPERADMIN']
        )
