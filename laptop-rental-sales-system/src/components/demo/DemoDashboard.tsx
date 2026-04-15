import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { TestTube2, RotateCcw, AlertTriangle, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";
import api from "../../services/axios";
import { KpiCard, Card, CardHeader, Badge, Btn, fmtDate, fmtINR, daysDiff, C, statusBadge } from "./ui";

function TimelineItem({ icon: Icon, iconColor, title, meta }: { icon: any; iconColor: string; title: string; meta: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", paddingBottom: "16px" }}>
      <div style={{
        width: "30px", height: "30px", borderRadius: "50%",
        background: iconColor + "22", flexShrink: 0, marginTop: "1px",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${iconColor}44`,
      }}>
        <Icon size={13} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>{title}</div>
        <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{meta}</div>
      </div>
    </div>
  );
}

export function DemoDashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState<any>({});
  const [trend,    setTrend]    = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [overdue,  setOverdue]  = useState<any[]>([]);
  const [convRate, setConvRate] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/demos/demo/");
      const demos = Array.isArray(res.data) ? res.data : res.data.results || [];

      const today = new Date(); today.setHours(0, 0, 0, 0);

      const ongoing  = demos.filter((d: any) => d.status === "ONGOING");
      const returned = demos.filter((d: any) => d.status === "RETURNED");
      const convRental = demos.filter((d: any) => d.status === "CONVERTED_RENTAL");
      const convSale   = demos.filter((d: any) => d.status === "CONVERTED_SALE");
      const overdueList = ongoing.filter((d: any) => {
        if (!d.expected_return_date) return false;
        const due = new Date(d.expected_return_date); due.setHours(0, 0, 0, 0);
        return due < today;
      });

      const totalConverted = convRental.length + convSale.length;
      const conversionRate = demos.length > 0 ? Math.round((totalConverted / demos.length) * 100) : 0;

      // Monthly trend
      const monthMap: Record<string, any> = {};
      demos.forEach((d: any) => {
        const key = new Date(d.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
        if (!monthMap[key]) monthMap[key] = { month: key, total: 0, converted: 0 };
        monthMap[key].total += 1;
        if (d.status === "CONVERTED_RENTAL" || d.status === "CONVERTED_SALE") monthMap[key].converted += 1;
      });

      // Conversion breakdown for bar chart
      setConvRate([
        { name: "Ongoing",  value: ongoing.length },
        { name: "Returned", value: returned.length },
        { name: "→ Rental", value: convRental.length },
        { name: "→ Sale",   value: convSale.length  },
        { name: "Overdue",  value: overdueList.length },
      ]);

      setStats({ ongoing: ongoing.length, returned: returned.length, convRental: convRental.length, convSale: convSale.length, overdue: overdueList.length, conversionRate, total: demos.length });
      setOverdue(overdueList.slice(0, 3));
      setTrend(Object.values(monthMap).slice(-6));
      setActivity(demos.slice(0, 5).map((d: any) => ({ ...d, customerName: d.customer_detail?.name || "Unknown" })));
    } catch (err) {
      console.error("Demo dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "80px", textAlign: "center", color: "#bbb" }}>Loading dashboard...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Demo Dashboard</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>Live overview of demo laptop operations</p>
        </div>
        <Btn variant="ghost" onClick={load}><RefreshCw size={13} /> Refresh</Btn>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <KpiCard label="Active demos" value={stats.ongoing} sub={`${stats.overdue} overdue`} subColor={stats.overdue > 0 ? "down" : "up"} />
        <KpiCard label="Conversion rate" value={`${stats.conversionRate}%`} sub="Demos converted" subColor="up" />
        <KpiCard label="→ Rentals" value={stats.convRental} sub="Converted to rental" subColor="up" />
        <KpiCard label="→ Sales" value={stats.convSale} sub="Converted to sale" subColor="up" />
        <KpiCard label="Total demos" value={stats.total} sub="All time" subColor="neutral" />
      </div>

      {/* Overdue alert */}
      {stats.overdue > 0 && (
        <div style={{
          background: "#fff8ed", border: "1px solid #ffd499", borderRadius: "10px",
          padding: "12px 16px", marginBottom: "20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={15} color="#c07800" />
            <span style={{ fontSize: "13px", color: "#7a4d00", fontWeight: 500 }}>
              {stats.overdue} demo{stats.overdue > 1 ? "s are" : " is"} overdue — immediate follow-up needed
            </span>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => onNavigate("/demos/alerts")}>
            View alerts <ArrowRight size={12} />
          </Btn>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* Trend chart */}
        <Card>
          <CardHeader title="Monthly demo trend" />
          <div style={{ padding: "16px" }}>
            {trend.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e8e6e1" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="total" stroke={C.violet.solid} strokeWidth={2} dot={{ r: 3 }} name="Total demos" />
                  <Line type="monotone" dataKey="converted" stroke={C.teal.solid} strokeWidth={2} dot={{ r: 3 }} name="Converted" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>Not enough data yet</div>
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Recent demos" right={<Btn size="sm" variant="ghost" onClick={() => onNavigate("/demos/list")}>View all</Btn>} />
          <div style={{ padding: "16px" }}>
            {activity.map((d: any) => (
              <TimelineItem
                key={d.id}
                icon={d.status === "ONGOING" ? TestTube2 : d.status === "RETURNED" ? RotateCcw : TrendingUp}
                iconColor={d.status === "ONGOING" ? C.violet.solid : d.status === "RETURNED" ? C.teal.solid : C.green.solid}
                title={`${d.customer_detail?.name ?? "Customer"} — ${d.status.replace("_", " ").toLowerCase()}`}
                meta={`${d.items_detail?.length ?? 1} laptop${(d.items_detail?.length ?? 1) !== 1 ? "s" : ""} · ${fmtDate(d.created_at)}`}
              />
            ))}
            {activity.length === 0 && <div style={{ textAlign: "center", color: "#ccc", fontSize: "13px", padding: "24px" }}>No demos yet</div>}
          </div>
        </Card>
      </div>

      {/* Status breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card>
          <CardHeader title="Status breakdown" />
          <div style={{ padding: "16px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={convRate} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} />
                <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                <Bar dataKey="value" fill={C.violet.solid} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Overdue quick view */}
        <Card>
          <CardHeader
            title="Overdue demos"
            right={overdue.length > 0 ? <Btn size="sm" variant="danger" onClick={() => onNavigate("/demos/alerts")}><AlertTriangle size={12} /> View all</Btn> : undefined}
          />
          <div style={{ padding: "12px 16px" }}>
            {overdue.length === 0 ? (
              <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>✓</div>
                No overdue demos
              </div>
            ) : overdue.map((d: any) => {
              const diff = daysDiff(d.expected_return_date);
              return (
                <div key={d.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "1px solid #f5f4f1", fontSize: "13px",
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.customer_detail?.name}</div>
                    <div style={{ fontSize: "11px", color: "#999" }}>D-{d.id} · Due {fmtDate(d.expected_return_date)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Badge color="red">+{diff !== null ? Math.abs(diff) : 0}d</Badge>
                    <Btn size="sm" variant="ghost" onClick={() => onNavigate(`/demos/${d.id}`)}>View</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
