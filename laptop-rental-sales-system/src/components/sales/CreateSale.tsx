import React, { useEffect, useState } from "react";
import { Check, ChevronRight, Search, Trash2, X } from "lucide-react";
import api from "../../services/axios";
import { S, SBtn, fmtINR } from "./salesUi";

/* ── Step bar ── */
function StepBar({ step }: { step: number }) {
  const steps = ["Customer", "Laptops", "Pricing", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "32px" }}>
      {steps.map((label, i) => {
        const num    = i + 1;
        const done   = num < step;
        const active = num === step;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: "6px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 600,
                background: done ? S.emerald.solid : active ? S.indigo.solid : "#f1f5f9",
                color: done || active ? "#fff" : "#94a3b8",
                transition: "all 0.2s",
              }}>
                {done ? <Check size={14} /> : num}
              </div>
              <span style={{ fontSize: "11px", fontWeight: active ? 600 : 400, color: active ? "#0f172a" : "#94a3b8", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: "1.5px",
                background: done ? S.emerald.solid : "#e2e8f0",
                marginBottom: "18px", margin: "0 8px 18px 8px",
                transition: "background 0.2s",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Customer card ── */
function CustomerCard({ c, selected, onClick }: { c: any; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "12px 14px", border: `1.5px solid ${selected ? S.indigo.solid : "#e2e8f0"}`,
      borderRadius: "10px", cursor: "pointer",
      background: selected ? S.indigo.bg : "#fff",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      transition: "all 0.15s",
    }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#0f172a" }}>{c.name}</div>
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
          {c.phone}{c.email ? ` · ${c.email}` : ""}
        </div>
        <div style={{ fontSize: "10px", color: "#cbd5e1", marginTop: "1px", textTransform: "capitalize" }}>
          {c.customer_type === "company" ? "Corporate" : "Individual"}
        </div>
      </div>
      {selected && (
        <div style={{
          width: "20px", height: "20px", borderRadius: "50%",
          background: S.indigo.solid, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={11} color="#fff" />
        </div>
      )}
    </div>
  );
}

/* ── Laptop card ── */
function LaptopCard({ l, selected, onClick }: { l: any; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "12px 14px", border: `1.5px solid ${selected ? S.indigo.solid : "#e2e8f0"}`,
      borderRadius: "10px", cursor: "pointer",
      background: selected ? S.indigo.bg : "#fff",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      transition: "all 0.15s",
    }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: "13px", color: "#0f172a" }}>
          {l.brand} {l.model}
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
          {l.serial_number} · {l.processor} · {l.ram} · {l.storage}
        </div>
        <div style={{ fontSize: "11px", color: S.emerald.text, fontWeight: 500, marginTop: "3px" }}>
          {fmtINR(l.price)}
        </div>
      </div>
      <div style={{
        width: "22px", height: "22px", borderRadius: "50%",
        border: selected ? "none" : "1.5px solid #e2e8f0",
        background: selected ? S.indigo.solid : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {selected && <Check size={12} color="#fff" />}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function CreateSale({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [step,            setStep]            = useState(1);
  const [customers,       setCustomers]       = useState<any[]>([]);
  const [laptops,         setLaptops]         = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState("");
  const [custSearch,      setCustSearch]      = useState("");
  const [lapSearch,       setLapSearch]       = useState("");
  const [selectedCustomer,setSelectedCustomer]= useState<any>(null);
  const [selectedLaptops, setSelectedLaptops] = useState<any[]>([]);
  const [gst,             setGst]             = useState(18);
  const [notes,           setNotes]           = useState("No Return & No Refund");

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
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );
  const filteredLaptops = laptops.filter((l) =>
    `${l.brand} ${l.model}`.toLowerCase().includes(lapSearch.toLowerCase()) ||
    l.serial_number.toLowerCase().includes(lapSearch.toLowerCase())
  );

  const toggleLaptop = (laptop: any) => {
    setSelectedLaptops((prev) => {
      const exists = prev.find((x) => x.id === laptop.id);
      if (exists) return prev.filter((x) => x.id !== laptop.id);
      return [...prev, { ...laptop, sale_price: laptop.price || 0 }];
    });
  };

  const updatePrice = (id: number, val: string) => {
    setSelectedLaptops((prev) =>
      prev.map((l) => (l.id === id ? { ...l, sale_price: parseFloat(val) || 0 } : l))
    );
  };

  const removeLaptop = (id: number) => {
    setSelectedLaptops((prev) => prev.filter((l) => l.id !== id));
  };

  const subtotal  = selectedLaptops.reduce((s, l) => s + Number(l.sale_price), 0);
  const gstAmt    = (subtotal * gst) / 100;
  const total     = subtotal + gstAmt;

  const handleSubmit = async () => {
    if (!selectedCustomer || selectedLaptops.length === 0) return;
    setError("");
    try {
      setSubmitting(true);
      await api.post("/sales/sale/", {
        customer: selectedCustomer.id,
        gst,
        notes,
        items: selectedLaptops.map((l) => ({
          laptop_id:  l.id,
          sale_price: l.sale_price,
        })),
      });
      onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data) ||
        "Failed to create sale. Please check all fields."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
          New Sale
        </h1>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
          Create a new laptop sale in {4} steps
        </p>
      </div>

      <StepBar step={step} />

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "12px 16px", background: "#fef2f2",
          border: "1px solid #fecaca", borderRadius: "10px", marginBottom: "16px",
          fontSize: "13px", color: "#991b1b",
        }}>
          <X size={14} /> {error}
        </div>
      )}

      {/* ── Step 1: Customer ── */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "14px" }}>
            Select Customer
          </div>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search size={13} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Search by name or phone…"
              value={custSearch}
              onChange={(e) => setCustSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 30px",
                border: "1px solid #e2e8f0", borderRadius: "9px",
                fontSize: "13px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredCustomers.map((c) => (
              <CustomerCard
                key={c.id} c={c}
                selected={selectedCustomer?.id === c.id}
                onClick={() => setSelectedCustomer(c)}
              />
            ))}
            {filteredCustomers.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
                No customers found
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <SBtn variant="ghost" onClick={onCancel}>Cancel</SBtn>
            <SBtn variant="primary" onClick={() => setStep(2)} disabled={!selectedCustomer}>
              Next <ChevronRight size={14} />
            </SBtn>
          </div>
        </div>
      )}

      {/* ── Step 2: Laptops ── */}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Select Laptops</div>
            {selectedLaptops.length > 0 && (
              <span style={{
                fontSize: "12px", color: S.indigo.text,
                background: S.indigo.bg, padding: "3px 10px", borderRadius: "99px",
              }}>
                {selectedLaptops.length} selected
              </span>
            )}
          </div>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search size={13} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Search brand, model, serial number…"
              value={lapSearch}
              onChange={(e) => setLapSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 30px",
                border: "1px solid #e2e8f0", borderRadius: "9px",
                fontSize: "13px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredLaptops.map((l) => (
              <LaptopCard
                key={l.id} l={l}
                selected={!!selectedLaptops.find((x) => x.id === l.id)}
                onClick={() => toggleLaptop(l)}
              />
            ))}
            {filteredLaptops.length === 0 && (
              <div style={{ padding: "24px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
                No available laptops
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <SBtn variant="ghost" onClick={() => setStep(1)}>Back</SBtn>
            <SBtn variant="primary" onClick={() => setStep(3)} disabled={selectedLaptops.length === 0}>
              Next <ChevronRight size={14} />
            </SBtn>
          </div>
        </div>
      )}

      {/* ── Step 3: Pricing ── */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "16px" }}>
            Adjust Pricing
          </div>

          {/* Selected laptops with price override */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {selectedLaptops.map((l) => (
              <div key={l.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "12px 16px", border: "1px solid #e2e8f0",
                borderRadius: "10px", background: "#fff",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "13px", color: "#0f172a" }}>
                    {l.brand} {l.model}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                    {l.serial_number}  · Listed: {fmtINR(l.price)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>₹</span>
                  <input
                    type="number"
                    value={l.sale_price}
                    onChange={(e) => updatePrice(l.id, e.target.value)}
                    style={{
                      width: "110px", padding: "7px 10px", textAlign: "right",
                      border: "1px solid #e2e8f0", borderRadius: "8px",
                      fontSize: "13px", fontWeight: 600, outline: "none",
                    }}
                  />
                  <button
                    onClick={() => removeLaptop(l.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#fca5a5", padding: "4px",
                      borderRadius: "6px", display: "flex", alignItems: "center",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* GST + Notes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", display: "block", fontWeight: 500 }}>
                GST Rate
              </label>
              <select
                value={gst}
                onChange={(e) => setGst(Number(e.target.value))}
                style={{
                  width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0",
                  borderRadius: "8px", fontSize: "13px", outline: "none", background: "#fff",
                }}
              >
                {[0, 5, 12, 18, 28].map((v) => <option key={v} value={v}>{v}%</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px", display: "block", fontWeight: 500 }}>
                Terms & Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0",
                  borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Summary */}
          <div style={{
            background: "#fafaf9", border: "1px solid #e2e8f0",
            borderRadius: "10px", padding: "16px 20px", fontSize: "13px",
          }}>
            {[
              ["Subtotal", fmtINR(subtotal)],
              [`GST (${gst}%)`, fmtINR(gstAmt)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#94a3b8" }}>{label}</span>
                <span style={{ color: "#334155" }}>{val}</span>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontWeight: 700, fontSize: "16px", color: "#0f172a",
              paddingTop: "10px", borderTop: "1px solid #e2e8f0", marginTop: "6px",
            }}>
              <span>Total</span>
              <span style={{ color: S.indigo.text }}>{fmtINR(total)}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <SBtn variant="ghost" onClick={() => setStep(2)}>Back</SBtn>
            <SBtn variant="primary" onClick={() => setStep(4)}>
              Review Order <ChevronRight size={14} />
            </SBtn>
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", marginBottom: "16px" }}>
            Confirm Sale
          </div>

          {/* Customer summary */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: "10px", padding: "14px 18px", marginBottom: "12px",
          }}>
            <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
              Customer
            </div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>
              {selectedCustomer?.name}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              {selectedCustomer?.phone}{selectedCustomer?.email ? ` · ${selectedCustomer.email}` : ""}
            </div>
          </div>

          {/* Laptops summary */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: "10px", padding: "14px 18px", marginBottom: "12px",
          }}>
            <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
              Laptops ({selectedLaptops.length})
            </div>
            {selectedLaptops.map((l) => (
              <div key={l.id} style={{
                display: "flex", justifyContent: "space-between",
                paddingBottom: "7px", marginBottom: "7px",
                borderBottom: "1px solid #f8f7f5", fontSize: "13px",
              }}>
                <span style={{ color: "#334155" }}>
                  {l.brand} {l.model}
                  <span style={{ color: "#94a3b8", fontSize: "11px", marginLeft: "8px" }}>
                    ({l.serial_number})
                  </span>
                </span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{fmtINR(l.sale_price)}</span>
              </div>
            ))}
          </div>

          {/* Total box */}
          <div style={{
            background: S.indigo.bg, border: `1px solid ${S.indigo.border}`,
            borderRadius: "10px", padding: "16px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "24px",
          }}>
            <div>
              <div style={{ fontSize: "12px", color: S.indigo.text }}>Total Amount</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                Subtotal {fmtINR(subtotal)} + GST ({gst}%) {fmtINR(gstAmt)}
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: S.indigo.text }}>
              {fmtINR(total)}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <SBtn variant="ghost" onClick={() => setStep(3)}>Back</SBtn>
            <SBtn variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Processing…" : "Confirm Sale"}
            </SBtn>
          </div>
        </div>
      )}
    </div>
  );
}
