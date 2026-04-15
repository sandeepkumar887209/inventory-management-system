import React from "react";

export const C = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  teal:   { bg: "#e6f7f1", text: "#0d6e50", border: "#a8e0ce", solid: "#1aad80" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
  coral:  { bg: "#fff2ed", text: "#8f3a1a", border: "#ffc9b0", solid: "#e5622a" },
  purple: { bg: "#f3eeff", text: "#5b2d9e", border: "#d0b4f9", solid: "#7c3aed" },
  indigo: { bg: "#eef2ff", text: "#3730a3", border: "#c7d2fe", solid: "#4f46e5" },
};

export function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const c = (C as any)[color] ?? C.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export function customerTypeBadge(type: string) {
  if (type === "company") return <Badge color="blue">Corporate</Badge>;
  return <Badge color="teal">Individual</Badge>;
}

export function KpiCard({ label, value, sub, subColor, icon }: any) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #ebebeb",
      borderRadius: "12px", padding: "18px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ fontSize: "12px", color: "#888" }}>{label}</div>
        {icon && <div style={{ fontSize: "18px", opacity: 0.6 }}>{icon}</div>}
      </div>
      <div style={{ fontSize: "26px", fontWeight: 600, color: "#1a1a1a", lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: "11px", marginTop: "6px",
          color: subColor === "up" ? "#0d6e50" : subColor === "down" ? "#991b1b" : "#8a5c00",
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #ebebeb",
      borderRadius: "14px", overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{
      padding: "14px 18px", borderBottom: "1px solid #f0eeeb",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a" }}>{title}</span>
      {right}
    </div>
  );
}

export function Btn({
  children, onClick, variant = "default", disabled = false,
  style = {}, size = "md", type = "button",
}: any) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    border: "none", borderRadius: "8px", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500, transition: "all 0.15s", opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? "12px" : "13px",
    padding: size === "sm" ? "5px 12px" : "8px 16px", ...style,
  };
  const variants: Record<string, React.CSSProperties> = {
    default:  { background: "#f4f3f0", color: "#333" },
    primary:  { background: C.blue.solid, color: "#fff" },
    danger:   { background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}` },
    ghost:    { background: "transparent", color: "#555", border: "1px solid #e0deda" },
    success:  { background: C.green.bg, color: C.green.text, border: `0.5px solid ${C.green.border}` },
    amber:    { background: C.amber.bg, color: C.amber.text, border: `0.5px solid ${C.amber.border}` },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div style={{ padding: "60px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
      Loading...
    </div>
  );
}

export function Empty({ message = "Nothing here yet." }: { message?: string }) {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
      {message}
    </div>
  );
}

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export const fmtINR = (n?: number | string | null) =>
  n != null && !isNaN(Number(n)) ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 500, letterSpacing: "0.07em",
      color: "#999", textTransform: "uppercase", marginBottom: "10px",
    }}>
      {children}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f4f1" }}>
      <span style={{ fontSize: "12px", color: "#999" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#1a1a1a", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

export function Table({ columns, rows, onRowClick }: {
  columns: { key: string; label: string; render?: (r: any) => React.ReactNode }[];
  rows: any[];
  onRowClick?: (r: any) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#fafaf8" }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500,
                color: "#999", letterSpacing: "0.05em", textTransform: "uppercase",
                borderBottom: "1px solid #f0eeeb", whiteSpace: "nowrap",
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: "1px solid #f5f4f1",
                cursor: onRowClick ? "pointer" : "default",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = "#fafaf8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = ""; }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: "11px 14px", verticalAlign: "middle", color: "#1a1a1a" }}>
                  {col.render ? col.render(row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: "40px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Input({ placeholder, value, onChange, type = "text", style = {}, name }: any) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%", padding: "8px 12px",
        border: "1px solid #e0deda", borderRadius: "8px",
        fontSize: "13px", color: "#1a1a1a",
        background: "#fff", outline: "none", boxSizing: "border-box", ...style,
      }}
    />
  );
}

export function Select({ value, onChange, children, style = {} }: any) {
  return (
    <select value={value} onChange={onChange}
      style={{
        width: "100%", padding: "8px 12px",
        border: "1px solid #e0deda", borderRadius: "8px",
        fontSize: "13px", color: "#1a1a1a",
        background: "#fff", outline: "none", boxSizing: "border-box",
        cursor: "pointer", ...style,
      }}
    >
      {children}
    </select>
  );
}

export function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  const c = type === "success" ? C.teal : C.red;
  return (
    <div style={{
      position: "fixed", top: "24px", right: "24px", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "10px",
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: "10px", padding: "12px 16px",
      fontSize: "13px", fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    }}>
      {message}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: "14px" }}>✕</button>
    </div>
  );
}
