import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { RefreshCw } from "lucide-react";
import api from "../../services/axios";
import { C, Card, CardHeader, Btn, fmtINR, KpiCard } from "./ui";

function SegmentBar({ label, count, pct, color, total, revenue }: any) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>{label}</span>
          <span style={{ fontSize: "11px", color: "#888", marginLeft: "8px" }}>{count} customers</span>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <span style={{ color: "#888" }}>{pct}%</span>
          <span style={{ fontWeight: 500, color: C.teal.text }}>{fmtINR(revenue)}</span>
        </div>
      </div>
      <div style={{ width: "100%", height: "6px", background: "#f0eeeb", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: color, borderRadius: "99px",
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

export function CustomerSegments() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [rentals,   setRentals]   = useState<any[]>([]);
  const [sales,     setSales]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

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

  // Segments
  const customersWithRevenue = customers.map(c => ({
    ...c, revenue: revenueMap[c.id] || 0,
  }));

  const champions   = customersWithRevenue.filter(c => c.revenue >= 100000);
  const loyal       = customersWithRevenue.filter(c => c.revenue >= 50000 && c.revenue < 100000);
  const potential   = customersWithRevenue.filter(c => c.revenue > 0 && c.revenue < 50000);
  const newCustomers= customersWithRevenue.filter(c => c.revenue === 0);

  const total = customers.length || 1;
  const segments = [
    { label: "Champions",   customers: champions,    color: C.amber.solid, revenue: champions.reduce((s,c) => s+c.revenue,0) },
    { label: "Loyal",       customers: loyal,         color: C.blue.solid,  revenue: loyal.reduce((s,c) => s+c.revenue,0) },
    { label: "Potential",   customers: potential,     color: C.teal.solid,  revenue: potential.reduce((s,c) => s+c.revenue,0) },
    { label: "New / Zero",  customers: newCustomers,  color: C.gray.solid,  revenue: 0 },
  ];

  // Type breakdown
  const individual = customers.filter(c => c.customer_type === "individual").length;
  const corporate  = customers.filter(c => c.customer_type === "company").length;

  // Monthly growth
  const monthMap: Record<string, number> = {};
  customers.forEach(c => {
    if (!c.created_at) return;
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const growthData = Object.entries(monthMap)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, count]) => ({
      month: new Date(month).toLocaleString("default", { month: "short", year:"2-digit" }),
      count,
    }));

  // Revenue distribution for pie
  const revenuePie = [
    { name: "Champions ≥₹1L",   value: champions.length,    color: C.amber.solid },
    { name: "Loyal ₹50K-1L",    value: loyal.length,         color: C.blue.solid },
    { name: "Potential <₹50K",  value: potential.length,     color: C.teal.solid },
    { name: "New (no orders)",   value: newCustomers.length,  color: C.gray.solid },
  ].filter(d => d.value > 0);

  const totalRevenue = Object.values(revenueMap).reduce((a,b) => a+b, 0);
  const avgRevenue   = customers.length ? totalRevenue / customers.length : 0;

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px", color: "#bbb" }}>Loading segments...</div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Customer Segments</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>RFM-style segmentation and analytics</p>
        </div>
        <Btn variant="ghost" onClick={load}><RefreshCw size={13} /> Refresh</Btn>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "12px", marginBottom: "24px" }}>
        <KpiCard label="Total Customers"    value={customers.length} sub="All segments" subColor="up" />
        <KpiCard label="Total Revenue"      value={fmtINR(totalRevenue)} sub="All time" subColor="up" />
        <KpiCard label="Avg Revenue / Customer" value={fmtINR(Math.round(avgRevenue))} sub="Mean" subColor="neutral" />
        <KpiCard label="Champions"          value={champions.length} sub="Revenue ≥ ₹1L" subColor={champions.length > 0 ? "up" : "neutral"} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <Card>
          <CardHeader title="Customer Growth (Monthly)" />
          <div style={{ padding: "16px" }}>
            {growthData.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={growthData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e8e6e1" }} />
                  <Line type="monotone" dataKey="count" stroke={C.blue.solid} strokeWidth={2}
                    dot={{ r: 3, fill: C.blue.solid }} name="New Customers" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>Not enough data</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Segment Distribution" />
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {revenuePie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={revenuePie} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={2}>
                      {revenuePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e8e6e1" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", marginTop: "8px" }}>
                  {revenuePie.map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#555" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{d.name}</span>
                      <strong style={{ color: "#1a1a1a" }}>{d.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : <div style={{ padding: "40px", color: "#ccc", fontSize: "13px" }}>No data</div>}
          </div>
        </Card>
      </div>

      {/* Segment details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* Revenue breakdown */}
        <Card>
          <CardHeader title="Revenue by Segment" />
          <div style={{ padding: "20px" }}>
            {segments.map(s => (
              <SegmentBar
                key={s.label}
                label={s.label}
                count={s.customers.length}
                pct={total ? Math.round((s.customers.length / total) * 100) : 0}
                color={s.color}
                total={total}
                revenue={s.revenue}
              />
            ))}
          </div>
        </Card>

        {/* Type breakdown */}
        <Card>
          <CardHeader title="Customer Type Split" />
          <div style={{ padding: "20px" }}>
            <SegmentBar label="Individual" count={individual} pct={total ? Math.round((individual/total)*100) : 0} color={C.teal.solid} total={total} revenue={0} />
            <SegmentBar label="Corporate"  count={corporate}  pct={total ? Math.round((corporate/total)*100) : 0}  color={C.blue.solid} total={total} revenue={0} />
            <div style={{ marginTop: "20px", padding: "14px", background: "#fafaf8", borderRadius: "10px", fontSize: "12px", color: "#888" }}>
              <div style={{ fontWeight: 500, color: "#555", marginBottom: "8px" }}>Segment Definitions</div>
              <div><strong style={{ color: C.amber.text }}>Champions</strong> — Revenue ≥ ₹1,00,000</div>
              <div style={{ marginTop: "4px" }}><strong style={{ color: C.blue.text }}>Loyal</strong> — Revenue ₹50,000 – ₹99,999</div>
              <div style={{ marginTop: "4px" }}><strong style={{ color: C.teal.text }}>Potential</strong> — Revenue ₹1 – ₹49,999</div>
              <div style={{ marginTop: "4px" }}><strong style={{ color: C.gray.text }}>New</strong> — No orders yet</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Champions table */}
      {champions.length > 0 && (
        <Card>
          <CardHeader title={`Champions — Top ${champions.length} Customer${champions.length !== 1 ? "s" : ""}`} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  {["Customer", "Type", "Phone", "Total Revenue"].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {champions.sort((a,b) => b.revenue - a.revenue).map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          background: i === 0 ? C.amber.bg : C.blue.bg, flexShrink: 0,
                          border: `1px solid ${i === 0 ? C.amber.border : C.blue.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 600,
                          color: i === 0 ? C.amber.text : C.blue.text,
                        }}>
                          {i + 1}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "99px",
                        background: c.customer_type === "company" ? C.blue.bg : C.teal.bg,
                        color: c.customer_type === "company" ? C.blue.text : C.teal.text,
                        border: `0.5px solid ${c.customer_type === "company" ? C.blue.border : C.teal.border}`,
                      }}>
                        {c.customer_type === "company" ? "Corporate" : "Individual"}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#555" }}>{c.phone}</td>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: C.teal.text }}>{fmtINR(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
