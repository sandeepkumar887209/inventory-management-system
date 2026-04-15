import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, Plus, RefreshCw,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
} from "lucide-react";
import api from "../../services/axios";
import { C, Badge, Btn, fmtDate, customerTypeBadge } from "./ui";

const PAGE_SIZE = 15;
type SortDir = "asc" | "desc";

/* ─── small helpers ─── */

function Th({
  label, col, sortBy, sortDir, onSort, sortable = true,
  style = {},
}: {
  label: string; col: string; sortBy: string; sortDir: SortDir;
  onSort: (col: string) => void; sortable?: boolean;
  style?: React.CSSProperties;
}) {
  const active = sortBy === col;
  const Icon = active && sortDir === "desc" ? ChevronDown : ChevronUp;
  return (
    <th
      onClick={sortable ? () => onSort(col) : undefined}
      style={{
        padding: "9px 14px", textAlign: "left",
        fontSize: "11px", fontWeight: 500,
        color: active ? "#555" : "#999",
        letterSpacing: "0.05em", textTransform: "uppercase",
        borderBottom: "1px solid #f0eeeb", whiteSpace: "nowrap",
        cursor: sortable ? "pointer" : "default",
        userSelect: "none", ...style,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {label}
        {sortable && (
          <Icon size={10} color={active ? "#555" : "#ccc"} />
        )}
      </span>
    </th>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */

export function CustomerList({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [customers,    setCustomers]    = useState<any[]>([]);
  const [totalCount,   setTotalCount]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("active");
  const [sortBy,       setSortBy]       = useState("created_at");
  const [sortDir,      setSortDir]      = useState<SortDir>("desc");
  const [page,         setPage]         = useState(1);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── build query string ── */

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {
      page:     String(page),
      page_size: String(PAGE_SIZE),
      ordering: `${sortDir === "desc" ? "-" : ""}${sortBy}`,
    };
    if (search.trim())          p.search      = search.trim();
    if (typeFilter !== "all")   p.customer_type = typeFilter;
    if (activeFilter === "active")   p.is_active = "true";
    if (activeFilter === "inactive") p.is_active = "false";
    return new URLSearchParams(p).toString();
  }, [page, sortBy, sortDir, search, typeFilter, activeFilter]);

  /* ── fetch ── */

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/customers/?${buildParams()}`);
      // Handle both paginated { count, results } and plain array responses
      if (Array.isArray(res.data)) {
        setCustomers(res.data);
        setTotalCount(res.data.length);
      } else {
        setCustomers(res.data.results || []);
        setTotalCount(res.data.count || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Debounce search; immediate for other param changes
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { loadCustomers(); }, search ? 350 : 0);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [loadCustomers]);

  /* ── handlers ── */

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleFilter = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  const handleActiveFilter = (val: typeof activeFilter) => {
    setActiveFilter(val);
    setPage(1);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Deactivate this customer? They can be reactivated later.")) return;
    try {
      await api.delete(`/customers/customers/${id}/`);
      // Remove from list or mark inactive depending on current filter
      if (activeFilter === "active") {
        setCustomers(prev => prev.filter(c => c.id !== id));
        setTotalCount(p => p - 1);
      } else {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to deactivate customer.";
      alert(msg);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  /* ── sort helper props ── */
  const sortProps = { sortBy, sortDir, onSort: handleSort };

  /* ════════════════════ RENDER ════════════════════ */

  return (
    <div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>All Customers</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            {loading ? "Loading..." : `${totalCount} customer${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Btn variant="ghost" onClick={loadCustomers} disabled={loading}>
            <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </Btn>
          <Btn variant="primary" onClick={() => onNavigate("/customers/new")}>
            <Plus size={14} /> Add Customer
          </Btn>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "#fff", border: "1px solid #ebebeb", borderRadius: "12px",
        padding: "14px 16px", marginBottom: "16px",
        display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center",
      }}>

        {/* Search */}
        <div style={{ position: "relative", flex: "1", minWidth: "220px" }}>
          <Search size={13} color="#aaa" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            placeholder="Search name, email, phone, GSTIN, PAN..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 32px",
              border: "1px solid #e0deda", borderRadius: "8px",
              fontSize: "13px", color: "#1a1a1a", background: "#fafaf8",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "#ebebeb" }} />

        {/* Type chips */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { key: "all",        label: "All types" },
            { key: "individual", label: "Individual" },
            { key: "company",    label: "Corporate"  },
          ].map(f => (
            <button key={f.key} onClick={() => handleFilter(f.key)}
              style={{
                padding: "5px 13px", borderRadius: "99px", cursor: "pointer",
                border: typeFilter === f.key ? "none" : "1px solid #e0deda",
                background: typeFilter === f.key ? C.blue.solid : "#fff",
                color:      typeFilter === f.key ? "#fff" : "#555",
                fontSize: "12px", fontWeight: typeFilter === f.key ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "28px", background: "#ebebeb" }} />

        {/* Active / inactive chips */}
        <div style={{ display: "flex", gap: "6px" }}>
          {([
            { key: "active",   label: "Active",   color: C.teal },
            { key: "inactive", label: "Inactive", color: C.red  },
            { key: "all",      label: "Both",     color: C.gray },
          ] as const).map(f => (
            <button key={f.key} onClick={() => handleActiveFilter(f.key)}
              style={{
                padding: "5px 13px", borderRadius: "99px", cursor: "pointer",
                border: activeFilter === f.key ? `1px solid ${f.color.border}` : "1px solid #e0deda",
                background: activeFilter === f.key ? f.color.bg : "#fff",
                color: activeFilter === f.key ? f.color.text : "#555",
                fontSize: "12px", fontWeight: activeFilter === f.key ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "14px", overflow: "hidden" }}>
        {loading && customers.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
            Loading customers...
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto", opacity: loading ? 0.5 : 1, transition: "opacity 0.15s" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#fafaf8" }}>
                    <Th label="Customer"     col="name"          {...sortProps} />
                    <Th label="Type"         col="customer_type" {...sortProps} />
                    <Th label="Contact"      col="phone"         {...sortProps} sortable={false} />
                    <Th label="Location"     col="city"          {...sortProps} />
                    <Th label="GST / ID"     col="gst_number"    {...sortProps} sortable={false} />
                    <Th label="Joined"       col="created_at"    {...sortProps} />
                    <Th label=""             col=""              {...sortProps} sortable={false} style={{ textAlign: "right" }} />
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}
                      onClick={() => onNavigate(`/customers/${c.id}`)}
                      style={{
                        borderBottom: "1px solid #f5f4f1",
                        cursor: "pointer", transition: "background 0.1s",
                        opacity: c.is_active === false ? 0.55 : 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fafaf8"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                    >
                      {/* Customer name + avatar */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                            background: c.customer_type === "company" ? C.blue.bg : C.teal.bg,
                            border: `1px solid ${c.customer_type === "company" ? C.blue.border : C.teal.border}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "12px", fontWeight: 600,
                            color: c.customer_type === "company" ? C.blue.text : C.teal.text,
                          }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                              {c.name}
                              {c.is_active === false && (
                                <span style={{
                                  fontSize: "10px", color: C.red.text, background: C.red.bg,
                                  border: `0.5px solid ${C.red.border}`, borderRadius: "99px",
                                  padding: "1px 6px",
                                }}>
                                  Inactive
                                </span>
                              )}
                            </div>
                            {/* Show trade name below if different */}
                            {c.trade_name && c.trade_name !== c.name && (
                              <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>{c.trade_name}</div>
                            )}
                            <div style={{ fontSize: "11px", color: "#aaa", marginTop: "1px", fontFamily: "monospace" }}>
                              ID-{c.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "12px 14px" }}>{customerTypeBadge(c.customer_type)}</td>

                      {/* Contact */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: "13px", color: "#555" }}>{c.phone}</div>
                        {c.email && (
                          <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{c.email}</div>
                        )}
                        {/* Show contact person for companies */}
                        {c.customer_type === "company" && c.contact_person && (
                          <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                            {c.contact_person}{c.designation ? ` · ${c.designation}` : ""}
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#555" }}>
                        {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                      </td>

                      {/* GST / ID */}
                      <td style={{ padding: "12px 14px" }}>
                        {c.customer_type === "company" && c.gst_number ? (
                          <code style={{
                            fontSize: "11px", background: "#f0eeeb",
                            padding: "2px 7px", borderRadius: "5px",
                            color: "#555", letterSpacing: "0.03em",
                          }}>
                            {c.gst_number}
                          </code>
                        ) : c.customer_type === "individual" && c.pan_number_individual ? (
                          <code style={{
                            fontSize: "11px", background: "#f0eeeb",
                            padding: "2px 7px", borderRadius: "5px", color: "#555",
                          }}>
                            {c.pan_number_individual}
                          </code>
                        ) : (
                          <span style={{ color: "#ccc", fontSize: "12px" }}>—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#888" }}>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
                          onClick={e => e.stopPropagation()}>
                          <Btn size="sm" variant="ghost" onClick={() => onNavigate(`/customers/${c.id}`)}>
                            View
                          </Btn>
                          {c.is_active !== false ? (
                            <Btn size="sm" variant="danger" onClick={e => handleDelete(c.id, e)}>
                              Deactivate
                            </Btn>
                          ) : (
                            <Btn size="sm" variant="success" onClick={async e => {
                              e.stopPropagation();
                              try {
                                await api.post(`/customers/customers/${c.id}/activate/`);
                                setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, is_active: true } : x));
                              } catch { alert("Failed to reactivate."); }
                            }}>
                              Activate
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                        {search ? `No customers match "${search}".` : "No customers found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(totalPages > 1 || totalCount > 0) && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderTop: "1px solid #f0eeeb",
                fontSize: "12px", color: "#888",
              }}>
                <span>
                  Page {page} of {Math.max(totalPages, 1)}
                  {" · "}{totalCount} total
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(1)}>«</Btn>
                  <Btn size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={13} /> Prev
                  </Btn>
                  <Btn size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight size={13} />
                  </Btn>
                  <Btn size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}