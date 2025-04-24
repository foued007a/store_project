
from django.contrib import admin
from .models import User, Client, Product, Purchase, Sale

admin.site.register(User)
admin.site.register(Client)
admin.site.register(Product)
admin.site.register(Purchase)
admin.site.register(Sale)

