from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.views import LoginView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),  # لوحة التحكم في Django
    path("api/", include("app.urls")),  # تضمين مسارات التطبيق
    path(
        "api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"
    ),  # الحصول على التوكن
    path(
        "api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"
    ),  # تحديث التوكن
    path("login/", LoginView.as_view(), name="login"),  # مسار تسجيل الدخول
]

# إعدادات عرض الملفات الثابتة (CSS, JavaScript, Images)
