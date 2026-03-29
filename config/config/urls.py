from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/login/', TokenObtainPairView.as_view()),
    path('api/refresh/', TokenRefreshView.as_view()),

    path('api/inventory/', include('apps.inventory.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/rentals/', include('apps.rentals.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path("api/invoices/", include("apps.invoices.urls")),
    path('api/crm/', include('apps.crm.urls')),
    path('api/demos/', include('apps.demo.urls')),
    path('api/audit/', include('apps.audit.urls')),
    # path("api/", include("apps.dashboard.urls")),

]
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns += [
    path("api/pages/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/pages/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
