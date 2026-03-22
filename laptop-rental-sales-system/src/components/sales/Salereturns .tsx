import React, { useEffect, useState } from "react";
import {
  RotateCcw, RefreshCw, Check, Search, ChevronRight,
  PackageOpen, AlertTriangle, ArrowLeftRight, X, Loader2
} from "lucide-react";
import api from "../../services/axios";

/* ─── Design tokens (matches existing system) ─── */
const C = {
  blue:   { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  teal:   { bg: "#e6f7f1", text: "#0d6e50", border: "#a8e0ce", solid: "#1aad80" },
  amber:  { bg: "#fff8e6", text: "#8a5c00", border: "#ffdfa0", solid: "#d4930a" },
  red:    { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
  green:  { bg: "#eefaf0", text: "#166534", border: "#b0e8bc", solid: "#22c55e" },
  gray:   { bg: "#f4f3f0", text: "#555250", border: "#dddbd6", solid: "#8c8a85" },
  coral:  { bg: "#fff2ed", text: "#8f3a1a", border: "#ffc9b0", solid: "#e5622a" },
  purple: { bg: "#f3eeff", text: "#5b2d9e", border: "#d0b4f9", solid: "#7c3aed" },
};

function fmtINR(n?: number | string | null) {
  if (n == null || isNaN(Number(n))) return "—";
  return `₹${Number(n).toLocaleString("en-IN")}`;
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Sub-components ─── */
function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) {
  const c = (C as any)[color] ?? C.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: "99px",
      fontSize: "11px", fontWeight: 500,
      background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Btn({
  children, onClick, variant = "default", disabled = false, style = {}, size = "md"
}: any) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "6px",
    border: "none", borderRadius: "8px", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500, transition: "all 0.15s", opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? "12px" : "13px",
    padding: size === "sm" ? "5px 12px" : "8px 16px",
    ...style,
  };
  const variants: any = {
    default: { background: "#f4f3f0", color: "#333" },
    primary: { background: C.blue.solid, color: "#fff" },
    success: { background: C.teal.bg, color: C.teal.text, border: `0.5px solid ${C.teal.border}` },
    danger:  { background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}` },
    ghost:   { background: "transparent", color: "#555", border: "1px solid #e0deda" },
    amber:   { background: C.amber.bg, color: C.amber.text, border: `0.5px solid ${C.amber.border}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

function Card({ children, style = {} }: any) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #ebebeb",
      borderRadius: "14px", overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: any) {
  return (
    <div style={{
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
      color: "#aaa", textTransform: "uppercase", marginBottom: "10px",
    }}>
      {children}
    </div>
  );
}

function SearchInput({ placeholder, value, onChange }: any) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={13} color="#aaa" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%", padding: "8px 12px 8px 30px",
          border: "1px solid #e0deda", borderRadius: "8px",
          fontSize: "13px", color: "#1a1a1a", background: "#fafaf8",
          outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: "28px 16px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
      <Loader2 size={20} color="#aaa" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

function Toast({ message, type, onClose }: any) {
  const colors: any = {
    success: { bg: C.teal.bg, text: C.teal.text, border: C.teal.border },
    error:   { bg: C.red.bg,  text: C.red.text,  border: C.red.border },
  };
  const c = colors[type];
  return (
    <div style={{
      position: "fixed", top: "24px", right: "24px", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "10px",
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: "10px", padding: "12px 16px", fontSize: "13px",
      fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      animation: "slideIn 0.2s ease",
    }}>
      {type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
      {message}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}>
        <X size={13} />
      </button>
      <style>{`@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RETURN PANEL
══════════════════════════════════════════════ */
function ReturnPanel({ onSuccess, showToast }: any) {
  const [customers,       setCustomers]       = useState<any[]>([]);
  const [custSearch,      setCustSearch]      = useState("");
  const [selectedCust,    setSelectedCust]    = useState<any>(null);
  const [sales,           setSales]           = useState<any[]>([]);
  const [selectedSale,    setSelectedSale]    = useState<any>(null);
  const [checkedIds,      setCheckedIds]      = useState<number[]>([]);
  const [loadingCust,     setLoadingCust]     = useState(true);
  const [loadingSales,    setLoadingSales]    = useState(false);
  const [submitting,      setSubmitting]      = useState(false);

  useEffect(() => {
    api.get("/customers/customers/")
      .then(res => setCustomers(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(console.error)
      .finally(() => setLoadingCust(false));
  }, []);

  const handleSelectCust = async (c: any) => {
    setSelectedCust(c);
    setSelectedSale(null);
    setCheckedIds([]);
    setSales([]);
    setLoadingSales(true);
    try {
      const res = await api.get("/sales/sale/");
      const all = Array.isArray(res.data) ? res.data : res.data.results || [];
      const filtered = all.filter((s: any) =>
        (s.customer === c.id || s.customer_detail?.id === c.id) &&
        s.status !== "RETURNED"
      );
      setSales(filtered);
    } catch (e) { console.error(e); }
    finally { setLoadingSales(false); }
  };

  const handleReturn = async () => {
    if (!selectedSale || checkedIds.length === 0) return;
    setSubmitting(true);
    try {
      await api.post(`/sales/sale/${selectedSale.id}/return_laptops/`, { laptops: checkedIds });
      showToast(`${checkedIds.length} laptop${checkedIds.length > 1 ? "s" : ""} returned successfully`, "success");
      onSuccess();
      setSelectedCust(null);
      setSelectedSale(null);
      setCheckedIds([]);
      setSales([]);
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? "Return failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCust = customers.filter(c =>
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  const soldItems = selectedSale?.items_detail ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "start" }}>

      {/* Col 1: Customer */}
      <div>
        <SectionLabel>① Select Customer</SectionLabel>
        <SearchInput
          placeholder="Search by name or phone…"
          value={custSearch}
          onChange={(e: any) => setCustSearch(e.target.value)}
        />
        <div style={{ marginTop: "10px", maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {loadingCust ? <Spinner /> : filteredCust.length === 0 ? <EmptyState message="No customers found" /> :
            filteredCust.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelectCust(c)}
                style={{
                  padding: "10px 12px", borderRadius: "9px", cursor: "pointer",
                  border: selectedCust?.id === c.id ? `1.5px solid ${C.teal.solid}` : "1px solid #e8e6e1",
                  background: selectedCust?.id === c.id ? C.teal.bg : "#fff",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "all 0.12s",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>{c.phone}</div>
                </div>
                {selectedCust?.id === c.id && <Check size={13} color={C.teal.solid} />}
              </div>
            ))
          }
        </div>
      </div>

      {/* Col 2: Sale */}
      <div>
        <SectionLabel>② Select Sale</SectionLabel>
        {!selectedCust ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>
            Select a customer first
          </div>
        ) : loadingSales ? <Spinner /> : sales.length === 0 ? (
          <div style={{
            padding: "16px", background: C.amber.bg, border: `1px solid ${C.amber.border}`,
            borderRadius: "9px", fontSize: "13px", color: C.amber.text,
          }}>
            No returnable sales found for {selectedCust.name}.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" }}>
            {sales.map(s => (
              <div
                key={s.id}
                onClick={() => { setSelectedSale(s); setCheckedIds([]); }}
                style={{
                  padding: "12px 14px", borderRadius: "9px", cursor: "pointer",
                  border: selectedSale?.id === s.id ? `1.5px solid ${C.blue.solid}` : "1px solid #e8e6e1",
                  background: selectedSale?.id === s.id ? C.blue.bg : "#fff",
                  transition: "all 0.12s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500, fontSize: "13px" }}>Sale #{s.id}</span>
                  <Badge color="gray">{s.items_detail?.length ?? 0} items</Badge>
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                  {fmtDate(s.created_at)} · {fmtINR(s.total_amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Col 3: Laptops to return */}
      <div>
        <SectionLabel>③ Select Laptops to Return</SectionLabel>
        {!selectedSale ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>
            Select a sale first
          </div>
        ) : soldItems.length === 0 ? (
          <EmptyState message="No laptops in this sale" />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px", maxHeight: "260px", overflowY: "auto" }}>
              {soldItems.map((item: any) => {
                const checked = checkedIds.includes(item.laptop?.id);
                return (
                  <label
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 12px", borderRadius: "9px", cursor: "pointer",
                      border: `1px solid ${checked ? C.teal.border : "#e8e6e1"}`,
                      background: checked ? C.teal.bg : "#fff",
                      transition: "all 0.12s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setCheckedIds(prev =>
                        prev.includes(item.laptop?.id)
                          ? prev.filter(x => x !== item.laptop?.id)
                          : [...prev, item.laptop?.id]
                      )}
                      style={{ accentColor: C.teal.solid, width: "14px", height: "14px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: "13px" }}>
                        {item.laptop?.brand} {item.laptop?.model}
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>
                        {item.laptop?.serial_number} · {fmtINR(item.sale_price)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {checkedIds.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <Btn variant="success" onClick={handleReturn} disabled={submitting}
                  style={{ width: "100%", justifyContent: "center" }}>
                  {submitting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
                  {submitting ? "Processing…" : `Confirm Return (${checkedIds.length} laptop${checkedIds.length > 1 ? "s" : ""})`}
                </Btn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REPLACE PANEL
══════════════════════════════════════════════ */
function ReplacePanel({ onSuccess, showToast }: any) {
  const [customers,     setCustomers]     = useState<any[]>([]);
  const [custSearch,    setCustSearch]    = useState("");
  const [selectedCust,  setSelectedCust]  = useState<any>(null);
  const [sales,         setSales]         = useState<any[]>([]);
  const [selectedSale,  setSelectedSale]  = useState<any>(null);
  const [available,     setAvailable]     = useState<any[]>([]);
  const [oldLaptop,     setOldLaptop]     = useState("");
  const [newSearch,     setNewSearch]     = useState("");
  const [newLaptop,     setNewLaptop]     = useState<any>(null);
  const [loadingCust,   setLoadingCust]   = useState(true);
  const [loadingSales,  setLoadingSales]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/customers/customers/"),
      api.get("/inventory/laptops/?status=AVAILABLE"),
    ]).then(([cRes, lRes]) => {
      setCustomers(Array.isArray(cRes.data) ? cRes.data : cRes.data.results || []);
      setAvailable(Array.isArray(lRes.data) ? lRes.data : lRes.data.results || []);
    }).catch(console.error)
      .finally(() => setLoadingCust(false));
  }, []);

  const handleSelectCust = async (c: any) => {
    setSelectedCust(c);
    setSelectedSale(null);
    setOldLaptop("");
    setNewLaptop(null);
    setSales([]);
    setLoadingSales(true);
    try {
      const res = await api.get("/sales/sale/");
      const all = Array.isArray(res.data) ? res.data : res.data.results || [];
      const filtered = all.filter((s: any) =>
        (s.customer === c.id || s.customer_detail?.id === c.id) &&
        s.status !== "RETURNED"
      );
      setSales(filtered);
    } catch (e) { console.error(e); }
    finally { setLoadingSales(false); }
  };

  const handleReplace = async () => {
    if (!selectedSale || !oldLaptop || !newLaptop) return;
    setSubmitting(true);
    try {
      await api.post(`/sales/sale/${selectedSale.id}/replace_laptop/`, {
        old_laptop: Number(oldLaptop),
        new_laptop: newLaptop.id,
      });
      showToast("Laptop replaced successfully", "success");
      onSuccess();
      setSelectedCust(null);
      setSelectedSale(null);
      setOldLaptop("");
      setNewLaptop(null);
      setSales([]);
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? "Replacement failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCust = customers.filter(c =>
    c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  const filteredAvail = available.filter(l =>
    `${l.brand} ${l.model}`.toLowerCase().includes(newSearch.toLowerCase()) ||
    l.serial_number.toLowerCase().includes(newSearch.toLowerCase())
  );

  const soldItems = selectedSale?.items_detail ?? [];
  const oldLaptopObj = soldItems.find((i: any) => String(i.laptop?.id) === String(oldLaptop))?.laptop;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "start" }}>

      {/* Col 1: Customer + Sale */}
      <div>
        <SectionLabel>① Select Customer</SectionLabel>
        <SearchInput
          placeholder="Search by name or phone…"
          value={custSearch}
          onChange={(e: any) => setCustSearch(e.target.value)}
        />
        <div style={{ marginTop: "10px", maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {loadingCust ? <Spinner /> : filteredCust.length === 0 ? <EmptyState message="No customers found" /> :
            filteredCust.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelectCust(c)}
                style={{
                  padding: "10px 12px", borderRadius: "9px", cursor: "pointer",
                  border: selectedCust?.id === c.id ? `1.5px solid ${C.amber.solid}` : "1px solid #e8e6e1",
                  background: selectedCust?.id === c.id ? C.amber.bg : "#fff",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "all 0.12s",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>{c.name}</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>{c.phone}</div>
                </div>
                {selectedCust?.id === c.id && <Check size={13} color={C.amber.solid} />}
              </div>
            ))
          }
        </div>

        {/* Sale selector below customer */}
        {selectedCust && (
          <>
            <div style={{ height: "1px", background: "#f0eeeb", margin: "14px 0" }} />
            <SectionLabel>② Select Sale</SectionLabel>
            {loadingSales ? <Spinner /> : sales.length === 0 ? (
              <div style={{
                padding: "12px", background: C.amber.bg, border: `1px solid ${C.amber.border}`,
                borderRadius: "9px", fontSize: "12px", color: C.amber.text,
              }}>
                No eligible sales found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
                {sales.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSale(s); setOldLaptop(""); setNewLaptop(null); }}
                    style={{
                      padding: "10px 12px", borderRadius: "9px", cursor: "pointer",
                      border: selectedSale?.id === s.id ? `1.5px solid ${C.amber.solid}` : "1px solid #e8e6e1",
                      background: selectedSale?.id === s.id ? C.amber.bg : "#fff",
                      transition: "all 0.12s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500, fontSize: "13px" }}>Sale #{s.id}</span>
                      <Badge color="amber">{s.items_detail?.length ?? 0} items</Badge>
                    </div>
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>
                      {fmtDate(s.created_at)} · {fmtINR(s.total_amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Col 2: Old laptop */}
      <div>
        <SectionLabel>③ Laptop to Remove</SectionLabel>
        {!selectedSale ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>
            Select a sale first
          </div>
        ) : soldItems.length === 0 ? (
          <EmptyState message="No laptops in this sale" />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {soldItems.map((item: any) => {
                const selected = String(item.laptop?.id) === String(oldLaptop);
                return (
                  <div
                    key={item.id}
                    onClick={() => setOldLaptop(String(item.laptop?.id))}
                    style={{
                      padding: "12px 14px", borderRadius: "9px", cursor: "pointer",
                      border: `1px solid ${selected ? C.red.border : "#e8e6e1"}`,
                      background: selected ? C.red.bg : "#fff",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      transition: "all 0.12s",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "13px" }}>
                        {item.laptop?.brand} {item.laptop?.model}
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                        {item.laptop?.serial_number} · {fmtINR(item.sale_price)}
                      </div>
                    </div>
                    {selected && (
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: C.red.solid, display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <X size={11} color="#fff" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Arrow indicator */}
            {oldLaptop && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: "16px", gap: "8px", color: C.amber.text, fontSize: "12px",
              }}>
                <ArrowLeftRight size={14} />
                <span>Will be replaced by →</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Col 3: New laptop */}
      <div>
        <SectionLabel>④ Replacement Laptop</SectionLabel>
        {!oldLaptop ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>
            Select laptop to remove first
          </div>
        ) : (
          <>
            <SearchInput
              placeholder="Search available laptops…"
              value={newSearch}
              onChange={(e: any) => setNewSearch(e.target.value)}
            />
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "7px", maxHeight: "240px", overflowY: "auto" }}>
              {filteredAvail.length === 0 ? <EmptyState message="No available laptops" /> :
                filteredAvail.map(l => {
                  const selected = newLaptop?.id === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => setNewLaptop(l)}
                      style={{
                        padding: "12px 14px", borderRadius: "9px", cursor: "pointer",
                        border: `1px solid ${selected ? C.teal.border : "#e8e6e1"}`,
                        background: selected ? C.teal.bg : "#fff",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        transition: "all 0.12s",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "13px" }}>{l.brand} {l.model}</div>
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                          {l.serial_number} · {l.processor}
                        </div>
                        <div style={{ fontSize: "11px", color: C.teal.text, marginTop: "2px" }}>
                          {fmtINR(l.price)} sale · {fmtINR(l.rent_per_month)}/mo
                        </div>
                      </div>
                      {selected && (
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%",
                          background: C.teal.solid, display: "flex",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <Check size={11} color="#fff" />
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>

            {/* Summary + Confirm */}
            {oldLaptop && newLaptop && (
              <div style={{
                marginTop: "16px", padding: "14px", background: C.amber.bg,
                border: `1px solid ${C.amber.border}`, borderRadius: "10px",
              }}>
                <div style={{ fontSize: "11px", color: C.amber.text, fontWeight: 500, marginBottom: "10px" }}>
                  Swap Summary
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <div style={{ flex: 1, padding: "8px 10px", background: C.red.bg, borderRadius: "7px", color: C.red.text, fontSize: "11px" }}>
                    <div style={{ fontWeight: 500 }}>Remove</div>
                    <div>{oldLaptopObj?.brand} {oldLaptopObj?.model}</div>
                  </div>
                  <ArrowLeftRight size={14} color={C.amber.solid} />
                  <div style={{ flex: 1, padding: "8px 10px", background: C.teal.bg, borderRadius: "7px", color: C.teal.text, fontSize: "11px" }}>
                    <div style={{ fontWeight: 500 }}>Add</div>
                    <div>{newLaptop.brand} {newLaptop.model}</div>
                  </div>
                </div>
                <Btn
                  variant="amber"
                  onClick={handleReplace}
                  disabled={submitting}
                  style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
                >
                  {submitting
                    ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                    : <><RefreshCw size={13} /> Confirm Swap</>}
                </Btn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════ */
type TabId = "return" | "replace";

export function SaleReturns() {
  const [activeTab,  setActiveTab]  = useState<TabId>("return");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const showToast = (message: string, type: string) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSuccess = () => setRefreshKey(k => k + 1);

  const tabs: { id: TabId; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
    {
      id: "return",
      label: "Return Laptops",
      icon: <RotateCcw size={16} />,
      desc: "Process customer returns and restore laptop to available inventory",
      color: C.teal.solid,
    },
    {
      id: "replace",
      label: "Replace Laptop",
      icon: <RefreshCw size={16} />,
      desc: "Swap a laptop in an existing sale with another available unit",
      color: C.amber.solid,
    },
  ];

  return (
    <div style={{ minHeight: "100%", background: "#f8f7f5", fontFamily: "'Inter', sans-serif" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "linear-gradient(135deg, #1a6ef5, #1aad80)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PackageOpen size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            Returns & Replacements
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#999", margin: "0 0 0 50px" }}>
          Process laptop returns from customers or swap units in existing sales
        </p>
      </div>

      {/* Tab selector cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "18px 20px",
                border: `1.5px solid ${isActive ? tab.color : "#ebebeb"}`,
                borderRadius: "12px",
                cursor: "pointer",
                background: isActive ? "#fff" : "#fafaf8",
                display: "flex", alignItems: "center", gap: "14px",
                transition: "all 0.15s",
                boxShadow: isActive ? `0 2px 12px ${tab.color}22` : "none",
              }}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "9px",
                background: isActive ? tab.color : "#f0eeeb",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isActive ? "#fff" : "#aaa",
                flexShrink: 0,
                transition: "all 0.15s",
              }}>
                {tab.icon}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: "14px", color: isActive ? "#1a1a1a" : "#888" }}>
                  {tab.label}
                </div>
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                  {tab.desc}
                </div>
              </div>
              {isActive && (
                <div style={{ marginLeft: "auto" }}>
                  <ChevronRight size={15} color={tab.color} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel */}
      <Card style={{ padding: "24px" }}>
        {/* Panel header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "22px", paddingBottom: "18px",
          borderBottom: "1px solid #f0eeeb",
        }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: activeTab === "return" ? C.teal.bg : C.amber.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: activeTab === "return" ? C.teal.solid : C.amber.solid,
          }}>
            {activeTab === "return" ? <RotateCcw size={14} /> : <RefreshCw size={14} />}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: "14px", color: "#1a1a1a" }}>
              {activeTab === "return" ? "Return Laptops" : "Replace Laptop"}
            </div>
            <div style={{ fontSize: "11px", color: "#999", marginTop: "1px" }}>
              {activeTab === "return"
                ? "Select a customer → sale → laptops to mark as returned"
                : "Select a customer → sale → laptop to swap out → replacement unit"}
            </div>
          </div>
        </div>

        {/* Active panel */}
        {activeTab === "return" ? (
          <ReturnPanel key={`return-${refreshKey}`} onSuccess={handleSuccess} showToast={showToast} />
        ) : (
          <ReplacePanel key={`replace-${refreshKey}`} onSuccess={handleSuccess} showToast={showToast} />
        )}
      </Card>
    </div>
  );
}