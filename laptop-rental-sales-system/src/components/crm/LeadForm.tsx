import React, { useEffect, useState } from "react";
import { Button } from "../common/Button";
import api from "../../services/axios";
import { Lead, Tag } from "./types";

interface LeadFormProps {
  lead?: Lead | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  company: "",
  address: "",
  source: "OTHER",
  intent: "RENT",
  status: "NEW",
  follow_up_date: "",
  expected_laptops: 1,
  budget: "",
  notes: "",
};

export function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!lead;

  useEffect(() => {
    fetchTags();
    if (lead) {
      setForm({
        name: lead.name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        company: lead.company || "",
        address: lead.address || "",
        source: lead.source || "OTHER",
        intent: lead.intent || "RENT",
        status: lead.status || "NEW",
        follow_up_date: lead.follow_up_date || "",
        expected_laptops: lead.expected_laptops || 1,
        budget: lead.budget || "",
        notes: lead.notes || "",
      });
      setSelectedTagIds(lead.tags?.map((t) => t.id) || []);
    }
  }, [lead]);

  const fetchTags = async () => {
    try {
      const res = await api.get("/crm/tags/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setAllTags(data);
    } catch {
      // tags are optional
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.phone.trim()) errs.phone = "Phone is required.";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload: any = { ...form };
    if (!payload.email) delete payload.email;
    if (!payload.follow_up_date) delete payload.follow_up_date;
    if (!payload.budget) delete payload.budget;
    payload.expected_laptops = Number(payload.expected_laptops);

    try {
      setLoading(true);
      if (isEditing) {
        await api.patch(`/crm/leads/${lead!.id}/`, payload);
      } else {
        const res = await api.post("/crm/leads/", payload);
        // Add tags to new lead
        for (const tagId of selectedTagIds) {
          await api.post(`/crm/leads/${res.data.id}/add-tag/`, { tag_id: tagId });
        }
      }
      onSuccess();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const fieldErrors: Record<string, string> = {};
        Object.keys(data).forEach((k) => {
          fieldErrors[k] = Array.isArray(data[k]) ? data[k][0] : data[k];
        });
        setErrors(fieldErrors);
      } else {
        alert("Failed to save lead.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const inputClass = (field: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
      errors[field] ? "border-red-400" : "border-neutral-200"
    }`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">
          {isEditing ? "Edit Lead" : "Add New Lead"}
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {isEditing ? "Update the lead information below." : "Fill in the details to create a new lead."}
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input name="name" value={form.name} onChange={handleChange} className={inputClass("name")} placeholder="e.g. Rahul Sharma" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input name="phone" value={form.phone} onChange={handleChange} className={inputClass("phone")} placeholder="e.g. 9876543210" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass("email")} placeholder="email@example.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Company</label>
          <input name="company" value={form.company} onChange={handleChange} className={inputClass("company")} placeholder="Company name (if any)" />
        </div>
      </div>

      {/* Intent & Source */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Intent</label>
          <select name="intent" value={form.intent} onChange={handleChange} className={inputClass("intent")}>
            <option value="RENT">Rent</option>
            <option value="BUY">Buy</option>
            <option value="BOTH">Both</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Source</label>
          <select name="source" value={form.source} onChange={handleChange} className={inputClass("source")}>
            <option value="WALK_IN">Walk In</option>
            <option value="REFERRAL">Referral</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="WEBSITE">Website</option>
            <option value="COLD_CALL">Cold Call</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass("status")}>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Expected Laptops</label>
          <input name="expected_laptops" type="number" min={1} value={form.expected_laptops} onChange={handleChange} className={inputClass("expected_laptops")} />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Budget (₹)</label>
          <input name="budget" type="number" value={form.budget} onChange={handleChange} className={inputClass("budget")} placeholder="Monthly budget" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Follow-up Date</label>
          <input name="follow_up_date" type="date" value={form.follow_up_date} onChange={handleChange} className={inputClass("follow_up_date")} />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
        <input name="address" value={form.address} onChange={handleChange} className={inputClass("address")} placeholder="Full address" />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className={`${inputClass("notes")} resize-none`}
          placeholder="Any additional notes..."
        />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${
                  selectedTagIds.includes(tag.id)
                    ? "text-white border-transparent"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                }`}
                style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Lead" : "Create Lead"}
        </Button>
      </div>
    </div>
  );
}
