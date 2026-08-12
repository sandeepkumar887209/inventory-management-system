import React, { useEffect, useState } from "react";
import { crmApi } from "../../services/crm";
import { Lead, AssignableUser } from "./types";

interface LeadFormProps {
  lead?: Lead | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const D = {
  blue:  { bg: "#eaf2ff", text: "#1650b0", border: "#c3d9ff", solid: "#1a6ef5" },
  red:   { bg: "#fff0f0", text: "#991b1b", border: "#ffc5c5", solid: "#e53e3e" },
};

const FORM_STATUSES = [
  { value: "NEW",       label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "LOST",      label: "Lost" },
];

const EMPTY: any = {
  name: "", phone: "", email: "", company: "", address: "",
  source: "OTHER", intent: "RENT", status: "NEW",
  follow_up_date: "", expected_laptops: 1, budget: "", notes: "", assigned_to: "",
};

export function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const [form, setForm] = useState<any>(EMPTY);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!lead;

  useEffect(() => {
    crmApi.getAssignableUsers().then(setUsers).catch(() => {});
    if (lead) setForm({
      name: lead.name || "", phone: lead.phone || "",
      email: lead.email || "", company: lead.company || "",
      address: lead.address || "", source: lead.source || "OTHER",
      intent: lead.intent || "RENT", status: lead.status || "NEW",
      follow_up_date: lead.follow_up_date || "",
      expected_laptops: lead.expected_laptops || 1,
      budget: lead.budget || "", notes: lead.notes || "",
      assigned_to: lead.assigned_to ? String(lead.assigned_to) : "",
    });
  }, [lead]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p: any) => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.phone.trim()) e.phone = "Phone is required.";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const payload: any = { ...form };
    if (!payload.email) delete payload.email;
    if (!payload.follow_up_date) delete payload.follow_up_date;
    if (!payload.budget) delete payload.budget;
    payload.assigned_to = payload.assigned_to ? Number(payload.assigned_to) : null;
    payload.expected_laptops = Number(payload.expected_laptops);
    try {
      setLoading(true);
      if (isEditing) await crmApi.updateLead(lead!.id, payload);
      else await crmApi.createLead(payload);
      onSuccess();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const fe: Record<string, string> = {};
        Object.keys(data).forEach(k => { fe[k] = Array.isArray(data[k]) ? data[k][0] : String(data[k]); });
        setErrors(fe);
      } else alert("Failed to save lead.");
    } finally { setLoading(false); }
  };

  /* ── Input Styles ── */
  const inp = (field: string): React.CSSProperties => ({
    width: "100%", border: `1px solid ${errors[field] ? "#fca5a5" : "#e8e6e1"}`,
    borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
    background: errors[field] ? "#fff8f8" : "#fff",
    outline: "none", boxSizing: "border-box", color: "#1a1a1a",
    transition: "border-color 0.15s",
  });
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "5px" };
  const errStyle: React.CSSProperties = { fontSize: "11px", color: D.red.text, marginTop: "3px" };
  const sectionStyle: React.CSSProperties = { display: "grid", gap: "14px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "17px", fontWeight: 700, color: "#1a1a1a" }}>
          {isEditing ? "Edit Lead" : "Add New Lead"}
        </div>
        <div style={{ fontSize: "12px", color: "#aaa", marginTop: "3px" }}>
          {isEditing ? "Update the lead information below." : "Fill in the details to create a new lead."}
        </div>
      </div>

      {/* Basic Info */}
      <div style={{ ...sectionStyle, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label style={labelStyle}>Full Name <span style={{ color: D.red.solid }}>*</span></label>
          <input name="name" value={form.name} onChange={onChange} style={inp("name")} placeholder="e.g. Rahul Sharma" />
          {errors.name && <div style={errStyle}>{errors.name}</div>}
        </div>
        <div>
          <label style={labelStyle}>Phone <span style={{ color: D.red.solid }}>*</span></label>
          <input name="phone" value={form.phone} onChange={onChange} style={inp("phone")} placeholder="e.g. 9876543210" />
          {errors.phone && <div style={errStyle}>{errors.phone}</div>}
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} style={inp("email")} placeholder="email@example.com" />
        </div>
        <div>
          <label style={labelStyle}>Company</label>
          <input name="company" value={form.company} onChange={onChange} style={inp("company")} placeholder="Company name (if any)" />
        </div>
      </div>

      {/* Dropdowns row */}
      <div style={{ ...sectionStyle, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div>
          <label style={labelStyle}>Intent</label>
          <select name="intent" value={form.intent} onChange={onChange} style={inp("intent") as any}>
            <option value="RENT">Rent</option>
            <option value="BUY">Buy</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Source</label>
          <select name="source" value={form.source} onChange={onChange} style={inp("source") as any}>
            <option value="WALK_IN">Walk In</option>
            <option value="REFERRAL">Referral</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="WEBSITE">Website</option>
            <option value="COLD_CALL">Cold Call</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select name="status" value={form.status} onChange={onChange} style={inp("status") as any}>
            {FORM_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            {isEditing && lead?.status === "CONVERTED" && <option value="CONVERTED" disabled>Converted (use Convert button)</option>}
          </select>
          {errors.status && <div style={errStyle}>{errors.status}</div>}
        </div>
      </div>

      {/* Assigned To */}
      <div>
        <label style={labelStyle}>Assigned Salesperson</label>
        <select name="assigned_to" value={form.assigned_to} onChange={onChange} style={inp("assigned_to") as any}>
          <option value="">— Unassigned —</option>
          {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name}</option>)}
        </select>
      </div>

      {/* Numbers row */}
      <div style={{ ...sectionStyle, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div>
          <label style={labelStyle}>Expected Laptops</label>
          <input name="expected_laptops" type="number" min={1} value={form.expected_laptops} onChange={onChange} style={inp("expected_laptops")} />
        </div>
        <div>
          <label style={labelStyle}>Budget (₹)</label>
          <input name="budget" type="number" value={form.budget} onChange={onChange} style={inp("budget")} placeholder="Monthly budget" />
        </div>
        <div>
          <label style={labelStyle}>Follow-up Date</label>
          <input name="follow_up_date" type="date" value={form.follow_up_date} onChange={onChange} style={inp("follow_up_date")} />
        </div>
      </div>

      {/* Address */}
      <div>
        <label style={labelStyle}>Address</label>
        <input name="address" value={form.address} onChange={onChange} style={inp("address")} placeholder="Full address" />
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea name="notes" value={form.notes} onChange={onChange} rows={3}
          style={{ ...inp("notes"), resize: "none" }}
          placeholder="Any additional notes…"
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px", borderTop: "1px solid #f0eeeb" }}>
        <button onClick={onCancel} disabled={loading} style={{
          padding: "8px 18px", border: "1px solid #e8e6e1", borderRadius: "8px",
          background: "#f4f3f0", color: "#555", fontSize: "13px", fontWeight: 500, cursor: "pointer",
          opacity: loading ? 0.5 : 1,
        }}>Cancel</button>
        <button onClick={handleSubmit} disabled={loading} style={{
          padding: "8px 20px", background: D.blue.solid, color: "#fff",
          border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
        }}>
          {loading ? "Saving…" : isEditing ? "Update Lead" : "Create Lead"}
        </button>
      </div>
    </div>
  );
}
