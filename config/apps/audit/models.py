from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Immutable audit trail — every important user action is recorded here.
    Records are NEVER updated or deleted (append-only log).
    """

    # ── Action types ──────────────────────────────────────────────────────────
    ACTION_CREATE = "CREATE"
    ACTION_UPDATE = "UPDATE"
    ACTION_DELETE = "DELETE"
    ACTION_LOGIN  = "LOGIN"
    ACTION_LOGOUT = "LOGOUT"
    ACTION_EXPORT = "EXPORT"
    ACTION_VIEW   = "VIEW"

    ACTION_CHOICES = [
        (ACTION_CREATE, "Create"),
        (ACTION_UPDATE, "Update"),
        (ACTION_DELETE, "Delete"),
        (ACTION_LOGIN,  "Login"),
        (ACTION_LOGOUT, "Logout"),
        (ACTION_EXPORT, "Export"),
        (ACTION_VIEW,   "View"),
    ]

    # ── Module choices — extend as your app grows ─────────────────────────────
    MODULE_INVENTORY = "Inventory"
    MODULE_CUSTOMERS = "Customers"
    MODULE_RENTALS   = "Rentals"
    MODULE_SALES     = "Sales"
    MODULE_INVOICES  = "Invoices"
    MODULE_CRM       = "CRM"
    MODULE_DEMO      = "Demo"
    MODULE_AUTH      = "Auth"
    MODULE_SETTINGS  = "Settings"
    MODULE_USERS     = "Users"
    MODULE_REPORTS   = "Reports"

    MODULE_CHOICES = [
        (MODULE_INVENTORY, "Inventory"),
        (MODULE_CUSTOMERS, "Customers"),
        (MODULE_RENTALS,   "Rentals"),
        (MODULE_SALES,     "Sales"),
        (MODULE_INVOICES,  "Invoices"),
        (MODULE_CRM,       "CRM"),
        (MODULE_DEMO,      "Demo"),
        (MODULE_AUTH,      "Auth"),
        (MODULE_SETTINGS,  "Settings"),
        (MODULE_USERS,     "Users"),
        (MODULE_REPORTS,   "Reports"),
    ]

    # ── Who ───────────────────────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        db_index=True,
    )
    user_id_snapshot   = models.IntegerField(null=True, blank=True, db_index=True)
    username_snapshot  = models.CharField(max_length=150, blank=True, db_index=True)
    full_name_snapshot = models.CharField(max_length=300, blank=True)

    # ── What ──────────────────────────────────────────────────────────────────
    module      = models.CharField(max_length=50,  choices=MODULE_CHOICES, db_index=True)
    action      = models.CharField(max_length=20,  choices=ACTION_CHOICES, db_index=True)
    record_id   = models.CharField(max_length=100, blank=True, db_index=True,
                                   help_text="PK of the affected object (as string)")
    record_repr = models.CharField(max_length=500, blank=True,
                                   help_text="Human-readable label for the affected object")

    # ── Data snapshot ─────────────────────────────────────────────────────────
    old_data = models.JSONField(null=True, blank=True,
                                help_text="State of the object BEFORE the change")
    new_data = models.JSONField(null=True, blank=True,
                                help_text="State of the object AFTER the change")
    changed_fields = models.JSONField(null=True, blank=True,
                                      help_text="List of field names that changed")

    # ── Context ───────────────────────────────────────────────────────────────
    ip_address = models.GenericIPAddressField(null=True, blank=True, db_index=True)
    user_agent = models.TextField(blank=True)
    extra      = models.JSONField(default=dict, blank=True,
                                  help_text="Any additional context (endpoint, params, etc.)")

    # ── When ──────────────────────────────────────────────────────────────────
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering         = ["-timestamp"]
        verbose_name     = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=["module", "action"]),
            models.Index(fields=["user_id_snapshot", "timestamp"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.username_snapshot} → {self.action} {self.module}"

    # ── Helpers ───────────────────────────────────────────────────────────────

    @classmethod
    def log(
        cls,
        *,
        user,
        module: str,
        action: str,
        record_id=None,
        record_repr: str = "",
        old_data=None,
        new_data=None,
        changed_fields=None,
        request=None,
        extra: dict = None,
    ) -> "AuditLog":
        """
        Convenience factory.  Call anywhere in views / signals:

            AuditLog.log(
                user=request.user,
                module=AuditLog.MODULE_INVENTORY,
                action=AuditLog.ACTION_UPDATE,
                record_id=laptop.pk,
                record_repr=str(laptop),
                old_data=old_snapshot,
                new_data=new_snapshot,
                request=request,
            )
        """
        ip = None
        ua = ""
        if request:
            ip = _get_client_ip(request)
            ua = request.META.get("HTTP_USER_AGENT", "")[:1000]

        full_name = ""
        username  = ""
        user_pk   = None
        if user and hasattr(user, "pk"):
            user_pk   = user.pk
            username  = getattr(user, "username", "") or ""
            first     = getattr(user, "first_name", "") or ""
            last      = getattr(user, "last_name",  "") or ""
            full_name = f"{first} {last}".strip() or username

        # Compute diff if both sides provided but changed_fields not given
        if old_data and new_data and changed_fields is None:
            changed_fields = [
                k for k in set(list(old_data.keys()) + list(new_data.keys()))
                if old_data.get(k) != new_data.get(k)
            ]

        return cls.objects.create(
            user=user if (user and hasattr(user, "pk") and user.pk) else None,
            user_id_snapshot=user_pk,
            username_snapshot=username,
            full_name_snapshot=full_name,
            module=module,
            action=action,
            record_id=str(record_id) if record_id is not None else "",
            record_repr=record_repr[:500] if record_repr else "",
            old_data=old_data,
            new_data=new_data,
            changed_fields=changed_fields,
            ip_address=ip,
            user_agent=ua,
            extra=extra or {},
        )


def _get_client_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
