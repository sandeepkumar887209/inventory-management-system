import React, { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, Package, RefreshCw, ArrowRight,
  ShoppingBag, IndianRupee, RotateCcw, AlertCircle,
} from "lucide-react";
import api from "../../services/axios";
import {
  S, SKpiCard, SCard, SCardHeader, SBtn, SBadge,
  saleBadge, fmtINR, fmtINRCompact, fmtDate,
} from "./salesUi";

export function SalesDashboard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState<any>({});
  const [revenue,     setRevenue]     = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topLaptops,  setTopLaptops]  = useState<any[]>([]);
  const [unpaidCount, setUnpaidCount] = useState(0);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales/sale/");
      const sales: any[] = Array.isArray(res.data) ? res.data : res.data.results || [];

      const completed = sales.filter((s) => s.status === "COMPLETED");
      const returned  = sales.filter((s) => s.status === "RETURNED");

      const totalRevenue = completed.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      const totalUnits   = completed.reduce((sum, s) => sum + (s.total_items || s.items_detail?.length || 0), 0);
      const avgOrder     = completed.length ? totalRevenue / completed.length : 0;

      // Count unpaid (for alerts badge)
      setUnpaidCount(sales.filter((s) => s.payment_status === "UNPAID" || s.payment_status === "PARTIAL").length);

      // Monthly revenue breakdown
      const monthMap: Record<string, { month: string; revenue: number; units: number; count: number }> = {};
      sales.forEach((s) => {
        const d   = new Date(s.created_at);
        const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
        if (!monthMap[key]) monthMap[key] = { month: key, revenue: 0, units: 0, count: 0 };
        monthMap[key].revenue += Number(s.total_amount || 0);
        monthMap[key].units   += (s.total_items || s.items_detail?.length || 0);
        monthMap[key].count   += 1;
      });
      setRevenue(Object.values(monthMap).slice(-7));

      // Top laptops by sales frequency
      const laptopMap: Record<string, { name: string; count: number; revenue: number }> = {};
      sales.forEach((s) => {
        (s.items_detail || []).forEach((item: any) => {
          const name = `${item.laptop?.brand} ${item.laptop?.model}`.trim();
          if (!name || name === " ") return;
          if (!laptopMap[name]) laptopMap[name] = { name, count: 0, revenue: 0 };
          laptopMap[name].count   += 1;
          laptopMap[name].revenue += Number(item.sale_price || 0);
        });
      });
      setTopLaptops(
        Object.values(laptopMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );

      setStats({ totalRevenue, totalUnits, avgOrder, completed: completed.length, returned: returned.length, total: sales.length });
      setRecentSales(sales.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
        Loading dashboard…
      </div>
    );
  }

  const conversionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
            Sales Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            Live overview of your sales operations
          </p>
        </div>
        <SBtn variant="ghost" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </SBtn>
      </div>

      {/* Unpaid alert */}
      {unpaidCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px", background: S.amber.bg,
          border: `1px solid ${S.amber.border}`, borderRadius: "12px", marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={15} color={S.amber.solid} />
            <span style={{ fontSize: "13px", color: S.amber.text, fontWeight: 500 }}>
              {unpaidCount} sale{unpaidCount !== 1 ? "s" : ""} with pending payments
            </span>
          </div>
          <SBtn size="sm" variant="amber" onClick={() => onNavigate("/sales/alerts")}>
            View alerts <ArrowRight size={12} />
          </SBtn>
        </div>
      )}

      {/* KPIs */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "14px", marginBottom: "24px",
      }}>
        <SKpiCard
          label="Total Revenue"
          value={fmtINRCompact(stats.totalRevenue)}
          sub="All completed sales"
          subColor="up"
          icon={<IndianRupee size={15} color={S.indigo.solid} />}
        />
        <SKpiCard
          label="Completed Sales"
          value={stats.completed}
          sub={`${conversionRate}% conversion`}
          subColor="up"
          icon={<ShoppingBag size={15} color={S.emerald.solid} />}
        />
        <SKpiCard
          label="Units Sold"
          value={stats.totalUnits}
          sub="Total laptops sold"
          subColor="neutral"
          icon={<Package size={15} color={S.sky.solid} />}
        />
        <SKpiCard
          label="Avg Order Value"
          value={fmtINRCompact(stats.avgOrder)}
          sub={`${stats.returned} returned`}
          subColor="neutral"
          icon={<TrendingUp size={15} color={S.violet.solid} />}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px", marginBottom: "20px" }}>

        {/* Revenue trend */}
        <SCard>
          <SCardHeader title="Monthly Revenue" right={
            <SBtn size="sm" variant="ghost" onClick={() => onNavigate("/sales/list")}>View all</SBtn>
          } />
          <div style={{ padding: "16px 20px" }}>
            {revenue.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmtINRCompact(v)} />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}
                    formatter={(v: number) => [fmtINR(v), "Revenue"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone" dataKey="revenue"
                    stroke={S.indigo.solid} strokeWidth={2.5}
                    dot={{ r: 3, fill: S.indigo.solid }} name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: "13px" }}>
                Not enough data yet
              </div>
            )}
          </div>
        </SCard>

        {/* Top laptops */}
        <SCard>
          <SCardHeader title="Top Products" />
          <div style={{ padding: "12px 0" }}>
            {topLaptops.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
                No data yet
              </div>
            ) : topLaptops.map((l, i) => {
              const maxRev = topLaptops[0].revenue;
              const pct    = Math.round((l.revenue / maxRev) * 100);
              return (
                <div key={l.name} style={{ padding: "8px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        width: "18px", height: "18px", borderRadius: "99px",
                        background: i === 0 ? S.indigo.solid : i === 1 ? S.violet.solid : S.slate.bg,
                        color: i < 2 ? "#fff" : S.slate.text,
                        fontSize: "9px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>{l.name}</span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#0f172a" }}>
                      {fmtINRCompact(l.revenue)}
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "99px", marginLeft: "26px" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%", borderRadius: "99px",
                      background: i === 0 ? S.indigo.solid : i === 1 ? S.violet.solid : "#cbd5e1",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px", marginLeft: "26px" }}>
                    {l.count} sale{l.count !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </SCard>
      </div>

      {/* Units bar chart */}
      {revenue.length > 1 && (
        <SCard style={{ marginBottom: "20px" }}>
          <SCardHeader title="Units Sold per Month" />
          <div style={{ padding: "16px 20px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ee" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ fontSize: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="units" fill={S.emerald.solid} radius={[4, 4, 0, 0]} name="Units Sold" />
                <Bar dataKey="count" fill={S.sky.solid}     radius={[4, 4, 0, 0]} name="Sale Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SCard>
      )}

      {/* Recent sales */}
      <SCard>
        <SCardHeader title="Recent Sales" right={
          <SBtn size="sm" variant="ghost" onClick={() => onNavigate("/sales/list")}>
            All sales <ArrowRight size={11} />
          </SBtn>
        } />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafaf9" }}>
                {["Sale #", "Customer", "Items", "Total", "Date", "Status", ""].map((h) => (
                  <th key={h} style={{
                    padding: "9px 16px", textAlign: "left",
                    fontSize: "10.5px", fontWeight: 600, color: "#94a3b8",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    borderBottom: "1px solid #f1f0ee", whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => onNavigate(`/sales/${s.id}`)}
                  style={{ borderBottom: "1px solid #f8f7f5", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fafaf9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                >
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#94a3b8" }}>
                      #{s.id}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ fontWeight: 500, color: "#0f172a" }}>
                      {s.customer_detail?.name ?? "—"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {s.customer_detail?.phone ?? ""}
                    </div>
                  </td>
                  <td style={{ padding: "11px 16px", color: "#64748b" }}>
                    {s.total_items ?? s.items_detail?.length ?? 0} unit{(s.total_items ?? s.items_detail?.length ?? 0) !== 1 ? "s" : ""}
                  </td>
                  <td style={{ padding: "11px 16px", fontWeight: 600, color: "#0f172a" }}>
                    {fmtINR(s.total_amount)}
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: "12px", color: "#94a3b8" }}>
                    {fmtDate(s.created_at)}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    {saleBadge(s.status)}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <SBtn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onNavigate(`/sales/${s.id}`); }}>
                      View
                    </SBtn>
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
                    No sales yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SCard>
    </div>
  );
}
