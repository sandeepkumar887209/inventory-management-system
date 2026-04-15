import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, List, Plus, PieChart, Bell } from "lucide-react";
import { CustomerDashboard } from "./CustomerDashboard";
import { CustomerList } from "./CustomerList";
import { CreateCustomer } from "./CreateCustomer";
import { CustomerDetail } from "./CustomerDetail";
import { CustomerSegments } from "./CustomerSegments";
import { CustomerAlerts } from "./CustomerAlerts";

const TABS = [
  { id: "dashboard", label: "Dashboard",     icon: LayoutDashboard, path: "/customers" },
  { id: "list",      label: "All Customers", icon: List,            path: "/customers/list" },
  { id: "new",       label: "Add Customer",  icon: Plus,            path: "/customers/new" },
  { id: "segments",  label: "Segments",      icon: PieChart,        path: "/customers/segments" },
  { id: "alerts",    label: "Alerts",        icon: Bell,            path: "/customers/alerts" },
];

export function CustomerModule() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [refresh, setRefresh] = useState(0);

  const bump = () => setRefresh(k => k + 1);

  const activeTab = TABS.find(t =>
    t.path === "/customers"
      ? location.pathname === "/customers" || location.pathname === "/customers/"
      : location.pathname.startsWith(t.path)
  )?.id ?? "dashboard";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5" }}>
      {/* Top nav */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e8e6e1",
        padding: "0 24px", display: "flex", alignItems: "center", gap: "2px",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button key={tab.id} onClick={() => navigate(tab.path)} style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "14px 16px", border: "none",
              borderBottom: isActive ? "2px solid #1a6ef5" : "2px solid transparent",
              background: "transparent", cursor: "pointer",
              fontSize: "13px", fontWeight: isActive ? 500 : 400,
              color: isActive ? "#1a6ef5" : "#6b6b6b",
              whiteSpace: "nowrap", transition: "color 0.15s, border-color 0.15s",
              marginBottom: "-1px",
            }}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 28px 48px" }}>
        <Routes>
          <Route path="/"         element={<CustomerDashboard key={refresh} onNavigate={navigate} />} />
          <Route path="/list"     element={<CustomerList      key={refresh} onNavigate={navigate} />} />
          <Route path="/new"      element={<CreateCustomer    onSuccess={() => { bump(); navigate("/customers/list"); }} onCancel={() => navigate("/customers/list")} />} />
          <Route path="/segments" element={<CustomerSegments  key={refresh} />} />
          <Route path="/alerts"   element={<CustomerAlerts    key={refresh} onNavigate={navigate} />} />
          <Route path="/:id"      element={<CustomerDetail    onBack={() => navigate("/customers/list")} onNavigate={navigate} />} />
        </Routes>
      </div>
    </div>
  );
}
