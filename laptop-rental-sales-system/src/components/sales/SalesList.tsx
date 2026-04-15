import React, { useEffect, useState } from "react";
import { Search, Plus, RefreshCw, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/axios";
import {
  S, SCard, SBtn, SBadge, saleBadge, paymentBadge,
  fmtINR, fmtDate,
} from "./salesUi";

const STATUS_FILTERS = [
  { key: "ALL",       label: "All"       },
  { key: "COMPLETED", label: "Completed" },
  { key: "RETURNED",  label: "Returned"  },
];

const PAGE_SIZE = 14;

export function SalesList({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [sales,   setSales]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");
  const [sort,    setSort]    = useState<"asc" | "desc">("desc");
  const [page,    setPage]    = useState(1);

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales/sale/");
      setSales(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (s.customer_detail?.name ?? "").toLowerCase().includes(q) ||
      String(s.id).includes(q) ||
      (s.customer_detail?.phone ?? "").includes(q);
    const matchFilter = filter === "ALL" || s.status === filter;
    return matchSearch && matchFilter;
  }).sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sort === "desc" ? db - da : da - db;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalRevenue = filtered
    .filter((s) => s.status === "COMPLETED")
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  const columns = [
    {
      key: "id",
      label: "Sale #",
      render: (s: any) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#94a3b8" }}>#{s.id}</span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (s: any) => (
        <div>
          <div style={{ fontWeight: 500, color: "#0f172a" }}>{s.customer_detail?.name ?? "—"}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>
            {s.customer_detail?.phone ?? ""}
          </div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Units",
      render: (s: any) => {
        const n = s.total_items ?? s.items_detail?.length ?? 0;
        return <span style={{ color: "#64748b" }}>{n} laptop{n !== 1 ? "s" : ""}</span>;
      },
    },
    {
      key: "subtotal",
      label: "Subtotal",
      render: (s: any) => (
        <span style={{ fontSize: "12px", color: "#64748b" }}>{fmtINR(s.subtotal)}</span>
      ),
    },
    {
      key: "gst",
      label: "GST",
      render: (s: any) => (
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{s.gst}%</span>
      ),
    },
    {
      key: "total_amount",
      label: "Total",
      render: (s: any) => (
        <span style={{ fontWeight: 600, color: "#0f172a" }}>{fmtINR(s.total_amount)}</span>
      ),
    },
    {
      key: "created_at",
      label: "Date",
      render: (s: any) => (
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{fmtDate(s.created_at)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (s: any) => saleBadge(s.status),
    },
    {
      key: "actions",
      label: "",
      render: (s: any) => (
        <SBtn
          size="sm" variant="ghost"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onNavigate(`/sales/${s.id}`); }}
        >
          View
        </SBtn>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "24px",
      }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
            All Sales
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            {loading ? "Loading…" : `${filtered.length} sale${filtered.length !== 1 ? "s" : ""} · ${fmtINR(totalRevenue)} total`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <SBtn variant="ghost" onClick={fetchSales}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </SBtn>
          <SBtn variant="primary" onClick={() => onNavigate("/sales/new")}>
            <Plus size={14} /> New Sale
          </SBtn>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
        background: "#fff", border: "1px solid #edecea",
        borderRadius: "12px", padding: "12px 16px",
        marginBottom: "16px",
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <Search size={13} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search customer name, phone, sale ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: "100%", padding: "8px 12px 8px 30px",
              border: "1px solid #e2e8f0", borderRadius: "8px",
              fontSize: "13px", color: "#0f172a", background: "#fafaf9",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Status filter chips */}
        <div style={{ display: "flex", gap: "6px" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              style={{
                padding: "6px 14px", borderRadius: "99px",
                border: filter === f.key ? "none" : "1px solid #e2e8f0",
                background: filter === f.key ? S.indigo.solid : "#fff",
                color: filter === f.key ? "#fff" : "#64748b",
                fontSize: "12px", fontWeight: filter === f.key ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <button
          onClick={() => setSort((s) => s === "desc" ? "asc" : "desc")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
            background: "#fff", color: "#64748b", fontSize: "12px", cursor: "pointer",
          }}
        >
          <Filter size={12} />
          {sort === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", border: "1px solid #edecea",
        borderRadius: "14px", overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
            Loading sales…
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#fafaf9" }}>
                    {columns.map((col) => (
                      <th key={col.key} style={{
                        padding: "10px 16px", textAlign: "left",
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
                  {paginated.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => onNavigate(`/sales/${s.id}`)}
                      style={{ borderBottom: "1px solid #f8f7f5", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fafaf9"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      {columns.map((col) => (
                        <td key={col.key} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          {col.render ? col.render(s) : (s as any)[col.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} style={{ padding: "48px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
                        {search ? "No sales match your search." : "No sales yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderTop: "1px solid #f1f0ee",
                fontSize: "12px", color: "#94a3b8",
              }}>
                <span>
                  Page {page} of {totalPages} · {filtered.length} sales
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <SBtn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={13} /> Prev
                  </SBtn>
                  <SBtn variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRight size={13} />
                  </SBtn>
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
