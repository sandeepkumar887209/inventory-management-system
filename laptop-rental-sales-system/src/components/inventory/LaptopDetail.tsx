import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axios";
/* ─── Inline UI primitives (no external dependency) ─── */
const C = {
  blue:  { bg: "#eff4ff", text: "#1650b0", border: "#c7d9ff" },
  amber: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  green: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  red:   { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  gray:  { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" },
  coral: { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
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

function CardHeader({ title, right }: { title: string; right: React.ReactNode }) {
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

function Empty({ message = "Nothing here yet." }: { message?: string }) {
  return <div style={{ padding: "32px 18px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>{message}</div>;
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtINR(n?: number | string | null): string {
  if (n == null || isNaN(Number(n))) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

/* ─── Status maps ─── */
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
const ACTION_ICON: Record<string, string> = {
  ADDED:                "📦",
  RENTED_OUT:           "🔑",
  RETURNED:             "✅",
  SOLD:                 "💰",
  SENT_FOR_MAINTENANCE: "🔧",
  MAINTENANCE_DONE:     "✅",
  RETURNED_TO_SUPPLIER: "↩️",
  WRITTEN_OFF:          "🗑️",
  STATUS_CHANGED:       "🔄",
  SPECS_UPDATED:        "✏️",
};

/* ─── Info row inside cards ─── */
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

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export function LaptopDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [laptop,    setLaptop]    = useState<any>(null);
  const [history,   setHistory]   = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [tab,       setTab]       = useState<"history" | "movements">("history");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all three in parallel; history/movements use dedicated sub-routes
      const [lRes, hRes, mRes] = await Promise.allSettled([
        api.get(`/inventory/laptops/${id}/`),
        api.get(`/inventory/laptops/${id}/history/`),
        api.get(`/inventory/laptops/${id}/movements/`),
      ]);

      if (lRes.status === "rejected") {
        setError("Failed to load laptop.");
        return;
      }
      setLaptop(lRes.value.data);

      // History — gracefully handle missing endpoint
      if (hRes.status === "fulfilled") {
        const d = hRes.value.data;
        setHistory(Array.isArray(d) ? d : d.results ?? []);
      } else {
        console.warn("History endpoint error:", hRes.reason?.response?.status);
        setHistory([]);
      }

      // Movements
      if (mRes.status === "fulfilled") {
        const d = mRes.value.data;
        setMovements(Array.isArray(d) ? d : d.results ?? []);
      } else {
        console.warn("Movements endpoint error:", mRes.reason?.response?.status);
        setMovements([]);
      }
    } catch (e) {
      setError("Unexpected error loading laptop.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (error)   return <div style={{ padding: "40px", color: "#991b1b", fontSize: "14px" }}>{error}</div>;
  if (!laptop)  return <Empty message="Laptop not found." />;

  const warrantyExpired = laptop.warranty_expiry && new Date(laptop.warranty_expiry) < new Date();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a1a" }}>

      {/* ── Back ── */}
      <div style={{ marginBottom: "16px" }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
          ← Back to Inventory
        </Btn>
      </div>

      {/* ── Header ── */}
      <div style={{
        display:       "flex",
        alignItems:    "flex-start",
        justifyContent:"space-between",
        marginBottom:  "20px",
        gap:           "12px",
        flexWrap:      "wrap",
      }}>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 600 }}>
            {laptop.brand} {laptop.model}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px", flexWrap: "wrap" }}>
            <Badge color={STATUS_COLOR[laptop.status] ?? "gray"}>
              {STATUS_LABEL[laptop.status] ?? laptop.status}
            </Badge>
            {laptop.asset_tag && (
              <span style={{
                fontSize: "11px", color: "#888",
                background: "#f4f3f0", padding: "2px 8px", borderRadius: "99px",
                fontFamily: "monospace",
              }}>
                {laptop.asset_tag}
              </span>
            )}
            <span style={{
              fontSize: "11px", color: "#888",
              background: "#f4f3f0", padding: "2px 8px", borderRadius: "99px",
              fontFamily: "monospace",
            }}>
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
          <CardHeader title="Specifications" right={null} />
          <div style={{ padding: "6px 18px 12px" }}>
            <InfoRow label="Processor"    value={laptop.processor} />
            <InfoRow label="Generation"   value={laptop.generation} />
            <InfoRow label="RAM"          value={laptop.ram} />
            <InfoRow label="Storage"      value={laptop.storage} />
            <InfoRow label="Display"      value={laptop.display_size} />
            <InfoRow label="OS"           value={laptop.os} />
            <InfoRow label="Color"        value={laptop.color} />
            <InfoRow label="Condition"    value={
              <Badge color={{ NEW: "green", GOOD: "blue", FAIR: "amber", POOR: "red" }[laptop.condition] ?? "gray"}>
                {laptop.condition}
              </Badge>
            } />
          </div>
        </Card>

        {/* Purchase */}
        <Card>
          <CardHeader title="Purchase Details" right={null} />
          <div style={{ padding: "6px 18px 12px" }}>
            <InfoRow label="Supplier"       value={laptop.supplier_detail?.name ?? laptop.purchased_from} />
            <InfoRow label="Purchase Date"  value={fmtDate(laptop.purchase_date)} />
            <InfoRow label="Cost Price"     value={fmtINR(laptop.purchase_price)} />
            <InfoRow label="Invoice No."    value={laptop.invoice_number} />
            <InfoRow label="Warranty"       value={
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
          <CardHeader title="Pricing & Assignment" right={null} />
          <div style={{ padding: "6px 18px 12px" }}>
            <InfoRow label="Sale Price"      value={fmtINR(laptop.price)} />
            <InfoRow label="Rent / Month"    value={fmtINR(laptop.rent_per_month)} />
            <InfoRow label="Currently With"  value={laptop.customer_detail?.name} />
            <InfoRow label="Customer Phone"  value={laptop.customer_detail?.phone} />
            <InfoRow label="Added On"        value={fmtDate(laptop.created_at)} />
          </div>
          {laptop.internal_notes && (
            <div style={{
              margin:       "0 14px 14px",
              padding:      "10px 12px",
              background:   C.amber.bg,
              border:       `0.5px solid ${C.amber.border}`,
              borderRadius: "8px",
              fontSize:     "12px",
              color:        C.amber.text,
            }}>
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
            label="History"
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

        {/* History tab */}
        {tab === "history" && (
          <div style={{ padding: "16px 18px" }}>
            {history.length === 0 ? (
              <Empty message="No history recorded yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {history.map((h, i) => (
                  <div
                    key={h.id ?? i}
                    style={{
                      display:      "flex",
                      gap:          "14px",
                      padding:      "12px 0",
                      borderBottom: i < history.length - 1 ? "1px solid #f5f4f1" : "none",
                      alignItems:   "flex-start",
                    }}
                  >
                    {/* Icon dot */}
                    <div style={{
                      width:        "32px",
                      height:       "32px",
                      borderRadius: "50%",
                      background:   "#f4f3f0",
                      border:       "1px solid #ebebeb",
                      display:      "flex",
                      alignItems:   "center",
                      justifyContent: "center",
                      fontSize:     "15px",
                      flexShrink:   0,
                    }}>
                      {ACTION_ICON[h.action] ?? "🔄"}
                    </div>

                    <div style={{ flex: 1 }}>
                      {/* Action label + date */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>
                          {(h.action ?? "").replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: "11px", color: "#bbb", whiteSpace: "nowrap" }}>
                          {fmtDate(h.created_at)}
                        </span>
                      </div>

                      {/* Status change */}
                      {h.from_status && h.to_status && (
                        <div style={{ fontSize: "11px", color: "#999", marginTop: "3px" }}>
                          <span style={{ background: "#f4f3f0", padding: "1px 7px", borderRadius: "99px" }}>{h.from_status}</span>
                          {" → "}
                          <span style={{ background: "#f4f3f0", padding: "1px 7px", borderRadius: "99px" }}>{h.to_status}</span>
                        </div>
                      )}

                      {/* Customer */}
                      {h.customer_name && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>
                          Customer: {h.customer_name}
                        </div>
                      )}

                      {/* Remarks */}
                      {h.remarks && (
                        <div style={{
                          fontSize:     "12px",
                          color:        "#666",
                          marginTop:    "5px",
                          fontStyle:    "italic",
                          background:   "#fafaf8",
                          padding:      "6px 10px",
                          borderRadius: "6px",
                          borderLeft:   "2px solid #e0deda",
                        }}>
                          {h.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Movements tab */}
        {tab === "movements" && (
          movements.length === 0 ? (
            <Empty message="No stock movements recorded." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#fafaf8" }}>
                    {["Type", "Remarks", "By", "Date"].map((h) => (
                      <th key={h} style={{
                        padding:       "9px 14px",
                        textAlign:     "left",
                        fontSize:      "11px",
                        fontWeight:    500,
                        color:         "#999",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        borderBottom:  "1px solid #f0eeeb",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={m.id ?? i} style={{ borderBottom: "1px solid #f5f4f1" }}>
                      <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                        {(m.movement_type ?? "").replace(/_/g, " ")}
                      </td>
                      <td style={{ padding: "11px 14px", color: "#666" }}>{m.remarks || "—"}</td>
                      <td style={{ padding: "11px 14px", color: "#888" }}>{m.created_by_name || "System"}</td>
                      <td style={{ padding: "11px 14px", color: "#999" }}>{fmtDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

    </div>
  );
}