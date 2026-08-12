import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone, Mail, MapPin, Calendar, Plus, CheckCircle,
  Clock, Activity as ActivityIcon, UserCheck, ChevronLeft,
  Edit2, User, History,
} from "lucide-react";
import { crmApi } from "../../services/crm";
import { Lead, Activity, FollowUp, StatusHistory } from "./types";
import { ActivityForm } from "./ActivityForm";
import { FollowUpForm } from "./FollowUpForm";
import { LeadForm } from "./LeadForm";

/* ── Design Tokens ── */
const D = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  purple: { bg: "#f5f0ff", text: "#5b21b6", border: "#ddd6fe", solid: "#7c3aed" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
};

const STATUS_TOKEN: Record<string, any> = {
  NEW: D.blue, CONTACTED: D.amber, QUALIFIED: D.purple, CONVERTED: D.green, LOST: D.red,
};
const STATUS_LABELS: Record<string, string> = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", CONVERTED: "Converted", LOST: "Lost",
};
const ACTIVITY_ICONS: Record<string, string> = {
  CALL: "📞", EMAIL: "📧", VISIT: "🚶", MEETING: "🤝", NOTE: "📝", WHATSAPP: "💬",
};

type ActiveTab = "activities" | "followups" | "history";
type ActiveModal = "activity" | "followup" | "edit" | null;

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_TOKEN[status] ?? D.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: "99px", fontSize: "12px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
    }}>{STATUS_LABELS[status] || status}</span>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "11px 20px", fontSize: "13px", fontWeight: 500,
      border: "none", background: "none", cursor: "pointer",
      color: active ? D.blue.solid : "#888",
      borderBottom: active ? `2px solid ${D.blue.solid}` : "2px solid transparent",
      transition: "all 0.15s", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", padding: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#333", marginBottom: "8px" }}>
      <Icon size={14} color="#aaa" style={{ marginTop: "1px", flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("activities");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [leadData, acts, fups, history] = await Promise.all([
        crmApi.getLead(Number(id)),
        crmApi.getActivities({ lead: id! }),
        crmApi.getFollowUps({ lead: id! }),
        crmApi.getStatusHistory(Number(id)),
      ]);
      setLead(leadData); setActivities(acts); setFollowUps(fups); setStatusHistory(history);
    } catch { alert("Failed to load lead details."); }
    finally { setLoading(false); }
  };

  const handleConvert = async () => {
    if (!window.confirm("Convert this lead to a Customer? This cannot be undone.")) return;
    try { setConverting(true); await crmApi.convertLead(Number(id)); fetchAll(); }
    catch (err: any) { alert(err?.response?.data?.error || "Failed to convert lead."); }
    finally { setConverting(false); }
  };

  const handleMarkDone = async (fuId: number) => {
    try { await crmApi.markFollowUpDone(fuId); setFollowUps(p => p.map(f => f.id === fuId ? { ...f, status: "DONE" } : f)); }
    catch { alert("Failed to mark follow-up as done."); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>
      Loading lead…
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!lead) return <div style={{ padding: "40px", color: D.red.text }}>Lead not found.</div>;

  const pendingCount = followUps.filter(f => f.status === "PENDING").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Back */}
      <div>
        <button onClick={() => navigate("/crm/leads")} style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          background: "#f4f3f0", border: "1px solid #e8e6e1", borderRadius: "8px",
          padding: "7px 14px", fontSize: "13px", fontWeight: 500, color: "#555", cursor: "pointer",
        }}>
          <ChevronLeft size={14} /> Back to Leads
        </button>
      </div>

      {/* Header Card */}
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", padding: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{lead.name}</h1>
            {lead.company && <div style={{ fontSize: "14px", color: "#888", marginTop: "3px" }}>{lead.company}</div>}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <StatusBadge status={lead.status} />
              <span style={{
                display: "inline-flex", alignItems: "center", padding: "3px 9px",
                borderRadius: "99px", fontSize: "11px", fontWeight: 500,
                background: D.gray.bg, color: D.gray.text, border: `0.5px solid ${D.gray.border}`,
              }}>{lead.intent}</span>
              {lead.assigned_to_name && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 9px",
                  borderRadius: "99px", fontSize: "11px", fontWeight: 500,
                  background: D.purple.bg, color: D.purple.text, border: `0.5px solid ${D.purple.border}`,
                }}>
                  <User size={11} />{lead.assigned_to_name}
                </span>
              )}
              {lead.tags?.map(tag => (
                <span key={tag.id} style={{ padding: "3px 9px", borderRadius: "99px", fontSize: "11px", fontWeight: 500, color: "#fff", background: tag.color }}>{tag.name}</span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => setActiveModal("edit")} style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#f4f3f0", border: "1px solid #e8e6e1", borderRadius: "8px",
              padding: "8px 16px", fontSize: "13px", fontWeight: 500, color: "#555", cursor: "pointer",
            }}>
              <Edit2 size={14} /> Edit
            </button>
            {lead.status !== "CONVERTED" && lead.status !== "LOST" && (
              <button onClick={handleConvert} disabled={converting} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: D.blue.solid, color: "#fff", border: "none",
                borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 500,
                cursor: converting ? "not-allowed" : "pointer", opacity: converting ? 0.7 : 1,
              }}>
                <UserCheck size={14} /> {converting ? "Converting…" : "Convert to Customer"}
              </button>
            )}
            {lead.status === "CONVERTED" && lead.converted_customer_detail && (
              <button onClick={() => navigate(`/customers/${lead.converted_customer}`)} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: D.green.bg, color: D.green.text, border: `1px solid ${D.green.border}`,
                borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}>View Customer →</button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        {/* Contact */}
        <InfoCard title="Contact Info">
          <InfoRow icon={Phone}>{lead.phone}</InfoRow>
          {lead.email && <InfoRow icon={Mail}>{lead.email}</InfoRow>}
          {lead.address && <InfoRow icon={MapPin}>{lead.address}</InfoRow>}
        </InfoCard>

        {/* Lead Details */}
        <InfoCard title="Lead Details">
          {[
            ["Source", lead.source.replace(/_/g, " ")],
            ["Laptops", String(lead.expected_laptops)],
            lead.budget ? ["Budget", `₹${Number(lead.budget).toLocaleString("en-IN")}`] : null,
            ["Assigned", lead.assigned_to_name || "—"],
            ["Created", fmtDate(lead.created_at)],
          ].filter(Boolean).map(([k, v]: any) => (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: "13px", marginBottom: "8px" }}>
              <span style={{ color: "#aaa" }}>{k}</span>
              <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </InfoCard>

        {/* Follow-up */}
        <InfoCard title="Follow-up">
          {lead.follow_up_date
            ? <InfoRow icon={Calendar}><span style={{ fontWeight: 500 }}>{fmtDate(lead.follow_up_date)}</span></InfoRow>
            : <div style={{ fontSize: "13px", color: "#ccc" }}>No follow-up scheduled</div>
          }
          <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>{pendingCount} pending reminder(s)</div>
          {lead.notes && (
            <div style={{ fontSize: "13px", color: "#555", background: "#fafaf8", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" }}>
              {lead.notes}
            </div>
          )}
        </InfoCard>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", overflow: "hidden" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #f0eeeb", overflowX: "auto" }}>
          <TabBtn label={`Activities (${activities.length})`}    active={activeTab === "activities"} onClick={() => setActiveTab("activities")} />
          <TabBtn label={`Follow-ups (${followUps.length})`}     active={activeTab === "followups"}  onClick={() => setActiveTab("followups")} />
          <TabBtn label={`Status History (${statusHistory.length})`} active={activeTab === "history"} onClick={() => setActiveTab("history")} />

          <div style={{ marginLeft: "auto", padding: "10px 16px", borderLeft: "1px solid #f0eeeb", display: "flex", alignItems: "center" }}>
            {activeTab === "activities" && (
              <button onClick={() => setActiveModal("activity")} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: D.blue.solid, color: "#fff", border: "none",
                borderRadius: "7px", padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
              }}>
                <Plus size={13} /> Log Activity
              </button>
            )}
            {activeTab === "followups" && (
              <button onClick={() => setActiveModal("followup")} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: D.blue.solid, color: "#fff", border: "none",
                borderRadius: "7px", padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
              }}>
                <Plus size={13} /> Schedule Follow-up
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "16px", minHeight: "160px" }}>
          {/* Activities */}
          {activeTab === "activities" && (
            activities.length === 0
              ? <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>No activities logged yet. Click "Log Activity" to add one.</div>
              : activities.map(act => (
                <div key={act.id} style={{
                  display: "flex", gap: "12px", padding: "12px", borderRadius: "10px",
                  background: "#fafaf8", border: "1px solid #f0eeeb", marginBottom: "8px",
                }}>
                  <div style={{ fontSize: "20px", lineHeight: 1.4, flexShrink: 0 }}>{ACTIVITY_ICONS[act.activity_type]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <span style={{ fontWeight: 500, fontSize: "13px", color: "#1a1a1a" }}>{act.summary}</span>
                      <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>{fmtDateTime(act.activity_date)}</span>
                    </div>
                    {act.description && <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{act.description}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                      <span style={{
                        display: "inline-flex", padding: "2px 8px", borderRadius: "99px", fontSize: "11px",
                        fontWeight: 500, background: D.gray.bg, color: D.gray.text,
                      }}>{act.activity_type}</span>
                      {act.created_by_name && <span style={{ fontSize: "11px", color: "#aaa" }}>by {act.created_by_name}</span>}
                    </div>
                  </div>
                </div>
              ))
          )}

          {/* Follow-ups */}
          {activeTab === "followups" && (
            followUps.length === 0
              ? <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>No follow-ups scheduled yet.</div>
              : followUps.map(fu => {
                const isDone = fu.status === "DONE";
                const isCancelled = fu.status === "CANCELLED";
                const bgColor = isDone ? D.green.bg : isCancelled ? "#f9f9f9" : D.amber.bg;
                const borderColor = isDone ? D.green.border : isCancelled ? "#e8e6e1" : D.amber.border;
                return (
                  <div key={fu.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: "10px", background: bgColor,
                    border: `1px solid ${borderColor}`, marginBottom: "8px",
                    opacity: isCancelled ? 0.6 : 1,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Clock size={13} color="#aaa" />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>{fmtDateTime(fu.scheduled_at)}</span>
                        <StatusBadge status={fu.status === "DONE" ? "CONVERTED" : fu.status === "CANCELLED" ? "LOST" : "NEW"} />
                      </div>
                      {fu.remarks && <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", marginLeft: "21px" }}>{fu.remarks}</div>}
                    </div>
                    {fu.status === "PENDING" && (
                      <button onClick={() => handleMarkDone(fu.id)} style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        background: D.green.bg, color: D.green.text, border: `1px solid ${D.green.border}`,
                        borderRadius: "7px", padding: "5px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                      }}>
                        <CheckCircle size={12} /> Mark Done
                      </button>
                    )}
                  </div>
                );
              })
          )}

          {/* Status History */}
          {activeTab === "history" && (
            statusHistory.length === 0
              ? <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>No status changes recorded yet.</div>
              : (
                <div style={{ position: "relative", paddingLeft: "20px" }}>
                  <div style={{ position: "absolute", left: "8px", top: 0, bottom: 0, width: "1px", background: "#e8e6e1" }} />
                  {statusHistory.map((h) => {
                    const toC = STATUS_TOKEN[h.to_status] ?? D.gray;
                    return (
                      <div key={h.id} style={{ position: "relative", marginBottom: "16px" }}>
                        <div style={{
                          position: "absolute", left: "-16px", top: "10px",
                          width: "14px", height: "14px", borderRadius: "50%",
                          background: toC.solid, border: "2px solid #fff",
                          boxShadow: "0 0 0 1px #e8e6e1",
                        }} />
                        <div style={{
                          background: "#fff", border: "1px solid #ebebeb",
                          borderRadius: "10px", padding: "12px 14px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            {h.from_status && (
                              <>
                                <span style={{
                                  padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 500,
                                  background: (STATUS_TOKEN[h.from_status] ?? D.gray).bg,
                                  color: (STATUS_TOKEN[h.from_status] ?? D.gray).text,
                                }}>{STATUS_LABELS[h.from_status] || h.from_status}</span>
                                <span style={{ color: "#ccc", fontSize: "12px" }}>→</span>
                              </>
                            )}
                            <span style={{
                              padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 500,
                              background: toC.bg, color: toC.text,
                            }}>{STATUS_LABELS[h.to_status] || h.to_status}</span>
                          </div>
                          <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "11px", color: "#aaa" }}>
                            <span>{fmtDateTime(h.changed_at)}</span>
                            {h.changed_by_name && <span>by {h.changed_by_name}</span>}
                          </div>
                          {h.note && <div style={{ fontSize: "12px", color: "#888", fontStyle: "italic", marginTop: "5px" }}>"{h.note}"</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal === "activity" && (
        <ModalWrapper title="Log Activity" onClose={() => setActiveModal(null)}>
          <ActivityForm leadId={Number(id)} onSuccess={() => { setActiveModal(null); fetchAll(); }} onCancel={() => setActiveModal(null)} />
        </ModalWrapper>
      )}
      {activeModal === "followup" && (
        <ModalWrapper title="Schedule Follow-up" onClose={() => setActiveModal(null)}>
          <FollowUpForm leadId={Number(id)} onSuccess={() => { setActiveModal(null); fetchAll(); }} onCancel={() => setActiveModal(null)} />
        </ModalWrapper>
      )}
      {activeModal === "edit" && (
        <ModalWrapper title="Edit Lead" onClose={() => setActiveModal(null)}>
          <LeadForm lead={lead} onSuccess={() => { setActiveModal(null); fetchAll(); }} onCancel={() => setActiveModal(null)} />
        </ModalWrapper>
      )}
    </div>
  );
}

function ModalWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f0eeeb" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "18px", lineHeight: 1, padding: "2px 6px", borderRadius: "6px" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
