import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, RefreshCw, ArrowRight } from "lucide-react";
import api from "../../services/axios";
import { Card, CardHeader, Btn, Badge, fmtDate, fmtINR, daysDiff, C } from "./ui";

function AlertRow({ rental, type, onNavigate }) {
  const diff = daysDiff(rental.expected_return_date);

  const isOverdue   = type === "overdue";
  const badgeColor  = isOverdue ? "red" : diff <= 2 ? "coral" : "amber";
  const badgeLabel  = isOverdue
    ? `${Math.abs(diff)}d overdue`
    : diff === 0
    ? "Due today"
    : `${diff}d left`;

  return (
    <div
      style={{
        display:       "flex",
        alignItems:    "center",
        padding:       "12px 16px",
        borderBottom:  "1px solid #f5f4f1",
        gap:           "14px",
        transition:    "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#fafaf8"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
    >
      {/* Color bar */}
      <div
        style={{
          width:        "3px",
          height:       "40px",
          borderRadius: "2px",
          background:   isOverdue ? C.red.solid : diff <= 2 ? C.coral.solid : C.amber.solid,
          flexShrink:   0,
        }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#1a1a1a", marginBottom: "2px" }}>
          {rental.customer_detail?.name ?? "Unknown customer"}
        </div>
        <div style={{ fontSize: "11px", color: "#999", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span>R-{rental.id}</span>
          <span>·</span>
          <span>{rental.items_detail?.length ?? 0} laptop{(rental.items_detail?.length ?? 0) !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>Due {fmtDate(rental.expected_return_date)}</span>
          {rental.total_amount && (
            <>
              <span>·</span>
              <span>{fmtINR(rental.total_amount)}</span>
            </>
          )}
        </div>
      </div>

      {/* Badge */}
      <Badge color={badgeColor}>{badgeLabel}</Badge>

      {/* Action */}
      <Btn size="sm" variant="ghost" onClick={() => onNavigate(`/rentals/${rental.id}`)}>
        View <ArrowRight size={11} />
      </Btn>
    </div>
  );
}

export function RentalAlerts({ onNavigate }) {
  const [overdue,      setOverdue]      = useState([]);
  const [expiring,     setExpiring]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res     = await api.get("/rentals/rental/");
      const rentals = Array.isArray(res.data) ? res.data : res.data.results || [];
      const today   = new Date();
      today.setHours(0, 0, 0, 0);

      const od = [];
      const ex = [];

      rentals
        .filter((r) => r.status === "ONGOING")
        .forEach((r) => {
          if (!r.expected_return_date) return;
          const diff = daysDiff(r.expected_return_date);
          if (diff === null) return;
          if (diff < 0) od.push(r);
          else if (diff <= 7) ex.push(r);
        });

      // Sort overdue by most overdue first
      od.sort(
        (a, b) =>
          new Date(a.expected_return_date) - new Date(b.expected_return_date)
      );
      // Sort expiring by soonest first
      ex.sort(
        (a, b) =>
          new Date(a.expected_return_date) - new Date(b.expected_return_date)
      );

      setOverdue(od);
      setExpiring(ex);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Alerts load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = overdue.length + expiring.length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginBottom:   "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            Rental Alerts
          </h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            {loading
              ? "Loading..."
              : total === 0
              ? "All rentals are on track"
              : `${total} rental${total !== 1 ? "s" : ""} need attention`}
          </p>
        </div>
        <Btn variant="ghost" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>
          Loading alerts...
        </div>
      ) : total === 0 ? (
        <div
          style={{
            textAlign:    "center",
            padding:      "80px",
            background:   "#fff",
            border:       "1px solid #ebebeb",
            borderRadius: "14px",
            color:        C.teal.text,
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>No alerts</div>
          <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
            All active rentals are within their return window.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Overdue section */}
          {overdue.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={15} color={C.red.solid} />
                    <span style={{ color: C.red.text }}>Overdue</span>
                    <span
                      style={{
                        background:   C.red.bg,
                        color:        C.red.text,
                        border:       `1px solid ${C.red.border}`,
                        borderRadius: "99px",
                        fontSize:     "11px",
                        padding:      "1px 8px",
                        fontWeight:   500,
                      }}
                    >
                      {overdue.length}
                    </span>
                  </div>
                }
                right={
                  <span style={{ fontSize: "11px", color: "#bbb" }}>
                    Action required immediately
                  </span>
                }
              />
              <div>
                {overdue.map((r) => (
                  <AlertRow key={r.id} rental={r} type="overdue" onNavigate={onNavigate} />
                ))}
              </div>
            </Card>
          )}

          {/* Expiring soon section */}
          {expiring.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={15} color={C.amber.solid} />
                    <span style={{ color: C.amber.text }}>Expiring within 7 days</span>
                    <span
                      style={{
                        background:   C.amber.bg,
                        color:        C.amber.text,
                        border:       `1px solid ${C.amber.border}`,
                        borderRadius: "99px",
                        fontSize:     "11px",
                        padding:      "1px 8px",
                        fontWeight:   500,
                      }}
                    >
                      {expiring.length}
                    </span>
                  </div>
                }
                right={
                  <span style={{ fontSize: "11px", color: "#bbb" }}>
                    Consider reaching out to extend or return
                  </span>
                }
              />
              <div>
                {expiring.map((r) => (
                  <AlertRow key={r.id} rental={r} type="expiring" onNavigate={onNavigate} />
                ))}
              </div>
            </Card>
          )}

          {/* Last refreshed */}
          {lastRefresh && (
            <div style={{ textAlign: "center", fontSize: "11px", color: "#ccc" }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
