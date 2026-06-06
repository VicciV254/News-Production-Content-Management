from rest_framework import permissions
from accounts.models import User
from .models import NewsStory


class IsEditorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in (User.Role.EDITOR, User.Role.ADMIN)
        )


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN


class IsStoryOwnerOrEditor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in (User.Role.EDITOR, User.Role.ADMIN):
            return True
        return obj.journalist_id == request.user.id


class CanEditStory(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in (User.Role.EDITOR, User.Role.ADMIN):
            return True
        if obj.journalist_id != request.user.id:
            return False
        return obj.status in (
            NewsStory.Status.DRAFT,
            NewsStory.Status.CHANGES_REQUESTED,
        )


class CanDeleteStory(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in (User.Role.EDITOR, User.Role.ADMIN):
            return True
        if obj.journalist_id != request.user.id:
            return False
        return obj.status in (
            NewsStory.Status.DRAFT,
            NewsStory.Status.ARCHIVED,
        )
