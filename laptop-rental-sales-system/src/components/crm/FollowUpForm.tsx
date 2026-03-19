import React, { useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";

interface FollowUpFormProps {
  leadId?: number;
  customerId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FollowUpForm({ leadId, customerId, onSuccess, onCancel }: FollowUpFormProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateTime = tomorrow.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    scheduled_at: defaultDateTime,
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async () => {
    if (!form.scheduled_at) {
      setErrors({ scheduled_at: "Please select a date and time." });
      return;
    }
    try {
      setLoading(true);
      const payload: any = { ...form };
      if (leadId) payload.lead = leadId;
      if (customerId) payload.customer = customerId;
      await api.post("/crm/followups/", payload);
      onSuccess();
    } catch {
      alert("Failed to schedule follow-up.");
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
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Scheduled At <span className="text-red-500">*</span>
        </label>
        <input
          name="scheduled_at"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={handleChange}
          className={inputClass("scheduled_at")}
        />
        {errors.scheduled_at && <p className="text-xs text-red-500 mt-1">{errors.scheduled_at}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Remarks</label>
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
          rows={3}
          className={`${inputClass("remarks")} resize-none`}
          placeholder="What to discuss or check on..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Schedule Follow-up"}
        </Button>
      </div>
    </div>
  );
}
