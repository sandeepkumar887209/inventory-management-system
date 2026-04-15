import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock, RefreshCw, ArrowRight } from "lucide-react";
import api from "../../services/axios";
import { Card, CardHeader, Btn, Badge, fmtDate, fmtINR, daysDiff, C } from "./ui";

function AlertRow({ demo, type, onNavigate }: { demo: any; type: string; onNavigate: (path: string) => void }) {
  const diff = daysDiff(demo.expected_return_date);
  const isOverdue  = type === "overdue";
  const badgeColor = isOverdue ? "red" : diff !== null && diff <= 2 ? "coral" : "amber";
  const badgeLabel = isOverdue
    ? `${Math.abs(diff!)}d overdue`
    : diff === 0 ? "Due today" : `${diff}d left`;

  return (
    <div
      style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f5f4f1", gap: "14px", transition: "background 0.1s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafaf8"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      <div style={{ width: "3px", height: "40px", borderRadius: "2px", background: isOverdue ? C.red.solid : diff !== null && diff <= 2 ? C.coral.solid : C.amber.solid, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#1a1a1a", marginBottom: "2px" }}>
          {demo.customer_detail?.name ?? "Unknown customer"}
        </div>
        <div style={{ fontSize: "11px", color: "#999", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span>D-{demo.id}</span><span>·</span>
          <span>{demo.items_detail?.length ?? 1} laptop{(demo.items_detail?.length ?? 1) !== 1 ? "s" : ""}</span><span>·</span>
          <span>Due {fmtDate(demo.expected_return_date)}</span>
        </div>
      </div>
      <Badge color={badgeColor}>{badgeLabel}</Badge>
      <Btn size="sm" variant="ghost" onClick={() => onNavigate(`/demos/${demo.id}`)}>
        View <ArrowRight size={11} />
      </Btn>
    </div>
  );
}

export function DemoAlerts({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [overdue,     setOverdue]     = useState<any[]>([]);
  const [expiring,    setExpiring]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res    = await api.get("/demos/demo/");
      const demos  = Array.isArray(res.data) ? res.data : res.data.results || [];

      const od: any[] = []; const ex: any[] = [];

      demos
        .filter((d: any) => d.status === "ONGOING")
        .forEach((d: any) => {
          if (!d.expected_return_date) return;
          const diff = daysDiff(d.expected_return_date);
          if (diff === null) return;
          if (diff < 0)    od.push(d);
          else if (diff <= 7) ex.push(d);
        });

      od.sort((a: any, b: any) => new Date(a.expected_return_date).getTime() - new Date(b.expected_return_date).getTime());
      ex.sort((a: any, b: any) => new Date(a.expected_return_date).getTime() - new Date(b.expected_return_date).getTime());

      setOverdue(od); setExpiring(ex); setLastRefresh(new Date());
    } catch (e) {
      console.error("Demo alerts load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = overdue.length + expiring.length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Demo Alerts</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            {loading ? "Loading..." : total === 0 ? "All demos are on track" : `${total} demo${total !== 1 ? "s" : ""} need attention`}
          </p>
        </div>
        <Btn variant="ghost" onClick={load}><RefreshCw size={13} /> Refresh</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>Loading alerts...</div>
      ) : total === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", color: C.teal.text }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>No alerts</div>
          <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>All active demos are within their return window.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {overdue.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={15} color={C.red.solid} />
                    <span style={{ color: C.red.text }}>Overdue</span>
                    <span style={{ background: C.red.bg, color: C.red.text, border: `1px solid ${C.red.border}`, borderRadius: "99px", fontSize: "11px", padding: "1px 8px", fontWeight: 500 }}>
                      {overdue.length}
                    </span>
                  </div>
                }
                right={<span style={{ fontSize: "11px", color: "#bbb" }}>Immediate follow-up required</span>}
              />
              <div>{overdue.map((d) => <AlertRow key={d.id} demo={d} type="overdue" onNavigate={onNavigate} />)}</div>
            </Card>
          )}

          {expiring.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={15} color={C.amber.solid} />
                    <span style={{ color: C.amber.text }}>Expiring within 7 days</span>
                    <span style={{ background: C.amber.bg, color: C.amber.text, border: `1px solid ${C.amber.border}`, borderRadius: "99px", fontSize: "11px", padding: "1px 8px", fontWeight: 500 }}>
                      {expiring.length}
                    </span>
                  </div>
                }
                right={<span style={{ fontSize: "11px", color: "#bbb" }}>Consider reaching out to convert or return</span>}
              />
              <div>{expiring.map((d) => <AlertRow key={d.id} demo={d} type="expiring" onNavigate={onNavigate} />)}</div>
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
