# Implementation Details & Deployment Architecture

## 1. Implementation Overview

The Ditel Network Solutions Inventory System is built on a modern decoupled architecture. The backend is a robust RESTful API built with Django 5.2 and Django REST Framework (DRF), backed by PostgreSQL. The frontend is a Single Page Application (SPA) built using React 18, TypeScript, and Vite 6.

A core philosophy of the system is absolute data integrity:
- **Never-Delete Policy**: Laptops and core records are never deleted, only marked with terminal statuses (e.g., `WRITTEN_OFF`, `RETURNED_TO_SUPPLIER`).
- **Immutable Audit Trails**: Actions are captured in append-only ledger tables (`AuditLog`, `StockMovement`, `LaptopHistory`, `CustomerHistory`).
- **Snapshot Pattern**: Line items (Rentals, Sales, Demos) capture hard copies of laptop specs and pricing at the exact time of the transaction to preserve historical accuracy even if the base asset changes.

## 2. Project Structure

```text
Project/
├── config/                        # Django backend root
│   ├── config/                    # Django core settings (settings.py, urls.py, wsgi)
│   ├── apps/                      # Modular Django apps
│   │   ├── common/                # AuditModel base, permissions, viewsets
│   │   ├── inventory/             # Laptops, Suppliers, LaptopHistory, StockMovement
│   │   ├── customers/             # Customers, CustomerHistory, Django signals
│   │   ├── rentals/               # Rentals, RentalItems
│   │   ├── sales/                 # Sales, SaleItems
│   │   ├── demo/                  # Demos, DemoItems
│   │   ├── invoices/              # Invoices, PDF generation (weasyprint/xhtml2pdf), email
│   │   ├── crm/                   # Leads, Activities, FollowUps, Tags
│   │   ├── audit/                 # AuditLog, AuditModelMixin middleware
│   │   └── dashboard/             # Aggregated stats endpoints
│   ├── manage.py                  # Django CLI
│   └── requirements.txt           # Python dependencies
└── laptop-rental-sales-system/    # React frontend root
    ├── src/
    │   ├── components/            # Reusable UI (Radix UI, Tailwind, shadcn)
    │   ├── services/              # API communication layer (Axios)
    │   ├── styles/                # Global CSS / Tailwind directives
    │   ├── App.tsx                # Main application component & Router definition
    │   └── main.tsx               # React entry point
    ├── package.json               # Node dependencies
    └── vite.config.ts             # Vite build configuration
```

## 3. Key Implementation Patterns

### Pattern A: AuditModel Base Class
Almost every model inherits from `AuditModel`, ensuring that creation and update timestamps and users are automatically captured.

```python
# apps/common/models.py
class AuditModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="%(app_label)s_%(class)s_created")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="%(app_label)s_%(class)s_updated")
    
    class Meta:
        abstract = True
```
Coupled with `AuditModelViewSet` in `apps/common/viewsets.py`, the `created_by` and `updated_by` fields are injected automatically from `request.user` during DRF `perform_create` and `perform_update` hooks.

### Pattern B: The Snapshot Pattern
To ensure past invoices/rentals remain accurate even if a laptop's price or specs change later, the system uses denormalized snapshots.

```python
# Example from apps/rentals/models.py
class RentalItem(AuditModel):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE)
    laptop = models.ForeignKey(Laptop, on_delete=models.SET_NULL, null=True)
    
    # Snapshot fields
    snapshot_brand = models.CharField(max_length=100, blank=True)
    snapshot_serial_number = models.CharField(max_length=100, blank=True)
    snapshot_rent_per_month = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if self.laptop_id and not self.snapshot_serial_number:
            self.snapshot_brand = self.laptop.brand
            self.snapshot_serial_number = self.laptop.serial_number
            self.snapshot_rent_per_month = self.laptop.rent_per_month
        super().save(*args, **kwargs)
```

### Pattern C: Atomic Transactions for Complex Operations
Operations like converting a Demo to a Rental involve changing the Demo status, creating a Rental, creating RentalItems, and logging StockMovements. This is strictly wrapped in `@transaction.atomic`.

```python
@action(detail=True, methods=["post"])
@transaction.atomic
def convert(self, request, pk=None):
    demo = self.get_object()
    # 1. Validate status
    # 2. Create Rental record
    # 3. Create RentalItems and StockMovements
    # 4. Update Demo status and FK to Rental
    # If any step fails, the entire database transaction rolls back.
```

## 4. Backend Details

- **Authentication**: Uses `rest_framework_simplejwt`. Clients send `Authorization: Bearer <token>`. Access tokens expire in 60 minutes; refresh tokens in 1 day.
- **View Hierarchy**: Views inherit from `AuditModelViewSet` (which inherits from `ModelViewSet`), which also uses `AuditModelMixin` to write to the global `AuditLog` table.
- **Signals**: `apps/customers/signals.py` intercepts `post_save` on transactions to automatically append records to `CustomerHistory`.
- **PDF Generation**: The Invoice app uses a dual-backend approach. It attempts to use `weasyprint` (better formatting), and falls back to `xhtml2pdf` if GTK libraries are missing on the host OS (e.g., Windows).
- **CORS**: Configured via `django-cors-headers`. Currently `CORS_ALLOW_ALL_ORIGINS = True` for development flexibility.

## 5. Frontend Details

- **UI Framework**: Uses Tailwind CSS alongside Radix UI primitives to create accessible, unstyled components that are then styled comprehensively (similar to shadcn/ui).
- **Service Layer**: API calls are decoupled from components into `src/services/`. Axios instances are configured to automatically attach JWT interceptors.
- **State Management**: Local state is primarily handled via React Hooks (`useState`, `useReducer`), supplemented by Context where necessary. Form state is heavily managed by `react-hook-form`.
- **Routing**: Client-side routing via `react-router-dom` utilizing dynamic path parameters (e.g., `/rentals/:id`).

## 6. Deployment Diagram

```mermaid
flowchart TD
    %% Environments
    subgraph "Local Development Environment"
        Browser(Browser)
        Vite[Vite Dev Server<br>Port 5173]
        DjangoDev[Django Runserver<br>Port 8000]
        PG_Dev[(PostgreSQL<br>Port 5432)]
        
        Browser -- HTTP/WS --> Vite
        Vite -- API Proxy --> DjangoDev
        DjangoDev -- TCP/IP --> PG_Dev
    end

    subgraph "Recommended Production Environment"
        Client(Client Browsers)
        Nginx[Nginx Reverse Proxy<br>Ports 80 / 443]
        
        subgraph "Application Server"
            Gunicorn[Gunicorn / Uvicorn WSGI/ASGI]
            DjangoProd[Django Application]
            Gunicorn --> DjangoProd
        end
        
        PG_Prod[(PostgreSQL Database)]
        StaticFileVol[Static / Media Files]
        
        Client -- HTTPS --> Nginx
        Nginx -- Static Requests --> StaticFileVol
        Nginx -- API Requests --> Gunicorn
        DjangoProd --> PG_Prod
    end
```

## 7. Recommended Production Architecture

For production, the application should not rely on Vite or Django's `runserver`.

1. **Frontend Build**: Run `npm run build` to generate static HTML/JS/CSS assets. 
2. **Web Server**: Serve the frontend static assets via Nginx. Nginx will also act as a reverse proxy, forwarding requests starting with `/api/` or `/admin/` to the backend.
3. **Backend App Server**: Run the Django application using a production-grade WSGI server like Gunicorn (e.g., `gunicorn config.wsgi:application --workers 3`).
4. **Database**: Use a managed PostgreSQL instance (e.g., AWS RDS, DigitalOcean Managed DB) for automated backups and high availability.
5. **Static Files**: Run `python manage.py collectstatic`. Nginx should directly serve the `/static/` and `/media/` directories to offload file serving from Django.

## 8. Environment Configuration

The following environment variables should be abstracted into a `.env` file for production:
- `DEBUG=False`
- `SECRET_KEY="..."` (Must be unique and kept secret)
- `ALLOWED_HOSTS="api.ditel.com,ditel.com"`
- `DATABASE_URL="postgres://user:pass@host:5432/ditel_inventory"`
- `CORS_ALLOWED_ORIGINS="https://ditel.com"`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

## 9. Security Considerations

- **CORS Configuration**: `CORS_ALLOW_ALL_ORIGINS` must be set to `False` in production. Strict origins must be defined.
- **JWT Storage**: The frontend should ideally store the refresh token in an `HttpOnly` cookie to prevent XSS exfiltration, while the access token can be kept in memory or `sessionStorage`.
- **Admin Access**: The `/admin/` URL path should be protected, ideally restricted to specific internal IP ranges if possible.
- **File Uploads**: Ensure MEDIA configurations are secure and uploaded files (if any are added) are not executable.
