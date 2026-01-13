from rest_framework import permissions
from .models import Organization, OrganizationMember


class IsOrganizationOwner(permissions.BasePermission):
    """Check if user is the owner of the organization"""
    
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            return obj.owner == request.user
        return False


class IsOrganizationAdmin(permissions.BasePermission):
    """Check if user is admin or owner of the organization"""
    
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            try:
                membership = obj.members.get(user=request.user)
                return membership.role in [
                    OrganizationMember.Role.OWNER,
                    OrganizationMember.Role.ADMIN
                ]
            except OrganizationMember.DoesNotExist:
                return False
        return False


class IsOrganizationMember(permissions.BasePermission):
    """Check if user is any active member of the organization"""
    
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            return obj.members.filter(user=request.user, is_active=True).exists()
        return False


class CanCreateEvents(permissions.BasePermission):
    """Check if user can create events in organization"""
    
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            try:
                membership = obj.members.get(user=request.user, is_active=True)
                return membership.can_create_events
            except OrganizationMember.DoesNotExist:
                return False
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read-only for everyone, write only for admins"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class CanManageOrganizationTeam(permissions.BasePermission):
    """Check if user can add/remove team members"""
    
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Organization):
            try:
                membership = obj.members.get(user=request.user, is_active=True)
                return membership.can_manage_team
            except OrganizationMember.DoesNotExist:
                return False
        return False