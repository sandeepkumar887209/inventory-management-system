import React from "react";

/* ══════════════════════════════════════════════════
   DESIGN TOKENS  — Inventory Module
══════════════════════════════════════════════════ */
export const T = {
  available:    { bg: "#edfaf3", text: "#166534", border: "#86efac", dot: "#22c55e" },
  rented:       { bg: "#eff6ff", text: "#1e40af", border: "#93c5fd", dot: "#3b82f6" },
  sold:         { bg: "#f5f3ff", text: "#5b21b6", border: "#c4b5fd", dot: "#8b5cf6" },
  demo:         { bg: "#fefce8", text: "#854d0e", border: "#fde047", dot: "#eab308" },
  maintenance:  { bg: "#fff7ed", text: "#9a3412", border: "#fdba74", dot: "#f97316" },
  returned:     { bg: "#f0f9ff", text: "#0c4a6e", border: "#7dd3fc", dot: "#0ea5e9" },
  writtenoff:   { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5", dot: "#ef4444" },
  new_:         { bg: "#edfaf3", text: "#166534", border: "#86efac", dot: "#22c55e" },
  good:         { bg: "#eff6ff", text: "#1e40af", border: "#93c5fd", dot: "#3b82f6" },
  fair:         { bg: "#fefce8", text: "#854d0e", border: "#fde047", dot: "#eab308" },
  poor:         { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5", dot: "#ef4444" },
  neutral:      { bg: "#f8f7f5", text: "#55524e", border: "#e0dbd5", dot: "#a89f96" },
  blue:         { bg: "#eff6ff", text: "#1e40af", border: "#93c5fd", dot: "#3b82f6" },
  amber:        { bg: "#fffbeb", text: "#92400e", border: "#fcd34d", dot: "#f59e0b" },
  red:          { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5", dot: "#ef4444" },
  teal:         { bg: "#f0fdfa", text: "#134e4a", border: "#5eead4", dot: "#14b8a6" },
  primary:      "#1a5cf8",
  text:         "#1c1917",
  muted:        "#78716c",
  border:       "#e8e4df",
  bg:           "#f8f7f5",
  surface:      "#ffffff",
  radius:       "12px",
  radiusSm:     "8px",
  radiusLg:     "16px",
};

/* ══════════════════════════════════════════════════
   STATUS / CONDITION MAPS
══════════════════════════════════════════════════ */
export const STATUS_MAP: Record<string, { label: string; token: keyof typeof T }> = {
  AVAILABLE:              { label: "Available",         token: "available" },
  RENTED:                 { label: "Rented",            token: "rented" },
  SOLD:                   { label: "Sold",              token: "sold" },
  DEMO:                   { label: "Demo",              token: "demo" },
  UNDER_MAINTENANCE:      { label: "Maintenance",       token: "maintenance" },
  RETURNED_TO_SUPPLIER:   { label: "Returned",          token: "returned" },
  WRITTEN_OFF:            { label: "Written Off",       token: "writtenoff" },
};

export const CONDITION_MAP: Record<string, { label: string; token: keyof typeof T }> = {
  NEW:  { label: "New",  token: "new_" },
  GOOD: { label: "Good", token: "good" },
  FAIR: { label: "Fair", token: "fair" },
  POOR: { label: "Poor", token: "poor" },
};

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
export const fmtINR = (n: any) =>
  n != null && !isNaN(Number(n)) ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d: any) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export const daysDiff = (dateStr: string) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
};

/* ══════════════════════════════════════════════════
   ATOM COMPONENTS
══════════════════════════════════════════════════ */

/** Status / condition pill */
export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_MAP[status];
  if (!m) return <span style={{ fontSize: "11px", color: T.muted }}>{status}</span>;
  const tok = T[m.token] as any;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "3px 9px", borderRadius: "99px",
        fontSize: "11px", fontWeight: 500, whiteSpace: "nowrap",
        background: tok.bg, color: tok.text, border: `0.5px solid ${tok.border}`,
      }}
    >
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: tok.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  const m = CONDITION_MAP[condition];
  if (!m) return <span style={{ fontSize: "11px", color: T.muted }}>{condition}</span>;
  const tok = T[m.token] as any;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "2px 8px", borderRadius: "99px",
        fontSize: "11px", fontWeight: 500, whiteSpace: "nowrap",
        background: tok.bg, color: tok.text, border: `0.5px solid ${tok.border}`,
      }}
    >
      {m.label}
    </span>
  );
}

/** Generic colored badge */
export function Chip({
  children, color = "neutral",
}: {
  children: React.ReactNode;
  color?: keyof typeof T;
}) {
  const tok = T[color] as any;
  if (!tok?.bg) return <span>{children}</span>;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "2px 9px", borderRadius: "99px",
        fontSize: "11px", fontWeight: 500, whiteSpace: "nowrap",
        background: tok.bg, color: tok.text, border: `0.5px solid ${tok.border}`,
      }}
    >
      {children}
    </span>
  );
}

/** Button */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}
export function Btn({
  variant = "secondary", size = "md", icon, children, style, disabled, ...rest
}: BtnProps) {
  const sizes = {
    sm: { padding: "5px 12px", fontSize: "12px", gap: "5px", height: "28px" },
    md: { padding: "7px 16px", fontSize: "13px", gap: "6px", height: "34px" },
    lg: { padding: "10px 20px", fontSize: "14px", gap: "7px", height: "40px" },
  };
  const variants = {
    primary:   { background: T.primary,   color: "#fff",     border: `1px solid ${T.primary}` },
    secondary: { background: "#fff",       color: T.text,     border: `1px solid ${T.border}` },
    ghost:     { background: "transparent",color: T.muted,    border: "1px solid transparent" },
    danger:    { background: T.red.bg,     color: T.red.text, border: `1px solid ${T.red.border}` },
    success:   { background: T.teal.bg,    color: T.teal.text,border: `1px solid ${T.teal.border}` },
  };
  const sz = sizes[size];
  const vr = variants[variant];
  return (
    <button
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: sz.gap, padding: sz.padding, height: sz.height,
        fontSize: sz.fontSize, fontWeight: 500,
        borderRadius: T.radiusSm, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
        whiteSpace: "nowrap", ...vr, ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>}
      {children}
    </button>
  );
}

/** Card shell */
export function Card({
  children, style, padding,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: string;
}) {
  return (
    <div
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radius, overflow: "hidden",
        ...(padding ? { padding } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Section header inside a Card */
export function CardHead({
  title, subtitle, right, icon,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {icon && (
          <span style={{ display: "flex", alignItems: "center", color: T.muted }}>{icon}</span>
        )}
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: "11px", color: T.muted, marginTop: "1px" }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>{right}</div>}
    </div>
  );
}

/** KPI stat tile */
export function StatTile({
  label, value, sub, color = "blue", icon,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  color?: keyof typeof T; icon?: React.ReactNode;
}) {
  const tok = T[color] as any;
  return (
    <div
      style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radius, padding: "18px 20px",
      }}
    >
      {icon && (
        <div
          style={{
            width: "36px", height: "36px", borderRadius: T.radiusSm,
            background: tok?.bg || "#f0f0f0",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "12px", color: tok?.text || "#555",
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ fontSize: "11px", color: T.muted, marginBottom: "5px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: T.muted, marginTop: "6px" }}>{sub}</div>}
    </div>
  );
}

/** Search input */
export function SearchInput({
  value, onChange, placeholder = "Search…", style,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", ...style }}>
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="#aaa" strokeWidth="2.5" strokeLinecap="round"
        style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      >
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 12px 8px 30px",
          border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
          fontSize: "13px", color: T.text, background: T.bg,
          outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

/** Select dropdown */
export function Select({
  value, onChange, children, style,
}: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px", border: `1px solid ${T.border}`,
        borderRadius: T.radiusSm, fontSize: "13px",
        color: T.text, background: T.surface, outline: "none",
        cursor: "pointer", ...style,
      }}
    >
      {children}
    </select>
  );
}

/** Table skeleton */
export function Table({
  columns, rows, onRowClick, emptyMsg = "No records found",
}: {
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  rows: any[];
  onRowClick?: (row: any) => void;
  emptyMsg?: string;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: T.bg }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "9px 14px", textAlign: "left",
                  fontSize: "11px", fontWeight: 600, color: T.muted,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "48px", textAlign: "center",
                  color: "#c0bbb5", fontSize: "13px",
                }}
              >
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = T.bg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: "11px 14px", verticalAlign: "middle", color: T.text }}>
                    {col.render ? col.render(row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Loading spinner */
export function Spinner({ message = "Loading…" }: { message?: string }) {
  return (
    <div style={{ padding: "60px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}>
      {message}
    </div>
  );
}

/** Pagination bar */
export function Pagination({
  page, total, pageSize, onChange,
}: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px", borderTop: `1px solid ${T.border}`,
        fontSize: "12px", color: T.muted,
      }}
    >
      <span>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { label: "‹", to: page - 1 },
          ...(page > 2 ? [{ label: "1", to: 1 }] : []),
          ...(page > 3 ? [{ label: "…", to: 0 }] : []),
          ...(page > 1 ? [{ label: String(page - 1), to: page - 1 }] : []),
          { label: String(page), to: page, active: true },
          ...(page < totalPages ? [{ label: String(page + 1), to: page + 1 }] : []),
          ...(page < totalPages - 2 ? [{ label: "…", to: 0 }] : []),
          ...(page < totalPages - 1 ? [{ label: String(totalPages), to: totalPages }] : []),
          { label: "›", to: page + 1 },
        ]
          .filter((item, idx, arr) => item.to !== 0 || (idx > 0 && arr[idx - 1].to !== 0))
          .map((item, i) => (
            <button
              key={i}
              onClick={() => item.to > 0 && item.to <= totalPages && onChange(item.to)}
              disabled={item.to === page || item.to === 0 || (item.label === "‹" && page === 1) || (item.label === "›" && page === totalPages)}
              style={{
                width: "28px", height: "28px", borderRadius: T.radiusSm, border: "none",
                background: (item as any).active ? T.primary : "transparent",
                color: (item as any).active ? "#fff" : T.muted,
                fontSize: "12px", cursor: "pointer", fontWeight: (item as any).active ? 600 : 400,
                opacity: (item.label === "‹" && page === 1) || (item.label === "›" && page === totalPages) ? 0.35 : 1,
              }}
            >
              {item.label}
            </button>
          ))}
      </div>
    </div>
  );
}

/** Info row (label + value pair) */
export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "7px 0",
        borderBottom: `1px solid ${T.border}`,
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "12px", color: T.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "13px", color: T.text, fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

/** Toast notification */
export function Toast({
  message, type = "success", onClose,
}: {
  message: string; type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const colors = {
    success: { bg: T.teal.bg, text: T.teal.text, border: T.teal.border },
    error:   { bg: T.red.bg,  text: T.red.text,  border: T.red.border },
    info:    { bg: T.blue.bg, text: T.blue.text, border: T.blue.border },
  };
  const c = colors[type];
  return (
    <div
      style={{
        position: "fixed", top: "24px", right: "24px", zIndex: 9999,
        display: "flex", alignItems: "center", gap: "10px",
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        borderRadius: T.radius, padding: "12px 16px",
        fontSize: "13px", fontWeight: 500,
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        animation: "toastIn 0.2s ease",
      }}
    >
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {message}
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", color: c.text, opacity: 0.6, padding: "0 2px", fontSize: "14px" }}
      >
        ✕
      </button>
    </div>
  );
}

/** Confirmation dialog */
export function ConfirmDialog({
  title, message, confirmLabel = "Confirm", variant = "danger", onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel?: string;
  variant?: "danger" | "primary"; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          background: T.surface, borderRadius: T.radiusLg,
          padding: "28px", width: "380px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 700, color: T.text, marginBottom: "8px" }}>{title}</div>
        <div style={{ fontSize: "13px", color: T.muted, marginBottom: "24px" }}>{message}</div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/** Modal wrapper */
export function Modal({
  title, subtitle, children, onClose, width = "780px",
}: {
  title: string; subtitle?: string; children: React.ReactNode;
  onClose: () => void; width?: string;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 100, display: "flex", alignItems: "flex-start",
        justifyContent: "center", padding: "48px 20px", overflowY: "auto",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: T.surface, borderRadius: T.radiusLg,
          width: "100%", maxWidth: width,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          animation: "modalIn 0.2s ease",
        }}
      >
        <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 24px", borderBottom: `1px solid ${T.border}`,
            position: "sticky", top: 0, background: T.surface, zIndex: 1,
            borderRadius: `${T.radiusLg} ${T.radiusLg} 0 0`,
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: T.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: "12px", color: T.muted, marginTop: "2px" }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: T.radiusSm,
              border: `1px solid ${T.border}`, background: T.bg,
              cursor: "pointer", fontSize: "16px", color: T.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}
