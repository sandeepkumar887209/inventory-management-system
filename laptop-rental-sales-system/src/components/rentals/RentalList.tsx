import React, { useEffect, useState, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import api from "../../services/axios";
import {
  Card, CardHeader, SectionTitle, Btn, Input, Table,
  statusBadge, Badge, Spinner, fmtDate, fmtINR, daysDiff, C,
} from "./ui";

const STATUS_FILTERS = [
  { key: "ALL",      label: "All"      },
  { key: "ONGOING",  label: "Ongoing"  },
  { key: "RETURNED", label: "Returned" },
  { key: "REPLACED", label: "Replaced" },
];

const PAGE_SIZE = 12;

export function RentalList({ onNavigate }) {
  const [rentals,  setRentals]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");
  const [page,     setPage]     = useState(1);

  useEffect(() => { fetchRentals(); }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rentals/rental/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setRentals(data);
    } catch (err) {
      console.error("Rentals fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Overdue detection */
  const withOverdue = rentals.map((r) => {
    if (r.status !== "ONGOING" || !r.expected_return_date) return r;
    const diff = daysDiff(r.expected_return_date);
    return diff !== null && diff < 0 ? { ...r, _overdue: true } : r;
  });

  const filtered = withOverdue.filter((r) => {
    const q   = search.toLowerCase();
    const name = (r.customer_detail?.name ?? "").toLowerCase();
    const matchSearch = !q || name.includes(q) || String(r.id).includes(q);

    let matchStatus = filter === "ALL" || r.status === filter;
    if (filter === "ONGOING" && r._overdue) matchStatus = true;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key:    "id",
      label:  "Rental ID",
      render: (r) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#888" }}>
          R-{r.id}
        </span>
      ),
    },
    {
      key:    "customer",
      label:  "Customer",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.customer_detail?.name ?? "—"}</div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
            {r.customer_detail?.phone ?? ""}
          </div>
        </div>
      ),
    },
    {
      key:    "laptops",
      label:  "Laptops",
      render: (r) => (
        <span style={{ color: "#555" }}>
          {r.items_detail?.length ?? 0} unit{(r.items_detail?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key:    "start",
      label:  "Start date",
      render: (r) => (
        <span style={{ fontSize: "12px", color: "#888" }}>{fmtDate(r.rent_date ?? r.created_at)}</span>
      ),
    },
    {
      key:    "due",
      label:  "Expected return",
      render: (r) => {
        if (!r.expected_return_date) return <span style={{ color: "#ccc" }}>—</span>;
        const diff = daysDiff(r.expected_return_date);
        const isOverdue = r.status === "ONGOING" && diff !== null && diff < 0;
        return (
          <span
            style={{
              fontSize:   "12px",
              color:      isOverdue ? C.red.text : diff !== null && diff <= 3 ? C.amber.text : "#888",
              fontWeight: isOverdue ? 500 : 400,
            }}
          >
            {fmtDate(r.expected_return_date)}
            {isOverdue && (
              <span
                style={{
                  marginLeft: "6px",
                  fontSize:   "10px",
                  background: C.red.bg,
                  color:      C.red.text,
                  padding:    "1px 6px",
                  borderRadius: "99px",
                }}
              >
                {Math.abs(diff)}d overdue
              </span>
            )}
          </span>
        );
      },
    },
    {
      key:    "total",
      label:  "Total",
      render: (r) => (
        <span style={{ fontWeight: 500 }}>{fmtINR(r.total_amount)}</span>
      ),
    },
    {
      key:    "status",
      label:  "Status",
      render: (r) =>
        r._overdue ? <Badge color="red">Overdue</Badge> : statusBadge(r.status),
    },
    {
      key:    "actions",
      label:  "",
      render: (r) => (
        <Btn size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onNavigate(`/rentals/${r.id}`); }}>
          View
        </Btn>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginBottom:   "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            All Rentals
          </h1>
          <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>
            {filtered.length} rental{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Btn variant="primary" onClick={() => onNavigate("/rentals/new")}>
          <Plus size={14} /> New rental
        </Btn>
      </div>

      {/* Filters */}
      <div
        style={{
          background:    "#fff",
          border:        "1px solid #ebebeb",
          borderRadius:  "12px",
          padding:       "14px 16px",
          marginBottom:  "16px",
          display:       "flex",
          alignItems:    "center",
          gap:           "12px",
          flexWrap:      "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <Search
            size={14}
            color="#aaa"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            placeholder="Search customer name or rental ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width:        "100%",
              padding:      "8px 12px 8px 32px",
              border:       "1px solid #e0deda",
              borderRadius: "8px",
              fontSize:     "13px",
              color:        "#1a1a1a",
              background:   "#fafaf8",
              outline:      "none",
              boxSizing:    "border-box",
            }}
          />
        </div>

        {/* Status chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              style={{
                padding:      "6px 14px",
                borderRadius: "99px",
                border:       filter === f.key ? "none" : "1px solid #e0deda",
                background:   filter === f.key ? "#1a6ef5" : "#fff",
                color:        filter === f.key ? "#fff" : "#555",
                fontSize:     "12px",
                fontWeight:   filter === f.key ? 500 : 400,
                cursor:       "pointer",
                transition:   "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={columns}
            rows={paginated}
            onRowClick={(r) => onNavigate(`/rentals/${r.id}`)}
          />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            marginTop:      "12px",
            fontSize:       "12px",
            color:          "#999",
          }}
        >
          <span>
            Page {page} of {totalPages} · {filtered.length} rentals
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Btn>
            <Btn variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
