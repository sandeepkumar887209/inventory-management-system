import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft, Edit2, Wrench, RotateCcw, Trash2,
  History, Activity, Package, Shield, DollarSign,
  Calendar, User, Tag, Cpu, Monitor,
} from "lucide-react";
import api from "../../services/axios";
import {
  T, StatusBadge, ConditionBadge, Card, CardHead, Btn,
  InfoRow, fmtINR, fmtDate, fmtDateTime, daysDiff, Spinner, Chip, Toast,
} from "./ui";

/* ── Action config ── */
const ACTION_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  ADDED:                { icon: "📦", label: "Added to Inventory",     color: "available" },
  RENTED_OUT:           { icon: "🔑", label: "Rented Out",             color: "rented" },
  RETURNED:             { icon: "✅", label: "Returned by Customer",   color: "teal" },
  SOLD:                 { icon: "💰", label: "Sold",                   color: "sold" },
  SENT_FOR_MAINTENANCE: { icon: "🔧", label: "Sent for Maintenance",   color: "maintenance" },
  MAINTENANCE_DONE:     { icon: "✅", label: "Maintenance Done",       color: "available" },
  RETURNED_TO_SUPPLIER: { icon: "↩️", label: "Returned to Supplier",  color: "returned" },
  WRITTEN_OFF:          { icon: "🗑️", label: "Written Off",            color: "writtenoff" },
  STATUS_CHANGED:       { icon: "🔄", label: "Status Changed",         color: "neutral" },
  SPECS_UPDATED:        { icon: "✏️", label: "Specs Updated",          color: "blue" },
};

const MOVEMENT_CONFIG: Record<string, { icon: string; label: string }> = {
  IN:              { icon: "📥", label: "Stock In" },
  OUT:             { icon: "📤", label: "Rented Out" },
  RETURN:          { icon: "↩️", label: "Customer Return" },
  SOLD:            { icon: "💰", label: "Sold" },
  MAINTENANCE_OUT: { icon: "🔧", label: "To Maintenance" },
  MAINTENANCE_IN:  { icon: "✅", label: "From Maintenance" },
  SUPPLIER_RETURN: { icon: "📦", label: "To Supplier" },
  WRITTEN_OFF:     { icon: "🗑️", label: "Written Off" },
};

/* ── History timeline entry ── */
function HistoryEntry({ entry, isLast }: { entry: any; isLast: boolean }) {
  const cfg = ACTION_CONFIG[entry.action] || { icon: "🔄", label: entry.action?.replace(/_/g, " ") || "", color: "neutral" };
  const tok = (T as any)[cfg.color] || T.neutral;

  return (
    <div style={{ display: "flex", gap: "14px", position: "relative", paddingBottom: isLast ? 0 : "20px" }}>
      {!isLast && (
        <div
          style={{
            position: "absolute", left: "15px", top: "32px",
            width: "1px", height: "calc(100% - 12px)", background: T.border,
          }}
        />
      )}
      <div
        style={{
          width: "30px", height: "30px", borderRadius: "50%",
          background: tok.bg, border: `1px solid ${tok.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", flexShrink: 0, zIndex: 1,
        }}
      >
        {cfg.icon}
      </div>
      <div style={{ flex: 1, paddingTop: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>
            {entry.action_label || cfg.label}
          </span>
          <span style={{ fontSize: "11px", color: "#c0bbb5", whiteSpace: "nowrap" }}>
            {entry.date || fmtDateTime(entry.created_at)}
          </span>
        </div>

        {entry.from_status && entry.to_status && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
            <span
              style={{
                fontSize: "11px", background: T.bg, padding: "1px 7px",
                borderRadius: "99px", color: T.muted, border: `1px solid ${T.border}`,
              }}
            >
              {entry.from_status}
            </span>
            <span style={{ fontSize: "10px", color: "#c0bbb5" }}>→</span>
            <span
              style={{
                fontSize: "11px", background: tok.bg, color: tok.text,
                padding: "1px 7px", borderRadius: "99px", border: `0.5px solid ${tok.border}`,
              }}
            >
              {entry.to_status}
            </span>
          </div>
        )}

        {(entry.customer_detail?.name || entry.customer_name) && (
          <div style={{ fontSize: "11px", color: T.muted, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>👤</span>
            <span>{entry.customer_detail?.name || entry.customer_name}</span>
            {entry.customer_detail?.phone && (
              <span style={{ color: "#c0bbb5" }}>· {entry.customer_detail.phone}</span>
            )}
          </div>
        )}

        {(entry.performed_by || entry.created_by_name) && (
          <div style={{ fontSize: "11px", color: "#c0bbb5", marginTop: "2px" }}>
            By: {entry.performed_by?.name || entry.performed_by?.username || entry.created_by_name}
          </div>
        )}

        {entry.remarks && (
          <div
            style={{
              fontSize: "12px", color: T.text, marginTop: "6px",
              fontStyle: "italic", background: T.bg, padding: "6px 10px",
              borderRadius: T.radiusSm, borderLeft: `2px solid ${T.border}`,
            }}
          >
            {entry.remarks}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Action button with remarks modal ── */
function ActionButton({
  label, icon, variant, onConfirm,
}: {
  label: string; icon: React.ReactNode; variant: "secondary"|"danger"|"success";
  onConfirm: (remarks: string) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [remarks, setRemarks] = useState("");

  return (
    <>
      <Btn variant={variant} size="sm" icon={icon} onClick={() => setOpen(true)}>
        {label}
      </Btn>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: T.surface, borderRadius: "14px",
              padding: "24px", width: "400px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700, color: T.text, marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "13px", color: T.muted, marginBottom: "16px" }}>
              Add remarks (optional)
            </div>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason or notes…"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px",
                border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                fontSize: "13px", color: T.text, outline: "none",
                resize: "none", background: T.bg, boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <Btn variant="secondary" size="sm" onClick={() => { setOpen(false); setRemarks(""); }}>Cancel</Btn>
              <Btn
                variant={variant}
                size="sm"
                onClick={() => { onConfirm(remarks); setOpen(false); setRemarks(""); }}
              >
                Confirm
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export function LaptopDetail() {
  const _params   = useParams<{ id?: string }>();
  const _location = useLocation();
  // Works both inside a Route path=":id" and when rendered directly
  const id = _params.id ?? _location.pathname.split("/").filter(Boolean).pop();
  const navigate  = useNavigate();

  const [laptop,    setLaptop]    = useState<any>(null);
  const [history,   setHistory]   = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [tab,       setTab]       = useState<"history"|"movements"|"ledger">("ledger");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [toast,     setToast]     = useState<any>(null);
  const [histFilter,setHistFilter]= useState("ALL");
  
  const [rentalItems,  setRentalItems]  = useState<any[]>([]);
  const [saleItems,    setSaleItems]    = useState<any[]>([]);
  const [demoItems,    setDemoItems]    = useState<any[]>([]);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [lr, hr, mr, rentRes, saleRes, demoRes] = await Promise.allSettled([
        api.get(`/inventory/laptops/${id}/`),
        api.get(`/inventory/laptops/${id}/history/`),
        api.get(`/inventory/laptops/${id}/movements/`),
        api.get(`/rentals/rental-items/?laptop=${id}`),
        api.get(`/sales/sale-items/?laptop=${id}`),
        api.get(`/demos/demo-items/?laptop=${id}`),
      ]);
      if (lr.status === "rejected") { setError("Failed to load laptop."); return; }
      setLaptop(lr.value.data);
      if (hr.status === "fulfilled") {
        const d = hr.value.data;
        setHistory(Array.isArray(d) ? d : d.results ?? []);
      }
      if (mr.status === "fulfilled") {
        const d = mr.value.data;
        setMovements(Array.isArray(d) ? d : d.results ?? []);
      }
      if (rentRes.status === "fulfilled") {
        const d = rentRes.value.data;
        setRentalItems(Array.isArray(d) ? d : d.results ?? []);
      }
      if (saleRes.status === "fulfilled") {
        const d = saleRes.value.data;
        setSaleItems(Array.isArray(d) ? d : d.results ?? []);
      }
      if (demoRes.status === "fulfilled") {
        const d = demoRes.value.data;
        setDemoItems(Array.isArray(d) ? d : d.results ?? []);
      }
    } catch {
      setError("Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (endpoint: string, remarks: string) => {
    try {
      await api.post(`/inventory/laptops/${id}/${endpoint}/`, { remarks });
      showToast("Done successfully");
      fetchAll();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Action failed", "error");
    }
  };

  if (loading) return <Spinner message="Loading laptop details…" />;
  if (error)   return <div style={{ padding: "40px", color: T.red.text, fontSize: "14px" }}>{error}</div>;
  if (!laptop)  return <div style={{ padding: "40px", color: "#c0bbb5" }}>Laptop not found.</div>;

  const warrantyExpired = laptop.warranty_expiry && new Date(laptop.warranty_expiry) < new Date();
  const uniqueActions   = [...new Set(history.map((h) => h.action))] as string[];
  const filteredHistory = histFilter === "ALL" ? history : history.filter((h) => h.action === histFilter);

  /* ── Movement summary ── */
  const movCounts: Record<string, number> = {};
  movements.forEach((m) => { movCounts[m.movement_type] = (movCounts[m.movement_type] || 0) + 1; });

  return (
    <div style={{ fontFamily: "inherit" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Back ── */}
      <button
        onClick={() => navigate("/inventory/list")}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          fontSize: "13px", color: T.muted, background: "none",
          border: "none", cursor: "pointer", marginBottom: "18px", padding: 0,
        }}
      >
        <ChevronLeft size={16} /> Back to Inventory
      </button>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: "22px", gap: "16px", flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: T.text, margin: 0 }}>
            {laptop.brand} {laptop.model}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            <StatusBadge status={laptop.status} />
            <ConditionBadge condition={laptop.condition} />
            {laptop.asset_tag && (
              <span
                style={{
                  fontSize: "11px", fontFamily: "monospace",
                  background: T.bg, padding: "2px 8px", borderRadius: "99px",
                  border: `1px solid ${T.border}`, color: T.muted,
                }}
              >
                {laptop.asset_tag}
              </span>
            )}
            <span
              style={{
                fontSize: "11px", fontFamily: "monospace",
                background: T.bg, padding: "2px 8px", borderRadius: "99px",
                border: `1px solid ${T.border}`, color: T.muted,
              }}
            >
              {laptop.serial_number}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {laptop.status !== "UNDER_MAINTENANCE" && laptop.status !== "SOLD" && laptop.status !== "WRITTEN_OFF" && (
            <ActionButton
              label="Send to Maintenance"
              icon={<Wrench size={13} />}
              variant="secondary"
              onConfirm={(r) => performAction("send-maintenance", r)}
            />
          )}
          {laptop.status === "UNDER_MAINTENANCE" && (
            <ActionButton
              label="Mark Done"
              icon={<Activity size={13} />}
              variant="success"
              onConfirm={(r) => performAction("return-from-maintenance", r)}
            />
          )}
          {laptop.status !== "SOLD" && laptop.status !== "WRITTEN_OFF" && laptop.status !== "RETURNED_TO_SUPPLIER" && (
            <ActionButton
              label="Return to Supplier"
              icon={<RotateCcw size={13} />}
              variant="secondary"
              onConfirm={(r) => performAction("return-to-supplier", r)}
            />
          )}
          {laptop.status !== "WRITTEN_OFF" && laptop.status !== "SOLD" && laptop.status !== "RENTED" && (
            <ActionButton
              label="Write Off"
              icon={<Trash2 size={13} />}
              variant="danger"
              onConfirm={(r) => performAction("write-off", r)}
            />
          )}
          <Btn
            variant="primary" size="sm" icon={<Edit2 size={13} />}
            onClick={() => navigate("/inventory/list", { state: { editId: laptop.id } })}
          >
            Edit
          </Btn>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {/* Specs */}
        <Card>
          <CardHead title="Specifications" icon={<Cpu size={15} />} />
          <div style={{ padding: "8px 18px 14px" }}>
            <InfoRow label="Processor"    value={laptop.processor} />
            <InfoRow label="Generation"   value={laptop.generation} />
            <InfoRow label="RAM"          value={laptop.ram} />
            <InfoRow label="Storage"      value={laptop.storage} />
            <InfoRow label="GPU" value={laptop.gpu || "—"} />
            <InfoRow label="Display Size" value={laptop.display_size} />
            <InfoRow label="OS"           value={laptop.os} />
            <InfoRow label="Color"        value={laptop.color} />
          </div>
        </Card>

        {/* Purchase */}
        <Card>
          <CardHead title="Purchase Details" icon={<Tag size={15} />} />
          <div style={{ padding: "8px 18px 14px" }}>
            <InfoRow label="Supplier"      value={laptop.supplier_detail?.name || laptop.purchased_from} />
            <InfoRow label="Purchase Date" value={fmtDate(laptop.purchase_date)} />
            <InfoRow label="Cost Price"    value={fmtINR(laptop.purchase_price)} />
            <InfoRow label="Invoice No."   value={laptop.invoice_number} />
            <InfoRow
              label="Warranty"
              value={
                laptop.warranty_expiry ? (
                  <span
                    style={{
                      color: warrantyExpired ? T.red.text : T.available.text,
                      fontWeight: 500,
                    }}
                  >
                    {fmtDate(laptop.warranty_expiry)}
                    {warrantyExpired ? " ⚠ Expired" : ""}
                  </span>
                ) : null
              }
            />
            <InfoRow label="Added On"      value={fmtDate(laptop.created_at)} />
          </div>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHead title="Pricing & Assignment" icon={<DollarSign size={15} />} />
          <div style={{ padding: "8px 18px 14px" }}>
            <InfoRow label="Sale Price"       value={fmtINR(laptop.price)} />
            <InfoRow label="Rent / Month"     value={fmtINR(laptop.rent_per_month)} />
            <InfoRow label="Cost Price"       value={fmtINR(laptop.purchase_price)} />
            <InfoRow label="Cost to Company" value={laptop.cost_to_company ? fmtINR(laptop.cost_to_company) : "—"} />
            {laptop.customer_detail && (
              <>
                <InfoRow label="Assigned To"   value={laptop.customer_detail.name} />
                <InfoRow label="Customer Phone" value={laptop.customer_detail.phone} />
              </>
            )}
          </div>
          {laptop.internal_notes && (
            <div
              style={{
                margin: "0 14px 14px",
                padding: "10px 12px",
                background: T.amber.bg,
                border: `0.5px solid ${T.amber.border}`,
                borderRadius: T.radiusSm,
                fontSize: "12px",
                color: T.amber.text,
              }}
            >
              <strong>Note:</strong> {laptop.internal_notes}
            </div>
          )}
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Card>
        {/* Tab bar */}
        <div
          style={{
            display: "flex", borderBottom: `1px solid ${T.border}`, paddingLeft: "4px",
          }}
        >
          {[
            { key: "ledger",    label: "Laptop Ledger",    count: rentalItems.length + saleItems.length + demoItems.length + (saleItems.find((s:any) => s.sale_status === "RETURNED") ? 1 : 0) + (demoItems.find((d:any) => ["RETURNED", "CONVERTED_RENTAL", "CONVERTED_SALE"].includes(d.demo_status)) ? 1 : 0) + (rentalItems.find((r:any) => r.rental_status === "RETURNED") ? 1 : 0), icon: <Package size={14} /> },
            { key: "history",   label: "Lifecycle History", count: history.length,   icon: <History size={14} /> },
            { key: "movements", label: "Stock Movements",  count: movements.length, icon: <Activity size={14} /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "12px 18px", border: "none", background: "transparent",
                cursor: "pointer", fontSize: "13px", fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? T.primary : T.muted,
                borderBottom: tab === t.key ? `2px solid ${T.primary}` : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t.icon}
              {t.label}
              <span
                style={{
                  fontSize: "11px",
                  background: tab === t.key ? T.blue.bg : T.bg,
                  color: tab === t.key ? T.blue.text : T.muted,
                  padding: "1px 7px", borderRadius: "99px",
                  border: `1px solid ${tab === t.key ? T.blue.border : T.border}`,
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* History tab */}
        {tab === "history" && (
          <>
            {uniqueActions.length > 1 && (
              <div
                style={{
                  display: "flex", gap: "6px", padding: "10px 18px",
                  borderBottom: `1px solid ${T.border}`, flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setHistFilter("ALL")}
                  style={{
                    fontSize: "11px", padding: "3px 10px", borderRadius: "99px",
                    cursor: "pointer", border: "none",
                    background: histFilter === "ALL" ? T.primary : T.bg,
                    color: histFilter === "ALL" ? "#fff" : T.muted,
                    fontWeight: 500,
                  }}
                >
                  All
                </button>
                {uniqueActions.map((a) => {
                  const cfg = ACTION_CONFIG[a];
                  return (
                    <button
                      key={a}
                      onClick={() => setHistFilter(a)}
                      style={{
                        fontSize: "11px", padding: "3px 10px", borderRadius: "99px",
                        cursor: "pointer", border: "none",
                        background: histFilter === a ? T.primary : T.bg,
                        color: histFilter === a ? "#fff" : T.muted,
                        fontWeight: 500,
                        display: "flex", alignItems: "center", gap: "4px",
                      }}
                    >
                      {cfg?.icon} {cfg?.label || a.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ padding: "20px 18px" }}>
              {filteredHistory.length === 0 ? (
                <div style={{ textAlign: "center", color: "#c0bbb5", padding: "32px", fontSize: "13px" }}>
                  {history.length === 0 ? "No history recorded yet." : "No events match the filter."}
                </div>
              ) : (
                filteredHistory.map((h, i) => (
                  <HistoryEntry key={h.id ?? i} entry={h} isLast={i === filteredHistory.length - 1} />
                ))
              )}
            </div>
          </>
        )}

        {/* Movements tab */}
        {tab === "movements" && (
          <>
            {movements.length > 0 && (
              <div
                style={{
                  display: "flex", gap: "8px", flexWrap: "wrap",
                  padding: "10px 18px", borderBottom: `1px solid ${T.border}`, background: T.bg,
                }}
              >
                {Object.entries(movCounts).map(([type, count]) => {
                  const cfg = MOVEMENT_CONFIG[type];
                  return (
                    <span
                      key={type}
                      style={{
                        fontSize: "11px", padding: "3px 10px", borderRadius: "99px",
                        background: T.surface, border: `1px solid ${T.border}`,
                        color: T.muted,
                      }}
                    >
                      {cfg?.icon} {cfg?.label || type} <strong style={{ color: T.text }}>{count}</strong>
                    </span>
                  );
                })}
              </div>
            )}

            {movements.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}>
                No stock movements recorded.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      {["Type","Label","Remarks","By","Date"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "9px 14px", textAlign: "left",
                            fontSize: "11px", fontWeight: 600, color: T.muted,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            borderBottom: `1px solid ${T.border}`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m, i) => {
                      const cfg = MOVEMENT_CONFIG[m.movement_type] || { icon: "📋", label: m.movement_type };
                      return (
                        <tr
                          key={m.id ?? i}
                          style={{ borderBottom: `1px solid ${T.border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bg; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                        >
                          <td style={{ padding: "11px 14px", fontSize: "16px" }}>{cfg.icon}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span
                              style={{
                                fontSize: "11px", padding: "2px 8px", borderRadius: "99px",
                                background: T.blue.bg, color: T.blue.text,
                                border: `0.5px solid ${T.blue.border}`, fontWeight: 500,
                              }}
                            >
                              {m.movement_label || cfg.label}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", color: T.muted, maxWidth: "240px", fontSize: "12px" }}>
                            {m.remarks || <span style={{ color: "#c0bbb5" }}>—</span>}
                          </td>
                          <td style={{ padding: "11px 14px", color: T.muted, fontSize: "12px" }}>
                            {m.created_by_name || "System"}
                          </td>
                          <td style={{ padding: "11px 14px", color: T.muted, fontSize: "12px", whiteSpace: "nowrap" }}>
                            {fmtDateTime(m.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}