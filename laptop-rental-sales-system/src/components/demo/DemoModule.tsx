import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, List, Plus, RotateCcw, Bell, RefreshCw } from "lucide-react";
import { DemoDashboard } from "./DemoDashboard";
import { DemoList } from "./DemoList";
import { CreateNewDemo } from "./CreateNewDemo";
import { DemoReturns } from "./DemoReturns";
import { DemoAlerts } from "./DemoAlerts";
import { DemoDetail } from "./DemoDetail";

const TABS = [
  { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard, path: "/demos"         },
  { id: "list",      label: "All Demos",  icon: List,            path: "/demos/list"    },
  { id: "new",       label: "New Demo",   icon: Plus,            path: "/demos/new"     },
  { id: "returns",   label: "Returns",    icon: RotateCcw,       path: "/demos/returns" },
  { id: "alerts",    label: "Alerts",     icon: Bell,            path: "/demos/alerts"  },
];

export function DemoModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const [refresh, setRefresh] = useState(0);

  const bump = () => setRefresh((k) => k + 1);

  const activeTab =
    TABS.find((t) =>
      t.path === "/demos"
        ? location.pathname === "/demos" || location.pathname === "/demos/"
        : location.pathname.startsWith(t.path)
    )?.id ?? "dashboard";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5" }}>
      {/* Top Nav */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e8e6e1",
        padding: "0 24px", display: "flex", alignItems: "center", gap: "2px",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "14px 16px", border: "none",
                borderBottom: isActive ? "2px solid #7c3aed" : "2px solid transparent",
                background: "transparent", cursor: "pointer",
                fontSize: "13px", fontWeight: isActive ? 500 : 400,
                color: isActive ? "#7c3aed" : "#6b7280",
                whiteSpace: "nowrap", transition: "color 0.15s, border-color 0.15s",
                marginBottom: "-1px",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 28px 48px" }}>
        <Routes>
          <Route path="/"        element={<DemoDashboard key={refresh} onNavigate={navigate} />} />
          <Route path="/list"    element={<DemoList      key={refresh} onNavigate={navigate} />} />
          <Route path="/new"     element={<CreateNewDemo onSuccess={() => { bump(); navigate("/demos/list"); }} onCancel={() => navigate("/demos/list")} />} />
          <Route path="/returns" element={<DemoReturns   onSuccess={bump} />} />
          <Route path="/alerts"  element={<DemoAlerts    key={refresh} onNavigate={navigate} />} />
          <Route path="/:id"     element={<DemoDetail    onBack={() => navigate("/demos/list")} />} />
        </Routes>
      </div>
    </div>
  );
}
