import React from "react";

/* ─── Design tokens ─── */
export const C = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  teal:   { bg: "#e6f7f1", text: "#0d6e50", border: "#a8e0ce", solid: "#1aad80" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
  coral:  { bg: "#fff2ed", text: "#8f3a1a", border: "#ffc9b0", solid: "#e5622a" },
};

/* ─── Badge ─── */
export function Badge({ children, color = "gray" }) {
  const c = C[color];
  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        padding:       "3px 9px",
        borderRadius:  "99px",
        fontSize:      "11px",
        fontWeight:    500,
        background:    c.bg,
        color:         c.text,
        border:        `0.5px solid ${c.border}`,
        whiteSpace:    "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function statusBadge(status) {
  const map = {
    ONGOING:  { label: "Ongoing",  color: "blue"  },
    RETURNED: { label: "Returned", color: "teal"  },
    REPLACED: { label: "Replaced", color: "amber" },
    OVERDUE:  { label: "Overdue",  color: "red"   },
  };
  const m = map[status] ?? { label: status, color: "gray" };
  return <Badge color={m.color}>{m.label}</Badge>;
}

/* ─── KPI Card ─── */
export function KpiCard({ label, value, sub, subColor }) {
  return (
    <div
      style={{
        background:    "#fff",
        border:        "1px solid #ebebeb",
        borderRadius:  "12px",
        padding:       "18px 20px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize:   "11px",
            marginTop:  "6px",
            color:      subColor === "up"   ? "#0d6e50"
                       : subColor === "down" ? "#991b1b"
                       : "#8a5c00",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─── Section heading ─── */
export function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize:      "11px",
        fontWeight:    500,
        letterSpacing: "0.07em",
        color:         "#999",
        textTransform: "uppercase",
        marginBottom:  "10px",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Card shell ─── */
export function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background:    "#fff",
        border:        "1px solid #ebebeb",
        borderRadius:  "14px",
        overflow:      "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, right }) {
  return (
    <div
      style={{
        padding:       "14px 18px",
        borderBottom:  "1px solid #f0eeeb",
        display:       "flex",
        alignItems:    "center",
        justifyContent:"space-between",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a" }}>{title}</span>
      {right}
    </div>
  );
}

/* ─── Button ─── */
export function Btn({ children, onClick, variant = "default", disabled = false, style = {}, size = "md" }) {
  const base = {
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "6px",
    border:         "none",
    borderRadius:   "8px",
    cursor:         disabled ? "not-allowed" : "pointer",
    fontWeight:     500,
    transition:     "background 0.15s, opacity 0.15s",
    opacity:        disabled ? 0.5 : 1,
    fontSize:       size === "sm" ? "12px" : "13px",
    padding:        size === "sm" ? "5px 12px" : "8px 16px",
    ...style,
  };
  const variants = {
    default:  { background: "#f4f3f0", color: "#333" },
    primary:  { background: "#1a6ef5", color: "#fff" },
    danger:   { background: "#fff0f0", color: "#991b1b", border: "0.5px solid #ffc5c5" },
    ghost:    { background: "transparent", color: "#555", border: "1px solid #e0deda" },
    success:  { background: "#eefaf0", color: "#166534", border: "0.5px solid #b0e8bc" },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
}

/* ─── Text input ─── */
export function Input({ placeholder, value, onChange, type = "text", style = {} }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width:        "100%",
        padding:      "8px 12px",
        border:       "1px solid #e0deda",
        borderRadius: "8px",
        fontSize:     "13px",
        color:        "#1a1a1a",
        background:   "#fff",
        outline:      "none",
        boxSizing:    "border-box",
        ...style,
      }}
    />
  );
}

/* ─── Select ─── */
export function Select({ value, onChange, children, style = {} }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width:        "100%",
        padding:      "8px 12px",
        border:       "1px solid #e0deda",
        borderRadius: "8px",
        fontSize:     "13px",
        color:        "#1a1a1a",
        background:   "#fff",
        outline:      "none",
        boxSizing:    "border-box",
        cursor:       "pointer",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

/* ─── Table ─── */
export function Table({ columns, rows, onRowClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#fafaf8" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding:       "9px 14px",
                  textAlign:     "left",
                  fontSize:      "11px",
                  fontWeight:    500,
                  color:         "#999",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderBottom:  "1px solid #f0eeeb",
                  whiteSpace:    "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: "1px solid #f5f4f1",
                cursor:       onRowClick ? "pointer" : "default",
                transition:   "background 0.1s",
              }}
              onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.background = "#fafaf8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "11px 14px", verticalAlign: "middle", color: "#1a1a1a" }}>
                  {col.render ? col.render(row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: "40px", textAlign: "center", color: "#bbb", fontSize: "13px" }}
              >
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Spinner ─── */
export function Spinner() {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
      Loading...
    </div>
  );
}

/* ─── Empty state ─── */
export function Empty({ message = "Nothing here yet." }) {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
      {message}
    </div>
  );
}

/* ─── Date helpers ─── */
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const daysUntil  = (dateStr) => {
  if (!dateStr) return null;
  const due   = new Date(dateStr);
  const today = new Date();
  due.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  return Math.round((due - today) / 86_400_000);
};

export const fmtINR = (n) =>
  n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export function daysDiff(start: string, end?: string) {
  if (!start) return 0;

  const s = new Date(start);
  const e = end ? new Date(end) : new Date();

  const diff = e.getTime() - s.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}