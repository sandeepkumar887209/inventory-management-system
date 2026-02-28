from django.contrib import admin
from .models import Rental, RentalItem, RentalReturn, RentalReplacement


admin.site.register(Rental)
admin.site.register(RentalItem)
admin.site.register(RentalReturn)
admin.site.register(RentalReplacement)


