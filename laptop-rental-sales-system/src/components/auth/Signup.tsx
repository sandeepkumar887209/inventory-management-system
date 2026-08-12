import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Laptop, Mail, Lock, User, Building, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { registerApi } from '../../services/auth';

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    company: '',
    password: '',
    confirmPassword: '',
    role: 'sales',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      await registerApi({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        company: formData.company,
        role: formData.role,
      });
      navigate('/pending-approval', { replace: true });
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) {
        const firstError = Object.values(data).flat()[0];
        setError(typeof firstError === 'string' ? firstError : 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Shared styles
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "6px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px 10px 38px",
    fontSize: "13px",
    color: "#18181b",
    background: "#f4f4f5",
    border: "1px solid transparent",
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.2s",
  };

  const inputIconStyle = (field: string): React.CSSProperties => ({
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    transition: "color 0.15s",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .auth-page * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
        .auth-input:focus { background: #fff !important; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        .auth-input::placeholder { color: #a1a1aa; }
        .auth-btn:hover { background: #111827 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .auth-btn:active { transform: translateY(0); box-shadow: none; }
        .auth-link:hover { color: #2563eb !important; }
        .auth-eye:hover { color: #18181b !important; }
        .auth-select:focus { background: #fff !important; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
      `}</style>

      <div className="auth-page" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        padding: "20px",
      }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>

          {/* Logo + Title */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#2563eb",
              marginBottom: "20px",
            }}>
              <Laptop size={20} color="#fff" strokeWidth={2.2} />
            </div>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.3px",
              marginBottom: "6px",
            }}>
              Create your account
            </h1>
            <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>
              Join Mr. Laptop Management Suite
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
            padding: "32px",
          }}>
            <form onSubmit={handleSubmit}>

              {/* Error */}
              {error && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  marginBottom: "20px",
                }}>
                  <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#991b1b" }}>{error}</span>
                </div>
              )}

              {/* Row 1: Full Name + Username */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={16}
                      color={focusedField === "fullName" ? "#3b82f6" : "#a1a1aa"}
                      style={inputIconStyle("fullName")}
                    />
                    <input
                      className="auth-input"
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("fullName")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="John Doe"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Username *</label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={16}
                      color={focusedField === "username" ? "#3b82f6" : "#a1a1aa"}
                      style={inputIconStyle("username")}
                    />
                    <input
                      className="auth-input"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="johndoe"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email + Company */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={16}
                      color={focusedField === "email" ? "#3b82f6" : "#a1a1aa"}
                      style={inputIconStyle("email")}
                    />
                    <input
                      className="auth-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="john@example.com"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Company Name</label>
                  <div style={{ position: "relative" }}>
                    <Building
                      size={16}
                      color={focusedField === "company" ? "#3b82f6" : "#a1a1aa"}
                      style={inputIconStyle("company")}
                    />
                    <input
                      className="auth-input"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("company")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Acme Inc."
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Role (full width) */}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Role</label>
                <select
                  className="auth-select"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#18181b",
                    background: "#f4f4f5",
                    border: "1px solid transparent",
                    borderRadius: "10px",
                    outline: "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    appearance: "none" as any,
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                  <option value="operations">Operations</option>
                </select>
              </div>

              {/* Row 4: Password + Confirm */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={16}
                      color={focusedField === "password" ? "#3b82f6" : "#a1a1aa"}
                      style={inputIconStyle("password")}
                    />
                    <input
                      className="auth-input"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: "42px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-eye"
                      style={{
                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "#a1a1aa",
                        padding: "2px", display: "flex", transition: "color 0.15s",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password *</label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={16}
                      color={focusedField === "confirmPassword" ? "#3b82f6" : "#a1a1aa"}
                      style={inputIconStyle("confirmPassword")}
                    />
                    <input
                      className="auth-input"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: "42px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="auth-eye"
                      style={{
                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "#a1a1aa",
                        padding: "2px", display: "flex", transition: "color 0.15s",
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    style={{
                      width: "16px", height: "16px", borderRadius: "4px",
                      border: "1.5px solid #d1d5db", cursor: "pointer",
                      accentColor: "#2563eb", marginTop: "1px", flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500, lineHeight: "1.4" }}>
                    I agree to the{' '}
                    <span style={{ color: "#3b82f6", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: "#3b82f6", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn"
                style={{
                  width: "100%",
                  padding: "11px",
                  background: "#18181b",
                  color: "#fff",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "10px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.15s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            {/* Divider + login link */}
            <div style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid #f3f4f6",
              textAlign: "center",
            }}>
              <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="auth-link"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600, color: "#3b82f6", transition: "color 0.15s",
                  }}
                >
                  Sign in
                </button>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <span style={{ fontSize: "11px", color: "#d1d5db", fontWeight: 500 }}>
              © 2026 Mr. Laptop · Management Suite
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
