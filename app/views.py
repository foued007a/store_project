from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Sale, Client, Product, Purchase
from .serializers import SaleSerializer, ClientSerializer, ProductSerializer, PurchaseSerializer, UserSerializer
from .permissions import IsOwner, IsAuthenticatedAndOwner

User = get_user_model()

# ✅ تسجيل مستخدم جديد
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        # Remove role from registration, only create Client
        if not username or not password:
            return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
        # Create a User with default role 'customer' (not exposed to user)
        user = User.objects.create_user(username=username, password=password, role='customer')
        # Create a Client linked to this user
        Client.objects.create(user=user)
        return Response({"message": "Client created successfully"}, status=status.HTTP_201_CREATED)

# ✅ تسجيل الدخول وإصدار JWT Token
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            # Add role to access token
            access_token = refresh.access_token
            access_token["role"] = user.role
            return Response({"refresh": str(refresh), "access": str(access_token)})
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# ✅ ViewSets مع الصلاحيات الجديدة
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsOwner]  # فقط المالك يمكنه التعديل

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # أي مستخدم موثوق يمكنه رؤية المستخدمين

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticatedAndOwner]  # فقط المالك يرى بياناته أو العميل يرى بياناته الخاصة

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]  # جميع المستخدمين الموثوقين يمكنهم الشراء

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, IsOwner]  # المالك فقط يمكنه رؤية مبيعاته

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        invoice_data = serializer.to_representation(sale)
        return Response(invoice_data, status=status.HTTP_201_CREATED)

# ✅ عرض تاريخ المشتريات للمستخدم
class ClientPurchaseHistoryView(viewsets.ReadOnlyModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Sale.objects.filter(client__user=self.request.user).order_by('-sale_date')
  



