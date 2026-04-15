import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RefreshCw, ArrowRight, TrendingUp, Users, Building2, UserCheck, AlertTriangle } from "lucide-react";
import api from "../../services/axios";
import { C, KpiCard, Card, CardHeader, Badge, Btn, fmtDate, fmtINR, customerTypeBadge } from "./ui";

function TimelineItem({ title, meta, color }: { title: string; meta: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", paddingBottom: "14px" }}>
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: color, flexShrink: 0, marginTop: "5px",
      }} />
      <div>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>{title}</div>
        <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{meta}</div>
      </div>
    </div>
  );
}

export function CustomerDashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [customers,   setCustomers]   = useState<any[]>([]);
  const [rentals,     setRentals]     = useState<any[]>([]);
  const [sales,       setSales]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [cRes, rRes, sRes] = await Promise.all([
        api.get("/customers/customers/"),
        api.get("/rentals/rental/"),
        api.get("/sales/sale/"),
      ]);
      setCustomers(Array.isArray(cRes.data) ? cRes.data : cRes.data.results || []);
      setRentals(Array.isArray(rRes.data) ? rRes.data : rRes.data.results || []);
      setSales(Array.isArray(sRes.data) ? sRes.data : sRes.data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const total       = customers.length;
  const individual  = customers.filter(c => c.customer_type === "individual").length;
  const corporate   = customers.filter(c => c.customer_type === "company").length;

  // Customers with active rentals
  const activeRenterIds = new Set(
    rentals.filter(r => r.status === "ONGOING").map(r => r.customer_detail?.id ?? r.customer)
  );
  const activeRenters = activeRenterIds.size;

  // Revenue per customer
  const revenueMap: Record<number, number> = {};
  rentals.forEach(r => {
    const id = r.customer_detail?.id ?? r.customer;
    if (id) revenueMap[id] = (revenueMap[id] || 0) + Number(r.total_amount || 0);
  });
  sales.forEach(s => {
    const id = s.customer_detail?.id ?? s.customer;
    if (id) revenueMap[id] = (revenueMap[id] || 0) + Number(s.total_amount || 0);
  });

  // Top 5 customers by revenue
  const topCustomers = customers
    .map(c => ({ ...c, revenue: revenueMap[c.id] || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Monthly join trend
  const monthMap: Record<string, number> = {};
  customers.forEach(c => {
    if (!c.created_at) return;
    const key = new Date(c.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const joinTrend = Object.entries(monthMap).slice(-6).map(([month, count]) => ({ month, count }));

  // Type distribution
  const typeData = [
    { name: "Individual", value: individual, color: C.teal.solid },
    { name: "Corporate",  value: corporate,  color: C.blue.solid },
  ].filter(d => d.value > 0);

  // Recent customers
  const recent = [...customers]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px", color: "#bbb" }}>Loading dashboard...</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Customer Dashboard</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>Overview of your customer base</p>
        </div>
        <Btn variant="ghost" onClick={load}><RefreshCw size={13} /> Refresh</Btn>
      </div>

      {/* KPIs */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))",
        gap: "12px", marginBottom: "24px",
      }}>
        <KpiCard label="Total Customers"  value={total}         sub="All time" subColor="up"   icon="👥" />
        <KpiCard label="Individual"       value={individual}    sub={`${total ? Math.round(individual/total*100) : 0}% of total`} subColor="neutral" icon="👤" />
        <KpiCard label="Corporate"        value={corporate}     sub={`${total ? Math.round(corporate/total*100) : 0}% of total`}  subColor="neutral" icon="🏢" />
        <KpiCard label="Active Renters"   value={activeRenters} sub="Currently renting" subColor={activeRenters > 0 ? "up" : "neutral"} icon="🔑" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* Join trend */}
        <Card>
          <CardHeader title="Customer Join Trend" />
          <div style={{ padding: "16px" }}>
            {joinTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={joinTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e8e6e1" }} />
                  <Bar dataKey="count" fill={C.blue.solid} name="New Customers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>Not enough data yet</div>
            )}
          </div>
        </Card>

        {/* Type distribution */}
        <Card>
          <CardHeader title="Customer Type" />
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {typeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {typeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e8e6e1" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  {typeData.map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#555" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: d.color }} />
                      {d.name}: <strong style={{ color: "#1a1a1a" }}>{d.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "40px", color: "#ccc", fontSize: "13px" }}>No data</div>
            )}
          </div>
        </Card>
      </div>

      {/* Top customers + Recent */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Top by revenue */}
        <Card>
          <CardHeader
            title="Top Customers by Revenue"
            right={<Btn size="sm" variant="ghost" onClick={() => onNavigate("/customers/list")}>View all</Btn>}
          />
          <div style={{ padding: "12px 16px" }}>
            {topCustomers.length === 0 ? (
              <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>No data yet</div>
            ) : topCustomers.map((c, i) => (
              <div key={c.id} onClick={() => onNavigate(`/customers/${c.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 0", borderBottom: i < topCustomers.length - 1 ? "1px solid #f5f4f1" : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fafaf8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = ""; }}
              >
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: i === 0 ? C.amber.bg : C.blue.bg,
                  border: `1px solid ${i === 0 ? C.amber.border : C.blue.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 600,
                  color: i === 0 ? C.amber.text : C.blue.text, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "1px" }}>{c.phone}</div>
                </div>
                {customerTypeBadge(c.customer_type)}
                <div style={{ fontSize: "13px", fontWeight: 600, color: C.teal.text }}>
                  {fmtINR(c.revenue)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent customers */}
        <Card>
          <CardHeader
            title="Recently Added"
            right={<Btn size="sm" variant="ghost" onClick={() => onNavigate("/customers/new")}>+ Add</Btn>}
          />
          <div style={{ padding: "12px 16px" }}>
            {recent.length === 0 ? (
              <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>No customers yet</div>
            ) : recent.map(c => (
              <TimelineItem
                key={c.id}
                title={c.name}
                meta={`${c.customer_type === "company" ? "Corporate" : "Individual"} · Added ${fmtDate(c.created_at)}`}
                color={c.customer_type === "company" ? C.blue.solid : C.teal.solid}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
