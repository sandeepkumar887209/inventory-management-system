import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import api from "../../services/axios";
import { Card, Btn, Table, statusBadge, Badge, Spinner, fmtDate, fmtINR, daysDiff, C, PURPOSE_LABELS } from "./ui";

const STATUS_FILTERS = [
  { key: "ALL",              label: "All"            },
  { key: "ONGOING",          label: "Ongoing"        },
  { key: "RETURNED",         label: "Returned"       },
  { key: "CONVERTED_RENTAL", label: "→ Rental"       },
  { key: "CONVERTED_SALE",   label: "→ Sale"         },
];

const PAGE_SIZE = 12;

export function DemoList({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [demos,   setDemos]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");
  const [page,    setPage]    = useState(1);

  useEffect(() => { fetchDemos(); }, []);

  const fetchDemos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/demos/demo/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setDemos(data);
    } catch (err) {
      console.error("Demo fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const withOverdue = demos.map((d) => {
    if (d.status !== "ONGOING" || !d.expected_return_date) return d;
    const diff = daysDiff(d.expected_return_date);
    return diff !== null && diff < 0 ? { ...d, _overdue: true } : d;
  });

  const filtered = withOverdue.filter((d) => {
    const q = search.toLowerCase();
    const name = (d.customer_detail?.name ?? "").toLowerCase();
    const matchSearch = !q || name.includes(q) || String(d.id).includes(q);
    const matchStatus = filter === "ALL" || d.status === filter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: "id", label: "Demo ID",
      render: (d: any) => <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#888" }}>D-{d.id}</span>,
    },
    {
      key: "customer", label: "Customer",
      render: (d: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{d.customer_detail?.name ?? "—"}</div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{d.customer_detail?.phone ?? ""}</div>
        </div>
      ),
    },
    {
      key: "purpose", label: "Purpose",
      render: (d: any) => (
        <span style={{ color: "#555", fontSize: "12px" }}>
          {PURPOSE_LABELS[d.purpose] ?? d.purpose ?? "—"}
        </span>
      ),
    },
    {
      key: "laptops", label: "Laptops",
      render: (d: any) => {
        const count = d.items_detail?.length ?? 0;
        return <span style={{ color: "#555" }}>{count} unit{count !== 1 ? "s" : ""}</span>;
      },
    },
    {
      key: "assigned", label: "Assigned",
      render: (d: any) => <span style={{ fontSize: "12px", color: "#888" }}>{fmtDate(d.assigned_date ?? d.created_at)}</span>,
    },
    {
      key: "due", label: "Return due",
      render: (d: any) => {
        if (!d.expected_return_date) return <span style={{ color: "#ccc" }}>—</span>;
        const diff = daysDiff(d.expected_return_date);
        const isOver = d.status === "ONGOING" && diff !== null && diff < 0;
        return (
          <span style={{ fontSize: "12px", color: isOver ? C.red.text : diff !== null && diff <= 2 ? C.amber.text : "#888", fontWeight: isOver ? 500 : 400 }}>
            {fmtDate(d.expected_return_date)}
            {isOver && <span style={{ marginLeft: "6px", fontSize: "10px", background: C.red.bg, color: C.red.text, padding: "1px 6px", borderRadius: "99px" }}>{Math.abs(diff!)}d overdue</span>}
          </span>
        );
      },
    },
    {
      key: "status", label: "Status",
      render: (d: any) => d._overdue ? <Badge color="red">Overdue</Badge> : statusBadge(d.status),
    },
    {
      key: "feedback", label: "Feedback",
      render: (d: any) => (
        <span style={{ fontSize: "12px", color: d.feedback_received ? C.green.text : "#bbb" }}>
          {d.feedback_received ? "✓ Received" : "Pending"}
        </span>
      ),
    },
    {
      key: "actions", label: "",
      render: (d: any) => (
        <Btn size="sm" variant="ghost" onClick={(e: any) => { e?.stopPropagation?.(); onNavigate(`/demos/${d.id}`); }}>View</Btn>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>All Demos</h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>{filtered.length} demo{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn variant="primary" onClick={() => onNavigate("/demos/new")}><Plus size={14} /> New demo</Btn>
      </div>

      {/* Filters */}
      <div style={{
        background: "#fff", border: "1px solid #ebebeb", borderRadius: "12px",
        padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
      }}>
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search size={14} color="#aaa" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search customer name or demo ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: "100%", padding: "8px 12px 8px 32px", border: "1px solid #e0deda",
              borderRadius: "8px", fontSize: "13px", color: "#1a1a1a", background: "#fafaf8", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              style={{
                padding: "6px 14px", borderRadius: "99px",
                border: filter === f.key ? "none" : "1px solid #e0deda",
                background: filter === f.key ? C.violet.solid : "#fff",
                color: filter === f.key ? "#fff" : "#555",
                fontSize: "12px", fontWeight: filter === f.key ? 500 : 400,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? <Spinner /> : (
          <Table columns={columns} rows={paginated} onRowClick={(d) => onNavigate(`/demos/${d.id}`)} />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "12px", color: "#999" }}>
          <span>Page {page} of {totalPages} · {filtered.length} demos</span>
          <div style={{ display: "flex", gap: "6px" }}>
            <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Btn>
            <Btn variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
