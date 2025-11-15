from rest_framework import serializers
from .models import User, Client, Product, Purchase, Sale

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    client_name = serializers.CharField(source='client.user.username', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'product', 'product_name', 'client', 'client_name', 'quantity', 'sale_date']

    def to_representation(self, instance):
        """ تحويل البيانات بحيث تكون على شكل فاتورة إلكترونية """
        return {
            "invoice_id": instance.id,
            "customer": instance.client_name if instance.client else "Guest",
            "product": instance.product_name,
            "quantity": instance.quantity,
            "total_price": instance.quantity * instance.product.price,
            "date": instance.sale_date.strftime('%Y-%m-%d %H:%M:%S'),
        }