import React, { useEffect, useState, useCallback } from "react";
import { Wrench, RefreshCw, CheckCircle, Clock, Search, ArrowRight } from "lucide-react";
import api from "../../services/axios";
import {
  T, Card, CardHead, Btn, SearchInput, Select,
  StatusBadge, Spinner, Pagination, fmtDate, fmtINR, Toast, Chip,
} from "./ui";

/* ── Inline action button with remarks prompt ── */
function QuickAction({
  label, icon, variant, onConfirm, disabled,
}: {
  label: string; icon: React.ReactNode; variant: "secondary"|"success"|"danger";
  onConfirm: (remarks: string) => void; disabled?: boolean;
}) {
  const [open,    setOpen]    = useState(false);
  const [remarks, setRemarks] = useState("");

  return (
    <>
      <Btn
        variant={variant} size="sm" icon={icon}
        onClick={() => setOpen(true)} disabled={disabled}
      >
        {label}
      </Btn>
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: T.surface, borderRadius: "14px", padding: "24px",
              width: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700, color: T.text, marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "13px", color: T.muted, marginBottom: "14px" }}>
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
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "14px" }}>
              <Btn variant="secondary" size="sm" onClick={() => { setOpen(false); setRemarks(""); }}>Cancel</Btn>
              <Btn
                variant={variant} size="sm"
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

/* ── Timeline entry ── */
function HistoryItem({ entry }: { entry: any }) {
  const ACTION_ICONS: Record<string, string> = {
    ADDED: "📦", RENTED_OUT: "🔑", RETURNED: "✅",
    SOLD: "💰", SENT_FOR_MAINTENANCE: "🔧", MAINTENANCE_DONE: "✅",
    RETURNED_TO_SUPPLIER: "↩️", WRITTEN_OFF: "🗑️",
    STATUS_CHANGED: "🔄", SPECS_UPDATED: "✏️",
  };
  return (
    <div style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: "14px" }}>{ACTION_ICONS[entry.action] || "🔄"}</span>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 500, color: T.text }}>
          {entry.action_label || entry.action?.replace(/_/g, " ")}
        </div>
        <div style={{ fontSize: "11px", color: T.muted }}>
          {entry.date || (entry.created_at ? new Date(entry.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "")}
          {entry.remarks && ` · ${entry.remarks}`}
        </div>
      </div>
    </div>
  );
}

/* ── Expandable laptop row ── */
function MaintenanceRow({
  laptop, onAction, loading, onNavigate,
}: {
  laptop: any; onAction: (id: number, endpoint: string, remarks: string) => void;
  loading: boolean; onNavigate: (p: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [history,  setHistory]  = useState<any[]>([]);
  const [loadingH, setLoadingH] = useState(false);

  const inMaint = laptop.status === "UNDER_MAINTENANCE";

  const loadHistory = async () => {
    if (history.length > 0) { setExpanded((e) => !e); return; }
    setLoadingH(true);
    setExpanded(true);
    try {
      const res = await api.get(`/inventory/laptops/${laptop.id}/history/`);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setHistory(data.slice(0, 6));
    } catch {
      setHistory([]);
    } finally {
      setLoadingH(false);
    }
  };

  /* ── How long in maintenance? ── */
  let maintDays: number | null = null;
  const maintEntry = history.find((h) => h.action === "SENT_FOR_MAINTENANCE");
  if (maintEntry?.created_at) {
    maintDays = Math.round((Date.now() - new Date(maintEntry.created_at).getTime()) / 86_400_000);
  }

  return (
    <>
      <tr
        style={{ borderBottom: expanded ? "none" : `1px solid ${T.border}` }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bg; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        <td style={{ padding: "12px 16px" }}>
          <div style={{ fontWeight: 600, fontSize: "13px", color: T.text }}>
            {laptop.brand} {laptop.model}
          </div>
          <div style={{ fontSize: "11px", color: T.muted, fontFamily: "monospace", marginTop: "2px" }}>
            {laptop.serial_number}
          </div>
          {laptop.asset_tag && (
            <div style={{ fontSize: "10px", color: "#c0bbb5", marginTop: "1px" }}>{laptop.asset_tag}</div>
          )}
        </td>

        <td style={{ padding: "12px 16px", fontSize: "12px", color: T.muted }}>
          {laptop.processor} · {laptop.ram} · {laptop.storage}
        </td>

        <td style={{ padding: "12px 16px" }}>
          <StatusBadge status={laptop.status} />
        </td>

        <td style={{ padding: "12px 16px", fontSize: "12px", color: T.muted }}>
          {fmtINR(laptop.price)} / {fmtINR(laptop.rent_per_month)}/mo
        </td>

        <td style={{ padding: "12px 16px" }}>
          {maintDays !== null ? (
            <span
              style={{
                fontSize: "11px", fontWeight: 500,
                color: maintDays > 7 ? T.red.text : T.amber.text,
                background: maintDays > 7 ? T.red.bg : T.amber.bg,
                padding: "2px 8px", borderRadius: "99px",
              }}
            >
              {maintDays}d in maint.
            </span>
          ) : (
            <span style={{ color: "#c0bbb5", fontSize: "12px" }}>—</span>
          )}
        </td>

        <td style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {inMaint ? (
              <QuickAction
                label="Mark Done"
                icon={<CheckCircle size={13} />}
                variant="success"
                onConfirm={(r) => onAction(laptop.id, "return-from-maintenance", r)}
                disabled={loading}
              />
            ) : (
              <QuickAction
                label="Send to Maintenance"
                icon={<Wrench size={13} />}
                variant="secondary"
                onConfirm={(r) => onAction(laptop.id, "send-maintenance", r)}
                disabled={loading}
              />
            )}
            <Btn variant="ghost" size="sm" onClick={loadHistory}>
              {expanded ? "Hide" : "History"}
            </Btn>
            <Btn
              variant="ghost" size="sm" icon={<ArrowRight size={12} />}
              onClick={() => onNavigate(`/inventory/${laptop.id}`)}
            />
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ borderBottom: `1px solid ${T.border}` }}>
          <td
            colSpan={6}
            style={{ padding: "0 16px 14px 52px", background: T.bg }}
          >
            {loadingH ? (
              <div style={{ padding: "12px 0", fontSize: "12px", color: T.muted }}>Loading…</div>
            ) : history.length === 0 ? (
              <div style={{ padding: "12px 0", fontSize: "12px", color: "#c0bbb5" }}>No history recorded.</div>
            ) : (
              history.map((h, i) => <HistoryItem key={h.id ?? i} entry={h} />)
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
const PAGE_SIZE = 12;

export function MaintenancePage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [laptops,  setLaptops]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [actBusy,  setActBusy]  = useState(false);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<"all"|"in_maintenance"|"available">("all");
  const [page,     setPage]     = useState(1);
  const [toast,    setToast]    = useState<any>(null);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/laptops/");
      const all: any[] = Array.isArray(res.data) ? res.data : res.data.results || [];
      /* Show only those relevant to maintenance workflow */
      setLaptops(all.filter((l) => !["SOLD","WRITTEN_OFF","RETURNED_TO_SUPPLIER"].includes(l.status)));
    } catch (e) {
      showToast("Failed to load laptops", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: number, endpoint: string, remarks: string) => {
    try {
      setActBusy(true);
      await api.post(`/inventory/laptops/${id}/${endpoint}/`, { remarks });
      showToast("Action completed successfully");
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Action failed", "error");
    } finally {
      setActBusy(false);
    }
  };

  const inMaintCount = laptops.filter((l) => l.status === "UNDER_MAINTENANCE").length;
  const availCount   = laptops.filter((l) => l.status === "AVAILABLE").length;

  const filtered = laptops.filter((l) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      l.brand.toLowerCase().includes(q) ||
      l.model.toLowerCase().includes(q) ||
      l.serial_number.toLowerCase().includes(q);
    const matchF =
      filter === "all" ||
      (filter === "in_maintenance" && l.status === "UNDER_MAINTENANCE") ||
      (filter === "available"      && l.status === "AVAILABLE");
    return matchQ && matchF;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: T.text, margin: 0 }}>Maintenance</h1>
          <p style={{ fontSize: "13px", color: T.muted, marginTop: "4px" }}>
            Track and manage laptop maintenance
          </p>
        </div>
        <Btn variant="secondary" icon={<RefreshCw size={13} />} onClick={load}>
          Refresh
        </Btn>
      </div>

      {/* ── Stat tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>

        <div
          style={{
            background: T.maintenance.bg, border: `1px solid ${T.maintenance.border}`,
            borderRadius: T.radius, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "14px",
          }}
        >
          <Wrench size={22} color={T.maintenance.text} />
          <div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: T.text, lineHeight: 1 }}>{inMaintCount}</div>
            <div style={{ fontSize: "12px", color: T.muted, marginTop: "3px" }}>In Maintenance</div>
          </div>
        </div>

        <div
          style={{
            background: T.available.bg, border: `1px solid ${T.available.border}`,
            borderRadius: T.radius, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "14px",
          }}
        >
          <CheckCircle size={22} color={T.available.text} />
          <div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: T.text, lineHeight: 1 }}>{availCount}</div>
            <div style={{ fontSize: "12px", color: T.muted, marginTop: "3px" }}>Available</div>
          </div>
        </div>

        <div
          style={{
            background: T.blue.bg, border: `1px solid ${T.blue.border}`,
            borderRadius: T.radius, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "14px",
          }}
        >
          <Clock size={22} color={T.blue.text} />
          <div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: T.text, lineHeight: 1 }}>{laptops.length}</div>
            <div style={{ fontSize: "12px", color: T.muted, marginTop: "3px" }}>Total Tracked</div>
          </div>
        </div>

      </div>

      {/* ── Filters ── */}
      <Card style={{ marginBottom: "16px" }}>
        <div
          style={{
            padding: "12px 16px", display: "flex", gap: "10px",
            alignItems: "center", flexWrap: "wrap",
          }}
        >
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search brand, model, serial…"
            style={{ flex: "1 1 220px" }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { key: "all",            label: "All" },
              { key: "in_maintenance", label: "In Maintenance" },
              { key: "available",      label: "Available" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key as any); setPage(1); }}
                style={{
                  padding: "6px 14px", borderRadius: "99px",
                  border: filter === f.key ? "none" : `1px solid ${T.border}`,
                  background: filter === f.key ? T.primary : T.surface,
                  color: filter === f.key ? "#fff" : T.muted,
                  fontSize: "12px", fontWeight: filter === f.key ? 600 : 400,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {["Laptop","Specs","Status","Pricing","Time in Maint.","Actions"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "9px 16px", textAlign: "left",
                          fontSize: "11px", fontWeight: 600, color: T.muted,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ padding: "48px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}
                      >
                        {search ? "No laptops match your search." : "No maintenance records."}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((l) => (
                      <MaintenanceRow
                        key={l.id}
                        laptop={l}
                        onAction={handleAction}
                        loading={actBusy}
                        onNavigate={onNavigate}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
