from rest_framework import serializers
from .models import User, Client, Product, Purchase, Sale


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class PurchaseSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Purchase
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "supplier",
            "unit_cost",
            "notes",
            "purchase_date",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["unit_cost"] = (
            float(instance.unit_cost) if instance.unit_cost is not None else 0.0
        )
        data["purchase_date"] = (
            instance.purchase_date.isoformat() if instance.purchase_date else None
        )
        data["supplier"] = instance.supplier
        data["product"] = (
            {"id": instance.product.id, "name": instance.product.name}
            if instance.product
            else None
        )
        return data


class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "product",
            "product_name",
            "client",
            "client_name",
            "quantity",
            "sale_date",
        ]

    def get_client_name(self, instance):
        return instance.client.user.username if instance.client else "Guest"

    def to_representation(self, instance):
        """تحويل البيانات بحيث تكون على شكل فاتورة إلكترونية"""
        # Create items list for order display
        items = [
            {
                "product": {
                    "id": instance.product.id,
                    "name": instance.product.name,
                    "description": instance.product.description,
                },
                "price": float(instance.product.price),
                "quantity": instance.quantity,
            }
        ]

        return {
            "id": instance.id,
            "customer": self.get_client_name(instance),
            "items": items,
            "total": float(instance.product.price * instance.quantity),
            "date": instance.sale_date.strftime("%Y-%m-%d"),
            "status": "completed",  # Default status for all orders
        }
