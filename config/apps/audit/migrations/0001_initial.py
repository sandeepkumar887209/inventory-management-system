from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True,
                                           serialize=False, verbose_name="ID")),
                ("user", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="audit_logs",
                    to=settings.AUTH_USER_MODEL,
                    db_index=True,
                )),
                ("user_id_snapshot",   models.IntegerField(null=True, blank=True, db_index=True)),
                ("username_snapshot",  models.CharField(max_length=150, blank=True, db_index=True)),
                ("full_name_snapshot", models.CharField(max_length=300, blank=True)),
                ("module",      models.CharField(max_length=50, db_index=True, choices=[
                    ("Inventory","Inventory"),("Customers","Customers"),
                    ("Rentals","Rentals"),("Sales","Sales"),("Invoices","Invoices"),
                    ("CRM","CRM"),("Demo","Demo"),("Auth","Auth"),
                    ("Settings","Settings"),("Users","Users"),("Reports","Reports"),
                ])),
                ("action",      models.CharField(max_length=20, db_index=True, choices=[
                    ("CREATE","Create"),("UPDATE","Update"),("DELETE","Delete"),
                    ("LOGIN","Login"),("LOGOUT","Logout"),("EXPORT","Export"),("VIEW","View"),
                ])),
                ("record_id",   models.CharField(max_length=100, blank=True, db_index=True)),
                ("record_repr", models.CharField(max_length=500, blank=True)),
                ("old_data",    models.JSONField(null=True, blank=True)),
                ("new_data",    models.JSONField(null=True, blank=True)),
                ("changed_fields", models.JSONField(null=True, blank=True)),
                ("ip_address",  models.GenericIPAddressField(null=True, blank=True, db_index=True)),
                ("user_agent",  models.TextField(blank=True)),
                ("extra",       models.JSONField(default=dict, blank=True)),
                ("timestamp",   models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={"ordering": ["-timestamp"], "verbose_name": "Audit Log",
                     "verbose_name_plural": "Audit Logs"},
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["module", "action"], name="audit_module_action_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["user_id_snapshot", "timestamp"],
                               name="audit_user_ts_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["timestamp"], name="audit_ts_idx"),
        ),
    ]
