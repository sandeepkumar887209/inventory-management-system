import React, { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import api from "../../services/axios";
import { Btn, Input, Select, Card, fmtINR, C } from "./ui";

/* ── Step indicator ── */
function StepBar({ step, total }) {
  const steps = ["Customer", "Laptops", "Pricing", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "32px" }}>
      {steps.map((label, i) => {
        const num   = i + 1;
        const done  = num < step;
        const active = num === step;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: "6px" }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 500,
                background: done ? C.teal.solid : active ? C.blue.solid : "#f0eeeb",
                color: done || active ? "#fff" : "#aaa",
                transition: "all 0.2s",
              }}>
                {done ? <Check size={13} /> : num}
              </div>
              <span style={{ fontSize: "11px", color: active ? "#1a1a1a" : "#aaa", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: "1px",
                background: done ? C.teal.solid : "#e8e6e1",
                marginBottom: "18px", marginLeft: "4px", marginRight: "4px",
                transition: "background 0.2s",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CustomerCard({ c, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: "12px 14px",
      border: selected ? `1.5px solid ${C.blue.solid}` : "1px solid #e8e6e1",
      borderRadius: "10px", cursor: "pointer",
      background: selected ? C.blue.bg : "#fff",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      transition: "all 0.15s",
    }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: "13px" }}>{c.name}</div>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
          {c.phone}{c.email ? ` · ${c.email}` : ""}
        </div>
      </div>
      {selected && (
        <div style={{
          width: "20px", height: "20px", borderRadius: "50%",
          background: C.blue.solid, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={11} color="#fff" />
        </div>
      )}
    </div>
  );
}

function LaptopCard({ l, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: "12px 14px",
      border: selected ? `1.5px solid ${C.blue.solid}` : "1px solid #e8e6e1",
      borderRadius: "10px", cursor: "pointer",
      background: selected ? C.blue.bg : "#fff",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      transition: "all 0.15s",
    }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: "13px" }}>{l.brand} {l.model}</div>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
          {l.serial_number} · {l.processor} · {l.ram} · {l.storage}
        </div>
        <div style={{ fontSize: "11px", color: C.teal.text, marginTop: "2px" }}>
          {fmtINR(l.rent_per_month)}/month
        </div>
      </div>
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%",
        border: selected ? "none" : "1.5px solid #d0cec9",
        background: selected ? C.blue.solid : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {selected && <Check size={11} color="#fff" />}
      </div>
    </div>
  );
}

export function CreateRental({ onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [laptopSearch, setLaptopSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedLaptops, setSelectedLaptops] = useState([]);
  const [gst, setGst] = useState(18);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cRes, lRes] = await Promise.all([
          api.get("/customers/customers/"),
          api.get("/inventory/laptops/?status=AVAILABLE"),
        ]);
        setCustomers(Array.isArray(cRes.data) ? cRes.data : cRes.data.results || []);
        setLaptops(Array.isArray(lRes.data) ? lRes.data : lRes.data.results || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );
  const filteredLaptops = laptops.filter((l) =>
    `${l.brand} ${l.model}`.toLowerCase().includes(laptopSearch.toLowerCase()) ||
    l.serial_number.toLowerCase().includes(laptopSearch.toLowerCase())
  );

  const toggleLaptop = (laptop) => {
    setSelectedLaptops((prev) => {
      const exists = prev.find((x) => x.id === laptop.id);
      if (exists) return prev.filter((x) => x.id !== laptop.id);
      return [...prev, { ...laptop, discounted_price: laptop.rent_per_month }];
    });
  };

  const updatePrice = (id, val) => {
    setSelectedLaptops((prev) =>
      prev.map((l) => (l.id === id ? { ...l, discounted_price: Number(val) } : l))
    );
  };

  const subtotal  = selectedLaptops.reduce((s, l) => s + Number(l.discounted_price), 0);
  const gstAmount = (subtotal * gst) / 100;
  const total     = subtotal + gstAmount;

  const handleSubmit = async () => {
    if (!selectedCustomer || selectedLaptops.length === 0) return;
    try {
      setSubmitting(true);
      await api.post("/rentals/rental/", {
        customer: selectedCustomer.id,
        expected_return_date: new Date(Date.now() + 30 * 86_400_000).toISOString().split("T")[0],
        gst,
        subtotal,
        total_amount: total,
        items: selectedLaptops.map((l) => ({
          laptop_id: l.id,
          rent_price: l.discounted_price,
        })),
      });
      onSuccess();
    } catch (err) {
      console.error("Create rental error:", err.response?.data);
      alert(err.response?.data ? JSON.stringify(err.response.data) : "Failed to create rental");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "80px", color: "#bbb" }}>Loading...</div>;
  }

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", marginBottom: "24px" }}>
        New Rental
      </h1>

      <StepBar step={step} total={4} />

      {/* ── Step 1: Customer ── */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "12px" }}>
            Select customer
          </div>
          <Input
            placeholder="Search customer by name or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            style={{ marginBottom: "12px" }}
          />
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredCustomers.map((c) => (
              <CustomerCard key={c.id} c={c} selected={selectedCustomer?.id === c.id} onClick={() => setSelectedCustomer(c)} />
            ))}
            {filteredCustomers.length === 0 && (
              <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>No customers found</div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
            <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
            <Btn variant="primary" onClick={() => setStep(2)} disabled={!selectedCustomer}>
              Next <ChevronRight size={14} />
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 2: Laptops ── */}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a" }}>Select laptops</div>
            {selectedLaptops.length > 0 && (
              <span style={{ fontSize: "12px", color: C.blue.text, background: C.blue.bg, padding: "3px 10px", borderRadius: "99px" }}>
                {selectedLaptops.length} selected
              </span>
            )}
          </div>
          <Input
            placeholder="Search by brand, model, serial number..."
            value={laptopSearch}
            onChange={(e) => setLaptopSearch(e.target.value)}
            style={{ marginBottom: "12px" }}
          />
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredLaptops.map((l) => (
              <LaptopCard key={l.id} l={l} selected={!!selectedLaptops.find((x) => x.id === l.id)} onClick={() => toggleLaptop(l)} />
            ))}
            {filteredLaptops.length === 0 && (
              <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>No available laptops</div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <Btn variant="ghost" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="primary" onClick={() => setStep(3)} disabled={selectedLaptops.length === 0}>
              Next <ChevronRight size={14} />
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 3: Pricing ── */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "16px" }}>
            Adjust pricing
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {selectedLaptops.map((l) => (
              <div key={l.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", border: "1px solid #e8e6e1", borderRadius: "10px",
                gap: "16px", background: "#fff",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>{l.brand} {l.model}</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>List: {fmtINR(l.rent_per_month)}/month</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>₹</span>
                  <input
                    type="number"
                    value={l.discounted_price}
                    onChange={(e) => updatePrice(l.id, e.target.value)}
                    style={{
                      width: "100px", padding: "6px 10px",
                      border: "1px solid #e0deda", borderRadius: "7px",
                      fontSize: "13px", outline: "none", textAlign: "right",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#aaa" }}>/mo</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px",
            padding: "12px 16px", border: "1px solid #e8e6e1", borderRadius: "10px", background: "#fff",
          }}>
            <span style={{ fontSize: "13px", color: "#555", flex: 1 }}>GST rate</span>
            <Select value={gst} onChange={(e) => setGst(Number(e.target.value))} style={{ width: "120px" }}>
              {[0, 5, 12, 18, 28].map((v) => <option key={v} value={v}>{v}%</option>)}
            </Select>
          </div>

          <div style={{
            background: "#fafaf8", border: "1px solid #e8e6e1",
            borderRadius: "10px", padding: "14px 16px", fontSize: "13px", color: "#555",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Subtotal</span><span>{fmtINR(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>GST ({gst}%)</span><span>{fmtINR(gstAmount)}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontWeight: 600, fontSize: "14px", color: "#1a1a1a",
              paddingTop: "8px", borderTop: "1px solid #e8e6e1", marginTop: "4px",
            }}>
              <span>Total</span><span>{fmtINR(total)}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <Btn variant="ghost" onClick={() => setStep(2)}>Back</Btn>
            <Btn variant="primary" onClick={() => setStep(4)}>Review <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "16px" }}>
            Confirm rental
          </div>

          <div style={{
            background: "#fff", border: "1px solid #e8e6e1",
            borderRadius: "10px", padding: "14px 16px", marginBottom: "12px",
          }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>CUSTOMER</div>
            <div style={{ fontWeight: 500, fontSize: "14px" }}>{selectedCustomer?.name}</div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
              {selectedCustomer?.phone}{selectedCustomer?.email ? ` · ${selectedCustomer.email}` : ""}
            </div>
          </div>

          <div style={{
            background: "#fff", border: "1px solid #e8e6e1",
            borderRadius: "10px", padding: "14px 16px", marginBottom: "12px",
          }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px" }}>
              LAPTOPS ({selectedLaptops.length})
            </div>
            {selectedLaptops.map((l) => (
              <div key={l.id} style={{
                display: "flex", justifyContent: "space-between",
                paddingBottom: "6px", marginBottom: "6px",
                borderBottom: "1px solid #f5f4f1", fontSize: "13px",
              }}>
                <span>{l.brand} {l.model} ({l.serial_number})</span>
                <span style={{ fontWeight: 500 }}>{fmtINR(l.discounted_price)}/mo</span>
              </div>
            ))}
          </div>

          <div style={{
            background: C.blue.bg, border: `1px solid ${C.blue.border}`,
            borderRadius: "10px", padding: "14px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "24px",
          }}>
            <div>
              <div style={{ fontSize: "12px", color: C.blue.text }}>Total amount</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                Subtotal {fmtINR(subtotal)} + GST {fmtINR(gstAmount)}
              </div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: C.blue.text }}>{fmtINR(total)}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn variant="ghost" onClick={() => setStep(3)}>Back</Btn>
            <Btn variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Confirm rental"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}