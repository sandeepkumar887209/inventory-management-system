import React, { useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";

interface ActivityFormProps {
  leadId?: number;
  customerId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ActivityForm({ leadId, customerId, onSuccess, onCancel }: ActivityFormProps) {
  const [form, setForm] = useState({
    activity_type: "CALL",
    summary: "",
    description: "",
    activity_date: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async () => {
    if (!form.summary.trim()) {
      setErrors({ summary: "Summary is required." });
      return;
    }
    try {
      setLoading(true);
      const payload: any = { ...form };
      if (leadId) payload.lead = leadId;
      if (customerId) payload.customer = customerId;
      await api.post("/crm/activities/", payload);
      onSuccess();
    } catch {
      alert("Failed to log activity.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      errors[field] ? "border-red-400" : "border-neutral-200"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Activity Type</label>
        <select name="activity_type" value={form.activity_type} onChange={handleChange} className={inputClass("activity_type")}>
          <option value="CALL">📞 Call</option>
          <option value="EMAIL">📧 Email</option>
          <option value="VISIT">🚶 Visit</option>
          <option value="MEETING">🤝 Meeting</option>
          <option value="WHATSAPP">💬 WhatsApp</option>
          <option value="NOTE">📝 Note</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Summary <span className="text-red-500">*</span>
        </label>
        <input
          name="summary"
          value={form.summary}
          onChange={handleChange}
          className={inputClass("summary")}
          placeholder="Brief summary of what happened..."
        />
        {errors.summary && <p className="text-xs text-red-500 mt-1">{errors.summary}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className={`${inputClass("description")} resize-none`}
          placeholder="Detailed notes..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Date & Time</label>
        <input
          name="activity_date"
          type="datetime-local"
          value={form.activity_date}
          onChange={handleChange}
          className={inputClass("activity_date")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Log Activity"}
        </Button>
      </div>
    </div>
  );
}
