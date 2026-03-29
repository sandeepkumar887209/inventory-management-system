"""
AuditMiddleware
───────────────
Automatically logs LOGIN and LOGOUT events by hooking into Django's
authentication signals.  You can also call AuditLog.log() manually
anywhere in your views / serializers for CREATE / UPDATE / DELETE.

Usage
─────
Add to settings.py MIDDLEWARE (after AuthenticationMiddleware):

    'apps.audit.middleware.AuditMiddleware',

Then emit manual logs from your DRF views / serializers:

    from apps.audit.models import AuditLog

    # inside a view method:
    AuditLog.log(
        user=request.user,
        module=AuditLog.MODULE_INVENTORY,
        action=AuditLog.ACTION_CREATE,
        record_id=instance.pk,
        record_repr=str(instance),
        new_data=serializer.data,
        request=request,
    )
"""

from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver
from .models import AuditLog, _get_client_ip


# ── Signal handlers ───────────────────────────────────────────────────────────

@receiver(user_logged_in)
def on_login(sender, request, user, **kwargs):
    AuditLog.log(
        user=user,
        module=AuditLog.MODULE_AUTH,
        action=AuditLog.ACTION_LOGIN,
        record_repr=f"User '{user.username}' logged in",
        request=request,
        extra={"method": "jwt" if "api" in (request.path or "") else "session"},
    )


@receiver(user_logged_out)
def on_logout(sender, request, user, **kwargs):
    if user:
        AuditLog.log(
            user=user,
            module=AuditLog.MODULE_AUTH,
            action=AuditLog.ACTION_LOGOUT,
            record_repr=f"User '{user.username}' logged out",
            request=request,
        )


@receiver(user_login_failed)
def on_login_failed(sender, credentials, request, **kwargs):
    username = credentials.get("username", "unknown")
    ip       = _get_client_ip(request) if request else None
    ua       = request.META.get("HTTP_USER_AGENT", "") if request else ""

    AuditLog.objects.create(
        user=None,
        user_id_snapshot=None,
        username_snapshot=username,
        full_name_snapshot="",
        module=AuditLog.MODULE_AUTH,
        action=AuditLog.ACTION_LOGIN,
        record_repr=f"Failed login attempt for '{username}'",
        ip_address=ip,
        user_agent=ua[:1000],
        extra={"success": False},
    )


# ── AuditMixin for DRF ViewSets ───────────────────────────────────────────────
# Mix this into any ModelViewSet to get automatic CREATE / UPDATE / DELETE logs.

class AuditModelMixin:
    """
    Add to any DRF ModelViewSet:

        class InventoryViewSet(AuditModelMixin, AuditModelViewSet):
            audit_module = AuditLog.MODULE_INVENTORY
            ...
    """

    # Subclass should override this
    audit_module: str = "Unknown"

    def _snapshot(self, instance):
        """Return a JSON-serialisable dict of the instance.  Override if needed."""
        from rest_framework.serializers import ModelSerializer
        try:
            # Try to use the viewset's own serializer
            sz = self.get_serializer(instance)
            return sz.data
        except Exception:
            return {"id": getattr(instance, "pk", None), "str": str(instance)}

    def perform_create(self, serializer):
        super().perform_create(serializer)
        instance = serializer.instance
        AuditLog.log(
            user=self.request.user,
            module=self.audit_module,
            action=AuditLog.ACTION_CREATE,
            record_id=instance.pk,
            record_repr=str(instance),
            new_data=self._snapshot(instance),
            request=self.request,
        )

    def perform_update(self, serializer):
        old_data = self._snapshot(serializer.instance)
        super().perform_update(serializer)
        instance = serializer.instance
        AuditLog.log(
            user=self.request.user,
            module=self.audit_module,
            action=AuditLog.ACTION_UPDATE,
            record_id=instance.pk,
            record_repr=str(instance),
            old_data=old_data,
            new_data=self._snapshot(instance),
            request=self.request,
        )

    def perform_destroy(self, instance):
        old_data = self._snapshot(instance)
        pk       = instance.pk
        repr_    = str(instance)
        super().perform_destroy(instance)
        AuditLog.log(
            user=self.request.user,
            module=self.audit_module,
            action=AuditLog.ACTION_DELETE,
            record_id=pk,
            record_repr=repr_,
            old_data=old_data,
            request=self.request,
        )
