import React, { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Laptop, TrendingUp, DollarSign, Package,
  Wrench, AlertTriangle, RefreshCw, ArrowRight,
  ShieldAlert, Activity, Box, BadgeCheck,
} from "lucide-react";
import api from "../../services/axios";
import {
  T, StatusBadge, StatTile, Card, CardHead, Btn, Chip,
  fmtINR, fmtDate, daysDiff, Spinner,
} from "./ui";

/* ── Warranty row ── */
function WarrantyRow({ laptop, onNavigate }: { laptop: any; onNavigate: (p: string) => void }) {
  const days = daysDiff(laptop.warranty_expiry);
  const expired = days !== null && days < 0;
  const expiring = days !== null && days >= 0 && days <= 30;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", padding: "10px 18px",
        gap: "12px", borderBottom: `1px solid ${T.border}`, transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      <div
        style={{
          width: "3px", height: "38px", borderRadius: "2px", flexShrink: 0,
          background: expired ? T.red.dot : T.amber.dot,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: "13px", color: T.text }}>
          {laptop.brand} {laptop.model}
        </div>
        <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>
          {laptop.serial_number}
          {" · "}
          {expired
            ? <span style={{ color: T.red.text }}>Expired {Math.abs(days!)}d ago</span>
            : <span style={{ color: T.amber.text }}>Expires in {days}d ({fmtDate(laptop.warranty_expiry)})</span>
          }
        </div>
      </div>
      <Btn
        size="sm" variant="ghost"
        icon={<ArrowRight size={11} />}
        onClick={() => onNavigate(`/inventory/${laptop.id}`)}
      >
        View
      </Btn>
    </div>
  );
}

/* ── Recent laptop row ── */
function RecentRow({ laptop, onNavigate }: { laptop: any; onNavigate: (p: string) => void }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", padding: "10px 18px",
        gap: "12px", borderBottom: `1px solid ${T.border}`, transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bg; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      <div
        style={{
          width: "34px", height: "34px", borderRadius: T.radiusSm,
          background: T.blue.bg, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0,
        }}
      >
        <Laptop size={15} color={T.primary} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: "13px", color: T.text }}>
          {laptop.brand} {laptop.model}
        </div>
        <div style={{ fontSize: "11px", color: T.muted, marginTop: "1px" }}>
          {laptop.serial_number} · Added {fmtDate(laptop.created_at)}
        </div>
      </div>
      <StatusBadge status={laptop.status} />
      <span style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>{fmtINR(laptop.price)}</span>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export function InventoryDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [laptops,  setLaptops]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/laptops/");
      const data: any[] = Array.isArray(res.data) ? res.data : res.data.results || [];
      setLaptops(data);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner message="Loading dashboard…" />;

  /* ── Derived stats ── */
  const byStatus = (s: string) => laptops.filter((l) => l.status === s).length;
  const total         = laptops.length;
  const available     = byStatus("AVAILABLE");
  const rented        = byStatus("RENTED");
  const sold          = byStatus("SOLD");
  const demo          = byStatus("DEMO");
  const maintenance   = byStatus("UNDER_MAINTENANCE");
  const returned      = byStatus("RETURNED_TO_SUPPLIER");
  const writtenOff    = byStatus("WRITTEN_OFF");

  const totalSaleValue = laptops.reduce((s, l) => s + Number(l.price || 0), 0);
  const totalRentPool  = laptops
    .filter((l) => l.status !== "SOLD" && l.status !== "WRITTEN_OFF" && l.status !== "RETURNED_TO_SUPPLIER")
    .reduce((s, l) => s + Number(l.rent_per_month || 0), 0);
  const totalCost      = laptops.reduce((s, l) => s + Number(l.purchase_price || 0), 0);
  const utilization    = total > 0 ? Math.round((rented / total) * 100) : 0;

  /* ── Brand distribution ── */
  const brandMap: Record<string, number> = {};
  laptops.forEach((l) => { brandMap[l.brand] = (brandMap[l.brand] || 0) + 1; });
  const brandData = Object.entries(brandMap)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  /* ── Status pie ── */
  const statusPie = [
    { name: "Available",   value: available,   color: T.available.dot },
    { name: "Rented",      value: rented,      color: T.rented.dot },
    { name: "Demo",        value: demo,        color: T.demo.dot },
    { name: "Maintenance", value: maintenance, color: T.maintenance.dot },
    { name: "Sold",        value: sold,        color: T.sold.dot },
  ].filter((d) => d.value > 0);

  /* ── Condition distribution ── */
  const condMap: Record<string, number> = {};
  laptops.forEach((l) => { if (l.condition) condMap[l.condition] = (condMap[l.condition] || 0) + 1; });
  const condData = Object.entries(condMap).map(([cond, count]) => ({ cond, count }));

  /* ── Monthly additions ── */
  const monthMap: Record<string, number> = {};
  laptops.forEach((l) => {
    const k = new Date(l.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
    monthMap[k] = (monthMap[k] || 0) + 1;
  });
  const monthlyData = Object.entries(monthMap)
    .map(([month, added]) => ({ month, added }))
    .slice(-8);

  /* ── Alerts ── */
  const warrantyAlerts = laptops
    .filter((l) => {
      if (!l.warranty_expiry) return false;
      const d = daysDiff(l.warranty_expiry);
      return d !== null && d <= 30;
    })
    .sort((a, b) => daysDiff(a.warranty_expiry)! - daysDiff(b.warranty_expiry)!)
    .slice(0, 6);

  const recentLaptops = [...laptops]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const BRAND_COLORS = [
    "#1a5cf8","#14b8a6","#f59e0b","#8b5cf6","#ef4444","#0ea5e9","#22c55e","#f97316",
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: T.text, margin: 0 }}>
            Inventory Overview
          </h1>
          <p style={{ fontSize: "13px", color: T.muted, marginTop: "4px" }}>
            {total} laptops tracked
            {lastSync && ` · Updated ${lastSync.toLocaleTimeString()}`}
          </p>
        </div>
        <Btn variant="secondary" icon={<RefreshCw size={13} />} onClick={load}>
          Refresh
        </Btn>
      </div>

      {/* ── KPI Row 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "12px" }}>
        <StatTile
          label="Total Laptops"
          value={total}
          sub={`${utilization}% utilization`}
          color="blue"
          icon={<Laptop size={17} />}
        />
        <StatTile
          label="Available"
          value={available}
          sub={`${total > 0 ? Math.round((available / total) * 100) : 0}% of fleet`}
          color="available"
          icon={<BadgeCheck size={17} />}
        />
        <StatTile
          label="Active Rentals"
          value={rented}
          sub="Currently rented out"
          color="rented"
          icon={<Activity size={17} />}
        />
        <StatTile
          label="Inventory Value"
          value={fmtINR(totalSaleValue)}
          sub="At listed sale price"
          color="blue"
          icon={<DollarSign size={17} />}
        />
      </div>

      {/* ── KPI Row 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <StatTile label="Maintenance" value={maintenance} color="maintenance" icon={<Wrench size={17} />} />
        <StatTile label="Demo Units"  value={demo}        color="demo"        icon={<Box size={17} />} />
        <StatTile label="Units Sold"  value={sold}        color="sold"        icon={<Package size={17} />} />
        <StatTile
          label="Monthly Rent Pool"
          value={fmtINR(totalRentPool)}
          sub="If all active units rented"
          color="teal"
          icon={<TrendingUp size={17} />}
        />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* Brand bar chart */}
        <Card>
          <CardHead title="Fleet by Brand" subtitle="Unit count per manufacturer" />
          <div style={{ padding: "16px" }}>
            {brandData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={brandData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="brand" tick={{ fontSize: 11, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}
                  />
                  <Bar dataKey="count" name="Units" radius={[4, 4, 0, 0]}>
                    {brandData.map((_, i) => (
                      <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "13px" }}>
                No data
              </div>
            )}
          </div>
        </Card>

        {/* Status donut */}
        <Card>
          <CardHead title="Status Distribution" />
          <div style={{ padding: "16px" }}>
            {statusPie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      dataKey="value" strokeWidth={0}
                    >
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: "12px", borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                  {statusPie.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: T.muted }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "13px" }}>
                No data
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Monthly Additions + Condition ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "16px", marginBottom: "16px" }}>

        <Card>
          <CardHead title="Monthly Additions" subtitle="New laptops added to inventory" />
          <div style={{ padding: "16px" }}>
            {monthlyData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: T.muted }} />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: T.radiusSm, border: `1px solid ${T.border}` }}
                  />
                  <Line
                    type="monotone" dataKey="added" stroke={T.primary}
                    strokeWidth={2} dot={{ r: 3, fill: T.primary }} name="Added"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "13px" }}>
                Not enough data yet
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="Condition Breakdown" />
          <div style={{ padding: "18px" }}>
            {condData.length > 0 ? (
              condData.map(({ cond, count }) => {
                const pct = Math.round((count / total) * 100);
                const condColors: Record<string, string> = {
                  NEW: T.available.dot, GOOD: T.rented.dot,
                  FAIR: T.demo.dot, POOR: T.red.dot,
                };
                return (
                  <div key={cond} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: T.text }}>{cond}</span>
                      <span style={{ fontSize: "12px", color: T.muted }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: "6px", background: T.bg, borderRadius: "99px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%", width: `${pct}%`,
                          background: condColors[cond] || "#ccc",
                          borderRadius: "99px", transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: "#ccc", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No data</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Alerts + Recent ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Warranty alerts */}
        <Card>
          <CardHead
            title="Warranty Alerts"
            subtitle={`${warrantyAlerts.length} requiring attention`}
            icon={<ShieldAlert size={16} />}
            right={
              <Btn variant="ghost" size="sm" onClick={() => onNavigate("/inventory/list")}>
                View all
              </Btn>
            }
          />
          {warrantyAlerts.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}>
              ✓ All warranties are valid
            </div>
          ) : (
            warrantyAlerts.map((l) => (
              <WarrantyRow key={l.id} laptop={l} onNavigate={onNavigate} />
            ))
          )}
        </Card>

        {/* Recent additions */}
        <Card>
          <CardHead
            title="Recently Added"
            subtitle="Latest inventory entries"
            icon={<Laptop size={16} />}
            right={
              <Btn variant="ghost" size="sm" onClick={() => onNavigate("/inventory/list")}>
                View all
              </Btn>
            }
          />
          {recentLaptops.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}>
              No laptops yet
            </div>
          ) : (
            recentLaptops.map((l) => (
              <RecentRow key={l.id} laptop={l} onNavigate={onNavigate} />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
