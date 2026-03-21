import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, List, Plus, RotateCcw, Bell } from "lucide-react";
import { RentalDashboard } from "./RentalDashboard";
import { RentalList } from "./RentalList";
import { CreateRental } from "./CreateRental";
import { RentalReturns } from "./RentalReturns";
import { RentalAlerts } from "./RentalAlerts";
import { RentalDetail } from "./RentalDetail";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/rentals" },
  { id: "list",      label: "All Rentals", icon: List,            path: "/rentals/list" },
  { id: "new",       label: "New Rental",  icon: Plus,            path: "/rentals/new" },
  { id: "returns",   label: "Returns",     icon: RotateCcw,       path: "/rentals/returns" },
  { id: "alerts",    label: "Alerts",      icon: Bell,            path: "/rentals/alerts" },
];

export function RentalModule() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [refresh, setRefresh] = useState(0);

  const bump = () => setRefresh((k) => k + 1);

  const activeTab = TABS.find((t) =>
    t.path === "/rentals"
      ? location.pathname === "/rentals" || location.pathname === "/rentals/"
      : location.pathname.startsWith(t.path)
  )?.id ?? "dashboard";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5" }}>
      {/* ── Top Nav ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8e6e1",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: "2px",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        {TABS.map((tab) => {
          const Icon    = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                display:        "flex",
                alignItems:     "center",
                gap:            "7px",
                padding:        "14px 16px",
                border:         "none",
                borderBottom:   isActive ? "2px solid #1a6ef5" : "2px solid transparent",
                background:     "transparent",
                cursor:         "pointer",
                fontSize:       "13px",
                fontWeight:     isActive ? 500 : 400,
                color:          isActive ? "#1a6ef5" : "#6b6b6b",
                whiteSpace:     "nowrap",
                transition:     "color 0.15s, border-color 0.15s",
                marginBottom:   "-1px",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "28px 28px 48px" }}>
        <Routes>
          <Route path="/"        element={<RentalDashboard key={refresh} onNavigate={navigate} />} />
          <Route path="/list"    element={<RentalList      key={refresh} onNavigate={navigate} />} />
          <Route path="/new"     element={<CreateRental    onSuccess={() => { bump(); navigate("/rentals/list"); }} onCancel={() => navigate("/rentals/list")} />} />
          <Route path="/returns" element={<RentalReturns   onSuccess={bump} />} />
          <Route path="/alerts"  element={<RentalAlerts    key={refresh} onNavigate={navigate} />} />
          <Route path="/:id"     element={<RentalDetail    onBack={() => navigate("/rentals/list")} />} />
        </Routes>
      </div>
    </div>
  );
}
