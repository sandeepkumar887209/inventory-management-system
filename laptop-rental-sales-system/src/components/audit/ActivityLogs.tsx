import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/axios";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: number;
  user_id_snapshot: number | null;
  username_snapshot: string;
  full_name_snapshot: string;
  module: string;
  module_display: string;
  action: string;
  action_display: string;
  record_id: string;
  record_repr: string;
  changed_fields: string[] | null;
  ip_address: string | null;
  timestamp: string;
  old_data?: any;
  new_data?: any;
  user_agent?: string;
  extra?: any;
}

interface SummaryData {
  total: number;
  by_action: { action: string; count: number }[];
  by_module: { module: string; count: number }[];
  by_user:   { username_snapshot: string; count: number }[];
}

interface Choice { value: string; label: string; }

interface Filters {
  module:     string;
  action:     string;
  user:       string;
  date_from:  string;
  date_to:    string;
  search:     string;
}

const EMPTY_FILTERS: Filters = {
  module: "", action: "", user: "", date_from: "", date_to: "", search: ""
};

// ── Colour helpers ────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  CREATE: { bg: "#dcfce7", text: "#16a34a", dot: "#22c55e" },
  UPDATE: { bg: "#dbeafe", text: "#2563eb", dot: "#3b82f6" },
  DELETE: { bg: "#fee2e2", text: "#dc2626", dot: "#ef4444" },
  LOGIN:  { bg: "#ede9fe", text: "#7c3aed", dot: "#8b5cf6" },
  LOGOUT: { bg: "#f3f4f6", text: "#4b5563", dot: "#9ca3af" },
  EXPORT: { bg: "#fef3c7", text: "#d97706", dot: "#f59e0b" },
  VIEW:   { bg: "#f0fdf4", text: "#15803d", dot: "#4ade80" },
};

const MODULE_COLORS: Record<string, string> = {
  Inventory: "#3b82f6",
  Customers: "#8b5cf6",
  Rentals:   "#f59e0b",
  Sales:     "#10b981",
  Invoices:  "#06b6d4",
  CRM:       "#ec4899",
  Demo:      "#6366f1",
  Auth:      "#ef4444",
  Settings:  "#6b7280",
  Users:     "#84cc16",
  Reports:   "#f97316",
};

function ActionBadge({ action }: { action: string }) {
  const c = ACTION_COLORS[action] ?? { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.text, letterSpacing: "0.03em",
      fontFamily: "'DM Mono', monospace",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {action}
    </span>
  );
}

function ModulePill({ module }: { module: string }) {
  const color = MODULE_COLORS[module] ?? "#6b7280";
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 6,
      fontSize: 11, fontWeight: 600, color: "#fff",
      background: color, letterSpacing: "0.02em",
    }}>
      {module}
    </span>
  );
}

function fmtTs(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

// ── Diff viewer ───────────────────────────────────────────────────────────────

function DiffViewer({ old_data, new_data, changed_fields }: {
  old_data: any; new_data: any; changed_fields: string[] | null;
}) {
  const [tab, setTab] = useState<"diff" | "old" | "new">("diff");

  const renderDiff = () => {
    if (!old_data && !new_data) return <p style={{ color: "#9ca3af", fontSize: 13 }}>No data snapshot available.</p>;
    if (!old_data) return (
      <div>
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Created with:</p>
        <pre style={preStyle("#f0fdf4")}>{JSON.stringify(new_data, null, 2)}</pre>
      </div>
    );
    if (!new_data) return (
      <div>
        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Deleted object:</p>
        <pre style={preStyle("#fef2f2")}>{JSON.stringify(old_data, null, 2)}</pre>
      </div>
    );

    const fields = changed_fields ?? Object.keys({ ...old_data, ...new_data });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fields.map(f => {
          const changed = JSON.stringify(old_data?.[f]) !== JSON.stringify(new_data?.[f]);
          return (
            <div key={f} style={{
              borderRadius: 8, overflow: "hidden",
              border: `1px solid ${changed ? "#e2e8f0" : "#f1f5f9"}`,
              opacity: changed ? 1 : 0.55,
            }}>
              <div style={{
                background: "#f8fafc", padding: "4px 10px",
                fontSize: 11, fontWeight: 700, color: "#64748b",
                fontFamily: "'DM Mono', monospace", borderBottom: "1px solid #e2e8f0",
              }}>
                {f} {changed ? "✎" : ""}
              </div>
              {changed ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div style={{ padding: 8, borderRight: "1px solid #e2e8f0", background: "#fff5f5" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", marginBottom: 3 }}>BEFORE</div>
                    <pre style={{ ...preStyle(), fontSize: 11, margin: 0 }}>
                      {JSON.stringify(old_data?.[f], null, 2)}
                    </pre>
                  </div>
                  <div style={{ padding: 8, background: "#f0fdf4" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", marginBottom: 3 }}>AFTER</div>
                    <pre style={{ ...preStyle(), fontSize: 11, margin: 0 }}>
                      {JSON.stringify(new_data?.[f], null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 8, background: "#fafafa" }}>
                  <pre style={{ ...preStyle(), fontSize: 11, margin: 0, color: "#94a3b8" }}>
                    {JSON.stringify(new_data?.[f], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["diff", "old", "new"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600,
            background: tab === t ? "#1a6ef5" : "#f1f5f9",
            color: tab === t ? "#fff" : "#475569",
          }}>
            {t === "diff" ? "Changes" : t === "old" ? "Before" : "After"}
          </button>
        ))}
      </div>
      {tab === "diff" && renderDiff()}
      {tab === "old" && <pre style={preStyle("#fff5f5")}>{JSON.stringify(old_data, null, 2) ?? "—"}</pre>}
      {tab === "new" && <pre style={preStyle("#f0fdf4")}>{JSON.stringify(new_data, null, 2) ?? "—"}</pre>}
    </div>
  );
}

const preStyle = (bg = "#f8fafc") => ({
  background: bg, borderRadius: 8, padding: "10px 12px",
  fontSize: 12, fontFamily: "'DM Mono', monospace", overflowX: "auto" as const,
  margin: 0, color: "#1e293b", lineHeight: 1.6,
} as React.CSSProperties);

// ── Detail drawer ─────────────────────────────────────────────────────────────

function LogDrawer({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  if (!log) return null;
  const { date, time } = fmtTs(log.timestamp);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      display: "flex", alignItems: "stretch",
    }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} />
      <div style={{
        width: 540, background: "#fff", overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid #f1f5f9",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                Log #{log.id}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <ActionBadge action={log.action} />
                <ModulePill module={log.module} />
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#f8fafc", cursor: "pointer", fontSize: 16, color: "#94a3b8",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: "16px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              ["User", log.full_name_snapshot || log.username_snapshot || "—"],
              ["Username", log.username_snapshot || "—"],
              ["Record", log.record_repr || log.record_id || "—"],
              ["Record ID", log.record_id || "—"],
              ["Date", date],
              ["Time", time],
              ["IP Address", log.ip_address || "—"],
            ].map(([label, val]) => (
              <div key={label} style={{
                background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
                border: "1px solid #f1f5f9",
              }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, wordBreak: "break-all" }}>
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Changed fields */}
          {log.changed_fields && log.changed_fields.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Changed Fields ({log.changed_fields.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {log.changed_fields.map(f => (
                  <span key={f} style={{
                    background: "#eff6ff", color: "#2563eb", padding: "2px 8px",
                    borderRadius: 5, fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                  }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Data diff */}
          {(log.old_data || log.new_data) && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Data
              </div>
              <DiffViewer
                old_data={log.old_data}
                new_data={log.new_data}
                changed_fields={log.changed_fields}
              />
            </div>
          )}

          {/* User agent */}
          {log.user_agent && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Device / Browser
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace",
                lineHeight: 1.5, wordBreak: "break-all", margin: 0 }}>
                {log.user_agent}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCards({ data }: { data: SummaryData | null }) {
  if (!data) return null;
  const cards = [
    { label: "Total Actions", value: data.total.toLocaleString(), icon: "📋", accent: "#1a6ef5" },
    { label: "Modules Active",
      value: data.by_module.length,
      icon: "🗂️", accent: "#7c3aed" },
    { label: "Active Users",
      value: data.by_user.length,
      icon: "👥", accent: "#059669" },
    { label: "Most Common",
      value: data.by_action[0]?.action ?? "—",
      icon: "🔥", accent: "#d97706" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: c.accent + "18",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
          }}>{c.icon}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export function ActivityLogs() {
  const [logs,       setLogs]       = useState<AuditLog[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [filters,    setFilters]    = useState<Filters>(EMPTY_FILTERS);
  const [draft,      setDraft]      = useState<Filters>(EMPTY_FILTERS);
  const [choices,    setChoices]    = useState<{ modules: Choice[]; actions: Choice[] } | null>(null);
  const [summary,    setSummary]    = useState<SummaryData | null>(null);
  const [selected,   setSelected]   = useState<AuditLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── fetch choices once ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/audit/logs/choices/").then(r => setChoices(r.data)).catch(() => {});
    api.get("/audit/logs/summary/").then(r => setSummary(r.data)).catch(() => {});
  }, []);

  // ── fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (f: Filters, p: number) => {
    setLoading(true);
    try {
      const params: any = { page: p, page_size: PAGE_SIZE };
      if (f.module)    params.module    = f.module;
      if (f.action)    params.action    = f.action;
      if (f.user)      params.user      = f.user;
      if (f.date_from) params.date_from = f.date_from;
      if (f.date_to)   params.date_to   = f.date_to;
      if (f.search)    params.search    = f.search;

      const res = await api.get("/audit/logs/", { params });
      const data = res.data;

      // Support both paginated (DRF default) and plain array
      if (Array.isArray(data)) {
        setLogs(data);
        setTotal(data.length);
      } else {
        setLogs(data.results ?? []);
        setTotal(data.count ?? 0);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(filters, page); }, [filters, page, fetchLogs]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const applyFilters = () => { setPage(1); setFilters({ ...draft }); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setPage(1); setFilters(EMPTY_FILTERS); };

  const openDetail = async (log: AuditLog) => {
    if (log.old_data !== undefined) { setSelected(log); return; }
    setDetailLoading(true);
    try {
      const r = await api.get(`/audit/logs/${log.id}/`);
      setSelected(r.data);
    } catch { setSelected(log); }
    finally { setDetailLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (filters.module)    params.module    = filters.module;
      if (filters.action)    params.action    = filters.action;
      if (filters.user)      params.user      = filters.user;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to)   params.date_to   = filters.date_to;
      if (filters.search)    params.search    = filters.search;

      const res = await api.get("/audit/logs/export/", {
        params, responseType: "blob",
      });
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `audit_logs_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch { alert("Export failed."); }
    finally { setExporting(false); }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        .al-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .al-row { cursor: pointer; transition: background 0.1s; }
        .al-row:hover { background: #f8fafc !important; }
        .al-input {
          width: 100%; padding: 8px 12px;
          border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 13px; color: #1e293b; background: #fff; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .al-input:focus { border-color: #1a6ef5; box-shadow: 0 0 0 3px rgba(26,110,245,0.1); }
        .al-btn {
          padding: 8px 16px; border-radius: 8px; border: none;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .al-btn:hover { opacity: 0.88; }
        .al-btn:active { transform: scale(0.97); }
        .al-th {
          padding: 10px 14px; text-align: left;
          font-size: 11px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid #f1f5f9; white-space: nowrap;
        }
        .al-td { padding: 11px 14px; vertical-align: middle; border-bottom: 1px solid #f8fafc; }
        .al-page-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 12px; font-weight: 600; color: #475569;
          transition: all 0.12s;
        }
        .al-page-btn:hover:not(:disabled) { background: #1a6ef5; color: #fff; border-color: #1a6ef5; }
        .al-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .al-page-btn.active { background: #1a6ef5; color: #fff; border-color: #1a6ef5; }
      `}</style>

      <div className="al-root">
        {/* Page header */}
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
              Activity Logs
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
              Complete audit trail of all user actions across the system
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="al-btn"
            style={{ background: "#1a6ef5", color: "#fff", display: "flex", alignItems: "center", gap: 7 }}
          >
            <span style={{ fontSize: 15 }}>⬇</span>
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>

        {/* Summary cards */}
        <SummaryCards data={summary} />

        {/* Filter panel */}
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
          padding: "14px 16px", marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8" }}>🔍</span>
              <input
                className="al-input"
                style={{ paddingLeft: 32 }}
                placeholder="Search user, record…"
                value={draft.search}
                onChange={e => setDraft(p => ({ ...p, search: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && applyFilters()}
              />
            </div>

            {/* Module */}
            <select
              className="al-input"
              style={{ flex: "0 1 150px" }}
              value={draft.module}
              onChange={e => setDraft(p => ({ ...p, module: e.target.value }))}
            >
              <option value="">All Modules</option>
              {choices?.modules.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Action */}
            <select
              className="al-input"
              style={{ flex: "0 1 140px" }}
              value={draft.action}
              onChange={e => setDraft(p => ({ ...p, action: e.target.value }))}
            >
              <option value="">All Actions</option>
              {choices?.actions.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* User */}
            <input
              className="al-input"
              style={{ flex: "0 1 150px" }}
              placeholder="Username…"
              value={draft.user}
              onChange={e => setDraft(p => ({ ...p, user: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && applyFilters()}
            />

            {/* Date range */}
            <input
              type="date"
              className="al-input"
              style={{ flex: "0 1 145px" }}
              value={draft.date_from}
              onChange={e => setDraft(p => ({ ...p, date_from: e.target.value }))}
            />
            <input
              type="date"
              className="al-input"
              style={{ flex: "0 1 145px" }}
              value={draft.date_to}
              onChange={e => setDraft(p => ({ ...p, date_to: e.target.value }))}
            />

            <button onClick={applyFilters} className="al-btn" style={{ background: "#1a6ef5", color: "#fff", flexShrink: 0 }}>
              Apply
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="al-btn" style={{ background: "#f1f5f9", color: "#475569", flexShrink: 0 }}>
                Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, paddingLeft: 2 }}>
          {loading ? "Loading…" : `${total.toLocaleString()} record${total !== 1 ? "s" : ""} · Page ${page} of ${totalPages || 1}`}
        </div>

        {/* Table */}
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "#fafafa" }}>
                <tr>
                  <th className="al-th">Time</th>
                  <th className="al-th">User</th>
                  <th className="al-th">Module</th>
                  <th className="al-th">Action</th>
                  <th className="al-th">Record</th>
                  <th className="al-th">Changed Fields</th>
                  <th className="al-th">IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="al-td">
                          <div style={{
                            height: 14, borderRadius: 4,
                            background: `linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)`,
                            backgroundSize: "200% 100%",
                            animation: "shimmer 1.2s infinite",
                            width: `${60 + Math.random() * 40}%`,
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "60px 20px", textAlign: "center", color: "#cbd5e1" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>No audit logs found</div>
                      <div style={{ fontSize: 12, marginTop: 4, color: "#cbd5e1" }}>Try adjusting your filters</div>
                    </td>
                  </tr>
                ) : logs.map((log, idx) => {
                  const { date, time } = fmtTs(log.timestamp);
                  return (
                    <tr
                      key={log.id}
                      className="al-row"
                      onClick={() => openDetail(log)}
                      style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                    >
                      <td className="al-td">
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{time}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{date}</div>
                      </td>
                      <td className="al-td">
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>
                          {log.full_name_snapshot || log.username_snapshot || "—"}
                        </div>
                        {log.full_name_snapshot && log.username_snapshot && (
                          <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>
                            @{log.username_snapshot}
                          </div>
                        )}
                      </td>
                      <td className="al-td"><ModulePill module={log.module} /></td>
                      <td className="al-td"><ActionBadge action={log.action} /></td>
                      <td className="al-td">
                        <div style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#475569", fontSize: 12 }}>
                          {log.record_repr || log.record_id || "—"}
                        </div>
                      </td>
                      <td className="al-td">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 220 }}>
                          {(log.changed_fields ?? []).slice(0, 3).map(f => (
                            <span key={f} style={{
                              background: "#eff6ff", color: "#2563eb", padding: "1px 6px",
                              borderRadius: 4, fontSize: 10, fontFamily: "'DM Mono', monospace", fontWeight: 600,
                            }}>{f}</span>
                          ))}
                          {(log.changed_fields?.length ?? 0) > 3 && (
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>
                              +{(log.changed_fields?.length ?? 0) - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="al-td">
                        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>
                          {log.ip_address || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: "12px 16px", borderTop: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {((page - 1) * PAGE_SIZE) + 1} – {Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="al-page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                <button className="al-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = page - 2 + i;
                  if (p < 1) p = i + 1;
                  if (p > totalPages) p = totalPages - (4 - i);
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button key={p} className={`al-page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  );
                })}
                <button className="al-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                <button className="al-page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {detailLoading && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 70,
            background: "rgba(0,0,0,0.15)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "#fff", borderRadius: 12, padding: "18px 28px",
              fontSize: 14, color: "#475569", fontWeight: 500,
            }}>Loading details…</div>
          </div>
        )}
        <LogDrawer log={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}