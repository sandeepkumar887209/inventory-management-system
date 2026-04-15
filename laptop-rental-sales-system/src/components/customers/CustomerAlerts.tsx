import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, RefreshCw, ArrowRight, CheckCircle } from "lucide-react";
import api from "../../services/axios";
import { C, Card, CardHeader, Badge, Btn, fmtDate, fmtINR } from "./ui";

function AlertRow({ type, customer, meta, badge, onNavigate, path }: any) {
  const isRed = type === "overdue";
  const color = isRed ? C.red : C.amber;
  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "12px 16px",
      borderBottom: "1px solid #f5f4f1", gap: "14px", transition: "background 0.1s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#fafaf8"; }}
      onMouseLeave={e => { e.currentTarget.style.background = ""; }}
    >
      <div style={{
        width: "3px", height: "40px", borderRadius: "2px",
        background: color.solid, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#1a1a1a", marginBottom: "2px" }}>
          {customer}
        </div>
        <div style={{ fontSize: "11px", color: "#999", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {meta.map((m: string, i: number) => (
            <React.Fragment key={i}>
              {i > 0 && <span>·</span>}
              <span>{m}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      <span style={{
        fontSize: "11px", fontWeight: 500, padding: "3px 9px", borderRadius: "99px",
        background: color.bg, color: color.text, border: `0.5px solid ${color.border}`,
        whiteSpace: "nowrap",
      }}>
        {badge}
      </span>
      {path && (
        <Btn size="sm" variant="ghost" onClick={() => onNavigate(path)}>
          View <ArrowRight size={11} />
        </Btn>
      )}
    </div>
  );
}

export function CustomerAlerts({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [overdueRentals,  setOverdueRentals]  = useState<any[]>([]);
  const [unpaidInvoices,  setUnpaidInvoices]  = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [lastRefresh,     setLastRefresh]     = useState<Date | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [rRes, iRes] = await Promise.all([
        api.get("/rentals/rental/"),
        api.get("/invoices/invoices/").catch(() => ({ data: [] })),
      ]);

      const rentals  = Array.isArray(rRes.data) ? rRes.data : rRes.data.results || [];
      const invoices = Array.isArray(iRes.data) ? iRes.data : (iRes.data as any).results || [];

      // Overdue ongoing rentals
      const od = rentals.filter((r: any) => {
        if (r.status !== "ONGOING" || !r.expected_return_date) return false;
        return new Date(r.expected_return_date) < today;
      });
      setOverdueRentals(od);

      // Unpaid invoices older than 7 days
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      const up = invoices.filter((i: any) =>
        (i.status === "UNPAID" || i.status === "PARTIAL") &&
        new Date(i.created_at) < cutoff
      );
      setUnpaidInvoices(up);

      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const daysOverdue = (date: string) => {
    const diff = Math.round((Date.now() - new Date(date).getTime()) / 86_400_000);
    return diff;
  };

  const total = overdueRentals.length + unpaidInvoices.length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Customer Alerts</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            {loading ? "Loading..."
              : total === 0 ? "All customers are on track"
              : `${total} alert${total !== 1 ? "s" : ""} need attention`}
          </p>
        </div>
        <Btn variant="ghost" onClick={load}><RefreshCw size={13} /> Refresh</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>Loading alerts...</div>
      ) : total === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px",
          background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px",
          color: C.teal.text,
        }}>
          <CheckCircle size={32} color={C.teal.solid} style={{ marginBottom: "12px" }} />
          <div style={{ fontWeight: 500, fontSize: "14px" }}>No alerts</div>
          <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
            All customers and rentals are within expected parameters.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Overdue rentals */}
          {overdueRentals.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={15} color={C.red.solid} />
                    <span style={{ color: C.red.text }}>Overdue Rentals</span>
                    <span style={{
                      background: C.red.bg, color: C.red.text,
                      border: `1px solid ${C.red.border}`, borderRadius: "99px",
                      fontSize: "11px", padding: "1px 8px", fontWeight: 500,
                    }}>
                      {overdueRentals.length}
                    </span>
                  </div>
                }
                right={<span style={{ fontSize: "11px", color: "#bbb" }}>Immediate action required</span>}
              />
              <div>
                {overdueRentals
                  .sort((a, b) => new Date(a.expected_return_date).getTime() - new Date(b.expected_return_date).getTime())
                  .map(r => (
                    <AlertRow
                      key={r.id}
                      type="overdue"
                      customer={r.customer_detail?.name ?? "Unknown"}
                      meta={[
                        `R-${r.id}`,
                        `${r.items_detail?.length ?? 0} laptop${(r.items_detail?.length ?? 0) !== 1 ? "s" : ""}`,
                        `Due ${fmtDate(r.expected_return_date)}`,
                        fmtINR(r.total_amount),
                      ]}
                      badge={`${daysOverdue(r.expected_return_date)}d overdue`}
                      onNavigate={onNavigate}
                      path={`/rentals/${r.id}`}
                    />
                  ))}
              </div>
            </Card>
          )}

          {/* Unpaid invoices */}
          {unpaidInvoices.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={15} color={C.amber.solid} />
                    <span style={{ color: C.amber.text }}>Pending Payments (&gt;7 days)</span>
                    <span style={{
                      background: C.amber.bg, color: C.amber.text,
                      border: `1px solid ${C.amber.border}`, borderRadius: "99px",
                      fontSize: "11px", padding: "1px 8px", fontWeight: 500,
                    }}>
                      {unpaidInvoices.length}
                    </span>
                  </div>
                }
                right={<span style={{ fontSize: "11px", color: "#bbb" }}>Consider sending payment reminders</span>}
              />
              <div>
                {unpaidInvoices
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map(inv => (
                    <AlertRow
                      key={inv.id}
                      type="unpaid"
                      customer={inv.customer_detail?.name ?? "Unknown"}
                      meta={[
                        inv.invoice_number,
                        inv.invoice_type,
                        `Created ${fmtDate(inv.created_at)}`,
                        fmtINR(inv.total_amount),
                      ]}
                      badge={inv.status === "PARTIAL" ? "Partial" : "Unpaid"}
                      onNavigate={onNavigate}
                      path={null}
                    />
                  ))}
              </div>
            </Card>
          )}

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
