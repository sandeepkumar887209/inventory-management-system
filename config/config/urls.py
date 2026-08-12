from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth — custom login that checks approval status
    path('api/login/', CustomTokenObtainPairView.as_view()),
    path('api/refresh/', TokenRefreshView.as_view()),

    # Accounts (register, user management)
    path('api/accounts/', include('apps.accounts.urls')),

    path('api/inventory/', include('apps.inventory.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/rentals/', include('apps.rentals.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path("api/invoices/", include("apps.invoices.urls")),
    path('api/crm/', include('apps.crm.urls')),
    path('api/demos/', include('apps.demo.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/common/', include('apps.common.urls')),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path("api/pages/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/pages/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]


from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered

# Dynamically register all models from local apps into the Django admin panel
app_models = apps.get_models()
for model in app_models:
    # Only register models that belong to our local apps to avoid breaking built-in Django apps
    if model._meta.app_label in ["audit", "common", "crm", "customers", "dashboard", "demo", "inventory", "invoices", "rentals", "sales"]:
        try:
            class GenericAdmin(admin.ModelAdmin):
                list_display = [field.name for field in model._meta.fields]
                search_fields = [field.name for field in model._meta.fields if field.get_internal_type() in ('CharField', 'TextField', 'EmailField')]
                
            admin.site.register(model, GenericAdmin)
        except AlreadyRegistered:
            pass
