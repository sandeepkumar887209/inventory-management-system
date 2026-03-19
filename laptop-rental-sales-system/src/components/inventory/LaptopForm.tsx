import React, { useState, useEffect } from "react";
import { AlertCircle, Plus, ExternalLink } from "lucide-react";
import { Button } from "../common/Button";
import api from "../../services/axios";

interface LaptopFormProps {
  laptop?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: any = {
  asset_tag:       "",
  brand:           "",
  model:           "",
  serial_number:   "",
  processor:       "",
  generation:      "",
  ram:             "",
  storage:         "",
  display_size:    "",
  os:              "",
  color:           "",
  condition:       "NEW",
  supplier:        "",
  purchase_date:   "",
  purchase_price:  "",   // cost to company — invoice price
  invoice_number:  "",
  warranty_expiry: "",
  price:           "",   // sale price
  rent_per_month:  "",
  status:          "AVAILABLE",
  internal_notes:  "",
  description:     "",
};

const REQUIRED = ["brand","model","serial_number","processor","generation","ram","storage","price","rent_per_month"];

const INPUT   = "w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
const INPUT_E = "w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";
const LABEL   = "block text-sm font-medium text-neutral-700 mb-1.5";
const SECTION = "border border-neutral-200 rounded-xl p-5 space-y-4 bg-neutral-50";
const SECTION_TITLE = "text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3";

export function LaptopForm({ laptop, onSubmit, onCancel }: LaptopFormProps) {
  const [form,      setForm]      = useState<any>({ ...EMPTY });
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [loading,   setLoading]   = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const isEditing = !!laptop;

  useEffect(() => {
    fetchSuppliers();
    if (laptop) {
      setForm({
        asset_tag:       laptop.asset_tag         || "",
        brand:           laptop.brand             || "",
        model:           laptop.model             || "",
        serial_number:   laptop.serial_number     || "",
        processor:       laptop.processor         || "",
        generation:      laptop.generation        || "",
        ram:             laptop.ram               || "",
        storage:         laptop.storage           || "",
        display_size:    laptop.display_size      || "",
        os:              laptop.os                || "",
        color:           laptop.color             || "",
        condition:       laptop.condition         || "NEW",
        supplier:        laptop.supplier          || "",
        purchase_date:   laptop.purchase_date     || "",
        purchase_price:  laptop.purchase_price    ? String(laptop.purchase_price) : "",
        invoice_number:  laptop.invoice_number    || "",
        warranty_expiry: laptop.warranty_expiry   || "",
        price:           laptop.price             ? String(laptop.price) : "",
        rent_per_month:  laptop.rent_per_month    ? String(laptop.rent_per_month) : "",
        status:          laptop.status            || "AVAILABLE",
        internal_notes:  laptop.internal_notes    || "",
        description:     laptop.description?.notes || "",
      });
    }
  }, [laptop]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const res = await api.get("/inventory/suppliers/");
      setSuppliers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      console.error("Failed to load suppliers");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    REQUIRED.forEach(f => { if (!form[f]) errs[f] = "This field is required."; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload: any = {
      ...form,
      price:          parseFloat(form.price),
      rent_per_month: parseFloat(form.rent_per_month),
      description:    { notes: form.description },
    };

    // Numeric optionals
    if (form.purchase_price) payload.purchase_price = parseFloat(form.purchase_price);
    else delete payload.purchase_price;

    // Empty string → null for FK / date fields
    if (!form.supplier)        delete payload.supplier;
    if (!form.purchase_date)   delete payload.purchase_date;
    if (!form.warranty_expiry) delete payload.warranty_expiry;

    try {
      await onSubmit(payload);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.serial_number) setErrors({ serial_number: "This serial number already exists." });
      else if (data?.asset_tag) setErrors({ asset_tag: "This asset tag already exists." });
      else alert("Failed to save laptop. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  const fi = (field: string) => errors[field] ? INPUT_E : INPUT;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Error banner */}
      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">Please fix the highlighted fields below.</p>
        </div>
      )}

      {/* ─────────────── IDENTITY ─────────────── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Identity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={LABEL}>Asset Tag</label>
            <input name="asset_tag" value={form.asset_tag} onChange={handleChange}
              className={fi("asset_tag")} placeholder="e.g. LT-0001 (auto-assigned if blank)" />
            {errors.asset_tag && <p className="text-xs text-red-500 mt-1">{errors.asset_tag}</p>}
          </div>

          <div>
            <label className={LABEL}>Serial Number <span className="text-red-500">*</span></label>
            <input name="serial_number" value={form.serial_number} onChange={handleChange}
              className={fi("serial_number")} placeholder="Manufacturer serial number" />
            {errors.serial_number && <p className="text-xs text-red-500 mt-1">{errors.serial_number}</p>}
          </div>

          <div>
            <label className={LABEL}>Brand <span className="text-red-500">*</span></label>
            <select name="brand" value={form.brand} onChange={handleChange} className={fi("brand")}>
              <option value="">Select Brand</option>
              {["Dell","HP","Lenovo","Apple","Asus","Acer","MSI","Samsung","Toshiba","Other"].map(b => (
                <option key={b}>{b}</option>
              ))}
            </select>
            {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
          </div>

          <div>
            <label className={LABEL}>Model <span className="text-red-500">*</span></label>
            <input name="model" value={form.model} onChange={handleChange}
              className={fi("model")} placeholder="e.g. XPS 15, ThinkPad X1 Carbon" />
            {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
          </div>

        </div>
      </div>

      {/* ─────────────── SPECIFICATIONS ─────────────── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Specifications</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={LABEL}>Processor <span className="text-red-500">*</span></label>
            <input name="processor" value={form.processor} onChange={handleChange}
              className={fi("processor")} placeholder="e.g. Intel Core i7-1185G7" />
            {errors.processor && <p className="text-xs text-red-500 mt-1">{errors.processor}</p>}
          </div>

          <div>
            <label className={LABEL}>Generation <span className="text-red-500">*</span></label>
            <input name="generation" value={form.generation} onChange={handleChange}
              className={fi("generation")} placeholder="e.g. 11th Gen, M2, Ryzen 5 5000" />
            {errors.generation && <p className="text-xs text-red-500 mt-1">{errors.generation}</p>}
          </div>

          <div>
            <label className={LABEL}>RAM <span className="text-red-500">*</span></label>
            <select name="ram" value={form.ram} onChange={handleChange} className={fi("ram")}>
              <option value="">Select RAM</option>
              {["4GB","8GB","12GB","16GB","24GB","32GB","64GB"].map(v => <option key={v}>{v}</option>)}
            </select>
            {errors.ram && <p className="text-xs text-red-500 mt-1">{errors.ram}</p>}
          </div>

          <div>
            <label className={LABEL}>Storage <span className="text-red-500">*</span></label>
            <select name="storage" value={form.storage} onChange={handleChange} className={fi("storage")}>
              <option value="">Select Storage</option>
              {["128GB SSD","256GB SSD","512GB SSD","1TB SSD","256GB HDD","500GB HDD","1TB HDD","2TB HDD"].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
            {errors.storage && <p className="text-xs text-red-500 mt-1">{errors.storage}</p>}
          </div>

          <div>
            <label className={LABEL}>Display Size</label>
            <input name="display_size" value={form.display_size} onChange={handleChange}
              className={INPUT} placeholder='e.g. 15.6", 13.3"' />
          </div>

          <div>
            <label className={LABEL}>Operating System</label>
            <select name="os" value={form.os} onChange={handleChange} className={INPUT}>
              <option value="">Select OS</option>
              {["Windows 10 Home","Windows 10 Pro","Windows 11 Home","Windows 11 Pro","macOS","Ubuntu","FreeDOS","No OS"].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>Color</label>
            <input name="color" value={form.color} onChange={handleChange}
              className={INPUT} placeholder="e.g. Space Grey, Platinum Silver" />
          </div>

          <div>
            <label className={LABEL}>Condition</label>
            <select name="condition" value={form.condition} onChange={handleChange} className={INPUT}>
              <option value="NEW">New — Brand new, never used</option>
              <option value="GOOD">Good — Lightly used, no damage</option>
              <option value="FAIR">Fair — Visible wear, fully functional</option>
              <option value="POOR">Poor — Heavy wear or minor issues</option>
            </select>
          </div>

        </div>
      </div>

      {/* ─────────────── SUPPLIER & PURCHASE ─────────────── */}
      <div className={SECTION}>
        <div className="flex items-center justify-between mb-3">
          <p className={SECTION_TITLE} style={{ marginBottom: 0 }}>Supplier & Purchase Details</p>
          <a
            href="/inventory/suppliers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            title="Manage suppliers in a new tab"
          >
            <Plus className="w-3 h-3" />
            Add Supplier
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Supplier dropdown */}
          <div className="md:col-span-2">
            <label className={LABEL}>Supplier</label>
            {loadingSuppliers ? (
              <div className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-400">
                Loading suppliers...
              </div>
            ) : suppliers.length === 0 ? (
              <div className="w-full px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                No suppliers found.{" "}
                <a href="/inventory/suppliers" target="_blank" className="underline font-medium">
                  Add a supplier first
                </a>
              </div>
            ) : (
              <select name="supplier" value={form.supplier} onChange={handleChange} className={INPUT}>
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.phone ? ` · ${s.phone}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={LABEL}>Purchase Date</label>
            <input name="purchase_date" type="date" value={form.purchase_date} onChange={handleChange}
              className={INPUT} />
          </div>

          {/* Cost to Company = purchase_price (what we paid the supplier) */}
          <div>
            <label className={LABEL}>
              Cost to Company (₹)
              <span className="text-xs font-normal text-neutral-400 ml-1">— what you paid the supplier</span>
            </label>
            <input name="purchase_price" type="number" step="0.01" min="0"
              value={form.purchase_price} onChange={handleChange}
              className={INPUT} placeholder="Invoice / cost price" />
          </div>

          <div>
            <label className={LABEL}>Invoice Number</label>
            <input name="invoice_number" value={form.invoice_number} onChange={handleChange}
              className={INPUT} placeholder="Supplier invoice / bill number" />
          </div>

          <div>
            <label className={LABEL}>Warranty Expiry</label>
            <input name="warranty_expiry" type="date" value={form.warranty_expiry} onChange={handleChange}
              className={INPUT} />
          </div>

        </div>
      </div>

      {/* ─────────────── PRICING & STATUS ─────────────── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Pricing & Status</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className={LABEL}>
              Sale Price (₹) <span className="text-red-500">*</span>
              <span className="text-xs font-normal text-neutral-400 ml-1">— listed selling price</span>
            </label>
            <input name="price" type="number" step="0.01" min="0"
              value={form.price} onChange={handleChange}
              className={fi("price")} placeholder="e.g. 55000" />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className={LABEL}>
              Rent / Month (₹) <span className="text-red-500">*</span>
            </label>
            <input name="rent_per_month" type="number" step="0.01" min="0"
              value={form.rent_per_month} onChange={handleChange}
              className={fi("rent_per_month")} placeholder="e.g. 3000" />
            {errors.rent_per_month && <p className="text-xs text-red-500 mt-1">{errors.rent_per_month}</p>}
          </div>

          <div>
            <label className={LABEL}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={INPUT}>
              <option value="AVAILABLE">Available</option>
              <option value="DEMO">Demo</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>
          </div>

        </div>
      </div>

      {/* ─────────────── NOTES ─────────────── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Notes</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} className={`${INPUT} resize-none`}
              placeholder="Public-facing description shown to customers..." />
          </div>
          <div>
            <label className={LABEL}>Internal Notes</label>
            <textarea name="internal_notes" value={form.internal_notes} onChange={handleChange}
              rows={3} className={`${INPUT} resize-none`}
              placeholder="Private notes for your team (not shown to customers)..." />
          </div>
        </div>
      </div>

      {/* ─────────────── SUBMIT ─────────────── */}
      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Laptop" : "Add Laptop"}
        </Button>
      </div>

    </form>
  );
}