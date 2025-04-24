from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

# ✅ نموذج المستخدم المخصص
class User(AbstractUser):
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('customer', 'Customer'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')

# ✅ نموذج العميل (يرتبط بالمستخدم)
class Client(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client')
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Client: {self.user.username}"

# ✅ نموذج المنتج
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.mail import send_mail  # لإرسال تنبيهات عبر البريد

# ✅ نموذج المنتج مع تنبيه انخفاض المخزون
class Product(models.Model):
    CATEGORY_CHOICES = [
        ('homme', 'Homme'),
        ('femme', 'Femme'),
        ('unisex', 'Unisex'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='unisex')
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)  # 🚨 الحد الأدنى للتنبيه
    created_at = models.DateTimeField(auto_now_add=True)

    def is_low_stock(self):
        """🔔 التحقق مما إذا كان المخزون أقل من الحد الأدنى"""
        return self.stock <= self.low_stock_threshold

    def save(self, *args, **kwargs):
        """🔔 إرسال تنبيه عند انخفاض المخزون"""
        if self.is_low_stock():
            self.send_low_stock_alert()
        super().save(*args, **kwargs)

    def send_low_stock_alert(self):
        """📧 إرسال بريد إلكتروني أو تنبيه داخلي عند انخفاض المخزون"""
        send_mail(
            subject=f"⚠️ تنبيه: المخزون منخفض للمنتج {self.name}",
            message=f"المنتج {self.name} يحتوي على {self.stock} فقط، وهو أقل من الحد الأدنى المسموح ({self.low_stock_threshold}).",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_EMAIL],  # تأكد من ضبطه في `settings.py`
        )

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='unisex')
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

# ✅ نموذج المشتريات (شراء مخزون من الموردين)
class Purchase(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="purchases")
    quantity = models.PositiveIntegerField()
    purchase_date = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # التأكد من أن المنتج ليس None قبل التحديث
        if self.product:
            self.product.stock += self.quantity
            self.product.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Purchased {self.quantity} of {self.product.name}"



    

# ✅ نموذج المبيعات (بيع المنتجات للعملاء)
class Sale(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="sales")
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name="sales")
    quantity = models.PositiveIntegerField()
    sale_date = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.product.stock < self.quantity:
            raise ValueError("Not enough stock available!")
        self.product.stock -= self.quantity
        self.product.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sold {self.quantity} of {self.product.name} to {self.client.user.username if self.client else 'Unknown Client'}"

