# ──────────────────────────────────────────────────────────────────────────────
# HOW TO WIRE THE DEMO BACKEND
# ──────────────────────────────────────────────────────────────────────────────

# ── 1. Copy the app folder ────────────────────────────────────────────────────
# Copy  apps/demos/  into your  config/apps/  directory.
# Your structure should look like:
#
#   config/
#   └── apps/
#       ├── common/
#       ├── customers/
#       ├── inventory/
#       ├── rentals/
#       ├── sales/
#       ├── demos/          ← NEW
#       │   ├── __init__.py
#       │   ├── apps.py
#       │   ├── models.py
#       │   ├── serializers.py
#       │   ├── views.py
#       │   ├── urls.py
#       │   ├── admin.py
#       │   └── migrations/
#       │       ├── __init__.py
#       │       └── 0001_initial.py
#       └── ...

# ── 2. config/config/settings.py  ────────────────────────────────────────────
# Add "apps.demos" to INSTALLED_APPS:

INSTALLED_APPS_PATCH = """
INSTALLED_APPS = [
    ...
    'apps.demos',      # ← ADD THIS
    ...
]
"""

# ── 3. config/config/urls.py  ────────────────────────────────────────────────
# Add the demo URL include:

URLS_PATCH = """
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/login/',   TokenObtainPairView.as_view()),
    path('api/refresh/', TokenRefreshView.as_view()),

    path('api/inventory/', include('apps.inventory.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/rentals/',   include('apps.rentals.urls')),
    path('api/sales/',     include('apps.sales.urls')),
    path('api/invoices/',  include('apps.invoices.urls')),
    path('api/crm/',       include('apps.crm.urls')),
    path('api/demos/',     include('apps.demos.urls')),   # ← ADD THIS
]
"""

# ── 4. Run migrations ─────────────────────────────────────────────────────────
# cd config
# python manage.py makemigrations demos
# python manage.py migrate

# ── 5. Frontend API calls ─────────────────────────────────────────────────────
# The frontend already uses  api.get("/demos/demo/")  etc.
# Your axios baseURL should point to  http://localhost:8000/api
# so all calls resolve correctly.

# ── 6. Available endpoints ───────────────────────────────────────────────────
ENDPOINTS = """
GET    /api/demos/demo/                       — list all demos
POST   /api/demos/demo/                       — create demo
GET    /api/demos/demo/{id}/                  — retrieve demo
PATCH  /api/demos/demo/{id}/                  — update demo
DELETE /api/demos/demo/{id}/                  — delete demo

POST   /api/demos/demo/{id}/return_laptops/   — return one or more laptops
       Body: { "laptops": [1, 2], "feedback": "Great machine" }

POST   /api/demos/demo/{id}/convert/          — convert demo to rental or sale
       Body: { "convert_to": "rental" | "sale" }

POST   /api/demos/demo/{id}/add_feedback/     — log customer feedback
       Body: { "feedback": "Loved it", "rating": 5 }

GET    /api/demos/demo/stats/                 — summary counts

Query params for list:
  ?status=ONGOING|RETURNED|CONVERTED_RENTAL|CONVERTED_SALE
  ?purpose=performance_testing|...
  ?customer=<id>
  ?overdue=true
  ?search=<name>
"""
