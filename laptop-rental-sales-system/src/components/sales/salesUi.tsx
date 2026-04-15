import React from "react";

/* ─── Design tokens ─── */
export const S = {
  indigo:  { bg: "#eef2ff", text: "#3730a3", border: "#c7d2fe", solid: "#4f46e5" },
  violet:  { bg: "#f5f3ff", text: "#5b21b6", border: "#ddd6fe", solid: "#7c3aed" },
  sky:     { bg: "#e0f2fe", text: "#0c4a6e", border: "#7dd3fc", solid: "#0284c7" },
  emerald: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7", solid: "#059669" },
  amber:   { bg: "#fef3c7", text: "#92400e", border: "#fcd34d", solid: "#d97706" },
  rose:    { bg: "#ffe4e6", text: "#9f1239", border: "#fda4af", solid: "#e11d48" },
  slate:   { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1", solid: "#64748b" },
  orange:  { bg: "#fff7ed", text: "#7c2d12", border: "#fdba74", solid: "#ea580c" },
  teal:    { bg: "#f0fdfa", text: "#134e4a", border: "#5eead4", solid: "#0d9488" },
  lime:    { bg: "#f7fee7", text: "#3f6212", border: "#bef264", solid: "#65a30d" },
};

/* ─── Status badge helper ─── */
export function saleBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: "Completed", color: "emerald" },
    RETURNED:  { label: "Returned",  color: "slate"   },
    PENDING:   { label: "Pending",   color: "amber"   },
    CANCELLED: { label: "Cancelled", color: "rose"    },
  };
  const m = map[status] ?? { label: status, color: "slate" };
  return <SBadge color={m.color}>{m.label}</SBadge>;
}

export function paymentBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    PAID:      { label: "Paid",      color: "emerald" },
    UNPAID:    { label: "Unpaid",    color: "amber"   },
    PARTIAL:   { label: "Partial",   color: "sky"     },
    CANCELLED: { label: "Cancelled", color: "rose"    },
    OVERDUE:   { label: "Overdue",   color: "rose"    },
  };
  const m = map[status] ?? { label: status, color: "slate" };
  return <SBadge color={m.color}>{m.label}</SBadge>;
}

/* ─── Badge ─── */
export function SBadge({ children, color = "slate" }: { children: React.ReactNode; color?: string }) {
  const c = (S as any)[color] ?? S.slate;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      whiteSpace: "nowrap", letterSpacing: "0.01em",
    }}>
      {children}
    </span>
  );
}

/* ─── KPI Card ─── */
export function SKpiCard({ label, value, sub, subColor, icon }: {
  label: string; value: string | number; sub?: string; subColor?: "up" | "down" | "neutral"; icon?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #edecea",
      borderRadius: "14px", padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: "8px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500, letterSpacing: "0.02em" }}>
          {label}
        </span>
        {icon && (
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: "11px", fontWeight: 500,
          color: subColor === "up" ? S.emerald.text : subColor === "down" ? S.rose.text : "#94a3b8",
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─── Card ─── */
export function SCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #edecea",
      borderRadius: "14px", overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

export function SCardHeader({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{
      padding: "14px 20px 12px",
      borderBottom: "1px solid #f1f0ee",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{title}</span>
      {right && <div>{right}</div>}
    </div>
  );
}

/* ─── Button ─── */
interface SBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "success" | "default" | "amber" | "outline";
  size?: "sm" | "md" | "lg";
}
export function SBtn({ variant = "default", size = "md", style, children, disabled, ...rest }: SBtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    border: "none", borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500, transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? "12px" : size === "lg" ? "14px" : "13px",
    padding: size === "sm" ? "5px 12px" : size === "lg" ? "10px 20px" : "8px 16px",
    whiteSpace: "nowrap" as const,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:  { background: S.indigo.solid, color: "#fff"           },
    default:  { background: "#f1f0ee", color: "#334155"             },
    ghost:    { background: "transparent", color: "#64748b", border: "1px solid #e2e8f0" },
    outline:  { background: "#fff", color: S.indigo.text, border: `1px solid ${S.indigo.border}` },
    danger:   { background: S.rose.bg, color: S.rose.text, border: `0.5px solid ${S.rose.border}` },
    success:  { background: S.emerald.bg, color: S.emerald.text, border: `0.5px solid ${S.emerald.border}` },
    amber:    { background: S.amber.bg, color: S.amber.text, border: `0.5px solid ${S.amber.border}` },
  };
  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ─── Table ─── */
export function STable({ columns, rows, onRowClick }: {
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  rows: any[];
  onRowClick?: (row: any) => void;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#fafaf9" }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: "9px 16px", textAlign: "left",
                fontSize: "10.5px", fontWeight: 600, color: "#94a3b8",
                letterSpacing: "0.06em", textTransform: "uppercase",
                borderBottom: "1px solid #f1f0ee", whiteSpace: "nowrap",
              }}>
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
                borderBottom: "1px solid #f8f7f5",
                cursor: onRowClick ? "pointer" : "default",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.background = "#fafaf9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "12px 16px", verticalAlign: "middle", color: "#1e293b" }}>
                  {col.render ? col.render(row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: "48px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Input ─── */
export function SInput({ placeholder, value, onChange, type = "text", style = {} }: {
  placeholder?: string; value?: string | number; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%", padding: "8px 12px",
        border: "1px solid #e2e8f0", borderRadius: "8px",
        fontSize: "13px", color: "#0f172a", background: "#fff",
        outline: "none", boxSizing: "border-box",
        transition: "border-color 0.15s",
        ...style,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = S.indigo.solid; e.currentTarget.style.boxShadow = `0 0 0 3px ${S.indigo.bg}`; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

/* ─── Select ─── */
export function SSelect({ value, onChange, children, style = {} }: {
  value?: string | number; onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%", padding: "8px 12px",
        border: "1px solid #e2e8f0", borderRadius: "8px",
        fontSize: "13px", color: "#0f172a", background: "#fff",
        outline: "none", boxSizing: "border-box", cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

/* ─── Spinner ─── */
export function SSpinner() {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
      Loading…
    </div>
  );
}

/* ─── Empty State ─── */
export function SEmpty({ message = "Nothing here yet.", icon = "📭" }: { message?: string; icon?: string }) {
  return (
    <div style={{ padding: "56px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
      <div style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 500 }}>{message}</div>
    </div>
  );
}

/* ─── Date/Currency Helpers ─── */
export const fmtDate = (d?: string | null): string => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateTime = (d?: string | null): string => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const fmtINR = (n?: number | string | null): string => {
  if (n == null || isNaN(Number(n))) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

export const fmtINRCompact = (n?: number | string | null): string => {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
};
