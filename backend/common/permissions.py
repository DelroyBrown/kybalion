from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """Object-level permission: only the owner of a record may see or act on it."""

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id
