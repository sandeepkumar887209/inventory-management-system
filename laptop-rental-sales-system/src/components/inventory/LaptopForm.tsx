import React, { useState, useEffect } from "react";
import { AlertCircle, Plus, ExternalLink } from "lucide-react";
import api from "../../services/axios";
import { T, Btn } from "./ui";

/* ── field-level shared styles ── */
const FIELD = "w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
const FIELD_ERR = "w-full px-4 py-2 border border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";
const LABEL = "block text-sm font-medium mb-1.5";
const SECTION = "border border-neutral-100 rounded-xl p-5 space-y-4 bg-neutral-50";
const SECTION_TITLE = "text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3";

const EMPTY = {
  asset_tag: "", brand: "", model: "", serial_number: "",
  processor: "", generation: "", ram: "", storage: "",
  display_size: "", os: "", color: "",
  gpu: "",                          // ✅ NEW
  condition: "NEW",
  supplier: "", purchase_date: "", purchase_price: "",
  cost_to_company: "",              // ✅ NEW
  invoice_number: "", warranty_expiry: "",
  price: "", rent_per_month: "",
  status: "AVAILABLE",
  internal_notes: "", description: "",
};

const REQUIRED = ["brand","model","serial_number","processor","generation","ram","storage","price","rent_per_month"];

interface Props {
  laptop?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function LaptopForm({ laptop, onSubmit, onCancel }: Props) {
  const [form,      setForm]      = useState<any>({ ...EMPTY });
  const [errors,    setErrors]    = useState<Record<string,string>>({});
  const [loading,   setLoading]   = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingS,  setLoadingS]  = useState(true);

  const isEdit = !!laptop;

  useEffect(() => {
    api.get("/inventory/suppliers/")
      .then((r) => setSuppliers(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {})
      .finally(() => setLoadingS(false));

    if (laptop) {
      setForm({
        asset_tag:       laptop.asset_tag       || "",
        brand:           laptop.brand           || "",
        model:           laptop.model           || "",
        serial_number:   laptop.serial_number   || "",
        processor:       laptop.processor       || "",
        generation:      laptop.generation      || "",
        ram:             laptop.ram             || "",
        storage:         laptop.storage         || "",
        gpu:             laptop.gpu             || "",
        display_size:    laptop.display_size    || "",
        os:              laptop.os              || "",
        color:           laptop.color           || "",
        condition:       laptop.condition       || "NEW",
        supplier:        laptop.supplier        || "",
        purchase_date:   laptop.purchase_date   || "",
        purchase_price:  laptop.purchase_price  ? String(laptop.purchase_price) : "",
        cost_to_company: laptop.cost_to_company ? String(laptop.cost_to_company) : "",
        invoice_number:  laptop.invoice_number  || "",
        warranty_expiry: laptop.warranty_expiry || "",
        price:           laptop.price           ? String(laptop.price) : "",
        rent_per_month:  laptop.rent_per_month  ? String(laptop.rent_per_month) : "",
        status:          laptop.status          || "AVAILABLE",
        internal_notes:  laptop.internal_notes  || "",
        description:     laptop.description?.notes || "",
      });
    }
  }, [laptop]);

  const handle = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p: any) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string,string> = {};
    REQUIRED.forEach((f) => { if (!form[f]) errs[f] = "Required"; });
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
    if (form.purchase_price) payload.purchase_price = parseFloat(form.purchase_price);
    else delete payload.purchase_price;
    if (!form.supplier)        delete payload.supplier;
    if (!form.purchase_date)   delete payload.purchase_date;
    if (!form.warranty_expiry) delete payload.warranty_expiry;
    if (form.cost_to_company)
      payload.cost_to_company = parseFloat(form.cost_to_company);
    else
      delete payload.cost_to_company;

    try {
      await onSubmit(payload);
    } catch (err: any) {
      const d = err?.response?.data;
      if (d?.serial_number) setErrors({ serial_number: "Serial number already exists" });
      else if (d?.asset_tag) setErrors({ asset_tag: "Asset tag already exists" });
      else alert("Failed to save. Check all fields.");
    } finally {
      setLoading(false);
    }
  };

  const fi = (f: string) => errors[f] ? FIELD_ERR : FIELD;
  const labelStyle = (f: string) => ({
    ...({ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: errors[f] ? "#dc2626" : T.text }),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-1 md:px-2">

      {/* Error banner */}
      {Object.keys(errors).length > 0 && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 16px", background: T.red.bg,
            border: `1px solid ${T.red.border}`, borderRadius: T.radiusSm,
          }}
        >
          <AlertCircle size={16} color={T.red.text} />
          <span style={{ fontSize: "13px", color: T.red.text }}>
            Please fix the highlighted fields below.
          </span>
        </div>
      )}

      {/* ── IDENTITY ── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Identity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label style={labelStyle("asset_tag")} className={LABEL}>
              Asset Tag
            </label>
            <input name="asset_tag" value={form.asset_tag} onChange={handle}
              className={fi("asset_tag")} placeholder="e.g. LT-0001 (auto-assigned if blank)" />
            {errors.asset_tag && <p className="text-xs text-red-500 mt-1">{errors.asset_tag}</p>}
          </div>

          <div>
            <label style={labelStyle("serial_number")} className={LABEL}>
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input name="serial_number" value={form.serial_number} onChange={handle}
              className={fi("serial_number")} placeholder="Manufacturer serial" />
            {errors.serial_number && <p className="text-xs text-red-500 mt-1">{errors.serial_number}</p>}
          </div>

          <div>
            <label style={labelStyle("brand")} className={LABEL}>
              Brand <span className="text-red-500">*</span>
            </label>
            <select name="brand" value={form.brand} onChange={handle} className={fi("brand")}>
              <option value="">Select Brand</option>
              {["Dell","HP","Lenovo","Apple","Asus","Acer","MSI","Samsung","Toshiba","Other"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
          </div>

          <div>
            <label style={labelStyle("model")} className={LABEL}>
              Model <span className="text-red-500">*</span>
            </label>
            <input name="model" value={form.model} onChange={handle}
              className={fi("model")} placeholder="e.g. XPS 15, ThinkPad X1" />
            {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
          </div>

        </div>
      </div>

      {/* ── SPECIFICATIONS ── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Specifications</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label style={labelStyle("processor")} className={LABEL}>
              Processor <span className="text-red-500">*</span>
            </label>
            <input name="processor" value={form.processor} onChange={handle}
              className={fi("processor")} placeholder="e.g. Intel Core i7-1185G7" />
            {errors.processor && <p className="text-xs text-red-500 mt-1">{errors.processor}</p>}
          </div>

          <div>
            <label style={labelStyle("generation")} className={LABEL}>
              Generation <span className="text-red-500">*</span>
            </label>
            <input name="generation" value={form.generation} onChange={handle}
              className={fi("generation")} placeholder="e.g. 11th Gen, M2, Ryzen 5 5000" />
            {errors.generation && <p className="text-xs text-red-500 mt-1">{errors.generation}</p>}
          </div>

          <div>
            <label style={labelStyle("ram")} className={LABEL}>
              RAM <span className="text-red-500">*</span>
            </label>
            <select name="ram" value={form.ram} onChange={handle} className={fi("ram")}>
              <option value="">Select RAM</option>
              {["4GB","8GB","12GB","16GB","24GB","32GB","64GB"].map((v) => <option key={v}>{v}</option>)}
            </select>
            {errors.ram && <p className="text-xs text-red-500 mt-1">{errors.ram}</p>}
          </div>

          <div>
            <label style={labelStyle("storage")} className={LABEL}>
              Storage <span className="text-red-500">*</span>
            </label>
            <select name="storage" value={form.storage} onChange={handle} className={fi("storage")}>
              <option value="">Select Storage</option>
              {["128GB SSD","256GB SSD","512GB SSD","1TB SSD","256GB HDD","500GB HDD","1TB HDD","2TB HDD"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            {errors.storage && <p className="text-xs text-red-500 mt-1">{errors.storage}</p>}
          </div>
          <div>
              <label className={LABEL} style={{ color: T.text }}>GPU</label>
              <input
                name="gpu"
                value={form.gpu}
                onChange={handle}
                className={FIELD}
                placeholder="e.g. Intel Iris Xe / RTX 3050"
              />
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Display Size</label>
            <input name="display_size" value={form.display_size} onChange={handle}
              className={FIELD} placeholder='e.g. 15.6"' />
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Operating System</label>
            <select name="os" value={form.os} onChange={handle} className={FIELD}>
              <option value="">Select OS</option>
              {["Windows 10 Home","Windows 10 Pro","Windows 11 Home","Windows 11 Pro","macOS","Ubuntu","FreeDOS","No OS"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Color</label>
            <input name="color" value={form.color} onChange={handle}
              className={FIELD} placeholder="e.g. Space Grey" />
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Condition</label>
            <select name="condition" value={form.condition} onChange={handle} className={FIELD}>
              <option value="NEW">New — Brand new, never used</option>
              <option value="GOOD">Good — Lightly used, no damage</option>
              <option value="FAIR">Fair — Visible wear, fully functional</option>
              <option value="POOR">Poor — Heavy wear or minor issues</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── SUPPLIER & PURCHASE ── */}
      <div className={SECTION}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p className={SECTION_TITLE} style={{ margin: 0 }}>Supplier & Purchase</p>
          <a
            href="/inventory/suppliers" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: T.primary, textDecoration: "none" }}
          >
            <Plus size={12} /> Add Supplier <ExternalLink size={11} />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <label className={LABEL} style={{ color: T.text }}>Supplier</label>
            {loadingS ? (
              <div className={FIELD} style={{ color: T.muted }}>Loading suppliers…</div>
            ) : suppliers.length === 0 ? (
              <div
                style={{
                  padding: "10px 14px", background: T.amber.bg,
                  border: `1px solid ${T.amber.border}`, borderRadius: "8px",
                  fontSize: "13px", color: T.amber.text,
                  display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                <AlertCircle size={14} />
                No suppliers.{" "}
                <a href="/inventory/suppliers" target="_blank" style={{ color: T.amber.text, fontWeight: 600 }}>
                  Add one first
                </a>
              </div>
            ) : (
              <select name="supplier" value={form.supplier} onChange={handle} className={FIELD}>
                <option value="">— Select Supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.phone ? ` · ${s.phone}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Purchase Date</label>
            <input name="purchase_date" type="date" value={form.purchase_date} onChange={handle} className={FIELD} />
          </div>

          <div>
              <label className={LABEL} style={{ color: T.text }}>
                Purchase Price (₹)
              </label>
              <input
                name="purchase_price"
                type="number"
                step="0.01"
                min="0"
                value={form.purchase_price}
                onChange={handle}
                className={FIELD}
                placeholder="Invoice price"
              />
          </div>
          <div>
              <label className={LABEL} style={{ color: T.text }}>
                Cost to Company (₹)
              </label>
              <input
                name="cost_to_company"
                type="number"
                step="0.01"
                min="0"
                value={form.cost_to_company}
                onChange={handle}
                className={FIELD}
                placeholder="Actual business cost"
              />
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Invoice Number</label>
            <input name="invoice_number" value={form.invoice_number} onChange={handle}
              className={FIELD} placeholder="Supplier invoice / bill number" />
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Warranty Expiry</label>
            <input name="warranty_expiry" type="date" value={form.warranty_expiry} onChange={handle} className={FIELD} />
          </div>

        </div>
      </div>

      {/* ── PRICING & STATUS ── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Pricing & Status</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label style={labelStyle("price")} className={LABEL}>
              Sale Price (₹) <span className="text-red-500">*</span>
            </label>
            <input name="price" type="number" step="0.01" min="0"
              value={form.price} onChange={handle} className={fi("price")} placeholder="55000" />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label style={labelStyle("rent_per_month")} className={LABEL}>
              Rent / Month (₹) <span className="text-red-500">*</span>
            </label>
            <input name="rent_per_month" type="number" step="0.01" min="0"
              value={form.rent_per_month} onChange={handle} className={fi("rent_per_month")} placeholder="3000" />
            {errors.rent_per_month && <p className="text-xs text-red-500 mt-1">{errors.rent_per_month}</p>}
          </div>

          <div>
            <label className={LABEL} style={{ color: T.text }}>Status</label>
            <select name="status" value={form.status} onChange={handle} className={FIELD}>
              <option value="AVAILABLE">Available</option>
              <option value="DEMO">Demo</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── NOTES ── */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>Notes</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL} style={{ color: T.text }}>Description</label>
            <textarea name="description" value={form.description} onChange={handle}
              rows={3} className={`${FIELD} resize-none`} placeholder="Customer-facing description…" />
          </div>
          <div>
            <label className={LABEL} style={{ color: T.text }}>Internal Notes</label>
            <textarea name="internal_notes" value={form.internal_notes} onChange={handle}
              rows={3} className={`${FIELD} resize-none`} placeholder="Private notes for your team…" />
          </div>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "4px" }}>
        <Btn variant="secondary" type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </Btn>
        <Btn variant="primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Update Laptop" : "Add Laptop"}
        </Btn>
      </div>

    </form>
  );
}
