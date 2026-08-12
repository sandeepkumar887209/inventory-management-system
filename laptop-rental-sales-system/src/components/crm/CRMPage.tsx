import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, List, TrendingUp, CheckSquare, UserCog } from "lucide-react";
import { LeadList }        from "./LeadList";
import { LeadDetail }      from "./LeadDetail";
import { LeadPipeline }    from "./LeadPipeline";
import { LeadForm }        from "./LeadForm";
import { CRMDashboard }    from "./CRMDashboard";
import { TodoList }        from "./TodoList";
import { LeadAssignPanel } from "./LeadAssignPanel";
import { Lead }            from "./types";
import { useIdentity }     from "../../context/IdentityContext";

export function CRMPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { isAdmin } = useIdentity();
  const [modalOpen, setModalOpen]   = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /* Don't show top nav on a lead detail page */
  const isDetailPage = /^\/crm\/leads\/\d+/.test(location.pathname);
  const showNav = !isDetailPage;

  const TABS = [
    { path: "/crm/dashboard", label: "Dashboard", Icon: LayoutDashboard, match: (p: string) => p === "/crm" || p === "/crm/dashboard" },
    { path: "/crm/leads",     label: "Leads",     Icon: List,             match: (p: string) => p.startsWith("/crm/leads") },
    { path: "/crm/pipeline",  label: "Pipeline",  Icon: TrendingUp,       match: (p: string) => p === "/crm/pipeline" },
    { path: "/crm/todos",     label: "To-Do",     Icon: CheckSquare,      match: (p: string) => p === "/crm/todos" },
    // Admin-only tab
    ...(isAdmin
      ? [{ path: "/crm/assign", label: "Assign Leads", Icon: UserCog, match: (p: string) => p === "/crm/assign" }]
      : []),
  ];

  const activeTab = TABS.find((t) => t.match(location.pathname));

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5" }}>

      {/* ── Top navigation bar ── */}
      {showNav && (
        <div style={{
          background: "#fff",
          borderBottom: "1px solid #e8e6e1",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          gap: "2px",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}>
          {TABS.map(({ path, label, Icon, match }) => {
            const active = match(location.pathname);
            const isAssignTab = path === "/crm/assign";
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  padding: "14px 16px", border: "none",
                  borderBottom: active
                    ? `2px solid ${isAssignTab ? "#7c3aed" : "#1a6ef5"}`
                    : "2px solid transparent",
                  background: "transparent", cursor: "pointer",
                  fontSize: "13px", fontWeight: active ? 500 : 400,
                  color: active
                    ? (isAssignTab ? "#7c3aed" : "#1a6ef5")
                    : "#6b6b6b",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                  marginBottom: "-1px",
                }}
              >
                <Icon size={15} />
                {label}
                {isAssignTab && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", padding: "1px 6px",
                    borderRadius: "99px", fontSize: "10px", fontWeight: 600,
                    background: "#f5f0ff", color: "#7c3aed", marginLeft: "2px",
                  }}>
                    Admin
                  </span>
                )}
              </button>
            );
          })}

          {/* Add Lead button — only show on Leads tab */}
          {activeTab?.path === "/crm/leads" && (
            <div style={{ marginLeft: "auto", padding: "8px 0" }}>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", background: "#1a6ef5", color: "#fff",
                  border: "none", borderRadius: "8px", fontSize: "13px",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                + Add Lead
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Page content ── */}
      <div style={{ padding: "28px 28px 48px" }}>
        <Routes>
          <Route path="/"          element={<CRMDashboard />} />
          <Route path="/dashboard" element={<CRMDashboard />} />
          <Route
            path="/leads"
            element={
              <LeadList
                key={refreshKey}
                onAddNew={() => setModalOpen(true)}
                onViewDetails={(lead: Lead) => navigate(`/crm/leads/${lead.id}`)}
              />
            }
          />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/pipeline"  element={<LeadPipeline />} />
          <Route path="/todos"     element={<TodoList />} />
          {isAdmin && (
            <Route path="/assign" element={<LeadAssignPanel />} />
          )}
        </Routes>
      </div>

      {/* ── Add Lead Modal ── */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            width: "100%", maxWidth: "640px", maxHeight: "90vh",
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 24px", borderBottom: "1px solid #f0eeeb",
            }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>Add New Lead</div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#aaa", fontSize: "18px", lineHeight: 1, padding: "2px 6px", borderRadius: "6px",
                }}
              >✕</button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              <LeadForm
                onSuccess={() => { setModalOpen(false); setRefreshKey((k) => k + 1); }}
                onCancel={() => setModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
