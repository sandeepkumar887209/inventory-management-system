import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Calendar, RefreshCw } from "lucide-react";
import { crmApi } from "../../services/crm";
import { Pipeline, Lead } from "./types";

const D = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  purple: { bg: "#f5f0ff", text: "#5b21b6", border: "#ddd6fe", solid: "#7c3aed" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
};

const STAGES = [
  { key: "NEW" as const,       label: "New",        token: D.blue   },
  { key: "CONTACTED" as const, label: "Contacted",  token: D.amber  },
  { key: "QUALIFIED" as const, label: "Qualified",  token: D.purple },
  { key: "CONVERTED" as const, label: "Converted",  token: D.green  },
  { key: "LOST" as const,      label: "Lost",       token: D.red    },
];

function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : null;
}

export function LeadPipeline() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPipeline(); }, []);

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const data = await crmApi.getPipeline();
      setPipeline(data);
    } catch { alert("Failed to load pipeline."); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>
      <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
      Loading…
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!pipeline) return null;

  const totalLeads = STAGES.reduce((sum, s) => sum + (pipeline[s.key]?.count || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a1a" }}>Lead Pipeline</div>
          <div style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>{totalLeads} total leads across all stages</div>
        </div>
        <button onClick={fetchPipeline} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          border: "1px solid #e8e6e1", borderRadius: "8px", background: "#f4f3f0",
          padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#333",
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Kanban columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", alignItems: "start" }}>
        {STAGES.map(stage => {
          const stageData = pipeline[stage.key];
          const c = stage.token;
          return (
            <div key={stage.key}>
              {/* Column header */}
              <div style={{
                background: c.bg, border: `1px solid ${c.border}`, borderRadius: "10px",
                padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.solid }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: c.text }}>{stage.label}</span>
                </div>
                <span style={{
                  fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px",
                  background: c.solid, color: "#fff",
                }}>{stageData.count}</span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {stageData.leads.map((lead: Lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    style={{
                      background: "#fff", border: "1px solid #ebebeb", borderRadius: "10px",
                      padding: "12px", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
                      e.currentTarget.style.borderColor = c.border;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = "";
                      e.currentTarget.style.borderColor = "#ebebeb";
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: "13px", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                    {lead.company && <div style={{ fontSize: "11px", color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>{lead.company}</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#aaa", marginTop: "7px" }}>
                      <Phone size={11} /> {lead.phone}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                      <span style={{
                        display: "inline-flex", padding: "2px 8px", borderRadius: "99px",
                        fontSize: "10px", fontWeight: 500, background: D.gray.bg, color: D.gray.text,
                      }}>{lead.intent}</span>
                      {lead.follow_up_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: D.amber.text }}>
                          <Calendar size={10} />{fmtDate(lead.follow_up_date)}
                        </div>
                      )}
                    </div>
                    {lead.budget && (
                      <div style={{ fontSize: "11px", color: D.green.text, fontWeight: 600, marginTop: "5px" }}>
                        ₹{Number(lead.budget).toLocaleString("en-IN")}
                      </div>
                    )}
                    {(lead.tags?.length ?? 0) > 0 && (
                      <div style={{ display: "flex", gap: "3px", marginTop: "6px", flexWrap: "wrap" }}>
                        {lead.tags.map(tag => (
                          <span key={tag.id} style={{ padding: "1px 6px", borderRadius: "99px", fontSize: "10px", fontWeight: 500, color: "#fff", background: tag.color }}>{tag.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {stageData.count > stageData.leads.length && (
                  <button
                    onClick={() => navigate(`/crm/leads?status=${stage.key}`)}
                    style={{
                      width: "100%", textAlign: "center", fontSize: "12px", fontWeight: 500,
                      color: c.text, padding: "8px", borderRadius: "8px", cursor: "pointer",
                      background: c.bg, border: `1px dashed ${c.border}`, transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    +{stageData.count - stageData.leads.length} more →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
