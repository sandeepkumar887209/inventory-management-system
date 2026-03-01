from django.contrib import admin
from .models import Rental, RentalItem


admin.site.register(Rental)
admin.site.register(RentalItem)


