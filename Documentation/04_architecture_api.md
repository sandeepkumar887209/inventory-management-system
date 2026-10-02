# System Architecture & API Details

## 1. System Architecture Overview

The system is decoupled into a frontend Single Page Application (SPA) and a backend REST API. 
The backend utilizes Django 5.2 and Django REST Framework, while the frontend is constructed with React 18, Vite, and Radix UI primitives. Authentication bridges the two via short-lived JWT Access Tokens and HttpOnly Refresh Tokens.

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client [Client Tier]
        Browser[Web Browser]
        ReactApp[React 18 SPA]
        Browser --> ReactApp
    end
    
    subgraph APIGateway [Transport & Security]
        CORS[CORS Middleware]
        JWTAuth[JWT Authentication]
    end

    subgraph Backend [Django Application Tier]
        Router[DRF Router]
        
        subgraph LogicalServices [Logical Microservices]
            AuthSvc[Auth Service]
            InvSvc[Inventory Service]
            CustSvc[Customer Service]
            OpSvc[Ops: Rentals, Sales, Demos]
            FinSvc[Finance: Invoices]
            CRMSvc[CRM Service]
        end
        
        subgraph CoreComponents [Core Mechanics]
            AuditMix[AuditModel Middleware]
            PDFGen[PDF Generator: weasyprint/xhtml2pdf]
            Emailer[SMTP Email Engine]
        end
    end
    
    subgraph Persistence [Data Tier]
        PG[(PostgreSQL Database)]
        JSONB[JSONB Snapshot storage]
    end

    ReactApp -- HTTP / JSON --> CORS
    CORS --> JWTAuth
    JWTAuth --> Router
    Router --> LogicalServices
    
    LogicalServices --> AuditMix
    LogicalServices --> PDFGen
    LogicalServices --> Emailer
    
    LogicalServices --> PG
    AuditMix --> JSONB
```

## 3. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite 6 | Fast HMR, strongly typed UI layer. |
| **Frontend Styling** | Tailwind CSS, Radix UI | Accessible headless primitives wrapped in Tailwind utility classes. |
| **Backend Framework** | Django 5.2, DRF | Robust Python MVC, extensive ORM. |
| **Database** | PostgreSQL | Relational data integrity, supports complex JSON queries (used in Audit Logs). |
| **Authentication** | SimpleJWT | Stateless authentication mechanism. |
| **Document Generation** | WeasyPrint / xhtml2pdf | HTML to PDF rendering for Invoices. |
| **Charts / Analytics** | Recharts (Frontend) | Renders dashboard data natively in SVG. |

## 4. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| **POST** | `/auth/token/` | Obtain JWT Access & Refresh tokens. | No |
| **POST** | `/auth/token/refresh/` | Renew Access token. | No |
| **GET** / **POST** | `/inventory/laptops/` | List, search, and create laptops. | Yes (Staff) |
| **POST** | `/inventory/laptops/{id}/return-to-supplier/` | Change status to returned to vendor. | Yes |
| **POST** | `/inventory/laptops/{id}/send-maintenance/` | Move stock out for repair. | Yes |
| **GET** | `/inventory/laptops/stats/` | Dashboard inventory metrics. | Yes |
| **GET** / **POST** | `/customers/customers/` | Manage individual/corporate profiles. | Yes |
| **POST** | `/rentals/rental/{id}/return_laptops/` | Partially or fully return rented items. | Yes |
| **POST** | `/rentals/rental/{id}/replace_laptop/` | Swap faulty equipment atomic transaction. | Yes |
| **POST** | `/demos/demo/{id}/convert/` | Convert demo eval into rental or sale. | Yes |
| **POST** | `/invoices/invoice/{id}/send-email/` | Deliver PDF payload to customer inbox. | Yes |
| **GET** | `/invoices/invoice/{id}/pdf/` | Direct download of Invoice PDF. | Yes |
| **POST** | `/crm/leads/{id}/convert/` | Spawn customer entity from lead pipeline. | Yes |

## 5. Sequence Diagrams

### 5.1 Demo Conversion to Rental Flow

This is one of the most complex transactional flows, updating multiple statuses and generating snapshots concurrently.

```mermaid
sequenceDiagram
    participant UI as React Frontend
    participant API as Demo ViewSet
    participant DB as PostgreSQL ORM
    
    UI->>API: POST /demos/demo/{id}/convert/ { "convert_to": "rental" }
    activate API
    
    API->>DB: Begin Database Transaction
    
    API->>DB: Validate Demo status == 'ONGOING'
    API->>DB: Create new Rental contract
    
    loop For each Laptop in Demo
        API->>DB: Create StockMovement (OUT)
        API->>DB: Update Laptop Status (DEMO -> RENTED)
        API->>DB: Create RentalItem (Snapshot specs & pricing)
    end
    
    API->>DB: Update Demo status -> 'CONVERTED_RENTAL'
    API->>DB: Update Demo 'converted_rental' FK
    
    API->>DB: Commit Database Transaction
    
    API-->>UI: 200 OK { "success": true, "result_id": 42 }
    deactivate API
```

### 5.2 PDF Invoice Generation Flow

```mermaid
sequenceDiagram
    participant User as Staff User
    participant API as Invoice ViewSet
    participant Django as Django Templates
    participant PDFLib as WeasyPrint / xhtml2pdf
    
    User->>API: GET /invoices/invoice/{id}/pdf/
    activate API
    
    API->>Django: Fetch Invoice & Customer & Items
    API->>Django: render_to_string("invoice_pdf.html", context)
    Django-->>API: Raw HTML String
    
    API->>PDFLib: render_pdf(HTML String)
    activate PDFLib
    PDFLib-->>API: Binary PDF File Data (Bytes)
    deactivate PDFLib
    
    API-->>User: HTTP 200 (Content-Type: application/pdf)
    deactivate API
```

## 6. Microservices Logical Decomposition

While physically deployed as a monolithic Django application, the system is strictly decoupled into Logical Microservices via Django Apps.

- `inventory/` manages the physical truth.
- `rentals/`, `sales/`, and `demo/` encapsulate transaction logic but rely entirely on `inventory/` signals to update asset states.
- `audit/` acts as a cross-cutting concern (AOP style), utilizing middleware and class mixins to intercept HTTP requests and DB saves across all other services without tight coupling.
