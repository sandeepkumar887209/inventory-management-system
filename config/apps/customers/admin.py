from django.contrib import admin

from .models import Customer, CustomerHistory

class CustomerHistoryAdmin(admin.ModelAdmin):
    list_display = ('customer', 'action', 'event_date', 'laptop_name', 'ref_label', 'amount')
    list_filter = ('action', 'event_date')
    search_fields = ('customer__name', 'laptop_name', 'serial', 'ref_label', 'note')
    readonly_fields = ('created_at', 'updated_at')

admin.site.register(Customer)
admin.site.register(CustomerHistory, CustomerHistoryAdmin)
