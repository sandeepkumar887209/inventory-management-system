import React, { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import api from "../../services/axios";
import { Btn, Input, Select, Card, fmtINR, C } from "./ui";

function StepBar({ step }: { step: number }) {
  const steps = ["Customer", "Laptops", "Details", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "32px" }}>
      {steps.map((label, i) => {
        const num = i + 1; const done = num < step; const active = num === step;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: "6px" }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 500,
                background: done ? C.teal.solid : active ? C.violet.solid : "#f0eeeb",
                color: done || active ? "#fff" : "#aaa", transition: "all 0.2s",
              }}>
                {done ? <Check size={13} /> : num}
              </div>
              <span style={{ fontSize: "11px", color: active ? "#1a1a1a" : "#aaa", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: "1px",
                background: done ? C.teal.solid : "#e8e6e1",
                marginBottom: "18px", marginLeft: "4px", marginRight: "4px", transition: "background 0.2s",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CustomerCard({ c, selected, onClick }: { c: any; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "12px 14px", border: selected ? `1.5px solid ${C.violet.solid}` : "1px solid #e8e6e1",
      borderRadius: "10px", cursor: "pointer", background: selected ? C.violet.bg : "#fff",
      display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s",
    }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: "13px" }}>{c.name}</div>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
          {c.phone}{c.email ? ` · ${c.email}` : ""}
          {c.customer_type === "company" ? " · Corporate" : " · Individual"}
        </div>
      </div>
      {selected && <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: C.violet.solid, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={11} color="#fff" /></div>}
    </div>
  );
}

function LaptopCard({ l, selected, onClick }: { l: any; selected: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "12px 14px", border: selected ? `1.5px solid ${C.violet.solid}` : "1px solid #e8e6e1",
      borderRadius: "10px", cursor: "pointer", background: selected ? C.violet.bg : "#fff",
      display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s",
    }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: "13px" }}>{l.brand} {l.model}</div>
        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
          {l.serial_number} · {l.processor} · {l.ram} · {l.storage}
        </div>
        <div style={{ fontSize: "11px", color: C.violet.text, marginTop: "2px" }}>
          Available for demo · ₹{l.rent_per_month}/mo
        </div>
      </div>
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%",
        border: selected ? "none" : "1.5px solid #d0cec9",
        background: selected ? C.violet.solid : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {selected && <Check size={11} color="#fff" />}
      </div>
    </div>
  );
}

const PURPOSE_OPTIONS = [
  { value: "", label: "Select purpose" },
  { value: "performance_testing",     label: "Performance Testing"    },
  { value: "software_compatibility",  label: "Software Compatibility" },
  { value: "team_evaluation",         label: "Team Evaluation"        },
  { value: "student_trial",           label: "Student Trial"          },
  { value: "video_editing",           label: "Video Editing"          },
  { value: "programming_development", label: "Programming / Dev"      },
  { value: "graphic_design",          label: "Graphic Design"         },
  { value: "general_evaluation",      label: "General Evaluation"     },
  { value: "other",                   label: "Other"                  },
];

const DURATION_OPTIONS = [3, 5, 7, 10, 14];

export function CreateNewDemo({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [laptops,   setLaptops]   = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [laptopSearch,   setLaptopSearch]   = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedLaptops,  setSelectedLaptops]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 3 fields
  const [assignedDate,   setAssignedDate]   = useState(new Date().toISOString().split("T")[0]);
  const [duration,       setDuration]       = useState(7);
  const [purpose,        setPurpose]        = useState("");
  const [requirements,   setRequirements]   = useState("");
  const [needsTraining,  setNeedsTraining]  = useState(false);
  const [needsDelivery,  setNeedsDelivery]  = useState(false);
  const [deliveryAddr,   setDeliveryAddr]   = useState("");
  const [agreeTerms,     setAgreeTerms]     = useState(false);

  const returnDate = (() => {
    if (!assignedDate) return "";
    const d = new Date(assignedDate); d.setDate(d.getDate() + duration);
    return d.toISOString().split("T")[0];
  })();

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
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );
  const filteredLaptops = laptops.filter((l) =>
    `${l.brand} ${l.model}`.toLowerCase().includes(laptopSearch.toLowerCase()) ||
    l.serial_number.toLowerCase().includes(laptopSearch.toLowerCase())
  );

  const toggleLaptop = (laptop: any) => {
    setSelectedLaptops((prev) => {
      const exists = prev.find((x) => x.id === laptop.id);
      return exists ? prev.filter((x) => x.id !== laptop.id) : [...prev, laptop];
    });
  };

  const canProceedStep3 = purpose && assignedDate && (!needsDelivery || deliveryAddr) && agreeTerms;

  const handleSubmit = async () => {
    if (!selectedCustomer || selectedLaptops.length === 0) return;
    try {
      setSubmitting(true);
      await api.post("/demos/demo/", {
        customer:             selectedCustomer.id,
        assigned_date:        assignedDate,
        expected_return_date: returnDate,
        duration_days:        duration,
        purpose,
        specific_requirements: requirements,
        requires_training:    needsTraining,
        delivery_required:    needsDelivery,
        delivery_address:     deliveryAddr,
        status:               "ONGOING",
        items: selectedLaptops.map((l) => ({ laptop_id: l.id })),
      });
      onSuccess();
    } catch (err: any) {
      console.error("Create demo error:", err.response?.data);
      alert(err.response?.data ? JSON.stringify(err.response.data) : "Failed to create demo");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "80px", color: "#bbb" }}>Loading...</div>;

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", marginBottom: "24px" }}>New Demo Assignment</h1>
      <StepBar step={step} />

      {/* Step 1: Customer */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "12px" }}>Select customer</div>
          <Input placeholder="Search by name or phone..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} style={{ marginBottom: "12px" }} />
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredCustomers.map((c) => (
              <CustomerCard key={c.id} c={c} selected={selectedCustomer?.id === c.id} onClick={() => setSelectedCustomer(c)} />
            ))}
            {filteredCustomers.length === 0 && <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>No customers found</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
            <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
            <Btn variant="primary" style={{ background: C.violet.solid }} onClick={() => setStep(2)} disabled={!selectedCustomer}>Next <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 2: Laptops */}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a" }}>Select laptops for demo</div>
            {selectedLaptops.length > 0 && (
              <span style={{ fontSize: "12px", color: C.violet.text, background: C.violet.bg, padding: "3px 10px", borderRadius: "99px" }}>
                {selectedLaptops.length} selected
              </span>
            )}
          </div>
          <Input placeholder="Search by brand, model, serial number..." value={laptopSearch} onChange={(e) => setLaptopSearch(e.target.value)} style={{ marginBottom: "12px" }} />
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredLaptops.map((l) => (
              <LaptopCard key={l.id} l={l} selected={!!selectedLaptops.find((x) => x.id === l.id)} onClick={() => toggleLaptop(l)} />
            ))}
            {filteredLaptops.length === 0 && <div style={{ textAlign: "center", color: "#ccc", padding: "24px", fontSize: "13px" }}>No available laptops</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <Btn variant="ghost" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="primary" style={{ background: C.violet.solid }} onClick={() => setStep(3)} disabled={selectedLaptops.length === 0}>Next <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "16px" }}>Demo details</div>

          {/* Selected laptop summary */}
          <div style={{ background: C.violet.bg, border: `1px solid ${C.violet.border}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "13px", color: C.violet.text }}>
            <strong>Selected laptops:</strong> {selectedLaptops.map((l) => `${l.brand} ${l.model}`).join(", ")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>Assignment Date *</label>
              <input type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" as any }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>Demo Duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" as any }}>
                {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} Days{d === 7 ? " (Recommended)" : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>Return Due Date</label>
              <input type="date" value={returnDate} readOnly
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", background: "#fafaf8", boxSizing: "border-box" as any }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>Demo Purpose *</label>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box" as any }}>
                {PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>Specific Requirements</label>
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3}
              placeholder="Any specific software, configurations, or requirements..."
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" as any }} />
          </div>

          {/* Options */}
          <div style={{ background: "#fafaf8", border: "1px solid #e8e6e1", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px" }}>
              <input type="checkbox" checked={needsTraining} onChange={(e) => setNeedsTraining(e.target.checked)} style={{ accentColor: C.violet.solid }} />
              <div><div style={{ fontWeight: 500 }}>Requires Training Session</div><div style={{ fontSize: "11px", color: "#888" }}>Schedule a brief demo/training on laptop usage</div></div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px" }}>
              <input type="checkbox" checked={needsDelivery} onChange={(e) => setNeedsDelivery(e.target.checked)} style={{ accentColor: C.violet.solid }} />
              <div><div style={{ fontWeight: 500 }}>Delivery Required</div><div style={{ fontSize: "11px", color: "#888" }}>Deliver laptop to customer location</div></div>
            </label>
            {needsDelivery && (
              <textarea value={deliveryAddr} onChange={(e) => setDeliveryAddr(e.target.value)} placeholder="Enter full delivery address..."
                rows={2} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" as any }} />
            )}
          </div>

          {/* Terms */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "12px", color: "#666", marginBottom: "16px" }}>
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} style={{ marginTop: "2px", accentColor: C.violet.solid }} />
            I agree to the demo terms including responsibility for device safety, timely return, and compensation for any damages during the demo period.
          </label>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn variant="ghost" onClick={() => setStep(2)}>Back</Btn>
            <Btn variant="primary" style={{ background: C.violet.solid }} onClick={() => setStep(4)} disabled={!canProceedStep3}>Review <ChevronRight size={14} /></Btn>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "16px" }}>Confirm demo assignment</div>

          <div style={{ background: "#fff", border: "1px solid #e8e6e1", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>CUSTOMER</div>
            <div style={{ fontWeight: 500, fontSize: "14px" }}>{selectedCustomer?.name}</div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{selectedCustomer?.phone}{selectedCustomer?.email ? ` · ${selectedCustomer.email}` : ""}</div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e8e6e1", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px" }}>LAPTOPS ({selectedLaptops.length})</div>
            {selectedLaptops.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "6px", marginBottom: "6px", borderBottom: "1px solid #f5f4f1", fontSize: "13px" }}>
                <span>{l.brand} {l.model} <span style={{ color: "#aaa", fontSize: "11px" }}>({l.serial_number})</span></span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e8e6e1", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px" }}>DEMO DETAILS</div>
            {[
              ["Assigned date",  assignedDate],
              ["Return due",     returnDate],
              ["Duration",       `${duration} days`],
              ["Purpose",        PURPOSE_OPTIONS.find((o) => o.value === purpose)?.label ?? purpose],
              ["Training",       needsTraining ? "Yes" : "No"],
              ["Delivery",       needsDelivery ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                <span style={{ color: "#888" }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn variant="ghost" onClick={() => setStep(3)}>Back</Btn>
            <Btn variant="primary" style={{ background: C.violet.solid }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Assigning..." : "Confirm Demo"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
