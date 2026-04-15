import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "../../services/axios";
import { S, SCard, SCardHeader, SBtn, SBadge, fmtINR, fmtDate } from "./salesUi";

function AlertRow({ sale, type, onNavigate }: { sale: any; type: "unpaid" | "partial"; onNavigate: (path: string) => void }) {
  const isUnpaid = type === "unpaid";

  return (
    <div
      style={{
        display: "flex", alignItems: "center",
        padding: "12px 18px", borderBottom: "1px solid #f8f7f5",
        gap: "14px", transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#fafaf9"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
    >
      {/* Color stripe */}
      <div style={{
        width: "3px", height: "40px", borderRadius: "2px",
        background: isUnpaid ? S.rose.solid : S.amber.solid, flexShrink: 0,
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#0f172a", marginBottom: "2px" }}>
          {sale.customer_detail?.name ?? "Unknown customer"}
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span>#{sale.id}</span>
          <span>·</span>
          <span>{sale.total_items ?? sale.items_detail?.length ?? 0} laptop{(sale.total_items ?? sale.items_detail?.length ?? 0) !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>Sold {fmtDate(sale.created_at)}</span>
          {sale.total_amount && (
            <>
              <span>·</span>
              <span style={{ fontWeight: 500 }}>{fmtINR(sale.total_amount)}</span>
            </>
          )}
        </div>
      </div>

      {/* Badge */}
      <SBadge color={isUnpaid ? "rose" : "amber"}>
        {isUnpaid ? "Unpaid" : "Partial"}
      </SBadge>

      {/* Action */}
      <SBtn size="sm" variant="ghost" onClick={() => onNavigate(`/sales/${sale.id}`)}>
        View <ArrowRight size={11} />
      </SBtn>
    </div>
  );
}

export function SalesAlerts({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [unpaid,      setUnpaid]      = useState<any[]>([]);
  const [partial,     setPartial]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res   = await api.get("/sales/sale/");
      const sales: any[] = Array.isArray(res.data) ? res.data : res.data.results || [];

      const u: any[] = [];
      const p: any[] = [];

      sales.forEach((s) => {
        if (s.payment_status === "UNPAID")   u.push(s);
        if (s.payment_status === "PARTIAL")  p.push(s);
      });

      // Sort by date (oldest first = most urgent)
      u.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      p.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setUnpaid(u);
      setPartial(p);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = unpaid.length + partial.length;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px",
      }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
            Sales Alerts
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            {loading
              ? "Loading…"
              : total === 0
              ? "All payments are on track"
              : `${total} sale${total !== 1 ? "s" : ""} need${total === 1 ? "s" : ""} attention`}
          </p>
        </div>
        <SBtn variant="ghost" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </SBtn>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#cbd5e1", fontSize: "13px" }}>
          Loading alerts…
        </div>
      ) : total === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px",
          background: "#fff", border: "1px solid #edecea",
          borderRadius: "14px", color: S.emerald.text,
        }}>
          <CheckCircle2 size={40} color={S.emerald.solid} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontWeight: 600, fontSize: "15px" }}>No payment alerts</div>
          <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "6px" }}>
            All sales have been paid or are not yet due.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Unpaid section */}
          {unpaid.length > 0 && (
            <SCard>
              <SCardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={15} color={S.rose.solid} />
                    <span style={{ color: S.rose.text }}>Unpaid</span>
                    <span style={{
                      background: S.rose.bg, color: S.rose.text,
                      border: `1px solid ${S.rose.border}`,
                      borderRadius: "99px", fontSize: "11px", padding: "1px 8px", fontWeight: 500,
                    }}>
                      {unpaid.length}
                    </span>
                  </div>
                }
                right={<span style={{ fontSize: "11px", color: "#94a3b8" }}>Awaiting payment</span>}
              />
              <div>
                {unpaid.map((s) => (
                  <AlertRow key={s.id} sale={s} type="unpaid" onNavigate={onNavigate} />
                ))}
              </div>
            </SCard>
          )}

          {/* Partial section */}
          {partial.length > 0 && (
            <SCard>
              <SCardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={15} color={S.amber.solid} />
                    <span style={{ color: S.amber.text }}>Partial Payment</span>
                    <span style={{
                      background: S.amber.bg, color: S.amber.text,
                      border: `1px solid ${S.amber.border}`,
                      borderRadius: "99px", fontSize: "11px", padding: "1px 8px", fontWeight: 500,
                    }}>
                      {partial.length}
                    </span>
                  </div>
                }
                right={<span style={{ fontSize: "11px", color: "#94a3b8" }}>Balance pending</span>}
              />
              <div>
                {partial.map((s) => (
                  <AlertRow key={s.id} sale={s} type="partial" onNavigate={onNavigate} />
                ))}
              </div>
            </SCard>
          )}

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <SCard style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                Unpaid Total
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: S.rose.text }}>
                {fmtINR(unpaid.reduce((s, x) => s + Number(x.total_amount || 0), 0))}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Across {unpaid.length} sale{unpaid.length !== 1 ? "s" : ""}
              </div>
            </SCard>
            <SCard style={{ padding: "18px 20px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                Partial Balance
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: S.amber.text }}>
                {fmtINR(partial.reduce((s, x) => s + Number(x.total_amount || 0), 0))}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Across {partial.length} sale{partial.length !== 1 ? "s" : ""}
              </div>
            </SCard>
          </div>

          {/* Timestamp */}
          {lastRefresh && (
            <div style={{ textAlign: "center", fontSize: "11px", color: "#cbd5e1" }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
