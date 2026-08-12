import React, { useState } from "react";
import { crmApi } from "../../services/crm";

interface ActivityFormProps {
  leadId?: number;
  customerId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const D = {
  blue: { solid: "#1a6ef5" },
  red:  { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
};

const inp = (err?: string): React.CSSProperties => ({
  width: "100%", border: `1px solid ${err ? "#fca5a5" : "#e8e6e1"}`,
  borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
  background: err ? "#fff8f8" : "#fff", outline: "none",
  boxSizing: "border-box", color: "#1a1a1a",
});
const label: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "5px" };
const errMsg: React.CSSProperties = { fontSize: "11px", color: "#991b1b", marginTop: "3px" };

export function ActivityForm({ leadId, customerId, onSuccess, onCancel }: ActivityFormProps) {
  const [form, setForm] = useState({
    activity_type: "CALL",
    summary: "",
    description: "",
    activity_date: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async () => {
    if (!form.summary.trim()) { setErrors({ summary: "Summary is required." }); return; }
    try {
      setLoading(true);
      const payload: any = { ...form };
      if (leadId) payload.lead = leadId;
      if (customerId) payload.customer = customerId;
      await crmApi.createActivity(payload);
      onSuccess();
    } catch { alert("Failed to log activity."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={label}>Activity Type</label>
        <select name="activity_type" value={form.activity_type} onChange={onChange} style={inp() as any}>
          <option value="CALL">📞 Call</option>
          <option value="EMAIL">📧 Email</option>
          <option value="MEETING">🤝 Meeting</option>
          <option value="VISIT">🚶 Visit</option>
          <option value="WHATSAPP">💬 WhatsApp</option>
          <option value="NOTE">📝 Note</option>
        </select>
      </div>

      <div>
        <label style={label}>Summary <span style={{ color: D.red.solid }}>*</span></label>
        <input name="summary" value={form.summary} onChange={onChange} style={inp(errors.summary)} placeholder="Brief summary of what happened…" />
        {errors.summary && <div style={errMsg}>{errors.summary}</div>}
      </div>

      <div>
        <label style={label}>Description</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={3}
          style={{ ...inp(), resize: "none" }} placeholder="Detailed notes…" />
      </div>

      <div>
        <label style={label}>Date & Time</label>
        <input name="activity_date" type="datetime-local" value={form.activity_date} onChange={onChange} style={inp()} />
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
        }}>{loading ? "Saving…" : "Log Activity"}</button>
      </div>
    </div>
  );
}
