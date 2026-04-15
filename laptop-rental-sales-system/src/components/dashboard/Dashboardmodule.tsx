import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import {
  LayoutDashboard, TrendingUp, Laptop, Calendar, Users,
  AlertTriangle, RefreshCw, ArrowUp, ArrowDown, Clock,
  IndianRupee, Package, Activity, ChevronRight, AlertCircle,
  CheckCircle, RotateCcw, Eye, Filter, Download, Zap, Brain,
  BarChart2, PieChart as PieIcon, Star, ShoppingCart
} from "lucide-react";
import api from "../../services/axios";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const D = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5", light: "#f0f7ff" },
  teal:   { bg: "#e6f7f1", text: "#0d6e50", border: "#a8e0ce", solid: "#1aad80" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
  purple: { bg: "#f5f0ff", text: "#5b21b6", border: "#ddd6fe", solid: "#7c3aed" },
  coral:  { bg: "#fff2ed", text: "#8f3a1a", border: "#ffc9b0", solid: "#e5622a" },
};

const CHART_COLORS = [D.blue.solid, D.teal.solid, D.purple.solid, D.amber.solid, D.coral.solid, D.green.solid];

/* ─────────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────────── */
function Badge({ children, color = "gray" }: any) {
  const c = (D as any)[color] ?? D.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 9px",
      borderRadius: "99px", fontSize: "11px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "ghost", size = "md", disabled = false, style = {} }: any) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    border: "none", borderRadius: "8px", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500, transition: "all 0.15s", opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? "12px" : "13px",
    padding: size === "sm" ? "5px 12px" : "8px 16px", ...style,
  };
  const variants: any = {
    primary: { background: D.blue.solid, color: "#fff" },
    ghost:   { background: "#f4f3f0", color: "#333", border: "1px solid #e8e6e1" },
    danger:  { background: D.red.bg, color: D.red.text, border: `0.5px solid ${D.red.border}` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

function Card({ children, style = {}, onClick }: any) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", border: "1px solid #ebebeb",
        borderRadius: "14px", overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, right, sub }: any) {
  return (
    <div style={{
      padding: "16px 20px 12px",
      borderBottom: "1px solid #f5f4f1",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{title}</div>
        {sub && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", color: "#bbb", fontSize: "13px" }}>
      <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
      Loading…
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Empty({ message }: any) {
  return <div style={{ padding: "40px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>{message}</div>;
}

function fmtINR(n: any) {
  if (n == null || isNaN(Number(n))) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}
function fmtDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtShort(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function daysDiff(dateStr: any) {
  if (!dateStr) return null;
  const due = new Date(dateStr); const today = new Date();
  due.setHours(0,0,0,0); today.setHours(0,0,0,0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
function KpiCard({ label, value, sub, subUp, icon: Icon, color = "blue", onClick }: any) {
  const c = (D as any)[color] ?? D.blue;
  return (
    <Card onClick={onClick} style={{
      padding: "20px",
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow 0.15s, transform 0.15s",
    }}
      onMouseEnter={onClick ? (e: any) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={onClick ? (e: any) => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "";
      } : undefined}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: c.bg, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={c.solid} />
        </div>
        {sub != null && (
          <div style={{
            display: "flex", alignItems: "center", gap: "3px",
            fontSize: "11px", fontWeight: 500,
            color: subUp ? D.green.text : D.red.text,
          }}>
            {subUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {sub}
          </div>
        )}
      </div>
      <div style={{ fontSize: "26px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>{label}</div>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   CUSTOM TOOLTIP
───────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8e6e1",
      borderRadius: "10px", padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "12px",
    }}>
      <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#555" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "#1a1a1a" }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   OVERVIEW TAB
───────────────────────────────────────────── */
function OverviewTab({ data, loading, onNavigate }: any) {
  if (loading) return <Spinner />;
  const { kpis, revenue, statusData, alerts, activity, predictions } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <KpiCard label="Total Inventory"   value={kpis.total}        icon={Laptop}       color="blue"   sub="Units tracked"   />
        <KpiCard label="Active Rentals"    value={kpis.rented}       icon={Calendar}     color="teal"   sub={kpis.overdue > 0 ? `${kpis.overdue} overdue` : "On track"} subUp={kpis.overdue === 0} />
        <KpiCard label="Total Revenue"     value={fmtINR(kpis.totalRevenue)} icon={IndianRupee} color="purple" />
        <KpiCard label="Customers"         value={kpis.customers}    icon={Users}        color="amber"  />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        <KpiCard label="Available Laptops" value={kpis.available}    icon={Package}      color="green"  />
        <KpiCard label="Sold Laptops"      value={kpis.sold}         icon={ShoppingCart} color="gray"   />
        <KpiCard label="Sales Revenue"     value={fmtINR(kpis.salesRevenue)} icon={TrendingUp} color="blue" />
        <KpiCard label="Rental Revenue"    value={fmtINR(kpis.rentalRevenue)} icon={Activity} color="teal" />
      </div>

      {/* Alert banner */}
      {kpis.overdue > 0 && (
        <div style={{
          background: D.amber.bg, border: `1px solid ${D.amber.border}`, borderRadius: "12px",
          padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={16} color={D.amber.solid} />
            <span style={{ fontSize: "13px", color: D.amber.text, fontWeight: 500 }}>
              {kpis.overdue} rental{kpis.overdue > 1 ? "s are" : " is"} overdue and require immediate attention
            </span>
          </div>
          <Btn size="sm" onClick={() => onNavigate("/rentals/alerts")}>
            View Alerts <ChevronRight size={12} />
          </Btn>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px" }}>
        {/* Revenue trend */}
        <Card>
          <CardHeader title="Revenue Trend" sub="Sales vs Rental revenue by month" />
          <div style={{ padding: "16px" }}>
            {revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={D.blue.solid} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={D.blue.solid} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={D.teal.solid} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={D.teal.solid} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip formatter={fmtINR} />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="sales"   stroke={D.blue.solid} strokeWidth={2} fill="url(#colorSales)"   name="Sales" />
                  <Area type="monotone" dataKey="rentals" stroke={D.teal.solid} strokeWidth={2} fill="url(#colorRentals)" name="Rentals" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty message="No revenue data yet" />}
          </div>
        </Card>

        {/* Inventory status donut */}
        <Card>
          <CardHeader title="Inventory Status" sub="Current distribution" />
          <div style={{ padding: "16px" }}>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {statusData.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [v, "Units"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                  {statusData.map((s: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span style={{ color: "#555" }}>{s.name}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <Empty message="No inventory data" />}
          </div>
        </Card>
      </div>

      {/* Bottom row: Alerts + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Rental alerts */}
        <Card>
          <CardHeader title="Rental Alerts" sub="Upcoming returns & overdue" right={
            <Btn size="sm" onClick={() => onNavigate("/rentals/alerts")}>View all</Btn>
          } />
          <div style={{ padding: "0 0 8px" }}>
            {alerts.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center" }}>
                <CheckCircle size={28} color={D.green.solid} style={{ marginBottom: "8px" }} />
                <div style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>All rentals on track</div>
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "3px" }}>No alerts at this time</div>
              </div>
            ) : alerts.slice(0, 6).map((a: any, i: number) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 18px", borderBottom: i < Math.min(alerts.length, 6) - 1 ? "1px solid #f5f4f1" : "none",
                fontSize: "13px",
              }}>
                <div>
                  <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{a.customer}</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                    Due {fmtDate(a.dueDate)}
                  </div>
                </div>
                <Badge color={a.days < 0 ? "red" : a.days <= 2 ? "coral" : "amber"}>
                  {a.days < 0 ? `${Math.abs(a.days)}d overdue` : a.days === 0 ? "Today" : `${a.days}d left`}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Recent Activity" sub="Latest transactions" right={
            <Btn size="sm" onClick={() => onNavigate("/rentals/list")}>View all</Btn>
          } />
          <div style={{ padding: "0 0 8px" }}>
            {activity.length === 0 ? (
              <Empty message="No recent activity" />
            ) : activity.slice(0, 6).map((a: any, i: number) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 18px", borderBottom: i < Math.min(activity.length, 6) - 1 ? "1px solid #f5f4f1" : "none",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: a.type === "sale" ? D.purple.bg : D.blue.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {a.type === "sale" ? <ShoppingCart size={14} color={D.purple.solid} /> : <Calendar size={14} color={D.blue.solid} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.text}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{fmtDate(a.date)}</div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: D.green.text, flexShrink: 0 }}>
                  {fmtINR(a.value)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      {predictions && (
        <div style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          borderRadius: "14px", padding: "24px",
          display: "flex", alignItems: "center", gap: "20px",
        }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Brain size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
              AI Business Insights
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
              Based on historical trends and current data
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "Next Month Sales", value: fmtINR(predictions.nextMonthSales) },
              { label: "Next Month Rentals", value: fmtINR(predictions.nextMonthRentals) },
              { label: "Demand Forecast", value: predictions.inventoryDemand },
            ].map((p, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.1)", borderRadius: "10px",
                padding: "12px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>{p.label}</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>{p.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   REVENUE TAB
───────────────────────────────────────────── */
function RevenueTab({ data, loading }: any) {
  if (loading) return <Spinner />;
  const { revenue, kpis, topCustomers, monthlyBreakdown } = data;

  const totalSales = revenue.reduce((s: number, r: any) => s + (r.sales || 0), 0);
  const totalRentals = revenue.reduce((s: number, r: any) => s + (r.rentals || 0), 0);
  const total = totalSales + totalRentals;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Revenue KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Revenue",   value: fmtINR(total),        icon: IndianRupee, color: "blue"   },
          { label: "Sales Revenue",   value: fmtINR(totalSales),   icon: ShoppingCart, color: "purple" },
          { label: "Rental Revenue",  value: fmtINR(totalRentals), icon: Calendar,    color: "teal"   },
          { label: "Estimated Profit",value: fmtINR(Math.round(totalSales * 0.25 + totalRentals * 0.40)), icon: TrendingUp, color: "green" },
        ].map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Split bar */}
      {total > 0 && (
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Revenue Split</div>
          <div style={{ height: "12px", borderRadius: "99px", overflow: "hidden", background: "#f0eeeb", display: "flex" }}>
            <div style={{ width: `${(totalSales / total) * 100}%`, background: D.purple.solid, transition: "width 0.5s" }} />
            <div style={{ width: `${(totalRentals / total) * 100}%`, background: D.teal.solid }} />
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: D.purple.solid }} />
              <span style={{ color: "#555" }}>Sales {total > 0 ? `${Math.round((totalSales / total) * 100)}%` : "—"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: D.teal.solid }} />
              <span style={{ color: "#555" }}>Rentals {total > 0 ? `${Math.round((totalRentals / total) * 100)}%` : "—"}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Monthly chart */}
      <Card>
        <CardHeader title="Monthly Revenue Breakdown" sub="Sales and rental revenue by month" />
        <div style={{ padding: "16px" }}>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                <YAxis tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip formatter={fmtINR} />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="sales"   fill={D.purple.solid} radius={[4, 4, 0, 0]} name="Sales" />
                <Bar dataKey="rentals" fill={D.teal.solid}   radius={[4, 4, 0, 0]} name="Rentals" />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty message="No revenue data yet. Create some sales or rentals to see data here." />}
        </div>
      </Card>

      {/* Top customers */}
      {topCustomers && topCustomers.length > 0 && (
        <Card>
          <CardHeader title="Top Customers by Revenue" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  {["#", "Customer", "Total Revenue", "Transactions", "Share"].map(h => (
                    <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #f0eeeb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f5f4f1" }}>
                    <td style={{ padding: "11px 18px", color: "#aaa", fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: "11px 18px", fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: "11px 18px", fontWeight: 600, color: D.green.text }}>{fmtINR(c.revenue)}</td>
                    <td style={{ padding: "11px 18px" }}><Badge color="blue">{c.txns}</Badge></td>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "80px", height: "6px", background: "#f0eeeb", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${c.share}%`, height: "100%", background: D.blue.solid, borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontSize: "11px", color: "#888" }}>{c.share}%</span>
                      </div>
                    </td>
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

/* ─────────────────────────────────────────────
   INVENTORY TAB
───────────────────────────────────────────── */
function InventoryTab({ data, loading, onNavigate }: any) {
  if (loading) return <Spinner />;
  const { laptops, kpis } = data;

  const brands: Record<string, number> = {};
  const conditions: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  laptops.forEach((l: any) => {
    brands[l.brand] = (brands[l.brand] || 0) + 1;
    conditions[l.condition] = (conditions[l.condition] || 0) + 1;
    statuses[l.status] = (statuses[l.status] || 0) + 1;
  });

  const brandData = Object.entries(brands).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count);
  const condData = Object.entries(conditions).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(statuses).map(([name, value]) => ({ name, value }));

  const STATUS_COLORS: any = { AVAILABLE: D.green.solid, RENTED: D.blue.solid, SOLD: D.gray.solid, DEMO: D.amber.solid, UNDER_MAINTENANCE: D.coral.solid };
  const COND_COLORS: any = { NEW: D.green.solid, GOOD: D.blue.solid, FAIR: D.amber.solid, POOR: D.red.solid };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Inventory KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
        {[
          { label: "Total",       value: kpis.total,     color: "gray",   icon: Package   },
          { label: "Available",   value: kpis.available, color: "green",  icon: CheckCircle },
          { label: "Rented",      value: kpis.rented,    color: "blue",   icon: Calendar  },
          { label: "Sold",        value: kpis.sold,      color: "purple", icon: ShoppingCart },
          { label: "Maintenance", value: kpis.maintenance || 0, color: "amber", icon: AlertCircle },
        ].map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Utilization bar */}
      {kpis.total > 0 && (
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>Overall Utilization</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: D.blue.text }}>
              {Math.round(((kpis.rented + kpis.sold) / kpis.total) * 100)}%
            </span>
          </div>
          <div style={{ height: "10px", borderRadius: "99px", overflow: "hidden", background: "#f0eeeb", display: "flex", gap: "2px" }}>
            {kpis.rented > 0 && <div style={{ width: `${(kpis.rented / kpis.total) * 100}%`, background: D.blue.solid }} />}
            {kpis.sold > 0 && <div style={{ width: `${(kpis.sold / kpis.total) * 100}%`, background: D.purple.solid }} />}
            {kpis.available > 0 && <div style={{ width: `${(kpis.available / kpis.total) * 100}%`, background: D.green.solid }} />}
          </div>
          <div style={{ display: "flex", gap: "14px", marginTop: "8px", flexWrap: "wrap" }}>
            {[
              { label: `Rented (${kpis.rented})`, color: D.blue.solid },
              { label: `Sold (${kpis.sold})`, color: D.purple.solid },
              { label: `Available (${kpis.available})`, color: D.green.solid },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#555" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
        {/* Brand chart */}
        <Card>
          <CardHeader title="Inventory by Brand" />
          <div style={{ padding: "16px" }}>
            {brandData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={brandData} layout="vertical" margin={{ top: 4, right: 20, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis type="category" dataKey="brand" tick={{ fontSize: 12, fill: "#555" }} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={D.blue.solid} radius={[0, 6, 6, 0]} name="Laptops" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty message="No inventory data" />}
          </div>
        </Card>

        {/* Condition breakdown */}
        <Card>
          <CardHeader title="By Condition" />
          <div style={{ padding: "16px" }}>
            {condData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={condData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {condData.map((d: any, i: number) => (
                        <Cell key={i} fill={(COND_COLORS as any)[d.name] || CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "8px" }}>
                  {condData.map((d: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: (COND_COLORS as any)[d.name] || CHART_COLORS[i] }} />
                        <span style={{ color: "#555" }}>{d.name}</span>
                      </div>
                      <span style={{ fontWeight: 600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <Empty message="No data" />}
          </div>
        </Card>
      </div>

      {/* Recent inventory table */}
      <Card>
        <CardHeader
          title="Recent Inventory"
          sub={`Showing last ${Math.min(laptops.length, 10)} of ${laptops.length} laptops`}
          right={<Btn size="sm" onClick={() => onNavigate("/inventory")}>View all</Btn>}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafaf8" }}>
                {["Laptop", "Serial", "Specs", "Condition", "Status", "Sale Price", "Rent/mo"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laptops.slice(0, 10).map((l: any) => (
                <tr key={l.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 500 }}>{l.brand} {l.model}</td>
                  <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: "11px", color: "#888" }}>{l.serial_number}</td>
                  <td style={{ padding: "11px 16px", fontSize: "11px", color: "#888" }}>{l.processor} · {l.ram} · {l.storage}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <Badge color={{ NEW: "green", GOOD: "blue", FAIR: "amber", POOR: "red" }[l.condition as string] || "gray"}>{l.condition}</Badge>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <Badge color={l.status === "AVAILABLE" ? "green" : l.status === "RENTED" ? "blue" : l.status === "SOLD" ? "gray" : "amber"}>
                      {l.status}
                    </Badge>
                  </td>
                  <td style={{ padding: "11px 16px", fontWeight: 500 }}>{fmtINR(l.price)}</td>
                  <td style={{ padding: "11px 16px", color: "#888" }}>{fmtINR(l.rent_per_month)}</td>
                </tr>
              ))}
              {laptops.length === 0 && (
                <tr><td colSpan={7}><Empty message="No laptops found" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RENTALS TAB
───────────────────────────────────────────── */
function RentalsTab({ data, loading, onNavigate }: any) {
  if (loading) return <Spinner />;
  const { rentals, kpis } = data;

  const ongoing  = rentals.filter((r: any) => r.status === "ONGOING");
  const returned = rentals.filter((r: any) => r.status === "RETURNED");

  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = ongoing.filter((r: any) => {
    if (!r.expected_return_date) return false;
    const d = new Date(r.expected_return_date); d.setHours(0,0,0,0);
    return d < today;
  });
  const expiringSoon = ongoing.filter((r: any) => {
    const diff = daysDiff(r.expected_return_date);
    return diff !== null && diff >= 0 && diff <= 7;
  });

  // Monthly rentals chart
  const monthlyMap: Record<string, number> = {};
  rentals.forEach((r: any) => {
    const key = new Date(r.created_at).toLocaleString("default", { month: "short" });
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });
  const monthlyChart = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Rental KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Rentals",    value: rentals.length, icon: Calendar,     color: "blue"  },
          { label: "Active Rentals",   value: ongoing.length, icon: Activity,     color: "teal"  },
          { label: "Overdue",          value: overdue.length, icon: AlertTriangle,color: "red"   },
          { label: "Expiring in 7d",   value: expiringSoon.length, icon: Clock,   color: "amber" },
        ].map((k, i) => <KpiCard key={i} {...k} onClick={() => k.label !== "Total Rentals" ? onNavigate("/rentals/alerts") : onNavigate("/rentals/list")} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Monthly chart */}
        <Card>
          <CardHeader title="Rentals per Month" sub="Volume by month" />
          <div style={{ padding: "16px" }}>
            {monthlyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={D.teal.solid} radius={[4, 4, 0, 0]} name="Rentals" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty message="No rental data yet" />}
          </div>
        </Card>

        {/* Revenue by rental */}
        <Card>
          <CardHeader title="Rental Revenue" sub="Total collected per month" />
          <div style={{ padding: "16px" }}>
            {rentals.length > 0 ? (() => {
              const revMap: Record<string, number> = {};
              rentals.forEach((r: any) => {
                const key = new Date(r.created_at).toLocaleString("default", { month: "short" });
                revMap[key] = (revMap[key] || 0) + Number(r.total_amount || 0);
              });
              const revChart = Object.entries(revMap).map(([month, revenue]) => ({ month, revenue }));
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revChart}>
                    <defs>
                      <linearGradient id="rentalRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={D.teal.solid} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={D.teal.solid} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip formatter={fmtINR} />} />
                    <Area type="monotone" dataKey="revenue" stroke={D.teal.solid} strokeWidth={2} fill="url(#rentalRev)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              );
            })() : <Empty message="No revenue data" />}
          </div>
        </Card>
      </div>

      {/* Overdue rentals */}
      {overdue.length > 0 && (
        <Card>
          <CardHeader
            title={<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={15} color={D.red.solid} />
              <span style={{ color: D.red.text }}>Overdue Rentals</span>
              <Badge color="red">{overdue.length}</Badge>
            </div>}
            sub="These rentals require immediate action"
            right={<Btn size="sm" onClick={() => onNavigate("/rentals/alerts")}>View all alerts</Btn>}
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  {["Rental ID", "Customer", "Laptops", "Due Date", "Overdue By", "Amount", ""].map(h => (
                    <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overdue.slice(0, 8).map((r: any) => {
                  const diff = Math.abs(daysDiff(r.expected_return_date) || 0);
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                      <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: "11px", color: "#888" }}>R-{r.id}</td>
                      <td style={{ padding: "11px 16px", fontWeight: 500 }}>{r.customer_detail?.name || "—"}</td>
                      <td style={{ padding: "11px 16px" }}>{r.items_detail?.length || 0} unit{(r.items_detail?.length || 0) !== 1 ? "s" : ""}</td>
                      <td style={{ padding: "11px 16px", color: "#888", fontSize: "12px" }}>{fmtDate(r.expected_return_date)}</td>
                      <td style={{ padding: "11px 16px" }}><Badge color="red">+{diff}d</Badge></td>
                      <td style={{ padding: "11px 16px", fontWeight: 500 }}>{fmtINR(r.total_amount)}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <Btn size="sm" onClick={() => onNavigate(`/rentals/${r.id}`)}>View <ChevronRight size={11} /></Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* All active rentals */}
      <Card>
        <CardHeader
          title="Active Rentals"
          sub={`${ongoing.length} ongoing rentals`}
          right={<Btn size="sm" onClick={() => onNavigate("/rentals/list")}>View all</Btn>}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafaf8" }}>
                {["ID", "Customer", "Laptops", "Start", "Due", "Amount", "Status"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ongoing.slice(0, 10).map((r: any) => {
                const diff = daysDiff(r.expected_return_date);
                const isOverdue = diff !== null && diff < 0;
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                    <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: "11px", color: "#888" }}>R-{r.id}</td>
                    <td style={{ padding: "11px 16px", fontWeight: 500 }}>{r.customer_detail?.name || "—"}</td>
                    <td style={{ padding: "11px 16px" }}>{r.items_detail?.length || 0}</td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "#888" }}>{fmtShort(r.created_at)}</td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: isOverdue ? D.red.text : diff !== null && diff <= 3 ? D.amber.text : "#888" }}>
                      {fmtDate(r.expected_return_date)}
                    </td>
                    <td style={{ padding: "11px 16px", fontWeight: 500 }}>{fmtINR(r.total_amount)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      {isOverdue ? <Badge color="red">Overdue</Badge> :
                       diff !== null && diff <= 3 ? <Badge color="amber">{diff}d left</Badge> :
                       <Badge color="teal">Active</Badge>}
                    </td>
                  </tr>
                );
              })}
              {ongoing.length === 0 && (
                <tr><td colSpan={7}><Empty message="No active rentals" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CUSTOMERS TAB
───────────────────────────────────────────── */
function CustomersTab({ data, loading, onNavigate }: any) {
  if (loading) return <Spinner />;
  const { customers, rentals, sales } = data;

  // Build per-customer stats
  const custStats = customers.map((c: any) => {
    const cRentals = rentals.filter((r: any) => r.customer === c.id || r.customer_detail?.id === c.id);
    const cSales   = sales.filter((s: any) => s.customer === c.id || s.customer_detail?.id === c.id);
    const revenue  = cRentals.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0) +
                     cSales.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
    const activeRentals = cRentals.filter((r: any) => r.status === "ONGOING").length;
    return { ...c, rentals: cRentals.length, activeSales: cSales.length, revenue, activeRentals };
  }).sort((a: any, b: any) => b.revenue - a.revenue);

  const totalRevenue = custStats.reduce((s: number, c: any) => s + c.revenue, 0);

  // Monthly new customers
  const monthMap: Record<string, number> = {};
  customers.forEach((c: any) => {
    if (!c.created_at) return;
    const key = new Date(c.created_at).toLocaleString("default", { month: "short" });
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const growthChart = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

  // Type breakdown
  const individual = customers.filter((c: any) => c.customer_type === "individual").length;
  const corporate  = customers.filter((c: any) => c.customer_type === "company").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Customers",  value: customers.length, icon: Users,        color: "blue"   },
          { label: "Individual",       value: individual,        icon: Users,        color: "teal"   },
          { label: "Corporate",        value: corporate,         icon: Package,      color: "purple" },
          { label: "Total Revenue",    value: fmtINR(totalRevenue), icon: IndianRupee, color: "green" },
        ].map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
        {/* Growth chart */}
        <Card>
          <CardHeader title="Customer Growth" sub="New customers by month" />
          <div style={{ padding: "16px" }}>
            {growthChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={growthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={D.blue.solid} radius={[4, 4, 0, 0]} name="New Customers" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty message="No data" />}
          </div>
        </Card>

        {/* Type donut */}
        <Card>
          <CardHeader title="Customer Types" />
          <div style={{ padding: "16px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[{ name: "Individual", value: individual }, { name: "Corporate", value: corporate }]}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}
                >
                  <Cell fill={D.teal.solid} />
                  <Cell fill={D.purple.solid} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "4px" }}>
              {[{ label: `Individual (${individual})`, color: D.teal.solid }, { label: `Corporate (${corporate})`, color: D.purple.solid }].map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#555" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Customer table */}
      <Card>
        <CardHeader
          title="Customer Directory"
          sub={`${customers.length} customers`}
          right={<Btn size="sm" onClick={() => onNavigate("/customers")}>Manage customers</Btn>}
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafaf8" }}>
                {["#", "Customer", "Type", "Phone", "Rentals", "Revenue", "Active Rentals"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custStats.slice(0, 15).map((c: any, i: number) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f5f4f1", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fafaf8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
                  <td style={{ padding: "11px 16px", color: "#aaa", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                    {c.email && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{c.email}</div>}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <Badge color={c.customer_type === "company" ? "purple" : "blue"}>
                      {c.customer_type === "company" ? "Corporate" : "Individual"}
                    </Badge>
                  </td>
                  <td style={{ padding: "11px 16px", color: "#555" }}>{c.phone}</td>
                  <td style={{ padding: "11px 16px" }}><Badge color="teal">{c.rentals}</Badge></td>
                  <td style={{ padding: "11px 16px", fontWeight: 600, color: c.revenue > 0 ? D.green.text : "#888" }}>{c.revenue > 0 ? fmtINR(c.revenue) : "—"}</td>
                  <td style={{ padding: "11px 16px" }}>
                    {c.activeRentals > 0 ? <Badge color="blue">{c.activeRentals} active</Badge> : <span style={{ color: "#ccc", fontSize: "11px" }}>None</span>}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={7}><Empty message="No customers found" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ALERTS TAB
───────────────────────────────────────────── */
function AlertsTab({ data, loading, onNavigate }: any) {
  if (loading) return <Spinner />;
  const { rentals } = data;

  const today = new Date(); today.setHours(0,0,0,0);
  const ongoing = rentals.filter((r: any) => r.status === "ONGOING");

  const overdue     = ongoing.filter((r: any) => {
    const d = daysDiff(r.expected_return_date);
    return d !== null && d < 0;
  }).sort((a: any, b: any) => new Date(a.expected_return_date).getTime() - new Date(b.expected_return_date).getTime());

  const critical    = ongoing.filter((r: any) => {
    const d = daysDiff(r.expected_return_date);
    return d !== null && d >= 0 && d <= 2;
  });
  const expiringSoon = ongoing.filter((r: any) => {
    const d = daysDiff(r.expected_return_date);
    return d !== null && d > 2 && d <= 7;
  });

  const total = overdue.length + critical.length + expiringSoon.length;

  const AlertSection = ({ items, title, color, icon: Icon, type }: any) => {
    if (items.length === 0) return null;
    const c = (D as any)[color];
    return (
      <Card>
        <CardHeader
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon size={15} color={c.solid} />
              <span style={{ color: c.text }}>{title}</span>
              <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: "99px", fontSize: "11px", padding: "1px 8px", fontWeight: 500 }}>
                {items.length}
              </span>
            </div>
          }
          sub={type === "overdue" ? "Action required immediately" : type === "critical" ? "Due within 48 hours" : "Due within 7 days"}
        />
        <div>
          {items.map((r: any, i: number) => {
            const diff = daysDiff(r.expected_return_date);
            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", padding: "12px 18px",
                borderBottom: i < items.length - 1 ? "1px solid #f5f4f1" : "none",
                gap: "14px",
                transition: "background 0.1s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fafaf8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
              >
                <div style={{ width: "3px", height: "40px", borderRadius: "2px", background: c.solid, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: "13px", color: "#1a1a1a", marginBottom: "2px" }}>
                    {r.customer_detail?.name || "Unknown"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span>R-{r.id}</span>
                    <span>·</span>
                    <span>{r.items_detail?.length || 0} laptop{(r.items_detail?.length || 0) !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>Due {fmtDate(r.expected_return_date)}</span>
                    {r.total_amount && <><span>·</span><span>{fmtINR(r.total_amount)}</span></>}
                  </div>
                </div>
                <Badge color={diff !== null && diff < 0 ? "red" : diff !== null && diff <= 2 ? "coral" : "amber"}>
                  {diff !== null && diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? "Due today" : `${diff}d left`}
                </Badge>
                <Btn size="sm" variant="ghost" onClick={() => onNavigate(`/rentals/${r.id}`)}>
                  View <ChevronRight size={11} />
                </Btn>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {[
          { label: "Overdue",          value: overdue.length,     color: "red",   icon: AlertTriangle },
          { label: "Due within 48h",   value: critical.length,    color: "coral", icon: Clock },
          { label: "Due within 7 days",value: expiringSoon.length,color: "amber", icon: Calendar },
        ].map((k, i) => <KpiCard key={i} {...k} icon={k.icon} />)}
      </div>

      {total === 0 ? (
        <Card style={{ padding: "60px", textAlign: "center" }}>
          <CheckCircle size={40} color={D.green.solid} style={{ marginBottom: "12px" }} />
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a", marginBottom: "6px" }}>All Clear!</div>
          <div style={{ fontSize: "13px", color: "#888" }}>No alerts at this time. All active rentals are within their return window.</div>
        </Card>
      ) : (
        <>
          <AlertSection items={overdue}      title="Overdue"          color="red"   icon={AlertTriangle} type="overdue"   />
          <AlertSection items={critical}     title="Critical"         color="coral" icon={Clock}         type="critical"  />
          <AlertSection items={expiringSoon} title="Expiring Soon"    color="amber" icon={Calendar}      type="expiring"  />
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TABS CONFIG
───────────────────────────────────────────── */
const TABS = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "revenue",    label: "Revenue",    icon: TrendingUp       },
  { id: "inventory",  label: "Inventory",  icon: Laptop           },
  { id: "rentals",    label: "Rentals",    icon: Calendar         },
  { id: "customers",  label: "Customers",  icon: Users            },
  { id: "alerts",     label: "Alerts",     icon: AlertTriangle    },
];

/* ─────────────────────────────────────────────
   MAIN DASHBOARD MODULE
───────────────────────────────────────────── */
export function DashboardModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading,   setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Data stores
  const [laptops,   setLaptops]   = useState<any[]>([]);
  const [sales,     setSales]     = useState<any[]>([]);
  const [rentals,   setRentals]   = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lr, sr, rr, cr] = await Promise.all([
        api.get("/inventory/laptops/"),
        api.get("/sales/sale/"),
        api.get("/rentals/rental/"),
        api.get("/customers/customers/"),
      ]);
      setLaptops(   lr.data.results ?? lr.data ?? []);
      setSales(     sr.data.results ?? sr.data ?? []);
      setRentals(   rr.data.results ?? rr.data ?? []);
      setCustomers( cr.data.results ?? cr.data ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Derived data ── */
  const kpis = {
    total:        laptops.length,
    available:    laptops.filter(l => l.status === "AVAILABLE").length,
    rented:       laptops.filter(l => l.status === "RENTED").length,
    sold:         laptops.filter(l => l.status === "SOLD").length,
    maintenance:  laptops.filter(l => l.status === "UNDER_MAINTENANCE").length,
    customers:    customers.length,
    salesRevenue: sales.reduce((s, a) => s + Number(a.total_amount || 0), 0),
    rentalRevenue:rentals.reduce((s, a) => s + Number(a.total_amount || 0), 0),
    totalRevenue: sales.reduce((s, a) => s + Number(a.total_amount || 0), 0) +
                  rentals.reduce((s, a) => s + Number(a.total_amount || 0), 0),
    overdue: (() => {
      const today = new Date(); today.setHours(0,0,0,0);
      return rentals.filter(r => {
        if (r.status !== "ONGOING" || !r.expected_return_date) return false;
        const d = new Date(r.expected_return_date); d.setHours(0,0,0,0);
        return d < today;
      }).length;
    })(),
  };

  // Revenue chart data
  const monthlyMap: Record<string, { month: string; sales: number; rentals: number }> = {};
  sales.forEach(s => {
    const key = new Date(s.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, sales: 0, rentals: 0 };
    monthlyMap[key].sales += Number(s.total_amount || 0);
  });
  rentals.forEach(r => {
    const key = new Date(r.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, sales: 0, rentals: 0 };
    monthlyMap[key].rentals += Number(r.total_amount || 0);
  });
  const revenue = Object.values(monthlyMap);

  // Inventory status data
  const statusCounts: Record<string, number> = {};
  laptops.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });
  const STATUS_LABELS: any = { AVAILABLE: "Available", RENTED: "Rented", SOLD: "Sold", DEMO: "Demo", UNDER_MAINTENANCE: "Maintenance" };
  const statusData = Object.entries(statusCounts).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }));

  // Rental alerts
  const today = new Date(); today.setHours(0,0,0,0);
  const alerts = rentals
    .filter(r => r.status === "ONGOING" && r.expected_return_date)
    .map(r => ({
      customer: r.customer_detail?.name || "Unknown",
      dueDate: r.expected_return_date,
      days: daysDiff(r.expected_return_date) || 0,
    }))
    .filter(a => a.days <= 7)
    .sort((a, b) => a.days - b.days);

  // Recent activity
  const activity = [
    ...sales.slice(0, 5).map(s => ({
      text: `Sold to ${s.customer_detail?.name || "customer"}`,
      value: s.total_amount,
      type: "sale",
      date: s.created_at,
    })),
    ...rentals.slice(0, 5).map(r => ({
      text: `Rental for ${r.customer_detail?.name || "customer"}`,
      value: r.total_amount,
      type: "rental",
      date: r.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // AI predictions
  const avgSales   = kpis.salesRevenue / Math.max(revenue.length, 1);
  const avgRentals = kpis.rentalRevenue / Math.max(revenue.length, 1);
  const predictions = {
    nextMonthSales:   Math.round(avgSales * 1.15),
    nextMonthRentals: Math.round(avgRentals * 1.20),
    inventoryDemand:  kpis.rented > kpis.available ? "High" : "Normal",
  };

  // Top customers
  const custMap: Record<number, { name: string; revenue: number; txns: number }> = {};
  [...sales, ...rentals].forEach(tx => {
    const id = tx.customer || tx.customer_detail?.id;
    const name = tx.customer_detail?.name || "Unknown";
    if (!id) return;
    if (!custMap[id]) custMap[id] = { name, revenue: 0, txns: 0 };
    custMap[id].revenue += Number(tx.total_amount || 0);
    custMap[id].txns++;
  });
  const topCustomers = Object.values(custMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map(c => ({ ...c, share: kpis.totalRevenue > 0 ? Math.round((c.revenue / kpis.totalRevenue) * 100) : 0 }));

  /* ── Shared data objects ── */
  const overviewData = { kpis, revenue, statusData, alerts, activity, predictions };
  const revenueData  = { revenue, kpis, topCustomers };
  const inventoryData = { laptops, kpis };
  const rentalsData  = { rentals, kpis };
  const customersData = { customers, rentals, sales };
  const alertsData   = { rentals };

  const onNavigate = (path: string) => {
    window.location.href = path;
  };

  /* ── Alert badge count ── */
  const alertCount = alerts.length;
  const overdueCount = kpis.overdue;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f5" }}>
      {/* ── Top nav ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e8e6e1",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            const showBadge = tab.id === "alerts" && (overdueCount + alertCount) > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  padding: "14px 16px",
                  border: "none",
                  borderBottom: isActive ? "2px solid #1a6ef5" : "2px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "#1a6ef5" : "#6b6b6b",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                  marginBottom: "-1px",
                  position: "relative",
                }}
              >
                <Icon size={15} />
                {tab.label}
                {showBadge && (
                  <span style={{
                    position: "absolute", top: "10px", right: "8px",
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: D.red.solid, border: "2px solid #fff",
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Refresh + last updated */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastRefresh && (
            <span style={{ fontSize: "11px", color: "#bbb" }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Btn variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            {loading ? "Loading…" : "Refresh"}
          </Btn>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "28px 28px 60px" }}>
        {/* Page heading */}
        <div style={{ marginBottom: "22px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            {TABS.find(t => t.id === activeTab)?.label} Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            {activeTab === "overview"  && "Complete business overview and key metrics"}
            {activeTab === "revenue"   && "Revenue analysis, trends, and top customers"}
            {activeTab === "inventory" && "Laptop inventory status, distribution, and utilization"}
            {activeTab === "rentals"   && "Active rentals, overdue tracking, and revenue"}
            {activeTab === "customers" && "Customer insights, growth, and activity"}
            {activeTab === "alerts"    && "Overdue and expiring rentals requiring attention"}
          </p>
        </div>

        {activeTab === "overview"  && <OverviewTab  data={overviewData}  loading={loading} onNavigate={onNavigate} />}
        {activeTab === "revenue"   && <RevenueTab   data={revenueData}   loading={loading} />}
        {activeTab === "inventory" && <InventoryTab data={inventoryData} loading={loading} onNavigate={onNavigate} />}
        {activeTab === "rentals"   && <RentalsTab   data={rentalsData}   loading={loading} onNavigate={onNavigate} />}
        {activeTab === "customers" && <CustomersTab data={customersData} loading={loading} onNavigate={onNavigate} />}
        {activeTab === "alerts"    && <AlertsTab    data={alertsData}    loading={loading} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}