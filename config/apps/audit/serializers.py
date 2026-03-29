from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):

    action_display = serializers.CharField(source="get_action_display", read_only=True)
    module_display = serializers.CharField(source="get_module_display", read_only=True)

    class Meta:
        model  = AuditLog
        fields = [
            "id",
            "user_id_snapshot",
            "username_snapshot",
            "full_name_snapshot",
            "module",
            "module_display",
            "action",
            "action_display",
            "record_id",
            "record_repr",
            "old_data",
            "new_data",
            "changed_fields",
            "ip_address",
            "user_agent",
            "extra",
            "timestamp",
        ]
        read_only_fields = fields


class AuditLogListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view (no data payloads)."""

    action_display = serializers.CharField(source="get_action_display", read_only=True)
    module_display = serializers.CharField(source="get_module_display", read_only=True)

    class Meta:
        model  = AuditLog
        fields = [
            "id",
            "user_id_snapshot",
            "username_snapshot",
            "full_name_snapshot",
            "module",
            "module_display",
            "action",
            "action_display",
            "record_id",
            "record_repr",
            "changed_fields",
            "ip_address",
            "timestamp",
        ]
        read_only_fields = fields
