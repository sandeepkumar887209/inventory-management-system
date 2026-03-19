# CRM Frontend — Integration Guide

## File Structure

Drop all files into your existing frontend:

```
src/
└── components/
    └── crm/
        ├── types.ts           ← TypeScript interfaces
        ├── CRMPage.tsx        ← Main CRM router/container
        ├── LeadList.tsx       ← List view with filters + table
        ├── LeadDetail.tsx     ← Detail page (activities, follow-ups, convert)
        ├── LeadForm.tsx       ← Create / Edit lead form
        ├── LeadPipeline.tsx   ← Kanban pipeline view
        ├── ActivityForm.tsx   ← Log a call/email/visit/etc.
        └── FollowUpForm.tsx   ← Schedule a follow-up reminder
```

---

## 1. Add to App.tsx

Import CRMPage and add the route inside the protected Layout section:

```tsx
import { CRMPage } from "./components/crm/CRMPage";

// Inside your <Routes> → protected Layout route:
<Route path="/crm/*" element={<CRMPage />} />
```

Your App.tsx protected routes section should look like:

```tsx
<Route element={<Layout sidebarCollapsed={sidebarCollapsed} toggleSidebar={...} />}>
  <Route path="/" element={<Dashboard />} />
  <Route path="/inventory" element={...} />
  <Route path="/rentals" element={...} />
  <Route path="/sales" element={...} />
  <Route path="/customers" element={...} />
  <Route path="/crm/*" element={<CRMPage />} />   {/* ← ADD THIS */}
</Route>
```

---

## 2. Add to Sidebar.tsx

Add two CRM entries to the `menuItems` array in `src/components/layout/Sidebar.tsx`:

```tsx
import { Users2, TrendingUp } from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Inventory", icon: Laptop, path: "/inventory" },
  { label: "Rentals", icon: Calendar, path: "/rentals" },
  { label: "Sales", icon: ShoppingCart, path: "/sales" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "CRM", icon: Users2, path: "/crm/leads" },       // ← ADD
  { label: "Pipeline", icon: TrendingUp, path: "/crm/pipeline" }, // ← ADD
  { label: "Invoices", icon: FileText, path: "/invoices" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];
```

---

## 3. Fix active state for nested routes in Sidebar

The Sidebar checks `location.pathname === item.path` for exact match.
For CRM, change it to use `startsWith` so both list and detail pages highlight the nav:

In `Sidebar.tsx`, find:
```tsx
const isActive = location.pathname === item.path;
```

Replace with:
```tsx
const isActive =
  item.path === "/"
    ? location.pathname === "/"
    : location.pathname.startsWith(item.path);
```

---

## API Base URL

All CRM API calls use `/crm/` prefix, e.g.:
- `GET /api/crm/leads/`
- `POST /api/crm/leads/{id}/convert/`
- `GET /api/crm/leads/pipeline/`

Make sure your Django backend has:
```python
# config/urls.py
path('api/crm/', include('apps.crm.urls')),
```

---

## Pages & Routes

| URL | Component | Description |
|-----|-----------|-------------|
| `/crm` or `/crm/leads` | LeadList | All leads with search + filters |
| `/crm/leads/:id` | LeadDetail | Full lead detail, activities, follow-ups |
| `/crm/pipeline` | LeadPipeline | Kanban pipeline by stage |

---

## Features

- **Lead List** — searchable, filterable by status/intent, paginated
- **Lead Detail** — contact info, activities timeline, follow-up tracker, convert button
- **Pipeline** — kanban columns (NEW / CONTACTED / NEGOTIATION / CONVERTED / LOST)
- **Log Activity** — call, email, visit, meeting, WhatsApp, note
- **Schedule Follow-up** — datetime picker with mark-done action
- **Convert to Customer** — one-click lead → customer conversion
- **Tags** — color-coded tags shown on cards and list
