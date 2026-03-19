import React, { useEffect, useState } from "react";
import {
  Search, Plus, Edit2, Building2, Phone, Mail, MapPin,
  X, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "../common/Button";
import api from "../../services/axios";

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  notes: string;
  created_at: string;
}

const EMPTY_FORM = { name: "", phone: "", email: "", address: "", gst_number: "", notes: "" };
const INPUT  = "w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
const INPUT_E= "w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm";
const LABEL  = "block text-sm font-medium text-neutral-700 mb-1.5";

export function SupplierPage() {
  const [suppliers,   setSuppliers]   = useState<Supplier[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [showModal,   setShowModal]   = useState(false);
  const [editItem,    setEditItem]    = useState<Supplier | null>(null);
  const [form,        setForm]        = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState(false);

  const PER_PAGE = 10;

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/suppliers/");
      setSuppliers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch { console.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({
      name: s.name, phone: s.phone, email: s.email,
      address: s.address, gst_number: s.gst_number, notes: s.notes,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Supplier name is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      if (editItem) {
        await api.put(`/inventory/suppliers/${editItem.id}/`, form);
      } else {
        await api.post("/inventory/suppliers/", form);
      }
      closeModal();
      fetchSuppliers();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.name) setErrors({ name: data.name[0] });
      else alert("Failed to save supplier.");
    } finally { setSaving(false); }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Suppliers</h1>
          <p className="text-neutral-600">{filtered.length} suppliers in database</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1.5 inline-block" /> Add Supplier
        </Button>
      </div>

      {/* ── Search ── */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">Loading suppliers...</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">GST Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Added On</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-neutral-400">
                      {search ? "No suppliers match your search." : "No suppliers yet. Click 'Add Supplier' to get started."}
                    </td>
                  </tr>
                ) : paginated.map(s => (
                  <tr key={s.id} className="hover:bg-neutral-50 transition-colors">

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{s.name}</p>
                          {s.notes && (
                            <p className="text-xs text-neutral-400 truncate max-w-[200px]">{s.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-neutral-700">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-neutral-500 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          {s.email}
                        </div>
                      )}
                      {!s.phone && !s.email && <span className="text-neutral-400">—</span>}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {s.gst_number ? (
                        <code className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700 text-xs">
                          {s.gst_number}
                        </code>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-neutral-600 max-w-[180px]">
                      {s.address ? (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate">{s.address}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {fmtDate(s.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit supplier"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200">
                <span className="text-sm text-neutral-600">
                  Page {page} of {totalPages} · {filtered.length} total
                </span>
                <div className="flex gap-2">
                  <button className="p-1 disabled:opacity-40"
                    onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-1 disabled:opacity-40"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editItem ? "Edit Supplier" : "Add New Supplier"}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">

                {Object.keys(errors).length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{Object.values(errors)[0]}</p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className={LABEL}>Supplier Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange}
                    className={errors.name ? INPUT_E : INPUT}
                    placeholder="e.g. Tech Distributors Pvt. Ltd." />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className={INPUT} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className={INPUT} placeholder="contact@supplier.com" />
                  </div>
                </div>

                {/* GST */}
                <div>
                  <label className={LABEL}>GST Number</label>
                  <input name="gst_number" value={form.gst_number} onChange={handleChange}
                    className={INPUT} placeholder="e.g. 27AAAAA0000A1Z5" />
                </div>

                {/* Address */}
                <div>
                  <label className={LABEL}>Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange}
                    rows={2} className={`${INPUT} resize-none`} placeholder="Full address..." />
                </div>

                {/* Notes */}
                <div>
                  <label className={LABEL}>Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange}
                    rows={2} className={`${INPUT} resize-none`} placeholder="Internal notes about this supplier..." />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200">
                <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editItem ? "Update Supplier" : "Add Supplier"}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}