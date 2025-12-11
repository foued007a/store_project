from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    يسمح فقط للمالك (owner) بتعديل أو حذف البيانات، بينما يمكن للآخرين قراءتها فقط.
    """
    def has_object_permission(self, request, view, obj):
        # السماح بالقراءة لأي مستخدم (GET, HEAD, أو OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        # السماح فقط للمالك (owner) بالتعديل أو الحذف
        return request.user.is_authenticated and request.user.role == 'owner'

class IsAuthenticatedAndOwner(permissions.BasePermission):
    """
    يسمح فقط للمستخدمين المصادقين بالوصول إلى بياناتهم الخاصة.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # السماح فقط إذا كان المستخدم هو المالك (owner) أو هو صاحب البيانات
        return request.user.role == 'owner' or (hasattr(obj, 'user') and obj.user == request.user)
