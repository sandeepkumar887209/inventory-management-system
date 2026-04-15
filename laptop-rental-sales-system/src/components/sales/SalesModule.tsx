import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, List, Plus, RotateCcw, Bell, ShoppingBag } from "lucide-react";
import { SalesDashboard } from "./SalesDashboard";
import { SalesList }      from "./SalesList";
import { CreateSale }     from "./CreateSale";
import { SalesReturns }   from "./SalesReturns";
import { SalesAlerts }    from "./SalesAlerts";
import { SaleDetail }     from "./SaleDetail";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/sales"         },
  { id: "list",      label: "All Sales",  icon: List,            path: "/sales/list"    },
  { id: "new",       label: "New Sale",   icon: Plus,            path: "/sales/new"     },
  { id: "returns",   label: "Returns",    icon: RotateCcw,       path: "/sales/returns" },
  { id: "alerts",    label: "Alerts",     icon: Bell,            path: "/sales/alerts"  },
];

export function SalesModule() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [refresh, setRefresh] = useState(0);

  const bump = () => setRefresh((k) => k + 1);

  const activeTab = TABS.find((t) =>
    t.path === "/sales"
      ? location.pathname === "/sales" || location.pathname === "/sales/"
      : location.pathname.startsWith(t.path)
  )?.id ?? "dashboard";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4" }}>

      {/* ── Top Nav ── */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #ebe9e4",
        padding: "0 28px",
        display: "flex", alignItems: "center", gap: "2px",
        position: "sticky", top: 0, zIndex: 20,
      }}>

        {/* Module identity */}
     {/*   <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginRight: "24px", paddingRight: "24px",
          borderRight: "1px solid #ebe9e4",
        }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShoppingBag size={15} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>
            Sales
          </span>
        </div> */}

        {TABS.map((tab) => {
          const Icon    = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "15px 16px",
                border: "none",
                borderBottom: isActive ? "2px solid #4f46e5" : "2px solid transparent",
                background: "transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#4f46e5" : "#64748b",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
                marginBottom: "-1px",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "28px 28px 56px" }}>
        <Routes>
          <Route path="/"        element={<SalesDashboard key={refresh} onNavigate={navigate} />} />
          <Route path="/list"    element={<SalesList      key={refresh} onNavigate={navigate} />} />
          <Route path="/new"     element={<CreateSale
                                            onSuccess={() => { bump(); navigate("/sales/list"); }}
                                            onCancel={() => navigate("/sales/list")}
                                          />} />
          <Route path="/returns" element={<SalesReturns   onSuccess={bump} />} />
          <Route path="/alerts"  element={<SalesAlerts    key={refresh} onNavigate={navigate} />} />
          <Route path="/:id"     element={<SaleDetail     onBack={() => navigate("/sales/list")} />} />
        </Routes>
      </div>
    </div>
  );
}
