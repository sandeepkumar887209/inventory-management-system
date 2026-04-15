import React, { useEffect, useState } from "react";
import { Plus, Edit2, Building2, Phone, Mail, MapPin, X } from "lucide-react";
import api from "../../services/axios";
import {
  T, Card, CardHead, Btn, SearchInput, Modal,
  Spinner, Pagination, fmtDate, Toast, Chip,
} from "./ui";

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

const EMPTY = { name: "", phone: "", email: "", address: "", gst_number: "", notes: "" };
const FIELD = {
  width: "100%", padding: "9px 12px",
  border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  fontSize: "13px", color: T.text, background: T.surface,
  outline: "none", boxSizing: "border-box" as const,
};
const FIELD_ERR = {
  ...FIELD, border: `1px solid ${T.red.border}`,
  background: T.red.bg,
};
const LABEL = {
  display: "block" as const, fontSize: "13px",
  fontWeight: 500 as const, marginBottom: "6px", color: T.text,
};

const PER_PAGE = 10;

export function SupplierPage() {
  const [suppliers,  setSuppliers]  = useState<Supplier[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [modal,      setModal]      = useState(false);
  const [editItem,   setEditItem]   = useState<Supplier | null>(null);
  const [form,       setForm]       = useState<typeof EMPTY>({ ...EMPTY });
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<any>(null);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/suppliers/");
      setSuppliers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      showToast("Failed to load suppliers", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY });
    setErrors({});
    setModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address, gst_number: s.gst_number, notes: s.notes });
    setErrors({});
    setModal(true);
  };

  const handle = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
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
        showToast("Supplier updated");
      } else {
        await api.post("/inventory/suppliers/", form);
        showToast("Supplier added");
      }
      setModal(false);
      fetchSuppliers();
    } catch (err: any) {
      const d = err?.response?.data;
      if (d?.name) setErrors({ name: d.name[0] });
      else showToast("Failed to save supplier", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: T.text, margin: 0 }}>Suppliers</h1>
          <p style={{ fontSize: "13px", color: T.muted, marginTop: "4px" }}>
            {filtered.length} supplier{filtered.length !== 1 ? "s" : ""} in database
          </p>
        </div>
        <Btn variant="primary" icon={<Plus size={14} />} onClick={openAdd}>
          Add Supplier
        </Btn>
      </div>

      {/* ── Search ── */}
      <Card style={{ marginBottom: "16px", padding: "14px 16px" }}>
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name, phone, email…"
          style={{ maxWidth: "400px" }}
        />
      </Card>

      {/* ── Table ── */}
      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {["Supplier","Contact","GST Number","Address","Added On",""].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "9px 16px", textAlign: "left",
                          fontSize: "11px", fontWeight: 600, color: T.muted,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ padding: "48px", textAlign: "center", color: "#c0bbb5", fontSize: "13px" }}
                      >
                        {search ? "No suppliers match your search." : "No suppliers yet. Click 'Add Supplier' to start."}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((s) => (
                      <tr
                        key={s.id}
                        style={{ borderBottom: `1px solid ${T.border}` }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.bg; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px", height: "32px", borderRadius: T.radiusSm,
                                background: T.blue.bg, display: "flex",
                                alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}
                            >
                              <Building2 size={15} color={T.primary} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: T.text }}>{s.name}</div>
                              {s.notes && (
                                <div
                                  style={{
                                    fontSize: "11px", color: T.muted,
                                    maxWidth: "200px", overflow: "hidden",
                                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  }}
                                >
                                  {s.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {s.phone && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.text }}>
                              <Phone size={12} color={T.muted} /> {s.phone}
                            </div>
                          )}
                          {s.email && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.muted, marginTop: "2px" }}>
                              <Mail size={12} color={T.muted} /> {s.email}
                            </div>
                          )}
                          {!s.phone && !s.email && <span style={{ color: "#c0bbb5" }}>—</span>}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {s.gst_number ? (
                            <code
                              style={{
                                background: T.bg, padding: "2px 8px",
                                borderRadius: T.radiusSm, fontSize: "11px",
                                color: T.text, border: `1px solid ${T.border}`,
                              }}
                            >
                              {s.gst_number}
                            </code>
                          ) : (
                            <span style={{ color: "#c0bbb5" }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px", maxWidth: "180px" }}>
                          {s.address ? (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "5px", fontSize: "12px", color: T.muted }}>
                              <MapPin size={12} style={{ marginTop: "1px", flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {s.address}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#c0bbb5" }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px", fontSize: "12px", color: T.muted }}>
                          {fmtDate(s.created_at)}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={() => openEdit(s)}
                            style={{
                              padding: "6px 8px", borderRadius: T.radiusSm,
                              border: `1px solid ${T.border}`, background: "transparent",
                              cursor: "pointer", color: T.muted,
                              display: "flex", alignItems: "center",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = T.blue.bg; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={filtered.length} pageSize={PER_PAGE} onChange={setPage} />
          </>
        )}
      </Card>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <Modal
          title={editItem ? "Edit Supplier" : "Add New Supplier"}
          subtitle={editItem ? `Editing: ${editItem.name}` : "Add a new supplier to your database"}
          onClose={() => setModal(false)}
          width="520px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Name */}
            <div>
              <label style={LABEL}>
                Supplier Name <span style={{ color: T.red.text }}>*</span>
              </label>
              <input
                name="name" value={form.name} onChange={handle}
                style={errors.name ? FIELD_ERR : FIELD}
                placeholder="e.g. Tech Distributors Pvt. Ltd."
              />
              {errors.name && (
                <div style={{ fontSize: "12px", color: T.red.text, marginTop: "4px" }}>{errors.name}</div>
              )}
            </div>

            {/* Phone + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={LABEL}>Phone</label>
                <input name="phone" value={form.phone} onChange={handle} style={FIELD} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={LABEL}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handle} style={FIELD} placeholder="contact@supplier.com" />
              </div>
            </div>

            {/* GST */}
            <div>
              <label style={LABEL}>GST Number</label>
              <input name="gst_number" value={form.gst_number} onChange={handle} style={FIELD} placeholder="e.g. 27AAAAA0000A1Z5" />
            </div>

            {/* Address */}
            <div>
              <label style={LABEL}>Address</label>
              <textarea
                name="address" value={form.address} onChange={handle}
                rows={2}
                style={{ ...FIELD, resize: "none" }}
                placeholder="Full address…"
              />
            </div>

            {/* Notes */}
            <div>
              <label style={LABEL}>Internal Notes</label>
              <textarea
                name="notes" value={form.notes} onChange={handle}
                rows={2}
                style={{ ...FIELD, resize: "none" }}
                placeholder="Private notes about this supplier…"
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "4px", borderTop: `1px solid ${T.border}` }}>
              <Btn variant="secondary" onClick={() => setModal(false)} disabled={saving}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editItem ? "Update Supplier" : "Add Supplier"}
              </Btn>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}
