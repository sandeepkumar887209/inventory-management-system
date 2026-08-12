import React, { useEffect, useState, useCallback } from "react";
import {
  Users, UserCheck, UserX, Search, RefreshCw,
  CheckSquare, Square, ChevronDown, AlertCircle,
  CheckCircle2, X, Filter, ArrowRight,
} from "lucide-react";
import { crmApi } from "../../services/crm";
import { Lead, AssignableUser } from "./types";

/* ── Design tokens ── */
const D = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  teal:   { bg: "#e6f7f1", text: "#0d6e50", border: "#a8e0ce", solid: "#1aad80" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
  purple: { bg: "#f5f0ff", text: "#5b21b6", border: "#ddd6fe", solid: "#7c3aed" },
};

const STATUS_TOKEN: Record<string, any> = {
  NEW: D.blue, CONTACTED: D.amber, QUALIFIED: D.purple, CONVERTED: D.green, LOST: D.red,
};
const STATUS_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", CONVERTED: "Converted", LOST: "Lost",
};

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue}, 55%, 88%)`,
      color: `hsl(${hue}, 55%, 35%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {initials || "?"}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_TOKEN[status] ?? D.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: "99px", fontSize: "11px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const c = type === "success" ? D.green : D.red;
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "10px",
      background: "#fff", border: `1px solid ${c.border}`,
      borderLeft: `4px solid ${c.solid}`,
      borderRadius: "10px", padding: "12px 16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      animation: "slideUp 0.3s ease",
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {type === "success" ? <CheckCircle2 size={16} color={c.solid} /> : <AlertCircle size={16} color={c.solid} />}
      <span style={{ fontSize: "13px", color: "#333" }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", marginLeft: "4px" }}>
        <X size={14} />
      </button>
    </div>
  );
}

interface ToastState { message: string; type: "success" | "error" }

export function LeadAssignPanel() {
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [users, setUsers]           = useState<AssignableUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [bulkUser, setBulkUser]     = useState<string>("");
  const [assigning, setAssigning]   = useState<number | null>(null); // lead id being assigned
  const [bulkBusy, setBulkBusy]     = useState(false);
  const [toast, setToast]           = useState<ToastState | null>(null);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, u] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getAssignableUsers(),
      ]);
      setLeads(l);
      setUsers(u);
    } catch {
      showToast("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  /* Filtering */
  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.email ?? "").toLowerCase().includes(q) ||
      (l.company ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchAssigned =
      assignedFilter === "all" ||
      (assignedFilter === "unassigned" && !l.assigned_to) ||
      (assignedFilter === "assigned" && !!l.assigned_to);
    return matchSearch && matchStatus && matchAssigned;
  });

  /* Selection */
  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((l) => l.id)));
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* Assign single lead */
  const handleAssign = async (leadId: number, userId: number | null) => {
    setAssigning(leadId);
    try {
      await crmApi.assignLead(leadId, userId);
      const userName = userId ? users.find((u) => u.id === userId)?.full_name ?? "user" : "nobody";
      showToast(`Lead ${userId ? `assigned to ${userName}` : "unassigned"}.`, "success");
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, assigned_to: userId, assigned_to_name: userId ? userName : null }
            : l
        )
      );
    } catch {
      showToast("Assignment failed.", "error");
    } finally {
      setAssigning(null);
    }
  };

  /* Bulk assign */
  const handleBulkAssign = async () => {
    if (selected.size === 0) {
      showToast("Select at least one lead.", "error");
      return;
    }
    setBulkBusy(true);
    const userId = bulkUser ? Number(bulkUser) : null;
    try {
      await crmApi.bulkAssignLeads(Array.from(selected), userId);
      const userName = userId ? users.find((u) => u.id === userId)?.full_name ?? "user" : "nobody";
      showToast(`${selected.size} lead(s) ${userId ? `assigned to ${userName}` : "unassigned"}.`, "success");
      setSelected(new Set());
      setBulkUser("");
      await load();
    } catch {
      showToast("Bulk assignment failed.", "error");
    } finally {
      setBulkBusy(false);
    }
  };

  /* Per-user summary */
  const userSummary = users.map((u) => ({
    ...u,
    count: leads.filter((l) => l.assigned_to === u.id).length,
  })).sort((a, b) => b.count - a.count);
  const unassigned = leads.filter((l) => !l.assigned_to).length;

  const selectStyle: React.CSSProperties = {
    border: "1px solid #e8e6e1", borderRadius: "8px", padding: "6px 10px",
    fontSize: "13px", background: "#fff", color: "#333", cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a" }}>Lead Assignment</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
            Assign and manage leads across your sales team
          </div>
        </div>
        <button
          onClick={load}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            border: "1px solid #e8e6e1", borderRadius: "8px", background: "#f4f3f0",
            padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#333",
          }}
        >
          <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          Refresh
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </button>
      </div>

      {/* Team Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(users.length + 1, 5)}, 1fr)`,
        gap: "12px",
      }}>
        {/* Unassigned */}
        <button
          onClick={() => setAssignedFilter(assignedFilter === "unassigned" ? "all" : "unassigned")}
          style={{
            background: assignedFilter === "unassigned" ? D.amber.bg : "#fff",
            border: `1px solid ${assignedFilter === "unassigned" ? D.amber.border : "#ebebeb"}`,
            borderRadius: "12px", padding: "14px 16px", cursor: "pointer", textAlign: "left",
            transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: D.amber.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserX size={15} color={D.amber.solid} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#888" }}>Unassigned</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: D.amber.text }}>{unassigned}</div>
        </button>

        {userSummary.slice(0, 4).map((u) => (
          <button
            key={u.id}
            onClick={() => setAssignedFilter(assignedFilter === String(u.id) ? "all" : String(u.id))}
            style={{
              background: "#fff", border: "1px solid #ebebeb",
              borderRadius: "12px", padding: "14px 16px", cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fafaf8"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <Avatar name={u.full_name} size={32} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>
                {u.full_name}
              </span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#1a1a1a" }}>{u.count}</div>
            <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>leads</div>
          </button>
        ))}
      </div>

      {/* Bulk Assign Bar */}
      {selected.size > 0 && (
        <div style={{
          background: D.blue.bg, border: `1px solid ${D.blue.border}`,
          borderRadius: "12px", padding: "14px 20px",
          display: "flex", alignItems: "center", gap: "14px",
          animation: "slideDown 0.2s ease",
        }}>
          <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckSquare size={16} color={D.blue.solid} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: D.blue.text }}>
              {selected.size} lead{selected.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={bulkUser}
              onChange={(e) => setBulkUser(e.target.value)}
              style={{ ...selectStyle, minWidth: "200px" }}
            >
              <option value="">Unassign (remove assignment)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={bulkBusy}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: D.blue.solid, color: "#fff", border: "none",
                borderRadius: "8px", padding: "7px 16px", fontSize: "13px",
                fontWeight: 600, cursor: bulkBusy ? "not-allowed" : "pointer",
                opacity: bulkBusy ? 0.7 : 1,
              }}
            >
              <ArrowRight size={14} />
              {bulkBusy ? "Assigning…" : "Apply to Selected"}
            </button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "12px", padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
            <input
              style={{ width: "100%", border: "1px solid #e8e6e1", borderRadius: "8px", padding: "7px 12px 7px 32px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select style={selectStyle} value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}>
            <option value="all">All Assignments</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            {users.map((u) => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "#bbb", fontSize: "13px", gap: "8px" }}>
            <RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} />
            Loading leads…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  <th style={{ padding: "10px 16px", borderBottom: "1px solid #f0eeeb", width: "40px" }}>
                    <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#888" }}>
                      {allSelected ? <CheckSquare size={16} color={D.blue.solid} /> : <Square size={16} />}
                    </button>
                  </th>
                  {["Lead", "Status", "Current Assignment", "Reassign To", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #f0eeeb", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                      No leads found
                    </td>
                  </tr>
                ) : filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: "1px solid #f5f4f1",
                      background: selected.has(lead.id) ? "#f0f7ff" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => toggleOne(lead.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "#888" }}
                      >
                        {selected.has(lead.id)
                          ? <CheckSquare size={16} color={D.blue.solid} />
                          : <Square size={16} />}
                      </button>
                    </td>

                    {/* Lead info */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{lead.name}</div>
                      {lead.company && <div style={{ fontSize: "11px", color: "#aaa" }}>{lead.company}</div>}
                      <div style={{ fontSize: "11px", color: "#bbb", marginTop: "2px" }}>{lead.phone}</div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={lead.status} />
                    </td>

                    {/* Current assignment */}
                    <td style={{ padding: "12px 16px" }}>
                      {lead.assigned_to_name ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Avatar name={lead.assigned_to_name} size={26} />
                          <div>
                            <div style={{ fontSize: "12px", color: "#333", fontWeight: 500 }}>{lead.assigned_to_name}</div>
                            <button
                              onClick={() => handleAssign(lead.id, null)}
                              disabled={assigning === lead.id}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: "11px", color: D.red.solid, padding: 0, marginTop: "1px",
                              }}
                            >
                              Unassign
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#ccc", fontStyle: "italic" }}>Unassigned</span>
                      )}
                    </td>

                    {/* Assign dropdown */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ position: "relative" }}>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssign(lead.id, Number(e.target.value));
                                e.target.value = "";
                              }
                            }}
                            disabled={assigning === lead.id}
                            style={{
                              ...selectStyle,
                              minWidth: "160px",
                              opacity: assigning === lead.id ? 0.6 : 1,
                              paddingRight: "28px",
                              appearance: "none",
                            }}
                          >
                            <option value="" disabled>Select user…</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }} />
                        </div>
                        {assigning === lead.id && (
                          <RefreshCw size={14} style={{ animation: "spin 1s linear infinite", color: D.blue.solid }} />
                        )}
                      </div>
                    </td>

                    {/* Quick assign-to-self */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "3px 8px", borderRadius: "6px",
                          background: lead.assigned_to ? D.green.bg : D.gray.bg,
                          color: lead.assigned_to ? D.green.text : D.gray.text,
                          fontSize: "11px", fontWeight: 500,
                        }}>
                          {lead.assigned_to ? <UserCheck size={11} /> : <UserX size={11} />}
                          {lead.assigned_to ? "Assigned" : "Open"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && (
          <div style={{
            padding: "10px 20px", borderTop: "1px solid #f0eeeb",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "12px", color: "#888" }}>
              {filtered.length} lead{filtered.length !== 1 ? "s" : ""} shown
            </span>
            {selected.size > 0 && (
              <span style={{ fontSize: "12px", color: D.blue.text, fontWeight: 500 }}>
                {selected.size} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
