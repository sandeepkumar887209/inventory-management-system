import React, { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { Sidebar }         from "./components/layout/Sidebar";
import { Header }          from "./components/layout/Header";
import RequireAuth         from "./components/auth/RequireAuth";
import Login               from "./components/auth/Login";
import { Signup }          from "./components/auth/Signup";
import { ForgotPassword }  from "./components/auth/ForgotPassword";

import { DashboardModule }  from "./components/dashboard/DashboardModule";
import { InventoryModule }  from "./components/inventory/InventoryModule";
import { RentalModule }     from "./components/rentals/RentalModule";
import { DemoModule }       from "./components/demo/DemoModule";
import { SalesModule }      from "./components/sales/SalesModule";
import { CustomerModule }   from "./components/customers/CustomerModule";
import { CRMPage }          from "./components/crm/CRMPage";
import { ReportsAnalytics } from "./components/reports/ReportsAnalytics";
import { EnhancedSettings } from "./components/settings/EnhancedSettings";
import { BillingDashboard } from "./components/billing/BillingDashboard";
import { InvoiceList }      from "./components/invoices/InvoiceList";
import { InvoiceView }      from "./components/invoices/InvoiceView";
import { CreateInvoice }    from "./components/invoices/CreateInvoice";
import { UserList }         from "./components/users/UserList";
import { UserForm }         from "./components/users/UserForm";
import { RoleManagement }   from "./components/users/RoleManagement";

import { ActivityLogs } from "./components/audit/ActivityLogs";

/* ─── Layout ─── */
function Layout({
  sidebarCollapsed,
  toggleSidebar,
}: {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}) {
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f7f5" }}>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

      <div
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? "72px" : "256px",
          transition: "margin-left 0.25s",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          userName="Admin User"
          userRole="Administrator"
          onLogout={handleLogout}
        />

        <main style={{ flex: 1, paddingTop: "58px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ─── Invoices Page ─── */
function InvoicesPage() {
  const [view, setView] = useState<"list" | "create" | "view">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  if (view === "create") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <CreateInvoice onSuccess={() => setView("list")} onCancel={() => setView("list")} />
      </div>
    );
  }

  if (view === "view" && selectedInvoice) {
    return (
      <InvoiceView
        invoice={selectedInvoice}
        onClose={() => {
          setView("list");
          setSelectedInvoice(null);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <InvoiceList
        onCreateNew={() => setView("create")}
        onViewInvoice={(invoice: any) => {
          setSelectedInvoice(invoice);
          setView("view");
        }}
      />
    </div>
  );
}

/* ─── Users Page ─── */
function UsersPage() {
  const [view, setView] = useState<"list" | "form" | "permissions">("list");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  if (view === "form") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <UserForm
          user={selectedUser}
          onSubmit={() => setView("list")}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  if (view === "permissions" && selectedUser) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <RoleManagement
          user={selectedUser}
          onSave={() => setView("list")}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <UserList
        onAddNew={() => {
          setSelectedUser(null);
          setView("form");
        }}
        onEdit={(user: any) => {
          setSelectedUser(user);
          setView("form");
        }}
        onManagePermissions={(user: any) => {
          setSelectedUser(user);
          setView("permissions");
        }}
      />
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Routes>

      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup onSignup={() => {}} onSwitchToLogin={() => {}} />} />
      <Route path="/forgot-password" element={<ForgotPassword onBack={() => {}} onResetRequest={() => {}} />} />

      {/* Protected */}
      <Route element={<RequireAuth />}>
        <Route
          element={
            <Layout
              sidebarCollapsed={sidebarCollapsed}
              toggleSidebar={() => setSidebarCollapsed((c) => !c)}
            />
          }
        >
          {/* ✅ Dashboard Module */}
          <Route path="/" element={<DashboardModule />} />

          {/* Modules */}
          <Route path="/inventory/*" element={<InventoryModule />} />
          <Route path="/rentals/*" element={<RentalModule />} />
          <Route path="/demos/*" element={<DemoModule />} />
          <Route path="/sales/*" element={<SalesModule />} />
          <Route path="/customers/*" element={<CustomerModule />} />

          {/* CRM */}
          <Route path="/crm/*" element={<div className="p-6"><CRMPage /></div>} />

          {/* Accounts */}
          <Route path="/accounts" element={<div className="p-6"><BillingDashboard /></div>} />
          <Route path="/accounts/invoices" element={<InvoicesPage />} />
          <Route path="/accounts/payments" element={<div className="p-6"><BillingDashboard /></div>} />
          <Route path="/accounts/ledger" element={<div className="p-6"><h2>Ledger</h2></div>} />
          <Route path="/accounts/reports" element={<div className="p-6"><ReportsAnalytics /></div>} />

          {/* Others */}
          <Route path="/reports" element={<div className="p-6"><ReportsAnalytics /></div>} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<div className="p-6"><EnhancedSettings /></div>} />
          <Route path="/activity-logs" element={<ActivityLogs />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

    </Routes>
  );
}