import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, RotateCcw, AlertTriangle, Clock,
  ArrowRight, RefreshCw,
} from "lucide-react";
import api from "../../services/axios";
import { KpiCard, Card, CardHeader, SectionTitle, Badge, Btn, fmtDate, fmtINR, C } from "./ui";

function TimelineItem({ icon: Icon, iconColor, title, meta }) {
  return (
    <div style={{ display: "flex", gap: "12px", paddingBottom: "16px", position: "relative" }}>
      <div
        style={{
          width: "30px", height: "30px", borderRadius: "50%",
          background: iconColor + "22", flexShrink: 0, marginTop: "1px",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${iconColor}44`,
        }}
      >
        <Icon size={13} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>{title}</div>
        <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{meta}</div>
      </div>
    </div>
  );
}

export function RentalDashboard({ onNavigate }) {
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState({});
  const [revenue,  setRevenue]  = useState([]);
  const [activity, setActivity] = useState([]);
  const [overdue,  setOverdue]  = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [rentalRes, customerRes] = await Promise.all([
        api.get("/rentals/rental/"),
        api.get("/customers/customers/"),
      ]);

      const rentals   = Array.isArray(rentalRes.data) ? rentalRes.data : rentalRes.data.results || [];
      const customers = Array.isArray(customerRes.data) ? customerRes.data : customerRes.data.results || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ongoing  = rentals.filter((r) => r.status === "ONGOING");
      const returned = rentals.filter((r) => r.status === "RETURNED");
      const overdueList = ongoing.filter((r) => {
        if (!r.expected_return_date) return false;
        const due = new Date(r.expected_return_date);
        due.setHours(0, 0, 0, 0);
        return due < today;
      });

      const monthlyMap = {};
      rentals.forEach((r) => {
        const key = new Date(r.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
        if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, count: 0 };
        monthlyMap[key].revenue += Number(r.total_amount || 0);
        monthlyMap[key].count   += 1;
      });

      const totalRevenue = rentals.reduce((s, r) => s + Number(r.total_amount || 0), 0);
      const avgDuration  = ongoing.length
        ? Math.round(
            ongoing.reduce((s, r) => {
              const start = new Date(r.created_at);
              return s + (today - start) / 86_400_000;
            }, 0) / ongoing.length
          )
        : 0;

      setStats({
        ongoing:       ongoing.length,
        returned:      returned.length,
        overdue:       overdueList.length,
        customers:     customers.length,
        totalRevenue,
        avgDuration,
      });

      setOverdue(overdueList.slice(0, 3));
      setRevenue(Object.values(monthlyMap).slice(-6));
      setActivity(
        rentals
          .slice(0, 5)
          .map((r) => ({ ...r, customerName: r.customer_detail?.name || "Unknown" }))
      );
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "#bbb" }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            Rental Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            Live overview of your rental operations
          </p>
        </div>
        <Btn variant="ghost" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </Btn>
      </div>

      {/* KPIs */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap:                 "12px",
          marginBottom:        "24px",
        }}
      >
        <KpiCard
          label="Active rentals"
          value={stats.ongoing}
          sub={`${stats.overdue} overdue`}
          subColor={stats.overdue > 0 ? "down" : "up"}
        />
        <KpiCard
          label="Total revenue"
          value={fmtINR(stats.totalRevenue)}
          sub="All time"
          subColor="up"
        />
        <KpiCard
          label="Returned"
          value={stats.returned}
          sub="Total completed"
          subColor="up"
        />
        <KpiCard
          label="Avg rental duration"
          value={`${stats.avgDuration}d`}
          sub="Active rentals"
          subColor="neutral"
        />
      </div>

      {/* Overdue alert bar */}
      {stats.overdue > 0 && (
        <div
          style={{
            background:    "#fff8ed",
            border:        "1px solid #ffd499",
            borderRadius:  "10px",
            padding:       "12px 16px",
            marginBottom:  "20px",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={15} color="#c07800" />
            <span style={{ fontSize: "13px", color: "#7a4d00", fontWeight: 500 }}>
              {stats.overdue} rental{stats.overdue > 1 ? "s are" : " is"} overdue and need immediate action
            </span>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => onNavigate("/rentals/alerts")}>
            View alerts <ArrowRight size={12} />
          </Btn>
        </div>
      )}

      {/* Charts + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* Revenue chart */}
        <Card>
          <CardHeader title="Monthly revenue trend" />
          <div style={{ padding: "16px" }}>
            {revenue.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #e8e6e1" }}
                    formatter={(v) => fmtINR(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={C.blue.solid}
                    strokeWidth={2}
                    dot={{ r: 3, fill: C.blue.solid }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>
                Not enough data yet
              </div>
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader
            title="Recent activity"
            right={
              <Btn size="sm" variant="ghost" onClick={() => onNavigate("/rentals/list")}>
                View all
              </Btn>
            }
          />
          <div style={{ padding: "16px" }}>
            {activity.map((r) => {
              const statusIconMap = {
                ONGOING:  { icon: TrendingUp, color: C.blue.solid  },
                RETURNED: { icon: RotateCcw,  color: C.teal.solid  },
                REPLACED: { icon: RotateCcw,  color: C.amber.solid },
              };
              const s = statusIconMap[r.status] ?? { icon: Clock, color: C.gray.solid };
              return (
                <TimelineItem
                  key={r.id}
                  icon={s.icon}
                  iconColor={s.color}
                  title={`${r.customer_detail?.name ?? "Customer"} — ${r.status.toLowerCase()}`}
                  meta={`${r.items_detail?.length ?? 0} laptop${(r.items_detail?.length ?? 0) !== 1 ? "s" : ""} · ${fmtDate(r.created_at)}`}
                />
              );
            })}
            {activity.length === 0 && (
              <div style={{ textAlign: "center", color: "#ccc", fontSize: "13px", padding: "24px" }}>
                No activity yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Overdue quick view */}
      {overdue.length > 0 && (
        <Card>
          <CardHeader
            title="Overdue rentals"
            right={
              <Btn size="sm" variant="danger" onClick={() => onNavigate("/rentals/alerts")}>
                <AlertTriangle size={12} /> View all
              </Btn>
            }
          />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  {["Customer", "Laptops", "Due date", "Overdue by", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 14px", textAlign: "left",
                        fontSize: "11px", fontWeight: 500,
                        color: "#999", letterSpacing: "0.05em",
                        borderBottom: "1px solid #f0eeeb",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overdue.map((r) => {
                  const due  = new Date(r.expected_return_date);
                  const diff = Math.round((new Date() - due) / 86_400_000);
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 500 }}>{r.customer_detail?.name ?? "—"}</div>
                        <div style={{ fontSize: "11px", color: "#999" }}>R-{r.id}</div>
                      </td>
                      <td style={{ padding: "11px 14px", color: "#555" }}>
                        {r.items_detail?.length ?? 0} laptop{(r.items_detail?.length ?? 0) !== 1 ? "s" : ""}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#999", fontSize: "12px" }}>
                        {fmtDate(r.expected_return_date)}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <Badge color="red">+{diff} day{diff !== 1 ? "s" : ""}</Badge>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <Btn size="sm" variant="ghost" onClick={() => onNavigate(`/rentals/${r.id}`)}>
                          View
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
