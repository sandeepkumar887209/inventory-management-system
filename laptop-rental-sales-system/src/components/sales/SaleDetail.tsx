import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, RotateCcw, RefreshCw, Check, AlertCircle, X } from "lucide-react";
import api from "../../services/axios";
import {
  S, SCard, SCardHeader, SBtn, SBadge, saleBadge,
  fmtINR, fmtDate, fmtDateTime,
} from "./salesUi";

export function SaleDetail({ onBack }: { onBack: () => void }) {
  const { id } = useParams<{ id: string }>();

  const [sale,           setSale]           = useState<any>(null);
  const [loading,        setLoading]        = useState(true);
  const [showReturn,     setShowReturn]      = useState(false);
  const [showReplace,    setShowReplace]     = useState(false);
  const [checkedIds,     setCheckedIds]      = useState<number[]>([]);
  const [returnRemarks,  setReturnRemarks]   = useState("");
  const [submittingRet,  setSubmittingRet]   = useState(false);
  const [available,      setAvailable]       = useState<any[]>([]);
  const [oldLaptop,      setOldLaptop]       = useState("");
  const [newLaptop,      setNewLaptop]       = useState("");
  const [submittingRep,  setSubmittingRep]   = useState(false);
  const [loadingAvail,   setLoadingAvail]    = useState(false);
  const [toast,          setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { fetchSale(); }, [id]);

  const fetchSale = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sales/sale/${id}/`);
      setSale(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const loadAvailable = async () => {
    setLoadingAvail(true);
    try {
      const res = await api.get("/inventory/laptops/?status=AVAILABLE");
      setAvailable(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoadingAvail(false); }
  };

  const toggleCheck = (laptopId: number) => {
    setCheckedIds((prev) =>
      prev.includes(laptopId) ? prev.filter((x) => x !== laptopId) : [...prev, laptopId]
    );
  };

  const handleReturn = async () => {
    if (checkedIds.length === 0) return;
    try {
      setSubmittingRet(true);
      await api.post(`/sales/sale/${id}/return_laptops/`, {
        laptops: checkedIds,
        remarks: returnRemarks || undefined,
      });
      showToast(`${checkedIds.length} laptop${checkedIds.length > 1 ? "s" : ""} returned successfully`);
      setShowReturn(false);
      setCheckedIds([]);
      setReturnRemarks("");
      fetchSale();
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? "Return failed", false);
    } finally {
      setSubmittingRet(false);
    }
  };

  const handleReplace = async () => {
    if (!oldLaptop || !newLaptop) return;
    try {
      setSubmittingRep(true);
      await api.post(`/sales/sale/${id}/replace_laptop/`, {
        old_laptop: Number(oldLaptop),
        new_laptop: Number(newLaptop),
      });
      showToast("Laptop replaced successfully");
      setShowReplace(false);
      setOldLaptop("");
      setNewLaptop("");
      fetchSale();
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? "Replacement failed", false);
    } finally {
      setSubmittingRep(false);
    }
  };

  if (loading) return (
    <div style={{ padding: "80px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
      Loading sale…
    </div>
  );
  if (!sale) return (
    <div style={{ padding: "40px", color: S.rose.text, fontSize: "14px" }}>Sale not found.</div>
  );

  const soldItems    = sale.items_detail || [];
  const isCompleted  = sale.status === "COMPLETED";
  const gstAmount    = (Number(sale.subtotal) * Number(sale.gst)) / 100;

  return (
    <div style={{ maxWidth: "960px" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 9999,
          display: "flex", alignItems: "center", gap: "10px",
          background: toast.ok ? S.emerald.bg : S.rose.bg,
          color: toast.ok ? S.emerald.text : S.rose.text,
          border: `1px solid ${toast.ok ? S.emerald.border : S.rose.border}`,
          borderRadius: "10px", padding: "12px 18px", fontSize: "13px",
          fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}>
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "13px", color: "#94a3b8",
          background: "none", border: "none", cursor: "pointer",
          marginBottom: "20px", padding: 0,
        }}
      >
        <ChevronLeft size={15} /> Back to sales
      </button>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: "24px", gap: "16px", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>
              Sale #{sale.id}
            </h1>
            {saleBadge(sale.status)}
          </div>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "6px" }}>
            {fmtDate(sale.created_at)} · {soldItems.length} laptop{soldItems.length !== 1 ? "s" : ""}
          </p>
        </div>

        {isCompleted && (
          <div style={{ display: "flex", gap: "8px" }}>
            <SBtn variant="ghost" onClick={() => { setShowReturn(!showReturn); setShowReplace(false); }}>
              <RotateCcw size={13} /> Return
            </SBtn>
            <SBtn variant="ghost" onClick={() => {
              setShowReplace(!showReplace);
              setShowReturn(false);
              if (!showReplace) loadAvailable();
            }}>
              <RefreshCw size={13} /> Replace
            </SBtn>
          </div>
        )}
      </div>

      {/* Return panel */}
      {showReturn && (
        <div style={{
          background: S.rose.bg, border: `1px solid ${S.rose.border}`,
          borderRadius: "12px", padding: "16px 18px", marginBottom: "18px",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: S.rose.text, marginBottom: "12px" }}>
            Select Laptops to Return
          </div>
          {soldItems.map((item: any) => (
            <label key={item.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "9px 12px", border: `1px solid ${checkedIds.includes(item.laptop?.id) ? S.rose.solid : "#fca5a5"}`,
              borderRadius: "8px", marginBottom: "7px", cursor: "pointer",
              background: checkedIds.includes(item.laptop?.id) ? "#fff" : "transparent", transition: "all 0.12s",
            }}>
              <input
                type="checkbox"
                checked={checkedIds.includes(item.laptop?.id)}
                onChange={() => toggleCheck(item.laptop?.id)}
                style={{ accentColor: S.rose.solid, width: "14px", height: "14px" }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, fontSize: "13px", color: "#0f172a" }}>
                  {item.laptop?.brand} {item.laptop?.model}
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "8px" }}>
                  {item.laptop?.serial_number}
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{fmtINR(item.sale_price)}</span>
            </label>
          ))}
          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>
              Return Reason (optional)
            </label>
            <textarea
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. defective, customer changed mind…"
              style={{
                width: "100%", padding: "8px 12px", border: `1px solid ${S.rose.border}`,
                borderRadius: "8px", fontSize: "13px", resize: "none" as const,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          {checkedIds.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: S.rose.text, marginTop: "8px" }}>
              <AlertCircle size={13} /> Select at least one laptop
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <SBtn variant="danger" onClick={handleReturn} disabled={checkedIds.length === 0 || submittingRet}>
              <Check size={13} />
              {submittingRet ? "Processing…" : `Confirm Return (${checkedIds.length})`}
            </SBtn>
            <SBtn variant="ghost" onClick={() => { setShowReturn(false); setCheckedIds([]); setReturnRemarks(""); }}>
              Cancel
            </SBtn>
          </div>
        </div>
      )}

      {/* Replace panel */}
      {showReplace && (
        <div style={{
          background: S.amber.bg, border: `1px solid ${S.amber.border}`,
          borderRadius: "12px", padding: "16px 18px", marginBottom: "18px",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: S.amber.text, marginBottom: "12px" }}>
            Replace a Laptop
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>
                Laptop to remove (from this sale)
              </label>
              <select
                value={oldLaptop}
                onChange={(e) => setOldLaptop(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", border: `1px solid ${S.amber.border}`,
                  borderRadius: "8px", fontSize: "13px", background: "#fff", outline: "none",
                }}
              >
                <option value="">— Select laptop to swap out —</option>
                {soldItems.map((item: any) => (
                  <option key={item.laptop?.id} value={item.laptop?.id}>
                    {item.laptop?.brand} {item.laptop?.model} ({item.laptop?.serial_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "6px" }}>
                Replacement laptop (available inventory)
              </label>
              {loadingAvail ? (
                <div style={{ padding: "9px 12px", border: `1px solid ${S.amber.border}`, borderRadius: "8px", fontSize: "13px", color: "#94a3b8" }}>
                  Loading…
                </div>
              ) : (
                <select
                  value={newLaptop}
                  onChange={(e) => setNewLaptop(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px", border: `1px solid ${S.amber.border}`,
                    borderRadius: "8px", fontSize: "13px", background: "#fff", outline: "none",
                  }}
                >
                  <option value="">— Select replacement —</option>
                  {available.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.brand} {l.model} ({l.serial_number}) · {fmtINR(l.price)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <SBtn variant="amber" onClick={handleReplace} disabled={!oldLaptop || !newLaptop || submittingRep}>
              <RefreshCw size={13} />
              {submittingRep ? "Processing…" : "Confirm Replacement"}
            </SBtn>
            <SBtn variant="ghost" onClick={() => { setShowReplace(false); setOldLaptop(""); setNewLaptop(""); }}>
              Cancel
            </SBtn>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>

        {/* Customer */}
        <SCard>
          <SCardHeader title="Customer" />
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a", marginBottom: "6px" }}>
              {sale.customer_detail?.name ?? "—"}
            </div>
            {sale.customer_detail?.phone && (
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "3px" }}>
                📞 {sale.customer_detail.phone}
              </div>
            )}
            {sale.customer_detail?.email && (
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "3px" }}>
                ✉ {sale.customer_detail.email}
              </div>
            )}
            {sale.customer_detail?.customer_type && (
              <div style={{ marginTop: "8px" }}>
                <SBadge color="slate">
                  {sale.customer_detail.customer_type === "company" ? "Corporate" : "Individual"}
                </SBadge>
              </div>
            )}
          </div>
        </SCard>

        {/* Payment summary */}
        <SCard>
          <SCardHeader title="Payment Summary" />
          <div style={{ padding: "16px 20px" }}>
            {[
              ["Subtotal",         fmtINR(sale.subtotal)],
              [`GST (${sale.gst}%)`, fmtINR(gstAmount)],
              ["Date",             fmtDate(sale.created_at)],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "5px 0", borderBottom: "1px solid #f8f7f5",
                fontSize: "13px",
              }}>
                <span style={{ color: "#94a3b8" }}>{label}</span>
                <span style={{ color: "#334155" }}>{val}</span>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 0 4px", fontSize: "15px", fontWeight: 700, color: "#0f172a",
            }}>
              <span>Total</span>
              <span style={{ color: S.indigo.text }}>{fmtINR(sale.total_amount)}</span>
            </div>
            {sale.notes && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px", fontStyle: "italic" }}>
                {sale.notes}
              </div>
            )}
          </div>
        </SCard>
      </div>

      {/* Items table */}
      <SCard>
        <SCardHeader title={`Laptops Sold (${soldItems.length})`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafaf9" }}>
                {["Laptop", "Serial Number", "Specs", "Sale Price", "Laptop Status"].map((h) => (
                  <th key={h} style={{
                    padding: "9px 18px", textAlign: "left",
                    fontSize: "10.5px", fontWeight: 600, color: "#94a3b8",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    borderBottom: "1px solid #f1f0ee", whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {soldItems.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f8f7f5" }}>
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ fontWeight: 500, color: "#0f172a" }}>
                      {item.laptop?.brand} {item.laptop?.model}
                    </div>
                    {item.laptop?.color && (
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                        {item.laptop.color}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <code style={{
                      background: "#f1f5f9", padding: "3px 8px", borderRadius: "5px",
                      fontSize: "11px", fontFamily: "monospace", color: "#334155",
                    }}>
                      {item.laptop?.serial_number}
                    </code>
                  </td>
                  <td style={{ padding: "13px 18px", fontSize: "11px", color: "#64748b" }}>
                    {[item.laptop?.processor, item.laptop?.ram, item.laptop?.storage].filter(Boolean).join(" · ")}
                  </td>
                  <td style={{ padding: "13px 18px", fontWeight: 600, color: "#0f172a" }}>
                    {fmtINR(item.sale_price)}
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <SBadge color={
                      item.laptop?.status === "SOLD" ? "indigo" :
                      item.laptop?.status === "AVAILABLE" ? "emerald" : "slate"
                    }>
                      {item.laptop?.status ?? "—"}
                    </SBadge>
                  </td>
                </tr>
              ))}
              {soldItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SCard>
    </div>
  );
}
