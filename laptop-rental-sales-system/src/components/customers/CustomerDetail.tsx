import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronLeft, Edit2, Check, X, TrendingUp,
  Phone, MapPin, Building2, User, Shield, RefreshCw,
  ArrowUpRight, ArrowDownLeft, RotateCcw, ShoppingCart,
  Search, ChevronUp, ChevronDown,
} from "lucide-react";
import api from "../../services/axios";
import {
  C, Card, CardHeader, Badge, Btn, Spinner, InfoRow,
  fmtDate, fmtINR, customerTypeBadge, Toast,
} from "./ui";

/* ─────────────────────────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────────────────────────── */

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "10px", fontWeight: 600, color: "#bbb",
      textTransform: "uppercase" as const, letterSpacing: "0.07em",
      marginTop: "14px", marginBottom: "4px",
    }}>
      {children}
    </div>
  );
}

function IdChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 10px", background: "#fafaf8", borderRadius: "7px",
      border: "1px solid #f0eeeb", marginBottom: "6px",
    }}>
      <span style={{ fontSize: "11px", color: "#999" }}>{label}</span>
      <code style={{
        fontSize: "12px", fontWeight: 500, color: "#1a1a1a",
        background: "#f0eeeb", padding: "2px 8px", borderRadius: "5px", letterSpacing: "0.04em",
      }}>
        {value}
      </code>
    </div>
  );
}

function EditField({ label, value, onSave, type = "text" }: {
  label: string; value: string; onSave: (v: string) => Promise<void>; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!editing) setVal(value); }, [value, editing]);
  const save = async () => {
    setSaving(true);
    try { await onSave(val); setEditing(false); } catch { alert("Failed to save."); } finally { setSaving(false); }
  };
  const cancel = () => { setVal(value); setEditing(false); };
  if (!editing) return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f4f1" }}>
      <span style={{ fontSize: "12px", color: "#999", flexShrink: 0, marginRight: "12px" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: value ? "#1a1a1a" : "#ccc" }}>{value || "—"}</span>
        <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: "2px 4px" }}>
          <Edit2 size={11} />
        </button>
      </div>
    </div>
  );
  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #f5f4f1" }}>
      <div style={{ fontSize: "12px", color: "#999", marginBottom: "5px" }}>{label}</div>
      <div style={{ display: "flex", gap: "6px" }}>
        <input type={type} value={val} autoFocus onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          style={{ flex: 1, padding: "6px 10px", border: `1px solid ${C.blue.border}`, borderRadius: "7px", fontSize: "13px", outline: "none" }} />
        <button onClick={save} disabled={saving}
          style={{ padding: "6px 10px", background: C.teal.solid, color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer" }}>
          {saving ? "…" : <Check size={12} />}
        </button>
        <button onClick={cancel}
          style={{ padding: "6px 8px", background: "#f0eeeb", color: "#555", border: "none", borderRadius: "7px", cursor: "pointer" }}>
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

function DaysChip({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const diff = Math.round((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
  const isOverdue = diff < 0;
  const isUrgent = !isOverdue && diff <= 3;
  const p = isOverdue ? C.red : isUrgent ? C.amber : C.teal;
  const label = isOverdue ? `${Math.abs(diff)}d overdue` : diff === 0 ? "Due today" : `${diff}d left`;
  return (
    <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 9px", borderRadius: "99px", background: p.bg, color: p.text, border: `0.5px solid ${p.border}`, whiteSpace: "nowrap" as const }}>
      {label}
    </span>
  );
}


/* ─────────────────────────────────────────────────────────────
   TAB 3 — CURRENT ALLOCATED LAPTOPS
   Reads live inventory: /inventory/laptops/?status=RENTED&customer={id}
   One row per laptop. Sortable columns, search, summary strip.
───────────────────────────────────────────────────────────── */

const ALLOC_STATUS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  RENTED:            { ...C.blue,  label: "Rented"      },
  ONGOING:           { ...C.blue,  label: "Rented"      },
  UNDER_MAINTENANCE: { ...C.amber, label: "Maintenance" },
  DEMO:              { ...C.amber, label: "Demo"        },
  WRITTEN_OFF:       { ...C.red,   label: "Written Off" },
};

type AllocSortKey = "brand" | "model" | "serial_number" | "asset_tag" | "processor" | "ram" | "storage" | "condition" | "rent_per_month";

const ALLOC_COLS: { key: AllocSortKey; label: string; align?: "right" }[] = [
  { key: "asset_tag",     label: "Asset Tag"  },
  { key: "brand",         label: "Brand"      },
  { key: "model",         label: "Model"      },
  { key: "serial_number", label: "Serial"     },
  { key: "processor",     label: "Processor"  },
  { key: "ram",           label: "RAM"        },
  { key: "storage",       label: "Storage"    },
  { key: "condition",     label: "Condition"  },
  { key: "rent_per_month",label: "Rent / mo", align: "right" },
];

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ChevronUp size={10} style={{ opacity: 0.2 }} />;
  return dir === "asc" ? <ChevronUp size={10} color={C.blue.solid} /> : <ChevronDown size={10} color={C.blue.solid} />;
}

function CurrentAllocatedLaptops({ customerId, onNavigate }: { customerId?: string; onNavigate: (p: string) => void }) {
  const [laptops, setLaptops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState<AllocSortKey>("brand");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!customerId) return;
    api.get(`/inventory/laptops/?status=RENTED&customer=${customerId}`)
      .then(res => { const d = res.data; setLaptops(Array.isArray(d) ? d : d.results ?? []); })
      .catch(console.error).finally(() => setLoading(false));
  }, [customerId]);

  const handleSort = (key: AllocSortKey) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = laptops
    .filter(l => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (l.brand ?? "").toLowerCase().includes(q) ||
        (l.model ?? "").toLowerCase().includes(q) ||
        (l.serial_number ?? "").toLowerCase().includes(q) ||
        (l.asset_tag ?? "").toLowerCase().includes(q) ||
        (l.processor ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalMonthly = laptops.reduce((s, l) => s + Number(l.rent_per_month ?? 0), 0);
  const overdueCount = laptops.filter(l => {
    const due = l.current_rental_due_date ?? l.rental_due_date ?? l.expected_return_date;
    return due && new Date(due) < new Date();
  }).length;

  if (loading) return <div style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>Loading allocated laptops…</div>;

  return (
    <div>
      {/* summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid #f0eeeb" }}>
        {[
          { label: "Laptops on Rent",  value: String(laptops.length),  c: C.blue  },
          { label: "Overdue Returns",  value: String(overdueCount),    c: overdueCount > 0 ? C.red : C.gray },
          { label: "Monthly Billing",  value: fmtINR(totalMonthly),    c: C.teal  },
          { label: "Unique Models",    value: String(new Set(laptops.map(l => `${l.brand} ${l.model}`)).size), c: C.amber },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "12px 18px", background: s.c.bg, borderRight: i < 3 ? "1px solid #f0eeeb" : "none" }}>
            <div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>{s.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: s.c.text }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "#fafaf8", borderBottom: "1px solid #f0eeeb" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
          <Search size={13} color="#aaa" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brand, model, serial, asset tag…"
            style={{ width: "100%", padding: "7px 12px 7px 30px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "12px", outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>
          {filtered.length} laptop{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* empty state */}
      {laptops.length === 0 ? (
        <div style={{ padding: "64px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.3 }}>💻</div>
          <div>No laptops currently allocated to this customer.</div>
        </div>
      ) : (
        /* table */
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "#fafaf8" }}>
                {ALLOC_COLS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{
                    padding: "9px 14px", textAlign: col.align ?? "left",
                    fontSize: "10px", fontWeight: 600,
                    color: sortKey === col.key ? C.blue.text : "#999",
                    letterSpacing: "0.05em", textTransform: "uppercase" as const,
                    borderBottom: "1px solid #f0eeeb", cursor: "pointer",
                    userSelect: "none" as const, whiteSpace: "nowrap" as const,
                  }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      {col.label}<SortIcon active={sortKey === col.key} dir={sortDir} />
                    </span>
                  </th>
                ))}
                {/* Due Date — not sortable via ALLOC_COLS */}
                <th style={{ padding: "9px 14px", fontSize: "10px", fontWeight: 600, color: "#999", textTransform: "uppercase" as const, borderBottom: "1px solid #f0eeeb", whiteSpace: "nowrap" as const }}>Due Date</th>
                <th style={{ padding: "9px 14px", borderBottom: "1px solid #f0eeeb" }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(lap => {
                const dueDate  = lap.current_rental_due_date ?? lap.rental_due_date ?? lap.expected_return_date;
                const rentalId = lap.current_rental_id ?? lap.rental_id;
                const isOverdue = dueDate && new Date(dueDate) < new Date();
                const statusCfg = ALLOC_STATUS[lap.status] ?? { bg: C.gray.bg, text: C.gray.text, border: C.gray.border, label: lap.status };

                return (
                  <tr key={lap.id}
                    style={{ borderBottom: "1px solid #f5f4f1", background: isOverdue ? "#fff9f9" : "transparent", transition: "background 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = isOverdue ? "#fff0f0" : "#fafaf8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isOverdue ? "#fff9f9" : "transparent"; }}
                  >
                    <td style={{ padding: "11px 14px" }}>
                      <code style={{ fontSize: "11px", background: "#f0eeeb", padding: "2px 7px", borderRadius: "5px", color: "#555" }}>{lap.asset_tag || "—"}</code>
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 500 }}>{lap.brand}</td>
                    <td style={{ padding: "11px 14px" }}>{lap.model}</td>
                    <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: "11px", color: "#888" }}>{lap.serial_number}</td>
                    <td style={{ padding: "11px 14px", fontSize: "11px", color: "#555" }}>
                      {[lap.processor, lap.generation && `(${lap.generation})`].filter(Boolean).join(" ")}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: "11px", color: "#555" }}>{lap.ram}</td>
                    <td style={{ padding: "11px 14px", fontSize: "11px", color: "#555" }}>{lap.storage}</td>
                    <td style={{ padding: "11px 14px", fontSize: "11px", color: "#555" }}>{lap.condition || "—"}</td>
                    <td style={{ padding: "11px 14px", fontWeight: 500, color: C.teal.text, textAlign: "right", whiteSpace: "nowrap" as const }}>
                      {fmtINR(lap.rent_per_month)}
                    </td>
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" as const }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {dueDate
                          ? <><span style={{ fontSize: "12px", color: isOverdue ? C.red.text : "#555" }}>{fmtDate(dueDate)}</span><DaysChip dueDate={dueDate} /></>
                          : <span style={{ color: "#ccc" }}>—</span>
                        }
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {rentalId && <Btn size="sm" variant="ghost" onClick={() => onNavigate(`/rentals/${rentalId}`)}>R-{rentalId}</Btn>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB — CUSTOMER HISTORY TIMELINE
   Fetches /customers/customers/{id}/history/ and renders a
   vertical activity-feed, newest event at the top.
───────────────────────────────────────────────────────────── */

type HistoryEvent = {
  id:             number;
  action:         string;
  action_display: string;
  laptop_name:    string;
  serial:         string;
  ref_id:         number | null;
  ref_label:      string;
  amount:         string | null;
  note:           string;
  event_date:     string | null;
  created_at:     string;
};

const H_KIND: Record<string, { label: string; Icon: any; color: typeof C.blue; sign: "out" | "in" | "neutral" }> = {
  RENTAL_OUT:       { label: "Rented Out",   Icon: ArrowUpRight,  color: C.blue,   sign: "out"     },
  RENTAL_RETURNED:  { label: "Returned",     Icon: ArrowDownLeft, color: C.teal,   sign: "in"      },
  RENTAL_REPLACED:  { label: "Replaced",     Icon: RefreshCw,     color: C.amber,  sign: "neutral" },
  DEMO_OUT:         { label: "Demo Out",     Icon: ArrowUpRight,  color: C.amber,  sign: "out"     },
  DEMO_RETURNED:    { label: "Demo Ret.",    Icon: ArrowDownLeft, color: C.teal,   sign: "in"      },
  DEMO_CONVERTED:   { label: "Demo Conv.",   Icon: ArrowUpRight,  color: C.teal,   sign: "neutral" },
  SALE:             { label: "Sold",         Icon: ShoppingCart,  color: C.purple, sign: "out"     },
  SALE_RETURNED:    { label: "Sale Return",  Icon: RotateCcw,     color: C.amber,  sign: "in"      },
  CUSTOMER_CREATED: { label: "Account Created", Icon: User,       color: C.gray,   sign: "neutral" },
  PROFILE_UPDATED:  { label: "Profile Update",  Icon: Edit2,      color: C.gray,   sign: "neutral" },
  DEACTIVATED:      { label: "Deactivated",     Icon: X,          color: C.red,    sign: "neutral" },
  REACTIVATED:      { label: "Reactivated",     Icon: Check,      color: C.teal,   sign: "neutral" },
};

function HistoryFilterBar({
  filter,
  setFilter,
  search,
  setSearch,
  total,
}: {
  filter: string;
  setFilter: (f: string) => void;
  search: string;
  setSearch: (s: string) => void;
  total: number;
}) {
  const tabs = [
    { id: "all",    label: "All" },
    { id: "rental", label: "Rentals" },
    { id: "demo",   label: "Demos" },
    { id: "sale",   label: "Sales" },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 16px", background: "#fafaf8",
      borderBottom: "1px solid #f0eeeb", flexWrap: "wrap" as const,
    }}>
      <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
        <Search size={13} color="#aaa" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search laptop, serial, reference…"
          style={{
            width: "100%", padding: "7px 12px 7px 30px",
            border: "1px solid #e0deda", borderRadius: "8px",
            fontSize: "12px", outline: "none", boxSizing: "border-box" as const,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "5px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding: "5px 13px", borderRadius: "99px", cursor: "pointer",
            fontSize: "12px", fontWeight: filter === t.id ? 500 : 400,
            border: filter === t.id ? "none" : "1px solid #e0deda",
            background: filter === t.id ? C.blue.solid : "#fff",
            color: filter === t.id ? "#fff" : "#555",
          }}>{t.label}</button>
        ))}
      </div>
      <span style={{ marginLeft: "auto", fontSize: "11px", color: "#aaa" }}>
        {total} event{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function HistorySummaryBar({ events }: { events: HistoryEvent[] }) {
  const rentals = events.filter(e => e.action === "RENTAL_OUT").length;
  const demos   = events.filter(e => e.action === "DEMO_OUT").length;
  const sales   = events.filter(e => e.action === "SALE").length;
  const totalAmt = events
    .filter(e => e.action === "RENTAL_OUT" || e.action === "SALE")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid #f0eeeb" }}>
      {[
        { label: "Rentals",      value: String(rentals),     c: C.blue   },
        { label: "Demos",        value: String(demos),       c: C.amber  },
        { label: "Sales",        value: String(sales),       c: C.purple },
        { label: "Total Billed", value: fmtINR(totalAmt),    c: C.teal   },
      ].map((s, i) => (
        <div key={s.label} style={{
          padding: "12px 18px", background: s.c.bg,
          borderRight: i < 3 ? "1px solid #f0eeeb" : "none",
        }}>
          <div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>{s.label}</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: s.c.text }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function CustomerHistoryTimeline({
  events,
  onNavigate,
}: {
  events: HistoryEvent[];
  onNavigate: (path: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = events.filter(e => {
    if (e.action === "CUSTOMER_CREATED" || e.action === "PROFILE_UPDATED") return filter === "all" && !search;
    if (filter === "rental" && !e.action.startsWith("RENTAL")) return false;
    if (filter === "demo"   && !e.action.startsWith("DEMO"))   return false;
    if (filter === "sale"   && !e.action.startsWith("SALE"))   return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (e.laptop_name || "").toLowerCase().includes(q) ||
        (e.serial      || "").toLowerCase().includes(q) ||
        (e.ref_label   || "").toLowerCase().includes(q) ||
        (e.note        || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (events.length === 0) {
    return (
      <div style={{ padding: "64px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.25 }}>📋</div>
        <div>No history found for this customer.</div>
      </div>
    );
  }

  return (
    <div>
      <HistorySummaryBar events={events} />
      <HistoryFilterBar
        filter={filter} setFilter={setFilter}
        search={search} setSearch={setSearch}
        total={filtered.length}
      />

      {/* timeline feed */}
      <div style={{ padding: "20px 24px", position: "relative" }}>
        {/* vertical spine */}
        <div style={{
          position: "absolute", left: "44px", top: 0, bottom: 0,
          width: "2px", background: "#f0eeeb",
        }} />

        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
            No events match your filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {filtered.map((ev, idx) => {
              const cfg  = H_KIND[ev.action] ?? H_KIND["CUSTOMER_CREATED"];
              const isCreated = ev.action === "CUSTOMER_CREATED" || ev.action === "PROFILE_UPDATED" || ev.action === "DEACTIVATED" || ev.action === "REACTIVATED";
              const Icon = cfg.Icon;
              const isLast    = idx === filtered.length - 1;

              return (
                <div
                  key={`${ev.id}-${idx}`}
                  style={{
                    display: "flex", gap: "16px", alignItems: "flex-start",
                    paddingBottom: isLast ? 0 : "20px",
                    position: "relative",
                  }}
                >
                  {/* icon bubble */}
                  <div style={{
                    width: "36px", height: "36px", flexShrink: 0,
                    borderRadius: "50%",
                    background: cfg.color.bg,
                    border: `2px solid ${cfg.color.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1, position: "relative",
                  }}>
                    <Icon size={15} color={cfg.color.solid} />
                  </div>

                  {/* event card */}
                  <div style={{
                    flex: 1,
                    background: isCreated ? "#fafaf8" : "#fff",
                    border: `1px solid ${isCreated ? "#f0eeeb" : cfg.color.border}`,
                    borderRadius: "10px",
                    padding: "10px 14px",
                    marginTop: "2px",
                    transition: "box-shadow 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                      {/* event badge */}
                      <span style={{
                        fontSize: "11px", fontWeight: 600,
                        padding: "2px 9px", borderRadius: "99px",
                        background: cfg.color.bg,
                        color: cfg.color.text,
                        border: `0.5px solid ${cfg.color.border}`,
                        whiteSpace: "nowrap" as const,
                      }}>{cfg.label}</span>

                      {/* reference chip */}
                      {!isCreated && (
                        <code style={{
                          fontSize: "11px", color: "#555",
                          background: "#e8f0fe", padding: "2px 7px",
                          borderRadius: "5px",
                        }}>{ev.ref_label}</code>
                      )}

                      {/* amount */}
                      {Number(ev.amount) > 0 && (
                        <span style={{
                          fontSize: "12px", fontWeight: 600,
                          color: cfg.sign === "out" ? C.blue.text : C.teal.text,
                          marginLeft: "2px",
                        }}>{fmtINR(Number(ev.amount))}</span>
                      )}

                      {/* date */}
                      <span style={{
                        marginLeft: "auto", fontSize: "11px", color: "#aaa",
                        whiteSpace: "nowrap" as const,
                      }}>{ev.event_date ? fmtDate(ev.event_date) : fmtDate(ev.created_at)}</span>
                    </div>

                    {/* laptop + serial */}
                    {ev.laptop_name && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#1a1a1a" }}>
                          {ev.laptop_name}
                        </span>
                        {ev.serial && (
                          <code style={{
                            fontSize: "11px", color: "#888",
                            background: "#f0eeeb", padding: "1px 6px", borderRadius: "4px",
                          }}>{ev.serial}</code>
                        )}
                      </div>
                    )}

                    {/* note + open button */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between", marginTop: "4px",
                    }}>
                      <span style={{ fontSize: "11px", color: "#999" }}>{ev.note}</span>

                      {!isCreated && ev.ref_id && (
                        <button
                          onClick={() => onNavigate(
                            ev.action.startsWith("SALE")
                              ? `/sales/${ev.ref_id}`
                              : ev.action.startsWith("DEMO")
                                ? `/demos/${ev.ref_id}`
                                : `/rentals/${ev.ref_id}`
                          )}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "11px", color: C.blue.text,
                            display: "inline-flex", alignItems: "center", gap: "3px",
                            padding: "2px 4px", borderRadius: "4px",
                          }}
                        >
                          Open <ArrowUpRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT — 6 tabs
───────────────────────────────────────────────────────────── */

type Tab = "overview" | "history" | "allocated" | "sales" | "invoices" | "profile";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",  label: "Overview"                  },
  { id: "history",   label: "History"                   },
  { id: "allocated", label: "Current Allocated Laptops" },
  { id: "sales",     label: "Sales"                     },
  { id: "invoices",  label: "Invoices"                  },
  { id: "profile",   label: "Full Profile"              },
];

export function CustomerDetail({ onBack, onNavigate }: { onBack: () => void; onNavigate: (path: string) => void }) {
  const { id } = useParams<{ id: string }>();
  const [customer,     setCustomer]     = useState(null);
  const [summary,      setSummary]      = useState(null);
  const [rentals,      setRentals]      = useState([]);
  const [sales,        setSales]        = useState([]);
  const [invoices,     setInvoices]     = useState([]);
  const [history,      setHistory]      = useState<HistoryEvent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("overview");
  const [toast,        setToast]        = useState(null);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [sumRes, rentRes, saleRes, invRes, histRes] = await Promise.allSettled([
        api.get(`/customers/customers/${id}/summary/`),
        api.get(`/rentals/rental/?customer=${id}`),
        api.get(`/customers/customers/${id}/sales/`),
        api.get(`/customers/customers/${id}/invoices/`),
        api.get(`/customers/customers/${id}/history/`),
      ]);
      if (sumRes.status === "fulfilled") { setCustomer(sumRes.value.data.customer); setSummary(sumRes.value.data); }
      else { const r = await api.get(`/customers/customers/${id}/`); setCustomer(r.data); }
      if (rentRes.status  === "fulfilled") { const d = rentRes.value.data;  setRentals(Array.isArray(d) ? d : d.results ?? []); }
      if (saleRes.status  === "fulfilled") { const d = saleRes.value.data;  setSales(Array.isArray(d) ? d : d.results ?? d.sales ?? []); }
      if (invRes.status   === "fulfilled") { const d = invRes.value.data;   setInvoices(Array.isArray(d) ? d : d.results ?? d.invoices ?? []); }
      if (histRes.status  === "fulfilled") { setHistory(histRes.value.data.events ?? []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const patchCustomer = async (field: string, value: string) => {
    await api.patch(`/customers/customers/${id}/`, { [field]: value });
    setCustomer((p: any) => ({ ...p, [field]: value }));
    setToast({ msg: "Updated successfully", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <Spinner />;
  if (!customer) return <div style={{ padding: "40px", color: "#bbb", textAlign: "center" }}>Customer not found.</div>;

  const isCompany     = customer.customer_type === "company";
  const totalRevenue  = summary?.total_revenue ?? 0;
  const activeRentals = summary?.rentals?.active ?? rentals.filter((r) => r.status === "ONGOING").length;

  const tabCount: Partial<Record<Tab, number>> = {
    history:  history.filter(e => e.event_type !== "customer_created").length,
    sales:    sales.length,
    invoices: invoices.length,
  };

  const statCards = [
    { label: "Total Revenue",  value: fmtINR(totalRevenue),                     color: C.teal   },
    { label: "Total Rentals",  value: summary?.rentals?.total ?? rentals.length, color: C.blue   },
    { label: "Active Rentals", value: activeRentals,                             color: C.amber  },
    { label: "Sales",          value: summary?.sales?.total ?? sales.length,     color: C.purple },
  ];

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: "16px" }}>
        <Btn variant="ghost" size="sm" onClick={onBack}><ChevronLeft size={14} /> Back to Customers</Btn>
      </div>

      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: isCompany ? C.blue.bg : C.teal.bg, border: `1px solid ${isCompany ? C.blue.border : C.teal.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 600, flexShrink: 0, color: isCompany ? C.blue.text : C.teal.text }}>
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{customer.display_name || customer.name}</h1>
            {isCompany && customer.trade_name && customer.trade_name !== customer.name && (
              <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>Legal: {customer.name}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" as const }}>
              {customerTypeBadge(customer.customer_type)}
              <span style={{ fontSize: "11px", color: "#aaa", fontFamily: "monospace" }}>ID-{customer.id}</span>
              {!customer.is_active && <span style={{ fontSize: "11px", color: C.red.text, background: C.red.bg, border: `0.5px solid ${C.red.border}`, borderRadius: "99px", padding: "1px 8px" }}>Inactive</span>}
              {customer.created_at && <span style={{ fontSize: "11px", color: "#aaa" }}>Member since {fmtDate(customer.created_at)}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Btn variant="ghost" onClick={loadAll}><RefreshCw size={13} /></Btn>
          <Btn variant="ghost" onClick={() => onNavigate("/rentals/new")}><TrendingUp size={13} /> New Rental</Btn>
        </div>
      </div>

      {/* stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "12px", marginBottom: "24px" }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: s.color.bg, border: `1px solid ${s.color.border}`, borderRadius: "12px", padding: "16px 18px" }}>
            <div style={{ fontSize: "11px", color: s.color.text, marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: s.color.text, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* contact + address */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <Card>
          <CardHeader title={<span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Phone size={13} /> Contact</span>} />
          <div style={{ padding: "6px 18px 14px" }}>
            <EditField label="Phone"      value={customer.phone ?? ""}           onSave={v => patchCustomer("phone", v)} />
            <EditField label="Alt. Phone" value={customer.alternate_phone ?? ""} onSave={v => patchCustomer("alternate_phone", v)} />
            <EditField label="Email"      value={customer.email ?? ""}           onSave={v => patchCustomer("email", v)} type="email" />
            {isCompany && <>
              <EditField label="Contact Person"       value={customer.contact_person ?? ""}       onSave={v => patchCustomer("contact_person", v)} />
              <EditField label="Contact Person Phone" value={customer.contact_person_phone ?? ""}  onSave={v => patchCustomer("contact_person_phone", v)} />
              <EditField label="Contact Person Email" value={customer.contact_person_email ?? ""}  onSave={v => patchCustomer("contact_person_email", v)} type="email" />
            </>}
          </div>
        </Card>
        <Card>
          <CardHeader title={<span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={13} /> Address</span>} />
          <div style={{ padding: "6px 18px 14px" }}>
            <EditField label="Street"  value={customer.address ?? ""} onSave={v => patchCustomer("address", v)} />
            <EditField label="City"    value={customer.city ?? ""}    onSave={v => patchCustomer("city", v)} />
            <EditField label="State"   value={customer.state ?? ""}   onSave={v => patchCustomer("state", v)} />
            <EditField label="Pincode" value={customer.pincode ?? ""} onSave={v => patchCustomer("pincode", v)} />
          </div>
        </Card>
      </div>

      {/* company panels */}
      {isCompany && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <Card>
            <CardHeader title={<span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Shield size={13} /> Tax &amp; Legal</span>} />
            <div style={{ padding: "12px 18px 14px" }}>
              {[customer.gst_number, customer.pan_number, customer.cin_number, customer.tan_number, customer.udyam_number].every(v => !v)
                ? <div style={{ fontSize: "13px", color: "#ccc", textAlign: "center", padding: "16px 0" }}>No identifiers on file</div>
                : <><IdChip label="GSTIN" value={customer.gst_number} /><IdChip label="PAN" value={customer.pan_number} /><IdChip label="CIN" value={customer.cin_number} /><IdChip label="TAN" value={customer.tan_number} /><IdChip label="Udyam" value={customer.udyam_number} /></>
              }
            </div>
          </Card>
          <Card>
            <CardHeader title={<span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Building2 size={13} /> Business Details</span>} />
            <div style={{ padding: "6px 18px 14px" }}>
              <InfoRow label="Industry"    value={customer.industry} />
              <InfoRow label="Designation" value={customer.designation} />
              <InfoRow label="Trade Name"  value={customer.trade_name} />
              <InfoRow label="Website"     value={customer.website ? <a href={customer.website} target="_blank" rel="noopener noreferrer" style={{ color: C.blue.text, textDecoration: "none", fontSize: "13px" }}>{customer.website}</a> : null} />
              {(customer.credit_limit || customer.credit_period_days) && <>
                <SubHeading>Credit Terms</SubHeading>
                <InfoRow label="Credit Limit"  value={fmtINR(customer.credit_limit)} />
                <InfoRow label="Credit Period" value={customer.credit_period_days ? `${customer.credit_period_days} days` : null} />
              </>}
            </div>
          </Card>
        </div>
      )}

      {/* individual identity */}
      {!isCompany && (customer.aadhar_number || customer.pan_number_individual) && (
        <div style={{ marginBottom: "20px" }}>
          <Card>
            <CardHeader title={<span style={{ display: "flex", alignItems: "center", gap: "6px" }}><User size={13} /> Identity Documents</span>} />
            <div style={{ padding: "12px 18px 14px" }}>
              <IdChip label="Aadhaar" value={customer.aadhar_number} />
              <IdChip label="PAN"     value={customer.pan_number_individual} />
            </div>
          </Card>
        </div>
      )}

      {customer.notes && (
        <div style={{ marginBottom: "20px" }}>
          <Card>
            <CardHeader title="Internal Notes" />
            <div style={{ padding: "14px 18px", fontSize: "13px", color: "#555", lineHeight: 1.6 }}>{customer.notes}</div>
          </Card>
        </div>
      )}

      {/* ══ TABS ══ */}
      <Card>
        {/* tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #f0eeeb", paddingLeft: "4px", overflowX: "auto" }}>
          {TABS.map(t => {
            const count  = tabCount[t.id];
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "11px 18px", fontSize: "13px",
                fontWeight: active ? 500 : 400,
                color: active ? "#1650b0" : "#888",
                background: "none", border: "none",
                borderBottom: active ? "2px solid #1a6ef5" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const,
              }}>
                {t.label}
                {count !== undefined && (
                  <span style={{ marginLeft: "6px", fontSize: "11px", background: active ? C.blue.bg : "#f0eeeb", color: active ? C.blue.text : "#999", padding: "1px 7px", borderRadius: "99px" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "#999", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>Recent Rentals</div>
                {rentals.length === 0
                  ? <div style={{ color: "#bbb", fontSize: "13px" }}>No rentals yet.</div>
                  : rentals.slice(0, 5).map(r => (
                    <div key={r.id} onClick={() => onNavigate(`/rentals/${r.id}`)}
                      style={{ padding: "10px 12px", borderRadius: "8px", marginBottom: "6px", background: "#fafaf8", border: "1px solid #f0eeeb", cursor: "pointer", fontSize: "13px" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue.border; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0eeeb"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 500 }}>R-{r.id}</span>
                        <span style={{ fontSize: "11px", color: r.status === "ONGOING" ? C.blue.text : "#999" }}>{r.status}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                        {fmtDate(r.created_at)} · {fmtINR(r.total_amount)} · {r.items_detail?.length ?? 0} laptop{(r.items_detail?.length ?? 0) !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))
                }
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "#999", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "10px" }}>Recent Sales</div>
                {sales.length === 0
                  ? <div style={{ color: "#bbb", fontSize: "13px" }}>No sales yet.</div>
                  : sales.slice(0, 5).map(s => (
                    <div key={s.id} onClick={() => onNavigate(`/sales/${s.id}`)}
                      style={{ padding: "10px 12px", borderRadius: "8px", marginBottom: "6px", background: "#fafaf8", border: "1px solid #f0eeeb", cursor: "pointer", fontSize: "13px" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal.border; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0eeeb"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 500 }}>Sale #{s.id}</span>
                        <span style={{ fontSize: "11px", color: C.teal.text }}>{s.status}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{fmtDate(s.created_at)} · {fmtINR(s.total_amount)}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── History ── */}
        {tab === "history" && (
          <CustomerHistoryTimeline events={history} onNavigate={onNavigate} />
        )}


        {/* ── Current Allocated Laptops ── */}
        {tab === "allocated" && (
          <CurrentAllocatedLaptops customerId={id} onNavigate={onNavigate} />
        )}

        {/* ── Sales ── */}
        {tab === "sales" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  {["Sale ID", "Items", "Date", "Amount", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.length === 0
                  ? <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#bbb" }}>No sales found.</td></tr>
                  : sales.map(s => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: "11px", color: "#888" }}>#{s.id}</td>
                      <td style={{ padding: "11px 14px" }}>{s.total_items || s.items_detail?.length || 0} item{(s.total_items || 0) !== 1 ? "s" : ""}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "#888" }}>{fmtDate(s.created_at)}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 500 }}>{fmtINR(s.total_amount)}</td>
                      <td style={{ padding: "11px 14px" }}><Badge color={s.status === "COMPLETED" ? "teal" : "amber"}>{s.status}</Badge></td>
                      <td style={{ padding: "11px 14px" }}><Btn size="sm" variant="ghost" onClick={() => onNavigate(`/sales/${s.id}`)}>View</Btn></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ── Invoices ── */}
        {tab === "invoices" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#fafaf8" }}>
                  {["Invoice No.", "Type", "Date", "Amount", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0
                  ? <tr><td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#bbb" }}>No invoices found.</td></tr>
                  : invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: "12px" }}>{inv.invoice_number}</td>
                      <td style={{ padding: "11px 14px" }}><Badge color="gray">{inv.invoice_type}</Badge></td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "#888" }}>{fmtDate(inv.created_at)}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 500 }}>{fmtINR(inv.total_amount)}</td>
                      <td style={{ padding: "11px 14px" }}><Badge color={inv.status === "PAID" ? "teal" : inv.status === "UNPAID" ? "amber" : "gray"}>{inv.status}</Badge></td>
                      <td style={{ padding: "11px 14px" }}><Btn size="sm" variant="ghost" onClick={() => onNavigate(`/accounts/invoices/${inv.id}`)}>View</Btn></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ── Full Profile ── */}
        {tab === "profile" && (
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <SubHeading>Basic</SubHeading>
              <InfoRow label="Customer Type" value={customerTypeBadge(customer.customer_type)} />
              <InfoRow label="Name"          value={customer.name} />
              {customer.trade_name && <InfoRow label="Trade Name" value={customer.trade_name} />}
              <InfoRow label="Phone"         value={customer.phone} />
              <InfoRow label="Alt. Phone"    value={customer.alternate_phone} />
              <InfoRow label="Email"         value={customer.email} />
              <InfoRow label="Address"       value={customer.full_address || customer.address} />
              <InfoRow label="Member Since"  value={fmtDate(customer.created_at)} />
              {isCompany && <>
                <SubHeading>Company</SubHeading>
                <InfoRow label="Contact Person" value={customer.contact_person} />
                <InfoRow label="Designation"    value={customer.designation} />
                <InfoRow label="Contact Email"  value={customer.contact_person_email} />
                <InfoRow label="Contact Phone"  value={customer.contact_person_phone} />
                <InfoRow label="Industry"       value={customer.industry} />
                <InfoRow label="Website"        value={customer.website} />
              </>}
            </div>
            <div>
              {isCompany && <>
                <SubHeading>Tax &amp; Legal</SubHeading>
                <InfoRow label="GSTIN"     value={customer.gst_number} />
                <InfoRow label="PAN"       value={customer.pan_number} />
                <InfoRow label="CIN"       value={customer.cin_number} />
                <InfoRow label="TAN"       value={customer.tan_number} />
                <InfoRow label="Udyam No." value={customer.udyam_number} />
                <SubHeading>Credit Terms</SubHeading>
                <InfoRow label="Credit Limit"  value={fmtINR(customer.credit_limit)} />
                <InfoRow label="Credit Period" value={customer.credit_period_days ? `${customer.credit_period_days} days` : null} />
              </>}
              {!isCompany && <>
                <SubHeading>Identity</SubHeading>
                <InfoRow label="Aadhaar" value={customer.aadhar_number} />
                <InfoRow label="PAN"     value={customer.pan_number_individual} />
              </>}
              <SubHeading>Financials</SubHeading>
              <InfoRow label="Total Rentals"  value={summary?.rentals?.total ?? rentals.length} />
              <InfoRow label="Rental Revenue" value={fmtINR(summary?.rentals?.revenue ?? 0)} />
              <InfoRow label="Total Sales"    value={summary?.sales?.total ?? sales.length} />
              <InfoRow label="Sales Revenue"  value={fmtINR(summary?.sales?.revenue ?? 0)} />
              <InfoRow label="Total Revenue"  value={fmtINR(totalRevenue)} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}