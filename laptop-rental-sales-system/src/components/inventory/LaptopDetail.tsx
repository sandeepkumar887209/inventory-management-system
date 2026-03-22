import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";

/* ─── Inline UI primitives (matches existing project style) ─── */
const C = {
  blue:  { bg: "#eff4ff", text: "#1650b0", border: "#c7d9ff" },
  amber: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  green: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  red:   { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  gray:  { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" },
  coral: { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  teal:  { bg: "#e6f7f1", text: "#0d6e50", border: "#a8e0ce" },
  purple:{ bg: "#f5f3ff", text: "#5b21b6", border: "#ddd6fe" },
};

function Badge({ color = "gray", children }: { color?: string; children: React.ReactNode }) {
  const t = (C as any)[color] ?? C.gray;
  return (
    <span style={{
      display: "inline-block", fontSize: "11px", fontWeight: 500,
      padding: "2px 9px", borderRadius: "99px",
      background: t.bg, color: t.text, border: `0.5px solid ${t.border}`, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "danger";
  size?: "sm" | "md";
}
function Btn({ variant = "default", size = "md", style, children, ...rest }: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    borderRadius: "7px", fontWeight: 500, cursor: "pointer",
    border: "1px solid transparent", transition: "background 0.15s",
    fontSize: size === "sm" ? "12px" : "13px",
    padding: size === "sm" ? "5px 12px" : "7px 16px",
  };
  const variants: Record<string, React.CSSProperties> = {
    default: { background: "#1a6ef5", color: "#fff",    border: "1px solid #1a6ef5" },
    ghost:   { background: "none",    color: "#555",    border: "1px solid #e8e7e4" },
    danger:  { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
  };
  return <button style={{ ...base, ...variants[variant], ...style }} {...rest}>{children}</button>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f0eeeb", borderRadius: "12px", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px 10px", borderBottom: "1px solid #f5f4f1" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      {right}
    </div>
  );
}

function Spinner() {
  return <div style={{ padding: "60px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>Loading…</div>;
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtINR(n?: number | string | null): string {
  if (n == null || isNaN(Number(n))) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/* ─── Status / condition maps ─── */
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
  UNDER_MAINTENANCE:     "Under Maintenance",
  RETURNED_TO_SUPPLIER:  "Returned to Supplier",
  WRITTEN_OFF:           "Written Off",
};

/* ─── History action config ─── */
const ACTION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  ADDED:                { icon: "📦", color: "green",  label: "Added to Inventory" },
  RENTED_OUT:           { icon: "🔑", color: "blue",   label: "Rented Out" },
  RETURNED:             { icon: "✅", color: "teal",   label: "Returned by Customer" },
  SOLD:                 { icon: "💰", color: "purple", label: "Sold" },
  SENT_FOR_MAINTENANCE: { icon: "🔧", color: "amber",  label: "Sent for Maintenance" },
  MAINTENANCE_DONE:     { icon: "✅", color: "green",  label: "Maintenance Completed" },
  RETURNED_TO_SUPPLIER: { icon: "↩️", color: "coral",  label: "Returned to Supplier" },
  WRITTEN_OFF:          { icon: "🗑️", color: "red",    label: "Written Off" },
  STATUS_CHANGED:       { icon: "🔄", color: "gray",   label: "Status Changed" },
  SPECS_UPDATED:        { icon: "✏️", color: "blue",   label: "Specs Updated" },
};

const MOVEMENT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  IN:              { icon: "📥", color: "green",  label: "Stock In" },
  OUT:             { icon: "📤", color: "blue",   label: "Rented Out" },
  RETURN:          { icon: "↩️", color: "teal",   label: "Returned by Customer" },
  SOLD:            { icon: "💰", color: "purple", label: "Sold" },
  MAINTENANCE_OUT: { icon: "🔧", color: "amber",  label: "Sent for Maintenance" },
  MAINTENANCE_IN:  { icon: "✅", color: "green",  label: "Back from Maintenance" },
  SUPPLIER_RETURN: { icon: "📦", color: "coral",  label: "Returned to Supplier" },
  WRITTEN_OFF:     { icon: "🗑️", color: "red",    label: "Written Off" },
};

/* ─── InfoRow ─── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f4f1" }}>
      <span style={{ fontSize: "12px", color: "#999" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#1a1a1a", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Tab button ─── */
function Tab({ label, active, count, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:      "10px 18px",
        fontSize:     "13px",
        fontWeight:   active ? 500 : 400,
        color:        active ? "#1650b0" : "#888",
        background:   "none",
        border:       "none",
        borderBottom: active ? "2px solid #1a6ef5" : "2px solid transparent",
        cursor:       "pointer",
        transition:   "all 0.15s",
        whiteSpace:   "nowrap",
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          marginLeft:   "6px",
          fontSize:     "11px",
          background:   active ? C.blue.bg : "#f0eeeb",
          color:        active ? C.blue.text : "#999",
          padding:      "1px 7px",
          borderRadius: "99px",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Timeline entry for history ─── */
function HistoryEntry({ entry, isLast }: { entry: any; isLast: boolean }) {
  const cfg = ACTION_CONFIG[entry.action] ?? { icon: "🔄", color: "gray", label: entry.action?.replace(/_/g, " ") };
  const c = (C as any)[cfg.color] ?? C.gray;

  return (
    <div style={{ display: "flex", gap: "14px", position: "relative", paddingBottom: isLast ? 0 : "20px" }}>
      {/* Vertical connector */}
      {!isLast && (
        <div style={{
          position: "absolute", left: "15px", top: "32px",
          width: "1px", height: "calc(100% - 12px)",
          background: "#f0eeeb",
        }} />
      )}

      {/* Icon bubble */}
      <div style={{
        width: "30px", height: "30px", borderRadius: "50%",
        background: c.bg, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", flexShrink: 0,
        zIndex: 1,
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingTop: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>
            {entry.action_label || cfg.label}
          </span>
          <span style={{ fontSize: "11px", color: "#bbb", whiteSpace: "nowrap" }}>
            {entry.date || fmtDateTime(entry.created_at)}
          </span>
        </div>

        {/* Status transition */}
        {entry.from_status && entry.to_status && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", background: "#f4f3f0", padding: "1px 7px", borderRadius: "99px", color: "#555" }}>
              {entry.from_status}
            </span>
            <span style={{ fontSize: "10px", color: "#bbb" }}>→</span>
            <span style={{ fontSize: "11px", background: c.bg, color: c.text, padding: "1px 7px", borderRadius: "99px", border: `0.5px solid ${c.border}` }}>
              {entry.to_status}
            </span>
          </div>
        )}

        {/* Customer info */}
        {(entry.customer_detail?.name || entry.customer_name) && (
          <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>👤</span>
            <span>{entry.customer_detail?.name || entry.customer_name}</span>
            {entry.customer_detail?.phone && (
              <span style={{ color: "#bbb" }}>· {entry.customer_detail.phone}</span>
            )}
          </div>
        )}

        {/* Performed by */}
        {(entry.performed_by || entry.created_by_name) && (
          <div style={{ fontSize: "11px", color: "#aaa", marginTop: "3px" }}>
            By: {entry.performed_by?.name || entry.performed_by?.username || entry.created_by_name}
          </div>
        )}

        {/* Reference */}
        {entry.reference_id && (
          <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
            Ref: #{entry.reference_id}
          </div>
        )}

        {/* Remarks */}
        {entry.remarks && (
          <div style={{
            fontSize: "12px", color: "#555", marginTop: "6px",
            fontStyle: "italic", background: "#fafaf8",
            padding: "6px 10px", borderRadius: "6px",
            borderLeft: "2px solid #e0deda",
          }}>
            {entry.remarks}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stats row for history summary ─── */
function HistoryStatBar({ history }: { history: any[] }) {
  const counts: Record<string, number> = {};
  history.forEach((h) => {
    const cfg = ACTION_CONFIG[h.action];
    const label = cfg?.label || h.action;
    counts[label] = (counts[label] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (sorted.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "10px 18px", borderBottom: "1px solid #f5f4f1", background: "#fafaf8" }}>
      {sorted.map(([label, count]) => (
        <span key={label} style={{
          fontSize: "11px", padding: "3px 10px", borderRadius: "99px",
          background: "#fff", border: "1px solid #e8e6e1", color: "#555",
        }}>
          {label} <strong style={{ color: "#1a1a1a" }}>{count}</strong>
        </span>
      ))}
    </div>
  );
}

/* ─── Filter bar for history ─── */
function HistoryFilter({ actions, activeFilter, onFilter }: { actions: string[]; activeFilter: string; onFilter: (a: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "6px", padding: "10px 18px", borderBottom: "1px solid #f5f4f1", flexWrap: "wrap" }}>
      <button
        onClick={() => onFilter("all")}
        style={{
          fontSize: "11px", padding: "3px 10px", borderRadius: "99px", cursor: "pointer",
          background: activeFilter === "all" ? "#1a6ef5" : "#f4f3f0",
          color: activeFilter === "all" ? "#fff" : "#555",
          border: "none", fontWeight: 500,
        }}
      >
        All
      </button>
      {actions.map((a) => {
        const cfg = ACTION_CONFIG[a];
        return (
          <button
            key={a}
            onClick={() => onFilter(a)}
            style={{
              fontSize: "11px", padding: "3px 10px", borderRadius: "99px", cursor: "pointer",
              background: activeFilter === a ? "#1a6ef5" : "#f4f3f0",
              color: activeFilter === a ? "#fff" : "#555",
              border: "none", fontWeight: 500,
              display: "flex", alignItems: "center", gap: "4px",
            }}
          >
            {cfg?.icon} {cfg?.label || a}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export function LaptopDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [laptop,        setLaptop]        = useState<any>(null);
  const [history,       setHistory]       = useState<any[]>([]);
  const [movements,     setMovements]     = useState<any[]>([]);
  const [tab,           setTab]           = useState<"history" | "movements">("history");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [lRes, hRes, mRes] = await Promise.allSettled([
        api.get(`/inventory/laptops/${id}/`),
        api.get(`/inventory/laptops/${id}/history/`),
        api.get(`/inventory/laptops/${id}/movements/`),
      ]);

      if (lRes.status === "rejected") { setError("Failed to load laptop."); return; }
      setLaptop(lRes.value.data);

      if (hRes.status === "fulfilled") {
        const d = hRes.value.data;
        setHistory(Array.isArray(d) ? d : d.results ?? []);
      } else {
        setHistory([]);
      }

      if (mRes.status === "fulfilled") {
        const d = mRes.value.data;
        setMovements(Array.isArray(d) ? d : d.results ?? []);
      } else {
        setMovements([]);
      }
    } catch {
      setError("Unexpected error loading laptop.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (error)   return <div style={{ padding: "40px", color: "#991b1b", fontSize: "14px" }}>{error}</div>;
  if (!laptop)  return <div style={{ padding: "40px", color: "#bbb" }}>Laptop not found.</div>;

  const warrantyExpired = laptop.warranty_expiry && new Date(laptop.warranty_expiry) < new Date();

  /* ── Derived history data ── */
  const uniqueActions = [...new Set(history.map((h) => h.action))];
  const filteredHistory = historyFilter === "all" ? history : history.filter((h) => h.action === historyFilter);

  /* ── Movement stats ── */
  const movementCounts: Record<string, number> = {};
  movements.forEach((m) => { movementCounts[m.movement_type] = (movementCounts[m.movement_type] || 0) + 1; });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a1a" }}>

      {/* ── Back ── */}
      <div style={{ marginBottom: "16px" }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
          ← Back to Inventory
        </Btn>
      </div>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 600 }}>
            {laptop.brand} {laptop.model}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
            <Badge color={STATUS_COLOR[laptop.status] ?? "gray"}>
              {STATUS_LABEL[laptop.status] ?? laptop.status}
            </Badge>
            {laptop.asset_tag && (
              <span style={{ fontSize: "11px", color: "#888", background: "#f4f3f0", padding: "2px 8px", borderRadius: "99px", fontFamily: "monospace" }}>
                {laptop.asset_tag}
              </span>
            )}
            <span style={{ fontSize: "11px", color: "#888", background: "#f4f3f0", padding: "2px 8px", borderRadius: "99px", fontFamily: "monospace" }}>
              {laptop.serial_number}
            </span>
          </div>
        </div>
        <Btn variant="default" onClick={() => navigate("/inventory", { state: { editLaptopId: laptop.id } })}>
          ✏️ Edit
        </Btn>
      </div>

      {/* ── Info grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px", marginBottom: "20px" }}>

        {/* Specs */}
        <Card>
          <CardHeader title="Specifications" />
          <div style={{ padding: "6px 18px 12px" }}>
            <InfoRow label="Processor"  value={laptop.processor} />
            <InfoRow label="Generation" value={laptop.generation} />
            <InfoRow label="RAM"        value={laptop.ram} />
            <InfoRow label="Storage"    value={laptop.storage} />
            <InfoRow label="Display"    value={laptop.display_size} />
            <InfoRow label="OS"         value={laptop.os} />
            <InfoRow label="Color"      value={laptop.color} />
            <InfoRow label="Condition"  value={
              <Badge color={{ NEW: "green", GOOD: "blue", FAIR: "amber", POOR: "red" }[laptop.condition] ?? "gray"}>
                {laptop.condition}
              </Badge>
            } />
          </div>
        </Card>

        {/* Purchase */}
        <Card>
          <CardHeader title="Purchase Details" />
          <div style={{ padding: "6px 18px 12px" }}>
            <InfoRow label="Supplier"      value={laptop.supplier_detail?.name ?? laptop.purchased_from} />
            <InfoRow label="Purchase Date" value={fmtDate(laptop.purchase_date)} />
            <InfoRow label="Cost Price"    value={fmtINR(laptop.purchase_price)} />
            <InfoRow label="Invoice No."   value={laptop.invoice_number} />
            <InfoRow label="Warranty"      value={
              laptop.warranty_expiry ? (
                <span style={{ color: warrantyExpired ? "#991b1b" : "#166534" }}>
                  {fmtDate(laptop.warranty_expiry)}
                  {warrantyExpired ? "  ⚠ Expired" : ""}
                </span>
              ) : null
            } />
          </div>
        </Card>

        {/* Pricing & assignment */}
        <Card>
          <CardHeader title="Pricing & Assignment" />
          <div style={{ padding: "6px 18px 12px" }}>
            <InfoRow label="Sale Price"     value={fmtINR(laptop.price)} />
            <InfoRow label="Rent / Month"   value={fmtINR(laptop.rent_per_month)} />
            <InfoRow label="Currently With" value={laptop.customer_detail?.name} />
            <InfoRow label="Customer Phone" value={laptop.customer_detail?.phone} />
            <InfoRow label="Added On"       value={fmtDate(laptop.created_at)} />
          </div>
          {laptop.internal_notes && (
            <div style={{ margin: "0 14px 14px", padding: "10px 12px", background: C.amber.bg, border: `0.5px solid ${C.amber.border}`, borderRadius: "8px", fontSize: "12px", color: C.amber.text }}>
              <strong>Note:</strong> {laptop.internal_notes}
            </div>
          )}
        </Card>
      </div>

      {/* ── History / Movements tabs ── */}
      <Card>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #f0eeeb", paddingLeft: "4px" }}>
          <Tab
            label="Lifecycle History"
            count={history.length}
            active={tab === "history"}
            onClick={() => setTab("history")}
          />
          <Tab
            label="Stock Movements"
            count={movements.length}
            active={tab === "movements"}
            onClick={() => setTab("movements")}
          />
        </div>

        {/* ── History tab ── */}
        {tab === "history" && (
          <>
            {history.length > 0 && (
              <>
                <HistoryStatBar history={history} />
                {uniqueActions.length > 1 && (
                  <HistoryFilter
                    actions={uniqueActions}
                    activeFilter={historyFilter}
                    onFilter={setHistoryFilter}
                  />
                )}
              </>
            )}

            <div style={{ padding: "20px 18px" }}>
              {filteredHistory.length === 0 ? (
                <div style={{ textAlign: "center", color: "#bbb", padding: "32px", fontSize: "13px" }}>
                  {history.length === 0 ? "No history recorded yet." : "No events match the selected filter."}
                </div>
              ) : (
                filteredHistory.map((h, i) => (
                  <HistoryEntry key={h.id ?? i} entry={h} isLast={i === filteredHistory.length - 1} />
                ))
              )}
            </div>
          </>
        )}

        {/* ── Movements tab ── */}
        {tab === "movements" && (
          <>
            {/* Movement summary chips */}
            {movements.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "10px 18px", borderBottom: "1px solid #f5f4f1", background: "#fafaf8" }}>
                {Object.entries(movementCounts).map(([type, count]) => {
                  const cfg = MOVEMENT_CONFIG[type];
                  return (
                    <span key={type} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: "#fff", border: "1px solid #e8e6e1", color: "#555" }}>
                      {cfg?.icon} {cfg?.label || type} <strong style={{ color: "#1a1a1a" }}>{count}</strong>
                    </span>
                  );
                })}
              </div>
            )}

            {movements.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                No stock movements recorded.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#fafaf8" }}>
                      {["Type", "Label", "Remarks", "By", "Date"].map((h) => (
                        <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #f0eeeb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m, i) => {
                      const cfg = MOVEMENT_CONFIG[m.movement_type] ?? { icon: "📋", color: "gray", label: m.movement_type };
                      const c = (C as any)[cfg.color] ?? C.gray;
                      return (
                        <tr key={m.id ?? i} style={{ borderBottom: "1px solid #f5f4f1" }}>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ fontSize: "16px" }}>{cfg.icon}</span>
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, fontWeight: 500 }}>
                              {m.movement_label || cfg.label}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#666", maxWidth: "240px" }}>
                            {m.remarks || <span style={{ color: "#ccc" }}>—</span>}
                          </td>
                          <td style={{ padding: "11px 14px", color: "#888", fontSize: "12px" }}>
                            {m.created_by_name || "System"}
                          </td>
                          <td style={{ padding: "11px 14px", color: "#999", fontSize: "12px", whiteSpace: "nowrap" }}>
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