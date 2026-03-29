from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display  = (
        "id", "timestamp", "username_snapshot", "full_name_snapshot",
        "module", "action", "record_repr", "ip_address",
    )
    list_filter   = ("module", "action")
    search_fields = ("username_snapshot", "record_repr", "record_id", "ip_address")
    ordering      = ("-timestamp",)
    readonly_fields = [f.name for f in AuditLog._meta.get_fields() if hasattr(f, "name")]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
