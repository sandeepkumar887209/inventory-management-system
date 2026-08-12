import React, { useEffect, useState, useCallback } from "react";
import {
  Search, Plus, Phone, Mail, Calendar, RefreshCw,
  ChevronLeft, ChevronRight, Edit2, Trash2, User, UserCog, X,
} from "lucide-react";
import { crmApi } from "../../services/crm";
import { Lead, AssignableUser } from "./types";
import { LeadForm } from "./LeadForm";
import { useIdentity } from "../../context/IdentityContext";
import { useNavigate } from "react-router-dom";

interface LeadListProps {
  onAddNew: () => void;
  onViewDetails: (lead: Lead) => void;
}

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
const SOURCE_LABELS: Record<string, string> = {
  WALK_IN: "Walk In", REFERRAL: "Referral", SOCIAL_MEDIA: "Social Media",
  WEBSITE: "Website", COLD_CALL: "Cold Call", OTHER: "Other",
};
const INTENT_LABELS: Record<string, string> = { RENT: "Rent", BUY: "Buy", BOTH: "Rent + Buy" };

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_TOKEN[status] ?? D.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 9px",
      borderRadius: "99px", fontSize: "11px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, whiteSpace: "nowrap",
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Btn({ children, onClick, variant = "ghost", style = {}, disabled = false }: any) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "5px",
    border: "none", borderRadius: "8px", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500, fontSize: "13px", padding: "6px 14px", opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s", ...style,
  };
  const variants: any = {
    primary: { background: D.blue.solid, color: "#fff" },
    ghost:   { background: "#f4f3f0", color: "#333", border: "1px solid #e8e6e1" },
    danger:  { background: D.red.bg, color: D.red.text, border: `0.5px solid ${D.red.border}`, padding: "5px 10px" },
    icon:    { background: "transparent", color: "#888", padding: "5px 7px" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

const ITEMS_PER_PAGE = 10;

export function LeadList({ onAddNew, onViewDetails }: LeadListProps) {
  const { isAdmin }   = useIdentity();
  const navigate      = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [assigningLead, setAssigningLead] = useState<Lead | null>(null);
  const [assignUser, setAssignUser]       = useState("");
  const [assignBusy, setAssignBusy]       = useState(false);

  useEffect(() => {
    fetchLeads();
    crmApi.getAssignableUsers().then(setUsers).catch(() => {});
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true); setError("");
      setLeads(await crmApi.getLeads());
    } catch { setError("Failed to load leads."); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    try { await crmApi.deleteLead(id); setLeads(p => p.filter(l => l.id !== id)); }
    catch { alert("Failed to delete lead."); }
  };

  const handleQuickAssign = async () => {
    if (!assigningLead || !assignUser) return;
    setAssignBusy(true);
    try {
      await crmApi.assignLead(assigningLead.id, Number(assignUser));
      const userName = users.find((u) => u.id === Number(assignUser))?.full_name ?? "";
      setLeads((prev) =>
        prev.map((l) =>
          l.id === assigningLead.id
            ? { ...l, assigned_to: Number(assignUser), assigned_to_name: userName }
            : l
        )
      );
      setAssigningLead(null);
      setAssignUser("");
    } catch {
      alert("Assignment failed.");
    } finally {
      setAssignBusy(false);
    }
  };

  const filtered = leads.filter(l => {
    const q = searchTerm.toLowerCase();
    return (
      (l.name.toLowerCase().includes(q) || l.phone.includes(q) ||
       (l.email || "").toLowerCase().includes(q) || (l.company || "").toLowerCase().includes(q)) &&
      (statusFilter === "all" || l.status === statusFilter) &&
      (assignedFilter === "all" || (assignedFilter === "unassigned" ? !l.assigned_to : String(l.assigned_to) === assignedFilter)) &&
      (!dateFrom || new Date(l.created_at) >= new Date(dateFrom)) &&
      (!dateTo   || new Date(l.created_at) <= new Date(dateTo + "T23:59:59"))
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const selectStyle: React.CSSProperties = {
    border: "1px solid #e8e6e1", borderRadius: "8px", padding: "7px 12px",
    fontSize: "13px", background: "#fff", color: "#333", cursor: "pointer", outline: "none",
  };

  /* ── Inline Edit View ── */
  if (editLead) {
    return (
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", padding: "28px", maxWidth: "740px" }}>
        <LeadForm
          lead={editLead}
          onSuccess={() => { setEditLead(null); fetchLeads(); }}
          onCancel={() => setEditLead(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a" }}>Lead Management</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>{filtered.length} lead{filtered.length !== 1 ? "s" : ""} found</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {isAdmin && (
            <Btn onClick={() => navigate("/crm/assign")} variant="ghost" style={{ gap: "5px" }}>
              <UserCog size={14} /> Assign
            </Btn>
          )}
          <Btn onClick={fetchLeads} variant="ghost">
            <RefreshCw size={14} /> Refresh
          </Btn>
          <button onClick={onAddNew} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: D.blue.solid, color: "#fff", border: "none",
            borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
          }}>
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Role banner for non-admins */}
      {!isAdmin && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: D.blue.bg, border: `1px solid ${D.blue.border}`,
          borderRadius: "10px", padding: "10px 16px",
        }}>
          <User size={14} color={D.blue.solid} />
          <span style={{ fontSize: "13px", color: D.blue.text, fontWeight: 500 }}>
            Showing only leads assigned to you. Contact your admin to assign new leads.
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", padding: "16px 20px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isAdmin ? "2fr 1fr 1fr 1fr 1fr" : "2fr 1fr 1fr 1fr",
          gap: "10px", alignItems: "center",
        }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
            <input
              style={{ width: "100%", border: "1px solid #e8e6e1", borderRadius: "8px", padding: "7px 12px 7px 32px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
              placeholder="Search name, phone, email, company…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          {/* Status */}
          <select style={selectStyle} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {/* Assigned — only for admins */}
          {isAdmin && (
            <select style={selectStyle} value={assignedFilter} onChange={e => { setAssignedFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Salespeople</option>
              <option value="unassigned">Unassigned</option>
              {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
            </select>
          )}
          {/* Date From */}
          <input type="date" style={selectStyle} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }} title="From date" />
          {/* Date To */}
          <input type="date" style={selectStyle} value={dateTo} onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }} title="To date" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: D.red.bg, border: `1px solid ${D.red.border}`, borderRadius: "10px", padding: "12px 16px", color: D.red.text, fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>
            <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
            Loading leads…
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  {["Lead", "Contact", "Intent", "Source", "Assigned", "Status", "Follow-up", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #f0eeeb", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                    No leads found. {(statusFilter !== "all" || searchTerm) ? "Try adjusting your filters." : ""}
                  </td></tr>
                ) : paginated.map((lead) => (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500, color: "#1a1a1a", fontSize: "13px" }}>{lead.name}</div>
                      {lead.company && <div style={{ fontSize: "11px", color: "#aaa" }}>{lead.company}</div>}
                      {(lead.tags?.length ?? 0) > 0 && (
                        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                          {lead.tags.map(tag => (
                            <span key={tag.id} style={{ padding: "1px 7px", borderRadius: "99px", fontSize: "10px", fontWeight: 500, color: "#fff", background: tag.color }}>{tag.name}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#555" }}>
                        <Phone size={12} color="#aaa" />{lead.phone}
                      </div>
                      {lead.email && <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                        <Mail size={11} color="#ccc" />{lead.email}
                      </div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "13px", color: "#555" }}>{INTENT_LABELS[lead.intent]}</div>
                      <div style={{ fontSize: "11px", color: "#aaa" }}>{lead.expected_laptops} laptop(s)</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888" }}>{SOURCE_LABELS[lead.source]}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {lead.assigned_to_name ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: D.blue.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: D.blue.text }}>{lead.assigned_to_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span style={{ fontSize: "12px", color: "#555" }}>{lead.assigned_to_name}</span>
                        </div>
                      ) : (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "11px", color: D.amber.text,
                          background: D.amber.bg, padding: "2px 8px", borderRadius: "99px",
                          border: `0.5px solid ${D.amber.border}`,
                        }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {lead.follow_up_date ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#555" }}>
                          <Calendar size={12} color="#aaa" />{fmtDate(lead.follow_up_date)}
                        </div>
                      ) : <span style={{ color: "#ccc", fontSize: "12px" }}>—</span>}
                      {(lead.pending_followups ?? 0) > 0 && (
                        <div style={{ fontSize: "11px", color: D.amber.text, marginTop: "2px" }}>{lead.pending_followups} pending</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Btn variant="ghost" onClick={() => onViewDetails(lead)} style={{ padding: "5px 12px", fontSize: "12px" }}>View</Btn>
                        <button onClick={() => setEditLead(lead)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "4px", borderRadius: "6px", display: "flex" }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { setAssigningLead(lead); setAssignUser(String(lead.assigned_to ?? "")); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: D.purple.solid, padding: "4px", borderRadius: "6px", display: "flex" }}
                            title="Assign"
                          >
                            <UserCog size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(lead.id)} style={{ background: "none", border: "none", cursor: "pointer", color: D.red.solid, padding: "4px", borderRadius: "6px", display: "flex" }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid #f0eeeb" }}>
            <span style={{ fontSize: "12px", color: "#888" }}>Page {currentPage} of {totalPages}</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: "5px 10px", border: "1px solid #e8e6e1", borderRadius: "7px", background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: "5px 10px", border: "1px solid #e8e6e1", borderRadius: "7px", background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Assign Modal (Admin only) */}
      {assigningLead && isAdmin && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            width: "100%", maxWidth: "400px", padding: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>Assign Lead</div>
              <button onClick={() => setAssigningLead(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>Lead</div>
              <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{assigningLead.name}</div>
              {assigningLead.company && <div style={{ fontSize: "12px", color: "#aaa" }}>{assigningLead.company}</div>}
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500, display: "block", marginBottom: "6px" }}>Assign To</label>
              <select
                value={assignUser}
                onChange={(e) => setAssignUser(e.target.value)}
                style={{
                  width: "100%", border: "1px solid #e8e6e1", borderRadius: "8px",
                  padding: "8px 12px", fontSize: "13px", outline: "none",
                }}
              >
                <option value="">-- Unassign --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setAssigningLead(null)}
                style={{
                  padding: "8px 16px", border: "1px solid #e8e6e1",
                  borderRadius: "8px", background: "#f4f3f0",
                  fontSize: "13px", cursor: "pointer", color: "#333",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAssign}
                disabled={assignBusy}
                style={{
                  padding: "8px 16px", background: D.purple.solid, color: "#fff",
                  border: "none", borderRadius: "8px", fontSize: "13px",
                  fontWeight: 600, cursor: assignBusy ? "not-allowed" : "pointer",
                  opacity: assignBusy ? 0.7 : 1,
                }}
              >
                {assignBusy ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
