import React, { useEffect, useState } from "react";
import { Check, RotateCcw, TrendingUp, RefreshCw, ShoppingCart } from "lucide-react";
import api from "../../services/axios";
import { Btn, Input, Card, CardHeader, Badge, Spinner, fmtINR, C } from "./ui";

/* ── Customer search ── */
function CustomerSearch({ customers, selected, onSelect }: { customers: any[]; selected: any; onSelect: (c: any) => void }) {
  const [q, setQ] = useState("");
  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  return (
    <div>
      <Input placeholder="Search customer..." value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: "10px" }} />
      <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
        {filtered.map((c) => (
          <div
            key={c.id} onClick={() => onSelect(c)}
            style={{
              padding: "10px 12px", border: selected?.id === c.id ? `1.5px solid ${C.violet.solid}` : "1px solid #e8e6e1",
              borderRadius: "8px", cursor: "pointer", background: selected?.id === c.id ? C.violet.bg : "#fff",
              fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s",
            }}
          >
            <div>
              <span style={{ fontWeight: 500 }}>{c.name}</span>
              <span style={{ fontSize: "11px", color: "#888", marginLeft: "8px" }}>{c.phone}</span>
            </div>
            {selected?.id === c.id && <Check size={13} color={C.violet.solid} />}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: "#ccc", padding: "16px", fontSize: "13px" }}>No customers found</div>}
      </div>
    </div>
  );
}

/* ─── Return Panel ─── */
function ReturnPanel({ customers, onSuccess }: { customers: any[]; onSuccess: () => void }) {
  const [selected,      setSelected]      = useState<any>(null);
  const [activeDemo,    setActiveDemo]    = useState<any>(null);
  const [demoLaptops,   setDemoLaptops]   = useState<any[]>([]);
  const [checkedIds,    setCheckedIds]    = useState<number[]>([]);
  const [feedback,      setFeedback]      = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [loadingDemo,   setLoadingDemo]   = useState(false);

  const handleSelectCustomer = async (c: any) => {
    setSelected(c); setActiveDemo(null); setDemoLaptops([]); setCheckedIds([]);
    try {
      setLoadingDemo(true);
      const [demoRes, lapRes] = await Promise.all([
        api.get("/demos/demo/"),
        api.get(`/inventory/laptops/?status=DEMO&customer=${c.id}`),
      ]);
      const demos = Array.isArray(demoRes.data) ? demoRes.data : demoRes.data.results || [];
      const active = demos.find((d: any) =>
        (d.customer === c.id || d.customer_detail?.id === c.id) && d.status === "ONGOING"
      );
      setActiveDemo(active ?? null);
      setDemoLaptops(Array.isArray(lapRes.data) ? lapRes.data : lapRes.data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoadingDemo(false); }
  };

  const toggle = (id: number) =>
    setCheckedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleReturn = async () => {
    if (!activeDemo || checkedIds.length === 0) return;
    try {
      setSubmitting(true);
      await api.post(`/demos/demo/${activeDemo.id}/return_laptops/`, { laptops: checkedIds, feedback });
      onSuccess(); setSelected(null); setActiveDemo(null); setDemoLaptops([]); setCheckedIds([]); setFeedback("");
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Return failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader title={<div style={{ display: "flex", alignItems: "center", gap: "8px" }}><RotateCcw size={15} color={C.teal.solid} />Return demo laptops</div>} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>1 · Select customer</div>
          <CustomerSearch customers={customers} selected={selected} onSelect={handleSelectCustomer} />
        </div>

        {selected && (
          <div>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>2 · Select laptops to return</div>

            {loadingDemo && <div style={{ textAlign: "center", color: "#bbb", padding: "16px", fontSize: "13px" }}>Loading...</div>}

            {!loadingDemo && !activeDemo && (
              <div style={{ padding: "12px", background: "#fffbf0", border: "1px solid #ffdfa0", borderRadius: "8px", fontSize: "13px", color: C.amber.text }}>
                No active demo found for {selected.name}.
              </div>
            )}

            {!loadingDemo && activeDemo && demoLaptops.map((l) => (
              <label key={l.id} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                border: `1px solid ${checkedIds.includes(l.id) ? C.teal.border : "#e8e6e1"}`,
                borderRadius: "8px", marginBottom: "6px", cursor: "pointer",
                background: checkedIds.includes(l.id) ? C.teal.bg : "#fff", transition: "all 0.15s",
              }}>
                <input type="checkbox" checked={checkedIds.includes(l.id)} onChange={() => toggle(l.id)} style={{ accentColor: C.teal.solid }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>{l.brand} {l.model}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>{l.serial_number}</div>
                </div>
              </label>
            ))}

            {checkedIds.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <label style={{ fontSize: "12px", color: "#666", marginBottom: "4px", display: "block" }}>Feedback (optional)</label>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Customer feedback on the demo..."
                  rows={2} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" as any, marginBottom: "8px" }} />
                <Btn variant="success" onClick={handleReturn} disabled={submitting}>
                  <Check size={14} />{submitting ? "Processing..." : `Return ${checkedIds.length} laptop${checkedIds.length > 1 ? "s" : ""}`}
                </Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Convert Panel ─── */
function ConvertPanel({ customers, onSuccess }: { customers: any[]; onSuccess: () => void }) {
  const [selected,    setSelected]    = useState<any>(null);
  const [activeDemo,  setActiveDemo]  = useState<any>(null);
  const [convertType, setConvertType] = useState<"rental" | "sale">("rental");
  const [submitting,  setSubmitting]  = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleSelectCustomer = async (c: any) => {
    setSelected(c); setActiveDemo(null);
    try {
      setLoadingDemo(true);
      const res = await api.get("/demos/demo/");
      const demos = Array.isArray(res.data) ? res.data : res.data.results || [];
      const active = demos.find((d: any) =>
        (d.customer === c.id || d.customer_detail?.id === c.id) && d.status === "ONGOING"
      );
      setActiveDemo(active ?? null);
    } catch (e) { console.error(e); }
    finally { setLoadingDemo(false); }
  };

  const handleConvert = async () => {
    if (!activeDemo) return;
    try {
      setSubmitting(true);
      await api.post(`/demos/demo/${activeDemo.id}/convert/`, { convert_to: convertType });
      onSuccess(); setSelected(null); setActiveDemo(null); setConvertType("rental");
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Conversion failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader title={<div style={{ display: "flex", alignItems: "center", gap: "8px" }}><TrendingUp size={15} color={C.violet.solid} />Convert demo</div>} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>1 · Select customer</div>
          <CustomerSearch customers={customers} selected={selected} onSelect={handleSelectCustomer} />
        </div>

        {selected && (
          <div>
            <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>2 · Convert to</div>

            {loadingDemo && <div style={{ textAlign: "center", color: "#bbb", padding: "16px", fontSize: "13px" }}>Loading...</div>}

            {!loadingDemo && !activeDemo && (
              <div style={{ padding: "12px", background: "#fffbf0", border: "1px solid #ffdfa0", borderRadius: "8px", fontSize: "13px", color: C.amber.text }}>
                No active demo found for {selected.name}.
              </div>
            )}

            {!loadingDemo && activeDemo && (
              <>
                <div style={{ background: C.violet.bg, border: `1px solid ${C.violet.border}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", fontSize: "13px" }}>
                  <div style={{ fontWeight: 500, color: C.violet.text, marginBottom: "4px" }}>Demo D-{activeDemo.id}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>{activeDemo.items_detail?.length ?? 0} laptop(s) · {activeDemo.purpose}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  {(["rental", "sale"] as const).map((type) => (
                    <div
                      key={type}
                      onClick={() => setConvertType(type)}
                      style={{
                        padding: "14px", border: convertType === type ? `1.5px solid ${C.violet.solid}` : "1px solid #e8e6e1",
                        borderRadius: "10px", cursor: "pointer", background: convertType === type ? C.violet.bg : "#fff",
                        textAlign: "center", transition: "all 0.15s",
                      }}
                    >
                      {type === "rental" ? <RotateCcw size={20} color={convertType === type ? C.violet.solid : "#aaa"} /> : <ShoppingCart size={20} color={convertType === type ? C.violet.solid : "#aaa"} />}
                      <div style={{ fontSize: "13px", fontWeight: 500, color: convertType === type ? C.violet.text : "#555", marginTop: "6px" }}>
                        {type === "rental" ? "Convert to Rental" : "Convert to Sale"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                        {type === "rental" ? "Keep using & pay monthly" : "Purchase the laptop"}
                      </div>
                    </div>
                  ))}
                </div>

                <Btn variant="primary" style={{ background: C.violet.solid, width: "100%", justifyContent: "center" }} onClick={handleConvert} disabled={submitting}>
                  <TrendingUp size={14} />{submitting ? "Converting..." : `Convert → ${convertType === "rental" ? "Rental" : "Sale"}`}
                </Btn>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Main Export ─── */
export function DemoReturns({ onSuccess }: { onSuccess: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get("/customers/customers/")
      .then((res) => setCustomers(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", marginBottom: "8px" }}>Returns & Conversions</h1>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "24px" }}>
        Return demo laptops or convert a demo into a rental or sale.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <ReturnPanel  customers={customers} onSuccess={onSuccess} />
        <ConvertPanel customers={customers} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
