import React, { useState } from "react";
import {
  Check, ChevronRight, User, Building2,
  Mail, Phone, MapPin, Briefcase,
} from "lucide-react";
import api from "../../services/axios";
import { C, Btn } from "./ui";

/* ─── helpers ─── */

const fs = (err?: boolean): React.CSSProperties => ({
  width: "100%", padding: "10px 14px",
  border: `1px solid ${err ? "#ffc5c5" : "#e0deda"}`, borderRadius: "9px",
  fontSize: "13px", color: "#1a1a1a", background: "#fff",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s",
});

const LABEL: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 500, color: "#555", marginBottom: "6px",
};

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
      {children}
    </div>
  );
}

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={LABEL}>
        {label}{required && <span style={{ color: C.red.solid }}> *</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: "11px", color: C.red.text, marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

function IconInput({
  icon: Icon, ...props
}: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ position: "relative" }}>
      <Icon size={14} color="#aaa" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      <input {...props} style={{ ...(props.style as any), paddingLeft: "34px" }} />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 600, color: "#aaa",
      textTransform: "uppercase", letterSpacing: "0.07em",
      borderBottom: "1px solid #f0eeeb", paddingBottom: "8px", marginBottom: "4px",
    }}>
      {children}
    </div>
  );
}

/* ─── step bar ─── */

const STEPS = ["Type", "Info", "Contact", "Details", "Confirm"] as const;

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
      {STEPS.map((label, i) => {
        const num = i + 1;
        const done   = num < step;
        const active = num === step;
        return (
          <React.Fragment key={label}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 500,
                background: done ? C.teal.solid : active ? C.blue.solid : "#f0eeeb",
                color: done || active ? "#fff" : "#bbb",
                transition: "all 0.2s",
              }}>
                {done ? <Check size={12} /> : num}
              </div>
              <span style={{ fontSize: "10px", color: active ? "#1a1a1a" : "#bbb", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: "1px", margin: "0 6px 16px",
                background: done ? C.teal.solid : "#e8e6e1",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── form state ─── */

type FormState = {
  customer_type: "individual" | "company";
  name: string; email: string; phone: string; alternate_phone: string;
  address: string; city: string; state: string; pincode: string; notes: string;
  company_name: string; contact_person: string; contact_person_phone: string;
  contact_person_email: string; designation: string; trade_name: string;
  industry: string; website: string;
  gst_number: string; pan_number: string; cin_number: string;
  tan_number: string; udyam_number: string;
  credit_limit: string; credit_period_days: string;
  aadhar_number: string; pan_number_individual: string;
};

const EMPTY: FormState = {
  customer_type: "individual",
  name: "", email: "", phone: "", alternate_phone: "",
  address: "", city: "", state: "", pincode: "", notes: "",
  company_name: "", contact_person: "", contact_person_phone: "",
  contact_person_email: "", designation: "", trade_name: "",
  industry: "", website: "",
  gst_number: "", pan_number: "", cin_number: "", tan_number: "", udyam_number: "",
  credit_limit: "", credit_period_days: "",
  aadhar_number: "", pan_number_individual: "",
};

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */

export function CreateCustomer({
  onSuccess, onCancel,
}: {
  onSuccess: () => void;
  onCancel:  () => void;
}) {
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [errors,  setErrors]  = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);

  const isCompany = form.customer_type === "company";

  const set = (field: keyof FormState, val: string) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  /* ── per-step validation ── */

  const runValidation = (s: number): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (s === 2) {
      if (!form.name.trim())
        e.name = "Name is required.";
      if (isCompany && !form.contact_person.trim())
        e.contact_person = "Contact person is required.";
      if (form.gst_number && form.gst_number.trim().length !== 15)
        e.gst_number = "GSTIN must be exactly 15 characters.";
      if (form.pan_number && form.pan_number.trim().length !== 10)
        e.pan_number = "PAN must be exactly 10 characters.";
      if (form.cin_number && form.cin_number.trim().length !== 21)
        e.cin_number = "CIN must be exactly 21 characters.";
      if (form.pan_number_individual && form.pan_number_individual.trim().length !== 10)
        e.pan_number_individual = "PAN must be exactly 10 characters.";
      if (form.aadhar_number && !/^\d{12}$/.test(form.aadhar_number.replace(/\s/g, "")))
        e.aadhar_number = "Aadhaar must be exactly 12 digits.";
    }

    if (s === 3) {
      if (!form.phone.trim())
        e.phone = "Phone number is required.";
      else if (form.phone.replace(/[\s+\-]/g, "").length < 10)
        e.phone = "Phone must be at least 10 digits.";
      if (form.email && !/\S+@\S+\.\S+/.test(form.email))
        e.email = "Invalid email address.";
      if (form.contact_person_email && !/\S+@\S+\.\S+/.test(form.contact_person_email))
        e.contact_person_email = "Invalid email address.";
      if (form.pincode && !/^\d{6}$/.test(form.pincode))
        e.pincode = "PIN code must be exactly 6 digits.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (runValidation(step)) {
      if (step < 5) setStep(s => s + 1);
      else handleSubmit();
    }
  };

  /* ── submit ── */

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const trim = (v: string) => v.trim() || undefined;
      const upper = (v: string) => v.trim().toUpperCase() || undefined;

      const payload: Record<string, any> = {
        name:            form.name.trim(),
        customer_type:   form.customer_type,
        phone:           form.phone.trim(),
        email:           trim(form.email),
        alternate_phone: trim(form.alternate_phone),
        address:         trim(form.address),
        city:            trim(form.city),
        state:           trim(form.state),
        pincode:         trim(form.pincode),
        notes:           trim(form.notes),
      };

      if (isCompany) {
        Object.assign(payload, {
          company_name:          trim(form.company_name),
          contact_person:        trim(form.contact_person),
          contact_person_phone:  trim(form.contact_person_phone),
          contact_person_email:  trim(form.contact_person_email),
          designation:           trim(form.designation),
          trade_name:            trim(form.trade_name),
          industry:              trim(form.industry),
          website:               trim(form.website),
          gst_number:            upper(form.gst_number),
          pan_number:            upper(form.pan_number),
          cin_number:            upper(form.cin_number),
          tan_number:            upper(form.tan_number),
          udyam_number:          upper(form.udyam_number),
          credit_limit:          form.credit_limit || undefined,
          credit_period_days:    form.credit_period_days || undefined,
        });
      } else {
        Object.assign(payload, {
          aadhar_number:         form.aadhar_number.replace(/\s/g, "") || undefined,
          pan_number_individual: upper(form.pan_number_individual),
        });
      }

      // strip undefined keys so backend doesn't receive nulls for unset fields
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      await api.post("/customers/customers/", payload);
      onSuccess();
    } catch (err: any) {
      const d = err?.response?.data;
      if (d && typeof d === "object") {
        const mapped: typeof errors = {};
        Object.entries(d).forEach(([k, v]) => {
          mapped[k as keyof FormState] = Array.isArray(v) ? (v[0] as string) : String(v);
        });
        setErrors(mapped);
        // Jump to earliest step with an error
        const stepMap: (keyof FormState)[][] = [
          [],
          ["name", "contact_person", "gst_number", "pan_number", "cin_number", "aadhar_number", "pan_number_individual"],
          ["phone", "email", "pincode", "contact_person_email"],
          ["industry", "website", "credit_limit", "credit_period_days"],
          [],
        ];
        for (let i = 0; i < stepMap.length; i++) {
          if (stepMap[i].some(f => mapped[f])) { setStep(i + 1); break; }
        }
      } else {
        alert("Failed to create customer. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── confirm summary ── */

  const confirmRows = [
    { label: "Type",           value: isCompany ? "Corporate" : "Individual" },
    { label: "Name",           value: form.name },
    ...(isCompany && form.company_name    ? [{ label: "Company",         value: form.company_name }] : []),
    ...(isCompany && form.contact_person  ? [{ label: "Contact Person",  value: `${form.contact_person}${form.designation ? ` · ${form.designation}` : ""}` }] : []),
    { label: "Phone",          value: form.phone },
    ...(form.alternate_phone   ? [{ label: "Alt. Phone",      value: form.alternate_phone }] : []),
    ...(form.email             ? [{ label: "Email",           value: form.email }] : []),
    ...(form.city || form.state? [{ label: "Location",        value: [form.city, form.state, form.pincode].filter(Boolean).join(", ") }] : []),
    ...(isCompany && form.gst_number  ? [{ label: "GSTIN",    value: form.gst_number.toUpperCase() }] : []),
    ...(isCompany && form.pan_number  ? [{ label: "PAN",      value: form.pan_number.toUpperCase() }] : []),
    ...(isCompany && form.cin_number  ? [{ label: "CIN",      value: form.cin_number.toUpperCase() }] : []),
    ...(!isCompany && form.pan_number_individual ? [{ label: "PAN", value: form.pan_number_individual.toUpperCase() }] : []),
    ...(form.industry          ? [{ label: "Industry",        value: form.industry }] : []),
    ...(form.credit_limit      ? [{ label: "Credit Limit",    value: `₹${Number(form.credit_limit).toLocaleString("en-IN")}` }] : []),
    ...(form.credit_period_days? [{ label: "Credit Period",   value: `${form.credit_period_days} days` }] : []),
  ];

  /* ══════════════════════ RENDER ══════════════════════ */

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Add Customer</h1>
        <p style={{ fontSize: "13px", color: "#999", marginTop: "4px" }}>Fill in customer details step by step</p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #ebebeb", borderRadius: "16px", padding: "28px", marginTop: "24px" }}>
        <StepBar step={step} />

        {/* ── Step 1: Customer type ─────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "20px" }}>
              What type of customer is this?
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              {([
                { type: "individual", label: "Individual",  desc: "Personal rental or purchase",  icon: User },
                { type: "company",    label: "Corporate",   desc: "Business or organisation",      icon: Building2 },
              ] as const).map(({ type, label, desc, icon: Icon }) => (
                <div key={type} onClick={() => set("customer_type", type)}
                  style={{
                    flex: 1, padding: "24px 20px",
                    border: `2px solid ${form.customer_type === type ? C.blue.solid : "#e8e6e1"}`,
                    borderRadius: "12px", cursor: "pointer", transition: "all 0.15s",
                    background: form.customer_type === type ? C.blue.bg : "#fff",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
                  }}
                >
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "12px",
                    background: form.customer_type === type ? C.blue.solid : "#f0eeeb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={22} color={form.customer_type === type ? "#fff" : "#888"} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#1a1a1a" }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{desc}</div>
                  </div>
                  {form.customer_type === type && (
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: C.blue.solid, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={12} color="#fff" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Core info ─────────────────────── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {isCompany ? (
              <>
                <SectionHeading>Company information</SectionHeading>

                <Field label="Legal / Registered Company Name" required error={errors.name}>
                  <input style={fs(!!errors.name)} value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="e.g. Acme Technologies Pvt. Ltd."
                  />
                </Field>

                <Field label="Trade Name" error={errors.trade_name}>
                  <input style={fs()} value={form.trade_name}
                    onChange={e => set("trade_name", e.target.value)}
                    placeholder="Operating name if different from legal name"
                  />
                </Field>

                <Row>
                  <Field label="Primary Contact Person" required error={errors.contact_person}>
                    <input style={fs(!!errors.contact_person)} value={form.contact_person}
                      onChange={e => set("contact_person", e.target.value)}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Designation" error={errors.designation}>
                    <input style={fs()} value={form.designation}
                      onChange={e => set("designation", e.target.value)}
                      placeholder="e.g. Procurement Manager"
                    />
                  </Field>
                </Row>

                <SectionHeading>Tax &amp; legal identifiers</SectionHeading>

                <Row>
                  <Field label="GSTIN" error={errors.gst_number}>
                    <input style={fs(!!errors.gst_number)} value={form.gst_number}
                      onChange={e => set("gst_number", e.target.value.toUpperCase())}
                      placeholder="27AAAAA0000A1Z5" maxLength={15}
                    />
                  </Field>
                  <Field label="PAN" error={errors.pan_number}>
                    <input style={fs(!!errors.pan_number)} value={form.pan_number}
                      onChange={e => set("pan_number", e.target.value.toUpperCase())}
                      placeholder="AAAAA0000A" maxLength={10}
                    />
                  </Field>
                </Row>

                <Row>
                  <Field label="CIN" error={errors.cin_number}>
                    <input style={fs(!!errors.cin_number)} value={form.cin_number}
                      onChange={e => set("cin_number", e.target.value.toUpperCase())}
                      placeholder="U74999MH2000PTC123456" maxLength={21}
                    />
                  </Field>
                  <Field label="TAN" error={errors.tan_number}>
                    <input style={fs()} value={form.tan_number}
                      onChange={e => set("tan_number", e.target.value.toUpperCase())}
                      placeholder="ABCD12345E" maxLength={10}
                    />
                  </Field>
                </Row>

                <Field label="Udyam Registration No. (MSME)" error={errors.udyam_number}>
                  <input style={fs()} value={form.udyam_number}
                    onChange={e => set("udyam_number", e.target.value.toUpperCase())}
                    placeholder="UDYAM-XX-00-0000000" maxLength={19}
                  />
                </Field>
              </>
            ) : (
              <>
                <SectionHeading>Personal information</SectionHeading>

                <Field label="Full Name" required error={errors.name}>
                  <input style={fs(!!errors.name)} value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />
                </Field>

                <SectionHeading>Identity documents</SectionHeading>

                <Row>
                  <Field label="Aadhaar Number" error={errors.aadhar_number}>
                    <input style={fs(!!errors.aadhar_number)} value={form.aadhar_number}
                      onChange={e => set("aadhar_number", e.target.value.replace(/\D/g, ""))}
                      placeholder="xxxxxxxxxxxx" maxLength={12}
                    />
                  </Field>
                  <Field label="PAN" error={errors.pan_number_individual}>
                    <input style={fs(!!errors.pan_number_individual)} value={form.pan_number_individual}
                      onChange={e => set("pan_number_individual", e.target.value.toUpperCase())}
                      placeholder="AAAAA0000A" maxLength={10}
                    />
                  </Field>
                </Row>
              </>
            )}

            <Field label="Internal Notes" error={errors.notes}>
              <textarea style={{ ...fs(), resize: "none" } as any} rows={2} value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Private notes — not visible to customer"
              />
            </Field>
          </div>
        )}

        {/* ── Step 3: Contact & address ─────────────── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <SectionHeading>Phone &amp; email</SectionHeading>

            <Row>
              <Field label="Phone Number" required error={errors.phone}>
                <IconInput icon={Phone} style={fs(!!errors.phone)} value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>
              <Field label="Alternate Phone" error={errors.alternate_phone}>
                <IconInput icon={Phone} style={fs()} value={form.alternate_phone}
                  onChange={e => set("alternate_phone", e.target.value)}
                  placeholder="+91 98765 43211"
                />
              </Field>
            </Row>

            <Field label="Email Address" error={errors.email}>
              <IconInput icon={Mail} type="email" style={fs(!!errors.email)} value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="customer@example.com"
              />
            </Field>

            {isCompany && (
              <Row>
                <Field label="Contact Person Email" error={errors.contact_person_email}>
                  <IconInput icon={Mail} type="email"
                    style={fs(!!errors.contact_person_email)}
                    value={form.contact_person_email}
                    onChange={e => set("contact_person_email", e.target.value)}
                    placeholder="contact@company.com"
                  />
                </Field>
                <Field label="Contact Person Phone" error={errors.contact_person_phone}>
                  <IconInput icon={Phone} style={fs()} value={form.contact_person_phone}
                    onChange={e => set("contact_person_phone", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </Field>
              </Row>
            )}

            <SectionHeading>Address</SectionHeading>

            <Field label="Street Address" error={errors.address}>
              <div style={{ position: "relative" }}>
                <MapPin size={14} color="#aaa" style={{ position: "absolute", left: "12px", top: "13px", pointerEvents: "none" }} />
                <textarea style={{ ...fs(), paddingLeft: "34px", resize: "none" } as any}
                  rows={2} value={form.address}
                  onChange={e => set("address", e.target.value)}
                  placeholder="Building, Street"
                />
              </div>
            </Field>

            <Row>
              <Field label="City" error={errors.city}>
                <input style={fs()} value={form.city}
                  onChange={e => set("city", e.target.value)} placeholder="e.g. Mumbai" />
              </Field>
              <Field label="State" error={errors.state}>
                <input style={fs()} value={form.state}
                  onChange={e => set("state", e.target.value)} placeholder="e.g. Maharashtra" />
              </Field>
            </Row>

            <Field label="PIN Code" error={errors.pincode}>
              <input style={{ ...fs(!!errors.pincode), maxWidth: "160px" }} value={form.pincode}
                onChange={e => set("pincode", e.target.value.replace(/\D/g, ""))}
                placeholder="400001" maxLength={6}
              />
            </Field>
          </div>
        )}

        {/* ── Step 4: Business details / skip ──────── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {isCompany ? (
              <>
                <SectionHeading>Business details</SectionHeading>

                <Row>
                  <Field label="Industry" error={errors.industry}>
                    <IconInput icon={Briefcase} style={fs()} value={form.industry}
                      onChange={e => set("industry", e.target.value)}
                      placeholder="e.g. IT, Education, Manufacturing"
                    />
                  </Field>
                  <Field label="Website" error={errors.website}>
                    <input style={fs()} value={form.website}
                      onChange={e => set("website", e.target.value)}
                      placeholder="https://company.com"
                    />
                  </Field>
                </Row>

                <SectionHeading>Credit terms</SectionHeading>

                <Row>
                  <Field label="Credit Limit (₹)" error={errors.credit_limit}>
                    <input style={fs(!!errors.credit_limit)} value={form.credit_limit}
                      type="number" min="0"
                      onChange={e => set("credit_limit", e.target.value)}
                      placeholder="e.g. 100000"
                    />
                  </Field>
                  <Field label="Credit Period (days)" error={errors.credit_period_days}>
                    <input style={fs(!!errors.credit_period_days)} value={form.credit_period_days}
                      type="number" min="0"
                      onChange={e => set("credit_period_days", e.target.value)}
                      placeholder="e.g. 30"
                    />
                  </Field>
                </Row>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#bbb", fontSize: "13px" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>✓</div>
                No additional details required for individual customers.<br />
                Click <strong style={{ color: "#555" }}>Next</strong> to review and confirm.
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Confirm ───────────────────────── */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "#1a1a1a", marginBottom: "8px" }}>
              Review &amp; confirm
            </div>
            {confirmRows.map(row => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                padding: "9px 14px", background: "#fafaf8", borderRadius: "8px",
              }}>
                <span style={{ fontSize: "12px", color: "#888", flexShrink: 0, marginRight: "16px" }}>{row.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a", textAlign: "right" }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <Btn variant="ghost" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}>
          {step === 1 ? "Cancel" : "← Back"}
        </Btn>
        <Btn variant="primary" onClick={handleNext} disabled={loading}>
          {step === 5
            ? (loading ? "Saving..." : "Create Customer")
            : <><span>Next</span><ChevronRight size={14} /></>}
        </Btn>
      </div>
    </div>
  );
}