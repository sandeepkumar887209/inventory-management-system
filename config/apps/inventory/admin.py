from django.contrib import admin
from .models import Laptop, StockMovement,LaptopHistory,Supplier

admin.site.register(Laptop)
admin.site.register(StockMovement)
admin.site.register(LaptopHistory)
admin.site.register(Supplier)
