from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name               = "apps.audit"
    verbose_name       = "Audit Trail"

    def ready(self):
        # Import middleware module to register signal handlers
        import apps.audit.middleware  # noqa: F401
