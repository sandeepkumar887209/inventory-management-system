import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, RefreshCw, LayoutList, LayoutGrid,
  Download, ChevronUp, ChevronDown, MoreVertical,
  Wrench, RotateCcw, Trash2, Eye, Edit2, History,
  X, Check,
} from "lucide-react";
import api from "../../services/axios";
import {
  T, StatusBadge, ConditionBadge, Card, CardHead, Btn, SearchInput,
  Select, Table, Spinner, Pagination, fmtINR, fmtDate, fmtDateTime,
  daysDiff, Modal, ConfirmDialog, Toast, Chip,
} from "./ui";

/* ── Sort icon ── */
function SortIcon({ col, sortBy, dir }: { col: string; sortBy: string; dir: "asc" | "desc" }) {
  if (sortBy !== col) return <span style={{ color: "#ccc", fontSize: "10px", marginLeft: "2px" }}>↕</span>;
  return dir === "asc"
    ? <ChevronUp size={11} style={{ marginLeft: "2px" }} />
    : <ChevronDown size={11} style={{ marginLeft: "2px" }} />;
}

/* ── Action menu for a single laptop ── */
function ActionMenu({ laptop, onAction, onEdit, onView }: any) {
  const [open, setOpen] = useState(false);

  const items = [
    { label: "View Details",       icon: <Eye size={13} />,      action: "view" },
    { label: "Edit Laptop",        icon: <Edit2 size={13} />,    action: "edit" },
    { label: "View History",       icon: <History size={13} />,  action: "history" },
    ...(laptop.status !== "UNDER_MAINTENANCE" && laptop.status !== "SOLD" && laptop.status !== "WRITTEN_OFF"
      ? [{ label: "Send to Maintenance", icon: <Wrench size={13} />, action: "maintenance" }] : []),
    ...(laptop.status === "UNDER_MAINTENANCE"
      ? [{ label: "Mark Maintenance Done", icon: <Check size={13} />, action: "maintenanceDone" }] : []),
    ...(laptop.status !== "SOLD" && laptop.status !== "WRITTEN_OFF" && laptop.status !== "RETURNED_TO_SUPPLIER"
      ? [{ label: "Return to Supplier", icon: <RotateCcw size={13} />, action: "returnSupplier" }] : []),
    ...(laptop.status !== "WRITTEN_OFF" && laptop.status !== "SOLD" && laptop.status !== "RENTED"
      ? [{ label: "Write Off", icon: <Trash2 size={13} />, action: "writeOff", danger: true }] : []),
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          width: "28px", height: "28px", borderRadius: T.radiusSm,
          border: `1px solid ${T.border}`, background: "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: T.muted,
        }}
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 80 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 90,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: T.radius, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              minWidth: "190px", overflow: "hidden",
            }}
          >
            {items.map((item) => (
              <button
                key={item.action}
                onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(item.action, laptop); }}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 14px",
                  fontSize: "13px", border: "none", background: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "9px",
                  color: (item as any).danger ? T.red.text : T.text,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = (item as any).danger ? T.red.bg : T.bg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                <span style={{ color: (item as any).danger ? T.red.text : T.muted }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── History drawer ── */
function HistoryDrawer({ laptop, onClose, onNavigate }: any) {
  const [history,  setHistory]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  const ACTION_ICONS: Record<string, string> = {
    ADDED: "📦", RENTED_OUT: "🔑", RETURNED: "✅",
    SOLD: "💰", SENT_FOR_MAINTENANCE: "🔧", MAINTENANCE_DONE: "✅",
    RETURNED_TO_SUPPLIER: "↩️", WRITTEN_OFF: "🗑️",
    STATUS_CHANGED: "🔄", SPECS_UPDATED: "✏️",
  };

  useEffect(() => {
    api.get(`/inventory/laptops/${laptop.id}/history/`)
      .then((r) => setHistory(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [laptop.id]);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 150 }}
      />
      <div
        style={{
          position: "fixed", top: 0, right: 0, height: "100vh", width: "400px",
          background: T.surface, zIndex: 160,
          boxShadow: "-4px 0 30px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            padding: "18px 20px", borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: T.text }}>
              {laptop.brand} {laptop.model}
            </div>
            <div style={{ fontSize: "11px", color: T.muted, fontFamily: "monospace", marginTop: "2px" }}>
              {laptop.serial_number}
            </div>
            <div style={{ marginTop: "8px" }}>
              <StatusBadge status={laptop.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "30px", height: "30px", borderRadius: T.radiusSm,
              border: `1px solid ${T.border}`, background: T.bg,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: T.muted, fontSize: "14px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Quick stats */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          {[
            { label: "Sale Price",  value: fmtINR(laptop.price) },
            { label: "Rent/mo",     value: fmtINR(laptop.rent_per_month) },
            { label: "Purchase",    value: fmtINR(laptop.purchase_price) },
            { label: "Company Cost",value: fmtINR(laptop.cost_to_company) },
           ].map(({ label, value }) => (
            <div key={label} style={{ padding: "10px 14px", textAlign: "center", borderRight: `1px solid ${T.border}` }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: T.text }}>{value}</div>
              <div style={{ fontSize: "10px", color: T.muted, marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* History list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px" }}>
            Lifecycle History ({history.length})
          </div>
          {loading ? (
            <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>Loading…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>No history recorded</div>
          ) : (
            history.map((h, i) => (
              <div key={h.id ?? i} style={{ display: "flex", gap: "12px", paddingBottom: "18px", position: "relative" }}>
                {i < history.length - 1 && (
                  <div
                    style={{
                      position: "absolute", left: "13px", top: "28px",
                      width: "1px", height: "calc(100% - 8px)", background: T.border,
                    }}
                  />
                )}
                <div
                  style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: T.blue.bg, border: `1px solid ${T.blue.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", flexShrink: 0, zIndex: 1,
                  }}
                >
                  {ACTION_ICONS[h.action] || "🔄"}
                </div>
                <div style={{ flex: 1, paddingTop: "3px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: T.text }}>
                      {h.action_label || h.action?.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: "10px", color: "#c0bbb5", whiteSpace: "nowrap" }}>
                      {h.date || (h.created_at ? new Date(h.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "")}
                    </span>
                  </div>
                  {h.from_status && h.to_status && (
                    <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>
                      {h.from_status} → <span style={{ color: T.primary }}>{h.to_status}</span>
                    </div>
                  )}
                  {(h.customer_detail?.name || h.customer_name) && (
                    <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>
                      👤 {h.customer_detail?.name || h.customer_name}
                    </div>
                  )}
                  {h.remarks && (
                    <div
                      style={{
                        fontSize: "11px", color: T.text, marginTop: "4px",
                        fontStyle: "italic", background: T.bg, padding: "4px 8px",
                        borderRadius: T.radiusSm, borderLeft: `2px solid ${T.border}`,
                      }}
                    >
                      {h.remarks}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: "8px" }}>
          <Btn variant="primary" size="sm" onClick={() => { onClose(); onNavigate(`/inventory/${laptop.id}`); }}>
            Full Detail →
          </Btn>
          <Btn variant="secondary" size="sm" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </>
  );
}

/* ── Card view item ── */
function LaptopCard({ laptop, onAction, onNavigate }: any) {
  return (
    <div
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radius, padding: "16px",
        cursor: "pointer", transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
      onClick={() => onNavigate(`/inventory/${laptop.id}`)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "13px", color: T.text }}>{laptop.brand} {laptop.model}</div>
          <div style={{ fontSize: "10px", color: T.muted, fontFamily: "monospace", marginTop: "2px" }}>
            {laptop.serial_number}
          </div>
        </div>
        <StatusBadge status={laptop.status} />
      </div>

      <div style={{ fontSize: "11px", color: T.muted, marginBottom: "12px" }}>
        {laptop.processor} · {laptop.ram} · {laptop.storage}
        {laptop.gpu && ` · ${laptop.gpu}`}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: T.text }}>{fmtINR(laptop.price)}</div>
          <div style={{ fontSize: "10px", color: T.muted }}>{fmtINR(laptop.rent_per_month)}/mo</div>
        </div>
        <ConditionBadge condition={laptop.condition} />
      </div>

      {laptop.customer_detail && (
        <div
          style={{
            fontSize: "11px", color: T.blue.text, padding: "5px 8px",
            background: T.blue.bg, borderRadius: T.radiusSm, marginBottom: "10px",
          }}
        >
          👤 {laptop.customer_detail.name}
        </div>
      )}

      {laptop.warranty_expiry && (() => {
        const d = daysDiff(laptop.warranty_expiry);
        if (d !== null && d < 0) {
          return (
            <div style={{ fontSize: "11px", color: T.red.text, padding: "5px 8px", background: T.red.bg, borderRadius: T.radiusSm, marginBottom: "10px" }}>
              ⚠ Warranty expired {Math.abs(d)}d ago
            </div>
          );
        }
        return null;
      })()}

      <div style={{ display: "flex", gap: "6px" }}>
        <Btn
          variant="secondary" size="sm"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={(e) => { e.stopPropagation(); onAction("edit", laptop); }}
        >
          Edit
        </Btn>
        <Btn
          variant="secondary" size="sm"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={(e) => { e.stopPropagation(); onAction("history", laptop); }}
        >
          History
        </Btn>
        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu laptop={laptop} onAction={onAction} onEdit={() => onAction("edit", laptop)} onView={() => onAction("view", laptop)} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const PAGE_SIZE = 12;
const STATUS_FILTERS = [
  { key: "ALL",                  label: "All"         },
  { key: "AVAILABLE",            label: "Available"   },
  { key: "RENTED",               label: "Rented"      },
  { key: "DEMO",                 label: "Demo"        },
  { key: "UNDER_MAINTENANCE",    label: "Maintenance" },
  { key: "SOLD",                 label: "Sold"        },
  { key: "RETURNED_TO_SUPPLIER", label: "Returned"    },
  { key: "WRITTEN_OFF",          label: "Written Off" },
];

export function InventoryList({
  onAddNew, onEdit,
}: {
  onAddNew: () => void;
  onEdit: (laptop: any) => void;
}) {
  const navigate = useNavigate();
  const [laptops,    setLaptops]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState("ALL");
  const [brand,      setBrand]      = useState("ALL");
  const [condition,  setCondition]  = useState("ALL");
  const [sortBy,     setSortBy]     = useState("created_at");
  const [sortDir,    setSortDir]    = useState<"asc"|"desc">("desc");
  const [page,       setPage]       = useState(1);
  const [viewMode,   setViewMode]   = useState<"table"|"card">("table");
  const [selected,   setSelected]   = useState<Set<number>>(new Set());
  const [drawerLap,  setDrawerLap]  = useState<any>(null);
  const [confirm,    setConfirm]    = useState<any>(null);
  const [toast,      setToast]      = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/laptops/");
      setLaptops(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Brands ── */
  const brands = ["ALL", ...Array.from(new Set(laptops.map((l) => l.brand))).sort()];

  /* ── Filtering + sorting ── */
  const filtered = laptops
    .filter((l) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        l.brand.toLowerCase().includes(q) ||
        l.model.toLowerCase().includes(q) ||
        l.serial_number.toLowerCase().includes(q) ||
        (l.asset_tag || "").toLowerCase().includes(q) ||
        (l.customer_detail?.name || "").toLowerCase().includes(q) ||
        (l.processor || "").toLowerCase().includes(q);
      const matchS = status === "ALL" || l.status === status;
      const matchB = brand === "ALL" || l.brand === brand;
      const matchC = condition === "ALL" || l.condition === condition;
      return matchQ && matchS && matchB && matchC;
    })
    .sort((a, b) => {
      let va = (a as any)[sortBy] ?? "";
      let vb = (b as any)[sortBy] ?? "";
      if (["price", "rent_per_month", "purchase_price"].includes(sortBy)) {
        va = Number(va); vb = Number(vb);
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Selection ── */
  const allSelected = paginated.length > 0 && paginated.every((r) => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); paginated.forEach((r) => n.delete(r.id)); return n; });
    } else {
      setSelected((s) => { const n = new Set(s); paginated.forEach((r) => n.add(r.id)); return n; });
    }
  };
  const toggleOne = (id: number) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  /* ── Sort toggle ── */
  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  /* ── Action handler ── */
  const handleAction = async (action: string, laptop: any) => {
    if (action === "view") { navigate(`/inventory/${laptop.id}`); return; }
    if (action === "edit") { onEdit(laptop); return; }
    if (action === "history") { setDrawerLap(laptop); return; }

    const endpointMap: Record<string, string> = {
      maintenance:     "send-maintenance",
      maintenanceDone: "return-from-maintenance",
      returnSupplier:  "return-to-supplier",
      writeOff:        "write-off",
    };

    const endpoint = endpointMap[action];
    if (!endpoint) return;

    if (action === "writeOff") {
      setConfirm({
        title: "Write Off Laptop",
        message: `Are you sure you want to write off ${laptop.brand} ${laptop.model}? This cannot be undone.`,
        confirmLabel: "Write Off",
        onConfirm: () => performAction(laptop.id, endpoint),
      });
      return;
    }

    performAction(laptop.id, endpoint);
  };

  const performAction = async (id: number, endpoint: string, remarks = "") => {
    setConfirm(null);
    try {
      setActionLoading(true);
      await api.post(`/inventory/laptops/${id}/${endpoint}/`, { remarks });
      showToast("Action completed successfully");
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  /* ── CSV Export ── */
  const exportCSV = () => {
    const selectedLaps = laptops.filter((l) => selected.has(l.id));
    const rows = selectedLaps.length > 0 ? selectedLaps : filtered;
    const headers = ["Asset Tag","Brand","Model","Serial","Processor","RAM","Storage","GPU","Status","Condition","Sale Price","Rent/mo","Purchase Price","Cost to Company","Customer","Added"];
    const csv = [
      headers.join(","),
      ...rows.map((l) => [
        l.asset_tag, l.brand, l.model, l.serial_number, l.processor, l.ram, l.storage, l.gpu || "",
        l.status, l.condition, l.price, l.rent_per_month, l.purchase_price || "", l.cost_to_company || "",
        l.customer_detail?.name || "", l.created_at?.split("T")[0] || "",
      ].map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  /* ── Th sort header ── */
  const Th = ({ col, label }: { col: string; label: string }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: "9px 14px", textAlign: "left",
        fontSize: "11px", fontWeight: 600, color: sortBy === col ? T.primary : T.muted,
        letterSpacing: "0.06em", textTransform: "uppercase",
        borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
        cursor: "pointer", userSelect: "none",
      }}
    >
      {label}
      <SortIcon col={col} sortBy={sortBy} dir={sortDir} />
    </th>
  );

  const hasFilters = search || status !== "ALL" || brand !== "ALL" || condition !== "ALL";

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      {drawerLap && (
        <HistoryDrawer
          laptop={drawerLap}
          onClose={() => setDrawerLap(null)}
          onNavigate={navigate}
        />
      )}

      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: T.text, margin: 0 }}>
            All Laptops
          </h1>
          <p style={{ fontSize: "13px", color: T.muted, marginTop: "4px" }}>
            {filtered.length} laptop{filtered.length !== 1 ? "s" : ""}
            {selected.size > 0 && ` · ${selected.size} selected`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, overflow: "hidden" }}>
            {(["table", "card"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                style={{
                  padding: "7px 12px", border: "none", cursor: "pointer",
                  background: viewMode === v ? T.primary : T.surface,
                  color: viewMode === v ? "#fff" : T.muted, fontSize: "12px",
                  display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                {v === "table" ? <LayoutList size={14} /> : <LayoutGrid size={14} />}
              </button>
            ))}
          </div>
          <Btn variant="secondary" icon={<RefreshCw size={13} />} onClick={load}>
            Refresh
          </Btn>
          <Btn variant="primary" icon={<Plus size={14} />} onClick={onAddNew}>
            Add Laptop
          </Btn>
        </div>
      </div>

      {/* ── Status filter chips ── */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {STATUS_FILTERS.map((f) => {
          const count = f.key === "ALL" ? laptops.length : laptops.filter((l) => l.status === f.key).length;
          const active = status === f.key;
          return (
            <button
              key={f.key}
              onClick={() => { setStatus(f.key); setPage(1); }}
              style={{
                padding: "5px 14px", borderRadius: "99px",
                border: active ? "none" : `1px solid ${T.border}`,
                background: active ? T.primary : T.surface,
                color: active ? "#fff" : T.muted,
                fontSize: "12px", fontWeight: active ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              {f.label}
              <span
                style={{
                  fontSize: "10px", fontWeight: 600,
                  background: active ? "rgba(255,255,255,0.25)" : T.bg,
                  color: active ? "#fff" : T.muted,
                  padding: "1px 6px", borderRadius: "99px",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <Card style={{ marginBottom: "16px" }}>
        <div
          style={{
            padding: "12px 16px", display: "flex", gap: "10px",
            flexWrap: "wrap", alignItems: "center",
          }}
        >
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search brand, model, serial, asset tag, customer…"
            style={{ flex: "2 1 240px" }}
          />
          <Select
            value={brand}
            onChange={(v) => { setBrand(v); setPage(1); }}
            style={{ flex: "1 1 130px" }}
          >
            {brands.map((b) => (
              <option key={b} value={b}>{b === "ALL" ? "All Brands" : b}</option>
            ))}
          </Select>
          <Select
            value={condition}
            onChange={(v) => { setCondition(v); setPage(1); }}
            style={{ flex: "1 1 140px" }}
          >
            <option value="ALL">All Conditions</option>
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(v) => { setSortBy(v); setPage(1); }}
            style={{ flex: "1 1 160px" }}
          >
            <option value="created_at">Sort: Date Added</option>
            <option value="brand">Sort: Brand</option>
            <option value="price">Sort: Sale Price</option>
            <option value="rent_per_month">Sort: Rent/mo</option>
            <option value="purchase_price">Sort: Cost Price</option>
            <option value="warranty_expiry">Sort: Warranty</option>
          </Select>
          {hasFilters && (
            <Btn
              variant="ghost" size="sm" icon={<X size={12} />}
              onClick={() => { setSearch(""); setStatus("ALL"); setBrand("ALL"); setCondition("ALL"); setPage(1); }}
            >
              Clear
            </Btn>
          )}
        </div>
      </Card>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 16px", marginBottom: "12px",
            background: T.blue.bg, border: `1px solid ${T.blue.border}`,
            borderRadius: T.radius, flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 500, color: T.blue.text }}>
            {selected.size} laptop{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
            <Btn variant="secondary" size="sm" onClick={() => setSelected(new Set())}>Deselect All</Btn>
            <Btn
              variant="secondary" size="sm" icon={<Download size={12} />}
              onClick={exportCSV}
            >
              Export CSV
            </Btn>
          </div>
        </div>
      )}

      {/* ── Table / Card ── */}
      {loading ? (
        <Card><Spinner /></Card>
      ) : viewMode === "table" ? (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {/* Checkbox */}
                  <th style={{ padding: "9px 14px", borderBottom: `1px solid ${T.border}`, width: "36px" }}>
                    <input
                      type="checkbox" checked={allSelected} onChange={toggleAll}
                      style={{ accentColor: T.primary, cursor: "pointer" }}
                    />
                  </th>
                  <Th col="brand"          label="Laptop" />
                  <Th col="processor"      label="Specs" />
                  <Th col="condition"      label="Condition" />
                  <Th col="status"         label="Status" />
                  <th style={{ padding: "9px 14px", borderBottom: `1px solid ${T.border}`, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Assigned To
                  </th>
                  <Th col="price"          label="Sale / Rent" />
                  <Th col="purchase_price" label="Cost" />
                  <Th col="warranty_expiry"label="Warranty" />
                  <th style={{ padding: "9px 14px", borderBottom: `1px solid ${T.border}`, width: "100px" }} />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{ padding: "48px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}
                    >
                      {hasFilters ? "No laptops match your filters." : "No laptops found."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((l) => {
                    const isSelected = selected.has(l.id);
                    const wDays = l.warranty_expiry ? daysDiff(l.warranty_expiry) : null;
                    const wExpired = wDays !== null && wDays < 0;
                    const wExpiring = wDays !== null && wDays >= 0 && wDays <= 30;
                    return (
                      <tr
                        key={l.id}
                        style={{
                          borderBottom: `1px solid ${T.border}`,
                          background: isSelected ? T.blue.bg : "transparent",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = T.bg; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "11px 14px" }}>
                          <input
                            type="checkbox" checked={isSelected}
                            onChange={() => toggleOne(l.id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ accentColor: T.primary, cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ fontWeight: 600, color: T.text }}>{l.brand} {l.model}</div>
                          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "monospace", marginTop: "2px" }}>
                            {l.serial_number}
                          </div>
                          {l.asset_tag && (
                            <div style={{ fontSize: "10px", color: "#c0bbb5", marginTop: "1px" }}>{l.asset_tag}</div>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ color: T.text }}>{l.processor}</div>
                            <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>
                              Gen {l.generation} · {l.ram} · {l.storage}
                            </div>
                            {l.gpu && (
                              <div style={{ fontSize: "11px", color: T.muted, marginTop: "2px" }}>
                                🎮 {l.gpu}
                              </div>
                            )}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <ConditionBadge condition={l.condition} />
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <StatusBadge status={l.status} />
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {l.customer_detail ? (
                            <>
                              <div style={{ fontWeight: 500, fontSize: "13px", color: T.text }}>
                                {l.customer_detail.name}
                              </div>
                              <div style={{ fontSize: "11px", color: T.muted }}>
                                {l.customer_detail.phone}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: "#c0bbb5" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ fontWeight: 600, fontSize: "13px", color: T.text }}>{fmtINR(l.price)}</div>
                          <div style={{ fontSize: "11px", color: T.muted }}>{fmtINR(l.rent_per_month)}/mo</div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: "13px" }}>
                          <div style={{ color: T.muted }}>{fmtINR(l.purchase_price)}</div>
                          {l.cost_to_company && (
                            <div style={{ fontSize: "11px", color: T.text }}>
                              Company: {fmtINR(l.cost_to_company)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {l.warranty_expiry ? (
                            <span
                              style={{
                                fontSize: "11px", fontWeight: 500,
                                color: wExpired ? T.red.text : wExpiring ? T.amber.text : T.available.text,
                                background: wExpired ? T.red.bg : wExpiring ? T.amber.bg : T.available.bg,
                                padding: "2px 7px", borderRadius: "99px",
                              }}
                            >
                              {wExpired ? `⚠ Exp. ${fmtDate(l.warranty_expiry)}` : fmtDate(l.warranty_expiry)}
                            </span>
                          ) : (
                            <span style={{ color: "#c0bbb5" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <Btn
                              variant="ghost" size="sm"
                              onClick={(e) => { e.stopPropagation(); setDrawerLap(l); }}
                            >
                              History
                            </Btn>
                            <Btn
                              variant="secondary" size="sm"
                              onClick={(e) => { e.stopPropagation(); onEdit(l); }}
                            >
                              Edit
                            </Btn>
                            <div onClick={(e) => e.stopPropagation()}>
                              <ActionMenu laptop={l} onAction={handleAction} onEdit={onEdit} onView={(la: any) => navigate(`/inventory/${la.id}`)} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </Card>
      ) : (
        /* ── Card Grid ── */
        <div>
          {paginated.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}>
              {hasFilters ? "No laptops match your filters." : "No laptops found."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {paginated.map((l) => (
                <LaptopCard key={l.id} laptop={l} onAction={handleAction} onNavigate={navigate} />
              ))}
            </div>
          )}
          <div style={{ marginTop: "16px" }}>
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}