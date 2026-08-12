import React, { useState } from "react";
import { crmApi } from "../../services/crm";

interface FollowUpFormProps {
  leadId?: number;
  customerId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const D = {
  blue: { solid: "#1a6ef5" },
  red:  { solid: "#e53e3e" },
};

const inp = (err?: string): React.CSSProperties => ({
  width: "100%", border: `1px solid ${err ? "#fca5a5" : "#e8e6e1"}`,
  borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
  background: err ? "#fff8f8" : "#fff", outline: "none",
  boxSizing: "border-box", color: "#1a1a1a",
});
const label: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "5px" };
const errMsg: React.CSSProperties = { fontSize: "11px", color: "#991b1b", marginTop: "3px" };

export function FollowUpForm({ leadId, customerId, onSuccess, onCancel }: FollowUpFormProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDT = tomorrow.toISOString().slice(0, 16);

  const [form, setForm] = useState({ scheduled_at: defaultDT, remarks: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async () => {
    if (!form.scheduled_at) { setErrors({ scheduled_at: "Please select a date and time." }); return; }
    try {
      setLoading(true);
      const payload: any = { ...form };
      if (leadId) payload.lead = leadId;
      if (customerId) payload.customer = customerId;
      await crmApi.createFollowUp(payload);
      onSuccess();
    } catch { alert("Failed to schedule follow-up."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={label}>Scheduled Date & Time <span style={{ color: D.red.solid }}>*</span></label>
        <input name="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={onChange} style={inp(errors.scheduled_at)} />
        {errors.scheduled_at && <div style={errMsg}>{errors.scheduled_at}</div>}
      </div>

      <div>
        <label style={label}>Remarks</label>
        <textarea name="remarks" value={form.remarks} onChange={onChange} rows={3}
          style={{ ...inp(), resize: "none" }} placeholder="What to discuss or check on…" />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "6px", borderTop: "1px solid #f0eeeb" }}>
        <button onClick={onCancel} disabled={loading} style={{
          padding: "8px 18px", border: "1px solid #e8e6e1", borderRadius: "8px",
          background: "#f4f3f0", color: "#555", fontSize: "13px", fontWeight: 500, cursor: "pointer",
          opacity: loading ? 0.5 : 1,
        }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{
          padding: "8px 20px", background: D.blue.solid, color: "#fff",
          border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
        }}>{loading ? "Saving…" : "Schedule Follow-up"}</button>
      </div>
    </div>
  );
}
