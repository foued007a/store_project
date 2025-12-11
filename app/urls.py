from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    ProductViewSet,
    UserViewSet,
    ClientViewSet,
    PurchaseViewSet,
    SaleViewSet,
    ClientPurchaseHistoryView,
)

# إنشاء راوتر للـ ViewSets
router = DefaultRouter()
router.register(r"products", ProductViewSet)
router.register(r"users", UserViewSet)
router.register(r"clients", ClientViewSet)
router.register(r"purchases", PurchaseViewSet)
router.register(r"sales", SaleViewSet, basename="sale")
router.register(r"client-history", ClientPurchaseHistoryView, basename="client-history")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
]  # لا تكرر /api/ هنا، لأنه موجود في store/urls.py

# Include router URLs
urlpatterns += router.urls
