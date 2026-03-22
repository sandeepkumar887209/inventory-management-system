import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import {
  C, Badge, Btn, Card, CardHeader,
  Input, Select, SectionTitle, Spinner, Empty,
  fmtDate, fmtINR,
} from "../rentals/ui";

/* ─── Status / Condition maps ─── */
const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:             "green",
  RENTED:                "blue",
  SOLD:                  "gray",
  DEMO:                  "amber",
  UNDER_MAINTENANCE:     "amber",
  RETURNED_TO_SUPPLIER:  "coral",
  WRITTEN_OFF:           "red",
};
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE:             "Available",
  RENTED:                "Rented",
  SOLD:                  "Sold",
  DEMO:                  "Demo",
  UNDER_MAINTENANCE:     "Maintenance",
  RETURNED_TO_SUPPLIER:  "Returned",
  WRITTEN_OFF:           "Written Off",
};
const COND_COLOR: Record<string, string> = {
  NEW: "green", GOOD: "blue", FAIR: "amber", POOR: "red",
};

const ACTION_ICONS: Record<string, string> = {
  ADDED: "📦", RENTED_OUT: "🔑", RETURNED: "✅",
  SOLD: "💰", SENT_FOR_MAINTENANCE: "🔧", MAINTENANCE_DONE: "✅",
  RETURNED_TO_SUPPLIER: "↩️", WRITTEN_OFF: "🗑️", STATUS_CHANGED: "🔄",
};

/* ─── Stat pill ─── */
function StatPill({ label, value, color, active, onClick }: any) {
  const c = (C as any)[color] ?? C.gray;
  return (
    <button
      onClick={onClick}
      style={{
        display:       "inline-flex",
        flexDirection: "column",
        alignItems:    "center",
        padding:       "14px 20px",
        background:    active ? c.bg : "#fff",
        border:        `1px solid ${active ? c.border : "#ebebeb"}`,
        borderRadius:  "12px",
        cursor:        "pointer",
        transition:    "all 0.15s",
        minWidth:      "90px",
      }}
    >
      <span style={{ fontSize: "22px", fontWeight: 600, color: active ? c.text : "#1a1a1a" }}>
        {value}
      </span>
      <span style={{ fontSize: "11px", color: active ? c.text : "#999", marginTop: "3px" }}>
        {label}
      </span>
    </button>
  );
}

/* ─── History preview drawer (slides in from right) ─── */
function HistoryDrawer({ laptop, history, loading, onClose }: {
  laptop: any; history: any[]; loading: boolean; onClose: () => void;
}) {
  const ACTION_CONFIG: Record<string, { icon: string; color: string }> = {
    ADDED:                { icon: "📦", color: "green"  },
    RENTED_OUT:           { icon: "🔑", color: "blue"   },
    RETURNED:             { icon: "✅", color: "teal"   },
    SOLD:                 { icon: "💰", color: "purple" },
    SENT_FOR_MAINTENANCE: { icon: "🔧", color: "amber"  },
    MAINTENANCE_DONE:     { icon: "✅", color: "green"  },
    RETURNED_TO_SUPPLIER: { icon: "↩️", color: "coral"  },
    WRITTEN_OFF:          { icon: "🗑️", color: "red"    },
    STATUS_CHANGED:       { icon: "🔄", color: "gray"   },
    SPECS_UPDATED:        { icon: "✏️", color: "blue"   },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)",
          zIndex: 200, transition: "opacity 0.2s",
        }}
      />
      {/* Drawer */}
      <div style={{
        position:    "fixed",
        top:         0,
        right:       0,
        height:      "100vh",
        width:       "380px",
        background:  "#fff",
        zIndex:      201,
        boxShadow:   "-4px 0 24px rgba(0,0,0,0.10)",
        display:     "flex",
        flexDirection: "column",
        overflow:    "hidden",
      }}>
        {/* Drawer header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0eeeb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "15px", color: "#1a1a1a" }}>
                {laptop.brand} {laptop.model}
              </div>
              <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "monospace", marginTop: "2px" }}>
                {laptop.serial_number}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#aaa", padding: "2px 6px", borderRadius: "6px" }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
            <Badge color={STATUS_COLOR[laptop.status] ?? "gray"}>
              {STATUS_LABEL[laptop.status] ?? laptop.status}
            </Badge>
            <Badge color={COND_COLOR[laptop.condition] ?? "gray"}>{laptop.condition}</Badge>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "#f0eeeb" }}>
          {[
            { label: "Sale Price", value: fmtINR(laptop.price) },
            { label: "Rent/mo", value: fmtINR(laptop.rent_per_month) },
            { label: "Cost Price", value: fmtINR(laptop.purchase_price) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#fafaf8", padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>{value}</div>
              <div style={{ fontSize: "10px", color: "#aaa", marginTop: "1px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* History list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
            Lifecycle History ({history.length})
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#bbb", padding: "24px", fontSize: "13px" }}>Loading history…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", color: "#bbb", padding: "24px", fontSize: "13px" }}>No history recorded yet.</div>
          ) : (
            history.map((h, i) => {
              const cfg = ACTION_CONFIG[h.action] ?? { icon: "🔄", color: "gray" };
              const c = (C as any)[cfg.color] ?? C.gray;
              return (
                <div key={h.id ?? i} style={{ display: "flex", gap: "10px", paddingBottom: "16px", position: "relative" }}>
                  {i < history.length - 1 && (
                    <div style={{ position: "absolute", left: "13px", top: "28px", width: "1px", height: "calc(100% - 8px)", background: "#f0eeeb" }} />
                  )}
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: c.bg, border: `1px solid ${c.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", flexShrink: 0, zIndex: 1,
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, paddingTop: "3px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "#1a1a1a" }}>
                        {h.action_label || h.action?.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: "10px", color: "#bbb", whiteSpace: "nowrap" }}>
                        {h.date || (h.created_at ? new Date(h.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "")}
                      </span>
                    </div>
                    {h.from_status && h.to_status && (
                      <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
                        {h.from_status} → <span style={{ color: c.text }}>{h.to_status}</span>
                      </div>
                    )}
                    {(h.customer_detail?.name || h.customer_name) && (
                      <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>
                        👤 {h.customer_detail?.name || h.customer_name}
                      </div>
                    )}
                    {h.remarks && (
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "4px", fontStyle: "italic", background: "#fafaf8", padding: "4px 8px", borderRadius: "5px", borderLeft: "2px solid #e0deda" }}>
                        {h.remarks}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f0eeeb", display: "flex", gap: "8px" }}>
          <Btn variant="primary" size="sm" onClick={() => { onClose(); }}>
            View Full Detail
          </Btn>
          <Btn variant="ghost" size="sm" onClick={onClose}>
            Close
          </Btn>
        </div>
      </div>
    </>
  );
}

/* ─── Action menu ─── */
function ActionMenu({ laptop, onDone }: { laptop: any; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const doAction = async (endpoint: string, promptText: string) => {
    const remarks = window.prompt(promptText);
    if (remarks === null) return;
    setBusy(true);
    setOpen(false);
    try {
      await api.post(`/inventory/laptops/${laptop.id}/${endpoint}/`, { remarks });
      onDone();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const s = laptop.status;
  const canMaintenance    = !["UNDER_MAINTENANCE","RETURNED_TO_SUPPLIER","WRITTEN_OFF","SOLD","RENTED"].includes(s);
  const canEndMaintenance = s === "UNDER_MAINTENANCE";
  const canReturn         = !["RETURNED_TO_SUPPLIER","WRITTEN_OFF","SOLD","RENTED"].includes(s);
  const canWriteOff       = !["WRITTEN_OFF","SOLD","RENTED"].includes(s);

  if (!canMaintenance && !canEndMaintenance && !canReturn && !canWriteOff) return null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Btn size="sm" variant="ghost" onClick={() => setOpen((o) => !o)} disabled={busy}>···</Btn>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100,
            background: "#fff", border: "1px solid #ebebeb", borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)", minWidth: "190px", overflow: "hidden",
          }}>
            {canMaintenance    && <MenuItem label="🔧 Send for Maintenance"    onClick={() => doAction("send-maintenance",          "Reason (optional):")} />}
            {canEndMaintenance && <MenuItem label="✅ Return from Maintenance" onClick={() => doAction("return-from-maintenance",   "Remarks (optional):")} />}
            {canReturn         && <MenuItem label="↩ Return to Supplier"       onClick={() => doAction("return-to-supplier",        "Reason:")} />}
            {canWriteOff       && <MenuItem label="🗑 Write Off" danger         onClick={() => doAction("write-off",                "Reason (required):")} />}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, danger = false }: any) {
  return (
    <button
      onClick={onClick}
      style={{ width: "100%", textAlign: "left", padding: "9px 14px", fontSize: "13px", color: danger ? "#991b1b" : "#1a1a1a", background: "none", border: "none", cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "#fff0f0" : "#fafaf8"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
    >{label}</button>
  );
}

/* ─── Warranty indicator ─── */
function WarrantyDot({ expiryDate }: { expiryDate?: string | null }) {
  if (!expiryDate) return <span style={{ color: "#ccc" }}>—</span>;
  const daysLeft = Math.round((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
  const color = daysLeft < 0 ? "#991b1b" : daysLeft < 90 ? "#92400e" : "#166534";
  const bg    = daysLeft < 0 ? "#fef2f2" : daysLeft < 90 ? "#fffbeb" : "#f0fdf4";
  const label = daysLeft < 0 ? `Exp. ${fmtDate(expiryDate)}` : `${fmtDate(expiryDate)}`;
  return (
    <span style={{ fontSize: "11px", color, background: bg, padding: "2px 7px", borderRadius: "99px", fontWeight: 500 }}>
      {daysLeft < 0 ? "⚠ " : ""}{label}
    </span>
  );
}

/* ─── Inline mini chart for age/usage ─── */
function UsageBar({ rented, available, total }: { rented: number; available: number; total: number }) {
  if (!total) return null;
  const pct = Math.round((rented / total) * 100);
  const color = pct > 75 ? C.blue.solid : pct > 40 ? C.teal.solid : C.gray.solid;
  return (
    <div title={`${rented} rented of ${total} total (${pct}% utilization)`} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "60px", height: "5px", background: "#f0eeeb", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: "11px", color: "#aaa" }}>{pct}%</span>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export function InventoryList({ refreshKey, onAddNew, onEdit, onView }: {
  refreshKey: number;
  onAddNew: () => void;
  onEdit: (item: any) => void;
  onView: (item: any) => void;
}) {
  const navigate = useNavigate();

  const [laptops,       setLaptops]       = useState<any[]>([]);
  const [stats,         setStats]         = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [brandFilter,   setBrandFilter]   = useState("all");
  const [condFilter,    setCondFilter]    = useState("all");
  const [warrantyFilter,setWarrantyFilter]= useState("all");
  const [sortBy,        setSortBy]        = useState("created_at");
  const [sortDir,       setSortDir]       = useState<"asc"|"desc">("desc");
  const [page,          setPage]          = useState(1);
  const [selectedIds,   setSelectedIds]   = useState<number[]>([]);
  const [viewMode,      setViewMode]      = useState<"table"|"card">("table");

  /* History drawer state */
  const [drawerLaptop,  setDrawerLaptop]  = useState<any>(null);
  const [drawerHistory, setDrawerHistory] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const PAGE = 12;

  useEffect(() => { fetchAll(); }, [refreshKey]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [lr, sr] = await Promise.all([
        api.get("/inventory/laptops/"),
        api.get("/inventory/laptops/stats/"),
      ]);
      setLaptops(lr.data.results ?? lr.data);
      setStats(sr.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Open history drawer ─── */
  const openDrawer = useCallback(async (laptop: any) => {
    setDrawerLaptop(laptop);
    setDrawerHistory([]);
    setDrawerLoading(true);
    try {
      const res = await api.get(`/inventory/laptops/${laptop.id}/history/`);
      setDrawerHistory(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      setDrawerHistory([]);
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerLaptop(null);
    setDrawerHistory([]);
  }, []);

  /* ─── Derived data ─── */
  const brands = ["all", ...Array.from(new Set(laptops.map((l) => l.brand))).sort()];

  const filtered = laptops.filter((l) => {
    const q = search.toLowerCase();
    const matchQ =
      l.brand.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      l.serial_number.toLowerCase().includes(q) ||
      (l.asset_tag ?? "").toLowerCase().includes(q) ||
      (l.customer_detail?.name ?? "").toLowerCase().includes(q) ||
      (l.processor ?? "").toLowerCase().includes(q);
    const matchS = statusFilter === "all" || l.status === statusFilter;
    const matchB = brandFilter  === "all" || l.brand   === brandFilter;
    const matchC = condFilter   === "all" || l.condition === condFilter;
    const matchW = warrantyFilter === "all" ||
      (warrantyFilter === "expired" && l.warranty_expiry && new Date(l.warranty_expiry) < new Date()) ||
      (warrantyFilter === "expiring" && l.warranty_expiry && (() => {
        const d = Math.round((new Date(l.warranty_expiry).getTime() - Date.now()) / 86_400_000);
        return d >= 0 && d <= 90;
      })()) ||
      (warrantyFilter === "valid" && l.warranty_expiry && new Date(l.warranty_expiry) > new Date());
    return matchQ && matchS && matchB && matchC && matchW;
  }).sort((a, b) => {
    let va: any = a[sortBy as keyof typeof a];
    let vb: any = b[sortBy as keyof typeof b];
    if (sortBy === "price" || sortBy === "rent_per_month" || sortBy === "purchase_price") {
      va = Number(va ?? 0); vb = Number(vb ?? 0);
    } else {
      va = va ?? ""; vb = vb ?? "";
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PAGE);
  const rows       = filtered.slice((page - 1) * PAGE, page * PAGE);

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds((p) => p.filter((id) => !rows.find((r) => r.id === id)));
    else             setSelectedIds((p) => [...new Set([...p, ...rows.map((r) => r.id)])]);
  };
  const toggleSelect = (id: number) =>
    setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col ? <span style={{ fontSize: "9px", marginLeft: "3px" }}>{sortDir === "asc" ? "▲" : "▼"}</span> : null;

  /* ─── Stat pills config ─── */
  const pills = stats ? [
    { key: "all",                  label: "Total",       value: stats.total,               color: "gray"  },
    { key: "AVAILABLE",            label: "Available",   value: stats.available,           color: "green" },
    { key: "RENTED",               label: "Rented",      value: stats.rented,              color: "blue"  },
    { key: "SOLD",                 label: "Sold",        value: stats.sold,                color: "gray"  },
    { key: "UNDER_MAINTENANCE",    label: "Maintenance", value: stats.under_maintenance,   color: "amber" },
    { key: "RETURNED_TO_SUPPLIER", label: "Returned",    value: stats.returned_to_supplier,color: "coral" },
    { key: "WRITTEN_OFF",          label: "Written Off", value: stats.written_off,         color: "red"   },
  ] : [];

  /* ─── Card view item ─── */
  function LaptopCard({ l }: { l: any }) {
    const warrantyExpired = l.warranty_expiry && new Date(l.warranty_expiry) < new Date();
    return (
      <div
        style={{
          background: "#fff", border: `1px solid ${selectedIds.includes(l.id) ? C.blue.border : "#ebebeb"}`,
          borderRadius: "12px", padding: "16px", cursor: "pointer",
          transition: "box-shadow 0.15s, border-color 0.15s",
          boxShadow: selectedIds.includes(l.id) ? `0 0 0 2px ${C.blue.bg}` : "none",
        }}
        onMouseEnter={(e) => { if (!selectedIds.includes(l.id)) (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
        onMouseLeave={(e) => { if (!selectedIds.includes(l.id)) (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => toggleSelect(l.id)}
              style={{ accentColor: C.blue.solid, cursor: "pointer" }} onClick={(e) => e.stopPropagation()} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#1a1a1a" }}>{l.brand} {l.model}</div>
              <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "monospace", marginTop: "1px" }}>{l.serial_number}</div>
            </div>
          </div>
          <Badge color={STATUS_COLOR[l.status] ?? "gray"}>{STATUS_LABEL[l.status] ?? l.status}</Badge>
        </div>

        <div style={{ fontSize: "11px", color: "#888", marginBottom: "10px" }}>
          {l.processor} · {l.ram} · {l.storage}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{fmtINR(l.price)}</div>
            <div style={{ fontSize: "10px", color: "#aaa" }}>{fmtINR(l.rent_per_month)}/mo</div>
          </div>
          <Badge color={COND_COLOR[l.condition] ?? "gray"}>{l.condition}</Badge>
        </div>

        {l.customer_detail && (
          <div style={{ fontSize: "11px", color: "#555", padding: "6px 8px", background: C.blue.bg, borderRadius: "6px", marginBottom: "10px" }}>
            👤 {l.customer_detail.name}
          </div>
        )}

        {warrantyExpired && (
          <div style={{ fontSize: "11px", color: C.red.text, padding: "4px 8px", background: C.red.bg, borderRadius: "6px", marginBottom: "8px" }}>
            ⚠ Warranty expired {fmtDate(l.warranty_expiry)}
          </div>
        )}

        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <Btn size="sm" variant="ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => navigate(`/inventory/${l.id}`)}>View</Btn>
          <Btn size="sm" variant="default" style={{ flex: 1, justifyContent: "center" }} onClick={() => onEdit(l)}>Edit</Btn>
          <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDrawer(l); }} title="History">🕐</Btn>
          <ActionMenu laptop={l} onDone={fetchAll} />
        </div>
      </div>
    );
  }

  const hasActiveFilters = search || statusFilter !== "all" || brandFilter !== "all" || condFilter !== "all" || warrantyFilter !== "all";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a1a" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>Laptop Inventory</div>
          <div style={{ fontSize: "13px", color: "#999", marginTop: "2px" }}>
            {loading ? "Loading…" : `${filtered.length} laptop${filtered.length !== 1 ? "s" : ""} found`}
            {selectedIds.length > 0 && (
              <span style={{ marginLeft: "8px", color: C.blue.text, fontWeight: 500 }}>
                · {selectedIds.length} selected
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: "1px solid #ebebeb", borderRadius: "8px", overflow: "hidden" }}>
            {(["table", "card"] as const).map((v) => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{
                  padding: "6px 12px", fontSize: "12px", cursor: "pointer", border: "none",
                  background: viewMode === v ? "#1a6ef5" : "#fff",
                  color:      viewMode === v ? "#fff" : "#888",
                }}>
                {v === "table" ? "⊞ Table" : "⊟ Cards"}
              </button>
            ))}
          </div>
          <Btn variant="primary" onClick={onAddNew}>+ Add Laptop</Btn>
        </div>
      </div>

      {/* ── Stat pills ── */}
      {stats && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          {pills.map((p) => (
            <StatPill
              key={p.key}
              label={p.label}
              value={p.value}
              color={p.color}
              active={statusFilter === p.key}
              onClick={() => { setStatusFilter(p.key); setPage(1); }}
            />
          ))}
          {/* Utilization mini-bar */}
          {stats.total > 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "14px 20px", background: "#fff", border: "1px solid #ebebeb", borderRadius: "12px", minWidth: "100px",
            }}>
              <UsageBar rented={stats.rented} available={stats.available} total={stats.total} />
              <span style={{ fontSize: "10px", color: "#aaa", marginTop: "4px" }}>Utilization</span>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <Card style={{ marginBottom: "16px", padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          {/* Search */}
          <div style={{ flex: "2 1 240px", position: "relative" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", color: "#bbb" }}>🔍</span>
            <input
              placeholder="Search brand, model, serial, asset tag, processor, customer…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e0deda",
                borderRadius: "8px", fontSize: "13px", color: "#1a1a1a", background: "#fafaf8",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Status */}
          <div style={{ flex: "1 1 140px" }}>
            <Select value={statusFilter} onChange={(e: any) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="SOLD">Sold</option>
              <option value="DEMO">Demo</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
              <option value="RETURNED_TO_SUPPLIER">Returned</option>
              <option value="WRITTEN_OFF">Written Off</option>
            </Select>
          </div>

          {/* Brand */}
          <div style={{ flex: "1 1 130px" }}>
            <Select value={brandFilter} onChange={(e: any) => { setBrandFilter(e.target.value); setPage(1); }}>
              {brands.map((b) => (
                <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>
              ))}
            </Select>
          </div>

          {/* Condition */}
          <div style={{ flex: "1 1 130px" }}>
            <Select value={condFilter} onChange={(e: any) => { setCondFilter(e.target.value); setPage(1); }}>
              <option value="all">All Conditions</option>
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </Select>
          </div>

          {/* Warranty */}
          <div style={{ flex: "1 1 140px" }}>
            <Select value={warrantyFilter} onChange={(e: any) => { setWarrantyFilter(e.target.value); setPage(1); }}>
              <option value="all">All Warranties</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring (90d)</option>
              <option value="expired">Expired</option>
            </Select>
          </div>

          {/* Sort */}
          <div style={{ flex: "1 1 150px" }}>
            <Select value={sortBy} onChange={(e: any) => { setSortBy(e.target.value); setPage(1); }}>
              <option value="created_at">Sort: Date Added</option>
              <option value="brand">Sort: Brand</option>
              <option value="price">Sort: Sale Price</option>
              <option value="rent_per_month">Sort: Rent/mo</option>
              <option value="purchase_price">Sort: Cost Price</option>
              <option value="warranty_expiry">Sort: Warranty</option>
            </Select>
          </div>
        </div>

        {/* Active filter chips + clear */}
        {hasActiveFilters && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#aaa" }}>Active filters:</span>
            {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch("")} />}
            {statusFilter !== "all" && <FilterChip label={STATUS_LABEL[statusFilter] ?? statusFilter} onRemove={() => setStatusFilter("all")} />}
            {brandFilter  !== "all" && <FilterChip label={brandFilter}  onRemove={() => setBrandFilter("all")} />}
            {condFilter   !== "all" && <FilterChip label={condFilter}   onRemove={() => setCondFilter("all")} />}
            {warrantyFilter !== "all" && <FilterChip label={`Warranty: ${warrantyFilter}`} onRemove={() => setWarrantyFilter("all")} />}
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); setBrandFilter("all"); setCondFilter("all"); setWarrantyFilter("all"); setPage(1); }}
              style={{ fontSize: "11px", color: C.red.text, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
            >
              Clear all
            </button>
          </div>
        )}
      </Card>

      {/* ── Bulk action bar ── */}
      {selectedIds.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px",
          background: C.blue.bg, border: `1px solid ${C.blue.border}`, borderRadius: "10px",
          marginBottom: "12px", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: C.blue.text }}>
            {selectedIds.length} laptop{selectedIds.length !== 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
            <Btn size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Deselect all</Btn>
            <Btn size="sm" variant="ghost" onClick={() => {
              const sel = laptops.filter((l) => selectedIds.includes(l.id));
              const csv = [
                ["Asset Tag","Brand","Model","Serial","Status","Condition","Sale Price","Rent/mo","Customer"],
                ...sel.map((l) => [l.asset_tag,l.brand,l.model,l.serial_number,l.status,l.condition,l.price,l.rent_per_month,l.customer_detail?.name ?? ""])
              ].map((r) => r.join(",")).join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              a.download = "inventory_export.csv";
              a.click();
            }}>⬇ Export CSV</Btn>
          </div>
        </div>
      )}

      {/* ── Table / Card view ── */}
      <Card>
        {loading ? <Spinner /> : (
          <>
            {/* ── TABLE VIEW ── */}
            {viewMode === "table" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#fafaf8" }}>
                      {/* Checkbox column */}
                      <th style={{ padding: "9px 14px", borderBottom: "1px solid #f0eeeb", width: "36px" }}>
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                          style={{ accentColor: C.blue.solid, cursor: "pointer" }} />
                      </th>
                      {[
                        { label: "Asset / Serial", key: "brand" },
                        { label: "Specs",          key: null },
                        { label: "Condition",      key: "condition" },
                        { label: "Status",         key: "status" },
                        { label: "Assigned To",    key: null },
                        { label: "Supplier",       key: null },
                        { label: "Cost Price",     key: "purchase_price" },
                        { label: "Sale / Rent",    key: "price" },
                        { label: "Warranty",       key: "warranty_expiry" },
                        { label: "History",        key: null },
                        { label: "Actions",        key: null },
                      ].map(({ label, key }) => (
                        <th
                          key={label}
                          onClick={key ? () => handleSort(key) : undefined}
                          style={{
                            padding: "9px 14px", textAlign: "left",
                            fontSize: "11px", fontWeight: 500, color: "#999",
                            letterSpacing: "0.05em", textTransform: "uppercase",
                            borderBottom: "1px solid #f0eeeb", whiteSpace: "nowrap",
                            cursor: key ? "pointer" : "default",
                            userSelect: "none",
                            color: key && sortBy === key ? "#555" : "#999",
                          }}
                        >
                          {label}
                          {key && <SortIcon col={key} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((l) => {
                      const isSelected = selectedIds.includes(l.id);
                      return (
                        <tr
                          key={l.id}
                          style={{
                            borderBottom: "1px solid #f5f4f1", transition: "background 0.1s",
                            background: isSelected ? C.blue.bg : "transparent",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#fafaf8"; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "11px 14px" }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(l.id)}
                              style={{ accentColor: C.blue.solid, cursor: "pointer" }} />
                          </td>

                          {/* Asset / Serial */}
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ fontWeight: 500 }}>{l.brand} {l.model}</div>
                            <div style={{ fontSize: "11px", color: "#888", marginTop: "2px", fontFamily: "monospace" }}>
                              {l.serial_number}
                            </div>
                            {l.asset_tag && (
                              <div style={{ fontSize: "10px", color: "#bbb", marginTop: "1px" }}>{l.asset_tag}</div>
                            )}
                          </td>

                          {/* Specs */}
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ color: "#444" }}>{l.processor}</div>
                            <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                              Gen {l.generation} · {l.ram} · {l.storage}
                            </div>
                          </td>

                          {/* Condition */}
                          <td style={{ padding: "11px 14px" }}>
                            <Badge color={COND_COLOR[l.condition] ?? "gray"}>{l.condition}</Badge>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "11px 14px" }}>
                            <Badge color={STATUS_COLOR[l.status] ?? "gray"}>
                              {STATUS_LABEL[l.status] ?? l.status}
                            </Badge>
                          </td>

                          {/* Assigned To */}
                          <td style={{ padding: "11px 14px" }}>
                            {l.customer_detail ? (
                              <>
                                <div style={{ fontWeight: 500 }}>{l.customer_detail.name}</div>
                                <div style={{ fontSize: "11px", color: "#999" }}>{l.customer_detail.phone}</div>
                              </>
                            ) : <span style={{ color: "#ccc" }}>—</span>}
                          </td>

                          {/* Supplier */}
                          <td style={{ padding: "11px 14px", color: "#555" }}>
                            {l.supplier_name || l.purchased_from || <span style={{ color: "#ccc" }}>—</span>}
                          </td>

                          {/* Cost Price */}
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ fontWeight: 500 }}>{fmtINR(l.purchase_price)}</div>
                            {l.purchase_date && (
                              <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                                {fmtDate(l.purchase_date)}
                              </div>
                            )}
                          </td>

                          {/* Sale / Rent */}
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ fontWeight: 500 }}>{fmtINR(l.price)}</div>
                            <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
                              {fmtINR(l.rent_per_month)}/mo
                            </div>
                          </td>

                          {/* Warranty */}
                          <td style={{ padding: "11px 14px" }}>
                            <WarrantyDot expiryDate={l.warranty_expiry} />
                          </td>

                          {/* History quick-open */}
                          <td style={{ padding: "11px 14px" }}>
                            <button
                              onClick={() => openDrawer(l)}
                              title="View history"
                              style={{
                                background: "#f4f3f0", border: "none", borderRadius: "6px",
                                padding: "4px 9px", fontSize: "12px", cursor: "pointer",
                                color: "#555", transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = C.blue.bg; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#f4f3f0"; }}
                            >
                              🕐 History
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <Btn size="sm" variant="ghost" onClick={() => navigate(`/inventory/${l.id}`)}>View</Btn>
                              <Btn size="sm" variant="default" onClick={() => onEdit(l)}>Edit</Btn>
                              <ActionMenu laptop={l} onDone={fetchAll} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                          {hasActiveFilters ? "No laptops match your filters." : "No laptops found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CARD VIEW ── */}
            {viewMode === "card" && (
              <div style={{ padding: "16px" }}>
                {rows.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#bbb", padding: "48px", fontSize: "13px" }}>
                    {hasActiveFilters ? "No laptops match your filters." : "No laptops found."}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                    {rows.map((l) => <LaptopCard key={l.id} l={l} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderTop: "1px solid #f0eeeb",
                fontSize: "12px", color: "#888",
              }}>
                <span>
                  Page {page} of {totalPages} · {filtered.length} total
                  {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
                </span>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(1)}>«</Btn>
                  <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</Btn>
                  {/* Page number pills */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = page - 2 + i;
                    if (p < 1) p = i + 1;
                    if (p > totalPages) p = totalPages - (4 - i);
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        style={{
                          width: "28px", height: "28px", borderRadius: "6px", border: "none",
                          background: page === p ? "#1a6ef5" : "#f4f3f0",
                          color: page === p ? "#fff" : "#555",
                          fontSize: "12px", cursor: "pointer", fontWeight: page === p ? 600 : 400,
                        }}
                      >{p}</button>
                    );
                  })}
                  <Btn size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</Btn>
                  <Btn size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── History Drawer ── */}
      {drawerLaptop && (
        <HistoryDrawer
          laptop={drawerLaptop}
          history={drawerHistory}
          loading={drawerLoading}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}

/* ─── Filter chip ─── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "11px", padding: "2px 8px 2px 10px", borderRadius: "99px",
      background: "#fff", border: "1px solid #e0deda", color: "#555",
    }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#bbb", padding: "0 2px", lineHeight: 1 }}>✕</button>
    </span>
  );
}