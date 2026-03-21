import React, { useEffect, useState } from "react";
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

/* ─── Stat pill ─── */
function StatPill({ label, value, color, active, onClick }) {
  const c = C[color] ?? C.gray;
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

/* ─── Action menu ─── */
function ActionMenu({ laptop, onDone }) {
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
  const canMaintenance   = !["UNDER_MAINTENANCE","RETURNED_TO_SUPPLIER","WRITTEN_OFF","SOLD","RENTED"].includes(s);
  const canEndMaintenance = s === "UNDER_MAINTENANCE";
  const canReturn        = !["RETURNED_TO_SUPPLIER","WRITTEN_OFF","SOLD","RENTED"].includes(s);
  const canWriteOff      = !["WRITTEN_OFF","SOLD","RENTED"].includes(s);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Btn
        size="sm"
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
      >
        ···
      </Btn>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position:     "absolute",
            right:        0,
            top:          "calc(100% + 6px)",
            zIndex:       100,
            background:   "#fff",
            border:       "1px solid #ebebeb",
            borderRadius: "10px",
            boxShadow:    "0 8px 24px rgba(0,0,0,0.10)",
            minWidth:     "190px",
            overflow:     "hidden",
          }}>
            {canMaintenance && (
              <MenuItem label="🔧 Send for Maintenance" onClick={() => doAction("send-maintenance","Reason (optional):")} />
            )}
            {canEndMaintenance && (
              <MenuItem label="✅ Return from Maintenance" onClick={() => doAction("return-from-maintenance","Remarks (optional):")} />
            )}
            {canReturn && (
              <MenuItem label="↩ Return to Supplier" onClick={() => doAction("return-to-supplier","Reason:")} />
            )}
            {canWriteOff && (
              <MenuItem label="🗑 Write Off" danger onClick={() => doAction("write-off","Reason (required):")} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        width:      "100%",
        textAlign:  "left",
        padding:    "9px 14px",
        fontSize:   "13px",
        color:      danger ? "#991b1b" : "#1a1a1a",
        background: "none",
        border:     "none",
        cursor:     "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "#fff0f0" : "#fafaf8"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
    >
      {label}
    </button>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export function InventoryList({ refreshKey, onAddNew, onEdit, onView }) {
  const navigate = useNavigate();

  const [laptops,      setLaptops]      = useState<any[]>([]);
  const [stats,        setStats]        = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [brandFilter,  setBrandFilter]  = useState("all");
  const [page,         setPage]         = useState(1);
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

  const brands = ["all", ...Array.from(new Set(laptops.map((l) => l.brand))).sort()];

  const filtered = laptops.filter((l) => {
    const q = search.toLowerCase();
    const matchQ =
      l.brand.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      l.serial_number.toLowerCase().includes(q) ||
      (l.asset_tag ?? "").toLowerCase().includes(q) ||
      (l.customer_detail?.name ?? "").toLowerCase().includes(q);
    const matchS = statusFilter === "all" || l.status === statusFilter;
    const matchB = brandFilter  === "all" || l.brand  === brandFilter;
    return matchQ && matchS && matchB;
  });

  const totalPages = Math.ceil(filtered.length / PAGE);
  const rows       = filtered.slice((page - 1) * PAGE, page * PAGE);

  /* ── Stat pills config ── */
  const pills = stats ? [
    { key: "all",                  label: "Total",       value: stats.total,               color: "gray"  },
    { key: "AVAILABLE",            label: "Available",   value: stats.available,           color: "green" },
    { key: "RENTED",               label: "Rented",      value: stats.rented,              color: "blue"  },
    { key: "SOLD",                 label: "Sold",        value: stats.sold,                color: "gray"  },
    { key: "UNDER_MAINTENANCE",    label: "Maintenance", value: stats.under_maintenance,   color: "amber" },
    { key: "RETURNED_TO_SUPPLIER", label: "Returned",    value: stats.returned_to_supplier,color: "coral" },
    { key: "WRITTEN_OFF",          label: "Written Off", value: stats.written_off,         color: "red"   },
  ] : [];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a1a" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>Laptop Inventory</div>
          <div style={{ fontSize: "13px", color: "#999", marginTop: "2px" }}>
            {filtered.length} laptop{filtered.length !== 1 ? "s" : ""} found
          </div>
        </div>
        <Btn variant="primary" onClick={onAddNew}>
          + Add Laptop
        </Btn>
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
        </div>
      )}

      {/* ── Filters ── */}
      <Card style={{ marginBottom: "16px", padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "2 1 240px" }}>
            <Input
              placeholder="Search brand, model, serial, asset tag, customer…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="RENTED">Rented</option>
              <option value="SOLD">Sold</option>
              <option value="DEMO">Demo</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
              <option value="RETURNED_TO_SUPPLIER">Returned to Supplier</option>
              <option value="WRITTEN_OFF">Written Off</option>
            </Select>
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <Select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}>
              {brands.map((b) => (
                <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card>
        {loading ? <Spinner /> : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#fafaf8" }}>
                    {[
                      "Asset / Serial", "Specs", "Condition", "Status",
                      "Assigned To", "Supplier", "Cost Price", "Sale / Rent",
                      "Warranty", "Actions",
                    ].map((h) => (
                      <th key={h} style={{
                        padding:       "9px 14px",
                        textAlign:     "left",
                        fontSize:      "11px",
                        fontWeight:    500,
                        color:         "#999",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        borderBottom:  "1px solid #f0eeeb",
                        whiteSpace:    "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => {
                    const warrantyExpired = l.warranty_expiry && new Date(l.warranty_expiry) < new Date();
                    return (
                      <tr
                        key={l.id}
                        style={{ borderBottom: "1px solid #f5f4f1", transition: "background 0.1s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fafaf8"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                      >
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
                          {l.warranty_expiry ? (
                            <span style={{ color: warrantyExpired ? "#991b1b" : "#166534", fontSize: "12px" }}>
                              {fmtDate(l.warranty_expiry)}
                              {warrantyExpired && " ⚠"}
                            </span>
                          ) : <span style={{ color: "#ccc" }}>—</span>}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <Btn size="sm" variant="ghost" onClick={() => navigate(`/inventory/${l.id}`)}>
                              View
                            </Btn>
                            <Btn size="sm" variant="default" onClick={() => onEdit(l)}>
                              Edit
                            </Btn>
                            <ActionMenu laptop={l} onDone={fetchAll} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                        No laptops found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                padding:        "12px 16px",
                borderTop:      "1px solid #f0eeeb",
                fontSize:       "12px",
                color:          "#888",
              }}>
                <span>Page {page} of {totalPages} · {filtered.length} total</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</Btn>
                  <Btn size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
