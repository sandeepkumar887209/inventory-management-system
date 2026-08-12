import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, CheckCircle, Clock, Phone, Calendar,
  RefreshCw, ArrowRight, TrendingUp, UserX, UserCog, AlertTriangle,
} from "lucide-react";
import { crmApi } from "../../services/crm";
import { CRMDashboard as DashboardData } from "./types";
import { useIdentity } from "../../context/IdentityContext";

/* ── Design tokens (match ERP DashboardModule) ── */
const D = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5", light: "#f0f7ff" },
  teal:   { bg: "#e6f7f1", text: "#0d6e50", border: "#a8e0ce", solid: "#1aad80" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
  purple: { bg: "#f5f0ff", text: "#5b21b6", border: "#ddd6fe", solid: "#7c3aed" },
};

const STATUS_COLORS: Record<string, string> = {
  NEW: D.blue.solid, CONTACTED: D.amber.solid, QUALIFIED: D.purple.solid,
  CONVERTED: D.green.solid, LOST: D.red.solid,
};
const STATUS_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  CONVERTED: "Converted", LOST: "Lost",
};
const STATUS_TOKEN: Record<string, any> = {
  NEW: D.blue, CONTACTED: D.amber, QUALIFIED: D.purple, CONVERTED: D.green, LOST: D.red,
};

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #ebebeb",
      borderRadius: "14px", overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, right, sub }: { title: string; right?: React.ReactNode; sub?: string }) {
  return (
    <div style={{
      padding: "16px 20px 12px", borderBottom: "1px solid #f5f4f1",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{title}</div>
        {sub && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color = "blue" }: any) {
  const c = (D as any)[color] ?? D.blue;
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: c.bg, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={18} color={c.solid} />
          </div>
        </div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>{label}</div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_TOKEN[status] ?? D.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 9px",
      borderRadius: "99px", fontSize: "11px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>
      <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
      Loading…
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function CRMDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useIdentity();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setData(await crmApi.getDashboard());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) return <Spinner />;
  if (!data) return null;

  const statuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"];
  const total = data.total_leads || 1;

  const kpiCards = isAdmin
    ? [
        { label: "Total Leads",      value: data.total_leads,                  icon: TrendingUp,  color: "blue"   },
        { label: "My Assigned",      value: data.my_leads,                     icon: Users,       color: "purple" },
        { label: "Today Follow-ups", value: data.today_followups,              icon: Clock,       color: "amber"  },
        { label: "Converted",        value: data.by_status?.CONVERTED ?? 0,    icon: CheckCircle, color: "green"  },
        { label: "Unassigned",       value: data.unassigned_count ?? 0,        icon: UserX,       color: data.unassigned_count ? "amber" : "gray" },
      ]
    : [
        { label: "My Leads",         value: data.my_leads,                     icon: Users,       color: "blue"   },
        { label: "Today Follow-ups", value: data.today_followups,              icon: Clock,       color: "amber"  },
        { label: "Converted",        value: data.by_status?.CONVERTED ?? 0,    icon: CheckCircle, color: "green"  },
        { label: "In Progress",      value: (data.by_status?.CONTACTED ?? 0) + (data.by_status?.QUALIFIED ?? 0), icon: TrendingUp, color: "purple" },
      ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a" }}>CRM Dashboard</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
            {isAdmin ? "Full pipeline overview and team performance" : "Your assigned leads and upcoming tasks"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isAdmin && (
            <button
              onClick={() => navigate("/crm/assign")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                border: "1px solid #ddd6fe", borderRadius: "8px", background: "#f5f0ff",
                padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#7c3aed",
              }}
            >
              <UserCog size={14} /> Assign Leads
            </button>
          )}
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: "6px",
            border: "1px solid #e8e6e1", borderRadius: "8px", background: "#f4f3f0",
            padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#333",
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpiCards.length}, 1fr)`, gap: "14px" }}>
        {kpiCards.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader title="Leads by Status" sub="Pipeline distribution" />
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {statuses.map((s) => {
            const count = data.by_status?.[s] ?? 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={s}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[s] }} />
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>{STATUS_LABELS[s]}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#aaa" }}>{pct}%</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", minWidth: "24px", textAlign: "right" }}>{count}</span>
                  </div>
                </div>
                <div style={{ height: "7px", background: "#f0eeeb", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", background: STATUS_COLORS[s],
                    borderRadius: "99px", transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Admin-only: Team Overview */}
      {isAdmin && data.user_stats && data.user_stats.length > 0 && (
        <Card>
          <CardHeader
            title="Team Performance"
            sub="Leads assigned per team member"
            right={
              <button
                onClick={() => navigate("/crm/assign")}
                style={{
                  display: "flex", alignItems: "center", gap: "4px", fontSize: "12px",
                  color: "#7c3aed", fontWeight: 500, background: "none", border: "none", cursor: "pointer",
                }}
              >
                Manage <ArrowRight size={12} />
              </button>
            }
          />
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {(data.unassigned_count ?? 0) > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 14px",
                background: "#fff8e6", border: "1px solid #ffdfa0", borderRadius: "10px",
              }}>
                <AlertTriangle size={15} color="#d4930a" />
                <span style={{ fontSize: "13px", color: "#8a5c00", fontWeight: 500 }}>
                  {data.unassigned_count} lead{data.unassigned_count !== 1 ? "s" : ""} still unassigned
                </span>
                <button
                  onClick={() => navigate("/crm/assign")}
                  style={{
                    marginLeft: "auto", background: "none", border: "1px solid #ffdfa0",
                    borderRadius: "6px", padding: "4px 10px", fontSize: "12px",
                    color: "#8a5c00", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Assign Now
                </button>
              </div>
            )}
            {data.user_stats.filter((u) => u.user_id !== null).map((u) => {
              const maxTotal = Math.max(...(data.user_stats || []).filter((x) => x.user_id !== null).map((x) => x.total), 1);
              const pct = Math.round((u.total / maxTotal) * 100);
              return (
                <div key={u.user_id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `hsl(${(u.user_id ?? 0) * 37 % 360}, 55%, 88%)`,
                    color: `hsl(${(u.user_id ?? 0) * 37 % 360}, 55%, 35%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 700, flexShrink: 0,
                  }}>
                    {u.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>{u.name}</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{u.total}</span>
                    </div>
                    <div style={{ height: "6px", background: "#f0eeeb", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`, height: "100%",
                        background: `hsl(${(u.user_id ?? 0) * 37 % 360}, 55%, 55%)`,
                        borderRadius: "99px", transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Two-column: Recent + Follow-ups */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Recent Leads */}
        <Card>
          <CardHeader
            title="Recent Leads"
            right={
              <button onClick={() => navigate("/crm/leads")} style={{
                display: "flex", alignItems: "center", gap: "4px", fontSize: "12px",
                color: D.blue.text, fontWeight: 500, background: "none", border: "none", cursor: "pointer",
              }}>
                View All <ArrowRight size={12} />
              </button>
            }
          />
          <div>
            {data.recent_leads.length === 0
              ? <div style={{ padding: "32px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>No leads yet</div>
              : data.recent_leads.map((lead, i) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  style={{
                    padding: "12px 20px", cursor: "pointer",
                    borderBottom: i < data.recent_leads.length - 1 ? "1px solid #f5f4f1" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafaf8"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>{lead.name}</div>
                    <StatusBadge status={lead.status} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#aaa" }}>
                      <Phone size={11} />{lead.phone}
                    </span>
                    <span style={{ fontSize: "11px", color: "#ccc" }}>{fmtDate(lead.created_at)}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </Card>

        {/* Today's Follow-ups */}
        <Card>
          <CardHeader
            title="Today's Follow-ups"
            right={
              <span style={{
                display: "inline-flex", alignItems: "center", padding: "3px 9px",
                borderRadius: "99px", fontSize: "11px", fontWeight: 500,
                background: D.amber.bg, color: D.amber.text, border: `0.5px solid ${D.amber.border}`,
              }}>
                {data.today_followup_leads.length} due
              </span>
            }
          />
          <div>
            {data.today_followup_leads.length === 0
              ? <div style={{ padding: "32px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>No follow-ups due today 🎉</div>
              : data.today_followup_leads.map((lead, i) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  style={{
                    padding: "12px 20px", cursor: "pointer",
                    borderBottom: i < data.today_followup_leads.length - 1 ? "1px solid #f5f4f1" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafaf8"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>{lead.name}</div>
                    <StatusBadge status={lead.status} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontSize: "11px", color: "#aaa" }}>
                    <Calendar size={11} />
                    Follow-up today
                    {lead.assigned_to_name && <span style={{ color: "#ccc" }}>· {lead.assigned_to_name}</span>}
                  </div>
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
