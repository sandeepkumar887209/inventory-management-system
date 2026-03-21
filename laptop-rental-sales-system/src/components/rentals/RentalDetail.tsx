import React, { useEffect, useState } from "react";
import { ChevronLeft, RotateCcw, RefreshCw, Check } from "lucide-react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import {
  Card, CardHeader, Btn, Badge, Spinner,
  statusBadge, fmtDate, fmtINR, daysDiff, C,
} from "./ui";

export function RentalDetail({ onBack }) {
  const { id }        = useParams();
  const [rental,      setRental]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showReturn,  setShowReturn]  = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [available,   setAvailable]   = useState([]);
  const [checkedIds,  setCheckedIds]  = useState([]);
  const [oldLaptop,   setOldLaptop]   = useState("");
  const [newLaptop,   setNewLaptop]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rentals/rental/${id}/`);
      setRental(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailable = async () => {
    try {
      const res = await api.get("/inventory/laptops/?status=AVAILABLE");
      setAvailable(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) { console.error(e); }
  };

  const handleReturn = async () => {
    if (checkedIds.length === 0) return;
    try {
      setSubmitting(true);
      await api.post(`/rentals/rental/${id}/return_laptops/`, { laptops: checkedIds });
      setShowReturn(false);
      setCheckedIds([]);
      load();
    } catch (err) {
      alert(err.response?.data?.error ?? "Return failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplace = async () => {
    if (!oldLaptop || !newLaptop) return;
    try {
      setSubmitting(true);
      await api.post(`/rentals/rental/${id}/replace_laptop/`, {
        old_laptop: Number(oldLaptop),
        new_laptop: Number(newLaptop),
      });
      setShowReplace(false);
      setOldLaptop("");
      setNewLaptop("");
      load();
    } catch (err) {
      alert(err.response?.data?.error ?? "Replacement failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!rental)  return <div style={{ padding: "40px", color: "#bbb", textAlign: "center" }}>Rental not found.</div>;

  const dueIn  = daysDiff(rental.expected_return_date);
  const isOngoing  = rental.status === "ONGOING";
  const isOverdue  = isOngoing && dueIn !== null && dueIn < 0;
  const rentedItems = rental.items_detail?.filter((i) => i.laptop?.status === "RENTED") ?? [];

  return (
    <div style={{ maxWidth: "800px" }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            "6px",
          fontSize:       "13px",
          color:          "#888",
          background:     "none",
          border:         "none",
          cursor:         "pointer",
          marginBottom:   "20px",
          padding:        0,
        }}
      >
        <ChevronLeft size={15} /> Back to rentals
      </button>

      {/* Header */}
      <div
        style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          marginBottom:   "20px",
          gap:            "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            Rental R-{rental.id}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            {isOverdue ? <Badge color="red">Overdue by {Math.abs(dueIn)}d</Badge> : statusBadge(rental.status)}
            {isOngoing && !isOverdue && dueIn !== null && dueIn <= 7 && (
              <Badge color="amber">Due in {dueIn}d</Badge>
            )}
          </div>
        </div>

        {isOngoing && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <Btn
              variant="ghost"
              onClick={() => { setShowReturn(!showReturn); setShowReplace(false); }}
            >
              <RotateCcw size={13} /> Return
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => { setShowReplace(!showReplace); setShowReturn(false); loadAvailable(); }}
            >
              <RefreshCw size={13} /> Replace
            </Btn>
          </div>
        )}
      </div>

      {/* Return inline panel */}
      {showReturn && (
        <div
          style={{
            background:    C.teal.bg,
            border:        `1px solid ${C.teal.border}`,
            borderRadius:  "12px",
            padding:       "16px",
            marginBottom:  "16px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 500, color: C.teal.text, marginBottom: "12px" }}>
            Select laptops to return
          </div>
          {rentedItems.map((item) => (
            <label
              key={item.id}
              style={{
                display:       "flex",
                alignItems:    "center",
                gap:           "10px",
                padding:       "8px 10px",
                border:        "1px solid " + (checkedIds.includes(item.laptop.id) ? C.teal.solid : "#c0e8d0"),
                borderRadius:  "8px",
                marginBottom:  "6px",
                cursor:        "pointer",
                background:    checkedIds.includes(item.laptop.id) ? "#fff" : "transparent",
                fontSize:      "13px",
              }}
            >
              <input
                type="checkbox"
                checked={checkedIds.includes(item.laptop.id)}
                onChange={() =>
                  setCheckedIds((prev) =>
                    prev.includes(item.laptop.id)
                      ? prev.filter((x) => x !== item.laptop.id)
                      : [...prev, item.laptop.id]
                  )
                }
                style={{ accentColor: C.teal.solid }}
              />
              <span style={{ fontWeight: 500 }}>{item.laptop.brand} {item.laptop.model}</span>
              <span style={{ color: "#888", fontSize: "11px" }}>{item.laptop.serial_number}</span>
            </label>
          ))}
          {rentedItems.length === 0 && (
            <div style={{ fontSize: "13px", color: "#aaa" }}>No returnable laptops.</div>
          )}
          {checkedIds.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <Btn variant="success" onClick={handleReturn} disabled={submitting}>
                <Check size={13} />
                {submitting ? "Processing..." : `Confirm return (${checkedIds.length})`}
              </Btn>
              <Btn variant="ghost" onClick={() => { setShowReturn(false); setCheckedIds([]); }}>
                Cancel
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* Replace inline panel */}
      {showReplace && (
        <div
          style={{
            background:    C.amber.bg,
            border:        `1px solid ${C.amber.border}`,
            borderRadius:  "12px",
            padding:       "16px",
            marginBottom:  "16px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 500, color: C.amber.text, marginBottom: "12px" }}>
            Swap a laptop
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#888", marginBottom: "4px", display: "block" }}>
                Remove
              </label>
              <select
                value={oldLaptop}
                onChange={(e) => setOldLaptop(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px",
                  border: "1px solid #ffdfa0", borderRadius: "8px",
                  fontSize: "13px", background: "#fff", outline: "none",
                }}
              >
                <option value="">Select laptop</option>
                {rentedItems.map((item) => (
                  <option key={item.laptop.id} value={item.laptop.id}>
                    {item.laptop.brand} {item.laptop.model} ({item.laptop.serial_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#888", marginBottom: "4px", display: "block" }}>
                Replacement
              </label>
              <select
                value={newLaptop}
                onChange={(e) => setNewLaptop(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px",
                  border: "1px solid #ffdfa0", borderRadius: "8px",
                  fontSize: "13px", background: "#fff", outline: "none",
                }}
              >
                <option value="">Select laptop</option>
                {available.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.brand} {l.model} ({l.serial_number})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {oldLaptop && newLaptop && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <Btn
                variant="primary"
                style={{ background: C.amber.solid }}
                onClick={handleReplace}
                disabled={submitting}
              >
                <RefreshCw size={13} />
                {submitting ? "Processing..." : "Confirm swap"}
              </Btn>
              <Btn variant="ghost" onClick={() => { setShowReplace(false); setOldLaptop(""); setNewLaptop(""); }}>
                Cancel
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* Main cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Customer */}
        <Card>
          <CardHeader title="Customer" />
          <div style={{ padding: "14px 16px", fontSize: "13px" }}>
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>{rental.customer_detail?.name}</div>
            <div style={{ color: "#888" }}>{rental.customer_detail?.phone}</div>
            {rental.customer_detail?.email && (
              <div style={{ color: "#888", marginTop: "2px" }}>{rental.customer_detail.email}</div>
            )}
          </div>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader title="Summary" />
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            {[
              ["Rent date",    fmtDate(rental.rent_date ?? rental.created_at)],
              ["Expected return", fmtDate(rental.expected_return_date)],
              ["Subtotal",     fmtINR(rental.subtotal)],
              ["GST",          `${rental.gst}%`],
              ["Total",        fmtINR(rental.total_amount)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>{label}</span>
                <span style={{ fontWeight: label === "Total" ? 600 : 400 }}>{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Laptops */}
      <Card>
        <CardHeader title={`Laptops (${rental.items_detail?.length ?? 0})`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafaf8" }}>
                {["Laptop", "Serial", "Specs", "Rent price", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 14px", textAlign: "left",
                      fontSize: "11px", fontWeight: 500, color: "#999",
                      letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rental.items_detail ?? []).map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                  <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                    {item.laptop?.brand} {item.laptop?.model}
                  </td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: "11px", color: "#888" }}>
                    {item.laptop?.serial_number}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "11px", color: "#888" }}>
                    {[item.laptop?.processor, item.laptop?.ram, item.laptop?.storage]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                    {fmtINR(item.rent_price)}<span style={{ fontSize: "10px", color: "#aaa" }}>/mo</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {item.laptop?.status === "RENTED" ? (
                      <Badge color="blue">Rented</Badge>
                    ) : item.laptop?.status === "AVAILABLE" ? (
                      <Badge color="teal">Returned</Badge>
                    ) : (
                      <Badge color="gray">{item.laptop?.status}</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {(rental.items_detail ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "28px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* History (child rentals) */}
      {rental.history?.length > 0 && (
        <Card style={{ marginTop: "16px" }}>
          <CardHeader title="History" />
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {rental.history.map((h) => (
              <div
                key={h.id}
                style={{
                  display:       "flex",
                  justifyContent:"space-between",
                  alignItems:    "center",
                  padding:       "8px 10px",
                  background:    "#fafaf8",
                  borderRadius:  "8px",
                  fontSize:      "12px",
                }}
              >
                <span style={{ color: "#555" }}>
                  {h.status === "RETURNED"  && "Laptops returned"}
                  {h.status === "REPLACED" && "Laptop replaced"}
                </span>
                <span style={{ color: "#aaa" }}>{fmtDate(h.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
