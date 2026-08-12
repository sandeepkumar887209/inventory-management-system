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
        customers:     customers.length,
        totalRevenue,
        avgDuration,
      });

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
          sub="Active"
          subColor="neutral"
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
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px" }}>
        <Card>
          <CardHeader title="Rental Revenue Trend" />
          <div style={{ padding: "16px" }}>
            {revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eeeb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Line type="monotone" dataKey="revenue" stroke={C.teal.solid} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#bbb", fontSize: "13px" }}>No revenue data yet</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" />
          <div style={{ padding: "16px 20px 0" }}>
            {activity.length === 0 && (
              <div style={{ textAlign: "center", color: "#ccc", fontSize: "13px", padding: "24px" }}>
                No activity yet
              </div>
            )}
            {activity.map((a: any) => (
              <TimelineItem
                key={a.id}
                icon={TrendingUp}
                iconColor={C.teal.solid}
                title={`Rental for ${a.customerName}`}
                meta={fmtDate(a.created_at)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
