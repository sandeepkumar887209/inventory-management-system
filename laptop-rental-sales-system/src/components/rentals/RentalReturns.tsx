import React, { useEffect, useState } from "react";
import { Check, RotateCcw, RefreshCw } from "lucide-react";
import api from "../../services/axios";
import { Btn, Input, Card, CardHeader, Badge, Spinner, fmtINR, C } from "./ui";

/* ── Customer search ── */
function CustomerSearch({ customers, selected, onSelect }) {
  const [q, setQ] = useState("");
  const filtered  = customers.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.phone.includes(q)
  );
  return (
    <div>
      <Input
        placeholder="Search customer..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: "10px" }}
      />
      <div
        style={{
          maxHeight:     "220px",
          overflowY:     "auto",
          display:       "flex",
          flexDirection: "column",
          gap:           "6px",
        }}
      >
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              padding:      "10px 12px",
              border:       selected?.id === c.id ? `1.5px solid ${C.blue.solid}` : "1px solid #e8e6e1",
              borderRadius: "8px",
              cursor:       "pointer",
              background:   selected?.id === c.id ? C.blue.bg : "#fff",
              fontSize:     "13px",
              display:      "flex",
              alignItems:   "center",
              justifyContent:"space-between",
              transition:   "all 0.15s",
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>{c.name}</span>
              <span style={{ fontSize: "11px", color: "#888", marginLeft: "8px" }}>{c.phone}</span>
            </div>
            {selected?.id === c.id && <Check size={13} color={C.blue.solid} />}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#ccc", padding: "16px", fontSize: "13px" }}>
            No customers found
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   RETURN PANEL
───────────────────────────────────── */
function ReturnPanel({ customers, onSuccess }) {
  const [selected,       setSelected]       = useState(null);
  const [activeRental,   setActiveRental]   = useState(null);
  const [rentedLaptops,  setRentedLaptops]  = useState([]);
  const [checkedIds,     setCheckedIds]     = useState([]);
  const [submitting,     setSubmitting]     = useState(false);
  const [loadingRental,  setLoadingRental]  = useState(false);

  const handleSelectCustomer = async (c) => {
    setSelected(c);
    setActiveRental(null);
    setRentedLaptops([]);
    setCheckedIds([]);
    try {
      setLoadingRental(true);
      const [rentRes, lapRes] = await Promise.all([
        api.get("/rentals/rental/"),
        api.get(`/inventory/laptops/?status=RENTED&customer=${c.id}`),
      ]);
      const rentals = Array.isArray(rentRes.data) ? rentRes.data : rentRes.data.results || [];
      const active  = rentals.find(
        (r) =>
          (r.customer === c.id || r.customer_detail?.id === c.id) &&
          r.status === "ONGOING"
      );
      setActiveRental(active ?? null);
      const laps = Array.isArray(lapRes.data) ? lapRes.data : lapRes.data.results || [];
      setRentedLaptops(laps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRental(false);
    }
  };

  const toggle = (id) =>
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleReturn = async () => {
    if (!activeRental || checkedIds.length === 0) return;
    try {
      setSubmitting(true);
      await api.post(`/rentals/rental/${activeRental.id}/return_laptops/`, {
        laptops: checkedIds,
      });
      onSuccess();
      setSelected(null);
      setActiveRental(null);
      setRentedLaptops([]);
      setCheckedIds([]);
    } catch (err) {
      alert(err.response?.data?.error ?? "Return failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <RotateCcw size={15} color={C.teal.solid} />
            Return laptops
          </div>
        }
      />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Customer */}
        <div>
          <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            1 · Select customer
          </div>
          <CustomerSearch customers={customers} selected={selected} onSelect={handleSelectCustomer} />
        </div>

        {/* Rental info */}
        {selected && (
          <div>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              2 · Select laptops to return
            </div>

            {loadingRental && (
              <div style={{ textAlign: "center", color: "#bbb", padding: "16px", fontSize: "13px" }}>
                Loading...
              </div>
            )}

            {!loadingRental && !activeRental && (
              <div
                style={{
                  padding:      "12px",
                  background:   "#fffbf0",
                  border:       "1px solid #ffdfa0",
                  borderRadius: "8px",
                  fontSize:     "13px",
                  color:        C.amber.text,
                }}
              >
                No active rental found for {selected.name}.
              </div>
            )}

            {!loadingRental && activeRental && rentedLaptops.length === 0 && (
              <div style={{ fontSize: "13px", color: "#bbb", padding: "12px" }}>
                No laptops currently rented.
              </div>
            )}

            {!loadingRental && rentedLaptops.map((l) => (
              <label
                key={l.id}
                style={{
                  display:       "flex",
                  alignItems:    "center",
                  gap:           "10px",
                  padding:       "10px 12px",
                  border:        `1px solid ${checkedIds.includes(l.id) ? C.teal.border : "#e8e6e1"}`,
                  borderRadius:  "8px",
                  marginBottom:  "6px",
                  cursor:        "pointer",
                  background:    checkedIds.includes(l.id) ? C.teal.bg : "#fff",
                  transition:    "all 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={checkedIds.includes(l.id)}
                  onChange={() => toggle(l.id)}
                  style={{ accentColor: C.teal.solid }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>
                    {l.brand} {l.model}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888" }}>
                    {l.serial_number} · {l.processor}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Action */}
        {activeRental && checkedIds.length > 0 && (
          <Btn variant="success" onClick={handleReturn} disabled={submitting}>
            <Check size={14} />
            {submitting ? "Processing..." : `Return ${checkedIds.length} laptop${checkedIds.length > 1 ? "s" : ""}`}
          </Btn>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────
   REPLACEMENT PANEL
───────────────────────────────────── */
function ReplacementPanel({ customers, onSuccess }) {
  const [selected,      setSelected]      = useState(null);
  const [activeRental,  setActiveRental]  = useState(null);
  const [rentedLaptops, setRentedLaptops] = useState([]);
  const [available,     setAvailable]     = useState([]);
  const [oldLaptop,     setOldLaptop]     = useState("");
  const [newLaptop,     setNewLaptop]     = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [loadingData,   setLoadingData]   = useState(false);

  const handleSelectCustomer = async (c) => {
    setSelected(c);
    setActiveRental(null);
    setRentedLaptops([]);
    setOldLaptop("");
    setNewLaptop("");
    try {
      setLoadingData(true);
      const [rentRes, lapRes, avRes] = await Promise.all([
        api.get("/rentals/rental/"),
        api.get(`/inventory/laptops/?status=RENTED&customer=${c.id}`),
        api.get("/inventory/laptops/?status=AVAILABLE"),
      ]);
      const rentals = Array.isArray(rentRes.data) ? rentRes.data : rentRes.data.results || [];
      const active  = rentals.find(
        (r) =>
          (r.customer === c.id || r.customer_detail?.id === c.id) &&
          r.status === "ONGOING"
      );
      setActiveRental(active ?? null);
      setRentedLaptops(Array.isArray(lapRes.data) ? lapRes.data : lapRes.data.results || []);
      setAvailable(Array.isArray(avRes.data) ? avRes.data : avRes.data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const handleReplace = async () => {
    if (!activeRental || !oldLaptop || !newLaptop) return;
    try {
      setSubmitting(true);
      await api.post(`/rentals/rental/${activeRental.id}/replace_laptop/`, {
        old_laptop: Number(oldLaptop),
        new_laptop: Number(newLaptop),
      });
      onSuccess();
      setSelected(null);
      setActiveRental(null);
      setRentedLaptops([]);
      setAvailable([]);
      setOldLaptop("");
      setNewLaptop("");
    } catch (err) {
      alert(err.response?.data?.error ?? "Replacement failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <RefreshCw size={15} color={C.amber.solid} />
            Replace laptop
          </div>
        }
      />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Customer */}
        <div>
          <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            1 · Select customer
          </div>
          <CustomerSearch customers={customers} selected={selected} onSelect={handleSelectCustomer} />
        </div>

        {/* Selects */}
        {selected && (
          <div>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              2 · Choose laptops
            </div>

            {loadingData && (
              <div style={{ textAlign: "center", color: "#bbb", padding: "16px", fontSize: "13px" }}>Loading...</div>
            )}

            {!loadingData && !activeRental && (
              <div
                style={{
                  padding: "12px", background: "#fffbf0",
                  border: "1px solid #ffdfa0", borderRadius: "8px",
                  fontSize: "13px", color: C.amber.text,
                }}
              >
                No active rental found.
              </div>
            )}

            {!loadingData && activeRental && (
              <>
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                    Laptop to remove
                  </label>
                  <select
                    value={oldLaptop}
                    onChange={(e) => setOldLaptop(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px",
                      border: "1px solid #e0deda", borderRadius: "8px",
                      fontSize: "13px", background: "#fff", outline: "none",
                    }}
                  >
                    <option value="">Select old laptop</option>
                    {rentedLaptops.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.brand} {l.model} ({l.serial_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>
                    Replacement laptop
                  </label>
                  <select
                    value={newLaptop}
                    onChange={(e) => setNewLaptop(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px",
                      border: "1px solid #e0deda", borderRadius: "8px",
                      fontSize: "13px", background: "#fff", outline: "none",
                    }}
                  >
                    <option value="">Select new laptop</option>
                    {available.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.brand} {l.model} ({l.serial_number}) · {fmtINR(l.rent_per_month)}/mo
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action */}
        {activeRental && oldLaptop && newLaptop && (
          <Btn
            variant="primary"
            style={{ background: C.amber.solid }}
            onClick={handleReplace}
            disabled={submitting}
          >
            <RefreshCw size={14} />
            {submitting ? "Processing..." : "Confirm replacement"}
          </Btn>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────── */
export function RentalReturns({ onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api
      .get("/customers/customers/")
      .then((res) => setCustomers(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px" }}>
        Returns & Replacements
      </h1>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "24px" }}>
        Process a return or swap a laptop for an active rental.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <ReturnPanel     customers={customers} onSuccess={onSuccess} />
        <ReplacementPanel customers={customers} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
