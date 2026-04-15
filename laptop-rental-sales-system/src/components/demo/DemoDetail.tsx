import React, { useEffect, useState } from "react";
import { ChevronLeft, RotateCcw, TrendingUp, Check, ShoppingCart, MessageSquare } from "lucide-react";
import { useParams } from "react-router-dom";
import api from "../../services/axios";
import { Card, CardHeader, Btn, Badge, Spinner, statusBadge, fmtDate, daysDiff, C, PURPOSE_LABELS } from "./ui";

export function DemoDetail({ onBack }: { onBack: () => void }) {
  const { id }          = useParams();
  const [demo,          setDemo]          = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [showReturn,    setShowReturn]    = useState(false);
  const [showConvert,   setShowConvert]   = useState(false);
  const [showFeedback,  setShowFeedback]  = useState(false);
  const [available,     setAvailable]     = useState<any[]>([]);
  const [checkedIds,    setCheckedIds]    = useState<number[]>([]);
  const [convertType,   setConvertType]   = useState<"rental" | "sale">("rental");
  const [feedback,      setFeedback]      = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/demos/demo/${id}/`);
      setDemo(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleReturn = async () => {
    if (checkedIds.length === 0) return;
    try {
      setSubmitting(true);
      await api.post(`/demos/demo/${id}/return_laptops/`, { laptops: checkedIds, feedback });
      setShowReturn(false); setCheckedIds([]); setFeedback(""); load();
    } catch (err: any) { alert(err.response?.data?.error ?? "Return failed"); }
    finally { setSubmitting(false); }
  };

  const handleConvert = async () => {
    try {
      setSubmitting(true);
      await api.post(`/demos/demo/${id}/convert/`, { convert_to: convertType });
      setShowConvert(false); load();
    } catch (err: any) { alert(err.response?.data?.error ?? "Conversion failed"); }
    finally { setSubmitting(false); }
  };

  const handleFeedback = async () => {
    try {
      setSubmitting(true);
      await api.post(`/demos/demo/${id}/add_feedback/`, { feedback, rating: feedbackRating });
      setShowFeedback(false); load();
    } catch (err: any) { alert(err.response?.data?.error ?? "Failed to save feedback"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner />;
  if (!demo)   return <div style={{ padding: "40px", color: "#bbb", textAlign: "center" }}>Demo not found.</div>;

  const dueIn     = daysDiff(demo.expected_return_date);
  const isOngoing = demo.status === "ONGOING";
  const isOverdue = isOngoing && dueIn !== null && dueIn < 0;
  const demoItems = demo.items_detail ?? [];

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#888", background: "none", border: "none", cursor: "pointer", marginBottom: "20px", padding: 0 }}
      >
        <ChevronLeft size={15} /> Back to demos
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Demo D-{demo.id}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            {isOverdue ? <Badge color="red">Overdue by {Math.abs(dueIn!)}d</Badge> : statusBadge(demo.status)}
            {isOngoing && !isOverdue && dueIn !== null && dueIn <= 3 && <Badge color="amber">Due in {dueIn}d</Badge>}
            {demo.feedback_received && <Badge color="teal">✓ Feedback received</Badge>}
          </div>
        </div>

        {isOngoing && (
          <div style={{ display: "flex", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
            <Btn variant="ghost" onClick={() => { setShowReturn(!showReturn); setShowConvert(false); setShowFeedback(false); }}>
              <RotateCcw size={13} /> Return
            </Btn>
            <Btn variant="ghost" onClick={() => { setShowConvert(!showConvert); setShowReturn(false); setShowFeedback(false); }}>
              <TrendingUp size={13} /> Convert
            </Btn>
            {!demo.feedback_received && (
              <Btn variant="ghost" onClick={() => { setShowFeedback(!showFeedback); setShowReturn(false); setShowConvert(false); }}>
                <MessageSquare size={13} /> Add Feedback
              </Btn>
            )}
          </div>
        )}
      </div>

      {/* Return panel */}
      {showReturn && (
        <div style={{ background: C.teal.bg, border: `1px solid ${C.teal.border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: C.teal.text, marginBottom: "12px" }}>Select laptops to return</div>
          {demoItems.map((item: any) => (
            <label key={item.id} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px",
              border: `1px solid ${checkedIds.includes(item.laptop?.id) ? C.teal.solid : "#c0e8d0"}`,
              borderRadius: "8px", marginBottom: "6px", cursor: "pointer",
              background: checkedIds.includes(item.laptop?.id) ? "#fff" : "transparent", fontSize: "13px",
            }}>
              <input type="checkbox" checked={checkedIds.includes(item.laptop?.id)}
                onChange={() => setCheckedIds((prev) => prev.includes(item.laptop?.id) ? prev.filter((x) => x !== item.laptop?.id) : [...prev, item.laptop?.id])}
                style={{ accentColor: C.teal.solid }} />
              <span style={{ fontWeight: 500 }}>{item.laptop?.brand} {item.laptop?.model}</span>
              <span style={{ color: "#888", fontSize: "11px" }}>{item.laptop?.serial_number}</span>
            </label>
          ))}
          {demoItems.length === 0 && <div style={{ fontSize: "13px", color: "#aaa" }}>No laptops in this demo.</div>}
          {checkedIds.length > 0 && (
            <>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Customer feedback (optional)..."
                rows={2} style={{ width: "100%", padding: "8px 12px", border: "1px solid #a8e0ce", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" as any, marginTop: "8px", marginBottom: "8px" }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <Btn variant="success" onClick={handleReturn} disabled={submitting}>
                  <Check size={13} />{submitting ? "Processing..." : `Confirm return (${checkedIds.length})`}
                </Btn>
                <Btn variant="ghost" onClick={() => { setShowReturn(false); setCheckedIds([]); }}>Cancel</Btn>
              </div>
            </>
          )}
        </div>
      )}

      {/* Convert panel */}
      {showConvert && (
        <div style={{ background: C.violet.bg, border: `1px solid ${C.violet.border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: C.violet.text, marginBottom: "12px" }}>Convert this demo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            {(["rental", "sale"] as const).map((type) => (
              <div key={type} onClick={() => setConvertType(type)} style={{
                padding: "12px", border: convertType === type ? `1.5px solid ${C.violet.solid}` : "1px solid #c4b5fd",
                borderRadius: "10px", cursor: "pointer", background: convertType === type ? "#fff" : "transparent", textAlign: "center", transition: "all 0.15s",
              }}>
                {type === "rental" ? <RotateCcw size={18} color={convertType === type ? C.violet.solid : "#aaa"} /> : <ShoppingCart size={18} color={convertType === type ? C.violet.solid : "#aaa"} />}
                <div style={{ fontSize: "13px", fontWeight: 500, color: convertType === type ? C.violet.text : "#555", marginTop: "4px" }}>
                  → {type === "rental" ? "Rental" : "Sale"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn variant="primary" style={{ background: C.violet.solid }} onClick={handleConvert} disabled={submitting}>
              {submitting ? "Converting..." : `Convert to ${convertType === "rental" ? "Rental" : "Sale"}`}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowConvert(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Feedback panel */}
      {showFeedback && (
        <div style={{ background: "#fafaf8", border: "1px solid #e8e6e1", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a", marginBottom: "12px" }}>Record customer feedback</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            {[1,2,3,4,5].map((star) => (
              <button key={star} onClick={() => setFeedbackRating(star)} style={{
                fontSize: "20px", background: "none", border: "none", cursor: "pointer", padding: "0 2px",
                color: feedbackRating >= star ? "#f59e0b" : "#d1d5db",
              }}>★</button>
            ))}
            {feedbackRating > 0 && <span style={{ fontSize: "12px", color: "#888", alignSelf: "center" }}>{feedbackRating}/5</span>}
          </div>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Customer's thoughts on the demo experience..."
            rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e0deda", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" as any, marginBottom: "8px" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn variant="primary" onClick={handleFeedback} disabled={submitting || !feedback}>
              {submitting ? "Saving..." : "Save Feedback"}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowFeedback(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Main info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <Card>
          <CardHeader title="Customer" />
          <div style={{ padding: "14px 16px", fontSize: "13px" }}>
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>{demo.customer_detail?.name}</div>
            <div style={{ color: "#888" }}>{demo.customer_detail?.phone}</div>
            {demo.customer_detail?.email && <div style={{ color: "#888", marginTop: "2px" }}>{demo.customer_detail.email}</div>}
            <div style={{ marginTop: "6px" }}>
              <Badge color={demo.customer_detail?.customer_type === "company" ? "blue" : "gray"}>
                {demo.customer_detail?.customer_type === "company" ? "Corporate" : "Individual"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Demo Summary" />
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            {[
              ["Assigned",      fmtDate(demo.assigned_date ?? demo.created_at)],
              ["Return due",    fmtDate(demo.expected_return_date)],
              ["Duration",      demo.duration_days ? `${demo.duration_days} days` : "—"],
              ["Purpose",       PURPOSE_LABELS[demo.purpose] ?? demo.purpose ?? "—"],
              ["Training",      demo.requires_training ? "Yes" : "No"],
              ["Delivery",      demo.delivery_required ? "Yes" : "No"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>{label}</span>
                <span style={{ fontWeight: label === "Purpose" ? 500 : 400 }}>{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Requirements */}
      {demo.specific_requirements && (
        <Card style={{ marginBottom: "16px" }}>
          <CardHeader title="Specific Requirements" />
          <div style={{ padding: "14px 16px", fontSize: "13px", color: "#555", lineHeight: 1.6 }}>
            {demo.specific_requirements}
          </div>
        </Card>
      )}

      {/* Feedback display */}
      {demo.feedback_received && demo.feedback && (
        <Card style={{ marginBottom: "16px" }}>
          <CardHeader title="Customer Feedback" right={demo.feedback_rating ? <span style={{ color: "#f59e0b", fontSize: "14px" }}>{"★".repeat(demo.feedback_rating)}{"☆".repeat(5 - demo.feedback_rating)}</span> : undefined} />
          <div style={{ padding: "14px 16px", fontSize: "13px", color: "#555", lineHeight: 1.6 }}>
            {demo.feedback}
          </div>
        </Card>
      )}

      {/* Laptops table */}
      <Card>
        <CardHeader title={`Laptops (${demoItems.length})`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#fafaf8" }}>
                {["Laptop", "Serial", "Specs", "Status"].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#999", letterSpacing: "0.05em", borderBottom: "1px solid #f0eeeb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoItems.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f5f4f1" }}>
                  <td style={{ padding: "11px 14px", fontWeight: 500 }}>{item.laptop?.brand} {item.laptop?.model}</td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: "11px", color: "#888" }}>{item.laptop?.serial_number}</td>
                  <td style={{ padding: "11px 14px", fontSize: "11px", color: "#888" }}>
                    {[item.laptop?.processor, item.laptop?.ram, item.laptop?.storage].filter(Boolean).join(" · ")}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {item.laptop?.status === "DEMO" ? <Badge color="violet">In Demo</Badge>
                      : item.laptop?.status === "AVAILABLE" ? <Badge color="teal">Returned</Badge>
                      : <Badge color="gray">{item.laptop?.status}</Badge>}
                  </td>
                </tr>
              ))}
              {demoItems.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "28px", textAlign: "center", color: "#ccc", fontSize: "13px" }}>No items</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
