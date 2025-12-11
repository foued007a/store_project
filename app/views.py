from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Sale, Client, Product, Purchase
from .serializers import (
    SaleSerializer,
    ClientSerializer,
    ProductSerializer,
    PurchaseSerializer,
    UserSerializer,
)
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
            return Response(
                {"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        # Create a User with default role 'customer' (not exposed to user)
        user = User.objects.create_user(
            username=username, password=password, role="customer"
        )
        # Create a Client linked to this user
        Client.objects.create(user=user)
        return Response(
            {"message": "Client created successfully"}, status=status.HTTP_201_CREATED
        )


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
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


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

    def get_permissions(self):
        if self.request.method == "POST":
            # Allow anyone to register a new client
            return [AllowAny()]
        # For other operations, use the original permission
        return [IsAuthenticated(), IsAuthenticatedAndOwner()]

    def create(self, request, *args, **kwargs):
        # Extract user data
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")

        # Validate required fields
        if not username or not password:
            return Response(
                {"error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Create user with customer role
        user = User.objects.create_user(
            username=username, password=password, email=email, role="customer"
        )

        # Create client with the remaining data
        client_data = {
            "user": user.id,
            "phone": request.data.get("phone", ""),
            "address": request.data.get("address", ""),
        }

        serializer = self.get_serializer(data=client_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Return success response
        return Response(
            {"message": "Client registered successfully"},
            status=status.HTTP_201_CREATED,
        )

    permission_classes = [
        IsAuthenticatedAndOwner
    ]  # فقط المالك يرى بياناته أو العميل يرى بياناته الخاصة


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]  # جميع المستخدمين الموثوقين يمكنهم الشراء


class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter sales based on user role
        user = self.request.user
        if user.role == "owner":
            # Owners can see all sales
            return Sale.objects.all().order_by("-sale_date")
        else:
            # Customers can only see their own sales
            try:
                client = Client.objects.get(user=user)
                return Sale.objects.filter(client=client).order_by("-sale_date")
            except Client.DoesNotExist:
                return Sale.objects.none()

    def create(self, request, *args, **kwargs):
        # Get client from the authenticated user if it's a customer
        user = request.user
        client = None

        if user.role == "customer":
            try:
                client = Client.objects.get(user=user)
            except Client.DoesNotExist:
                pass

        # Add client to request data if available
        data = request.data.copy()
        if client:
            data["client"] = client.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        invoice_data = serializer.to_representation(sale)
        return Response(invoice_data, status=status.HTTP_201_CREATED)


# ✅ عرض تاريخ المشتريات للمستخدم
class ClientPurchaseHistoryView(viewsets.ReadOnlyModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            client = Client.objects.get(user=self.request.user)
            return Sale.objects.filter(client=client).order_by("-sale_date")
        except Client.DoesNotExist:
            return Sale.objects.none()
