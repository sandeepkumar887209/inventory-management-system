import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Building, Shield, 
  Save, AlertCircle, CheckCircle, Camera,
  Lock, KeyRound
} from 'lucide-react';
import { useIdentity } from '../../context/IdentityContext';
import { updateProfileApi } from '../../services/auth';
import api from '../../services/axios';

export function UserProfile() {
  const { user, refreshIdentity } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        company: (user as any).company || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfileApi(formData);
      await refreshIdentity();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "28px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>My Profile</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>Manage your personal information and account security.</p>
      </div>

      <div style={{ 
        background: "#fff", 
        border: "1px solid #e5e7eb", 
        borderRadius: "12px", 
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
        marginBottom: "24px"
      }}>
        <div style={{ 
          height: "90px", 
          background: "linear-gradient(to right, #e0e7ff, #ede9fe)", 
          position: "relative" 
        }}>
        </div>
        
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "flex-end", 
            marginTop: "-30px", 
            marginBottom: "24px" 
          }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "12px",
              background: "#1a6ef5",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              border: "3px solid #fff",
              position: "relative",
            }}>
              {initials}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-[9px]">
                <Camera size={18} color="#fff" />
              </div>
            </div>
            
            <div style={{ marginLeft: "16px", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.2 }}>{user.full_name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>@{user.username}</span>
                <span style={{
                  background: "#eff6ff",
                  color: "#1a6ef5",
                  border: "1px solid #bfdbfe",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em"
                }}>{user.role_title}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <User style={{ position: "absolute", left: "12px", top: "10px", color: "#9ca3af" }} size={16} />
                  <input 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    style={{
                      width: "100%", padding: "8px 12px 8px 36px",
                      border: "1px solid #d1d5db", borderRadius: "8px",
                      fontSize: "14px", color: "#111827", outline: "none"
                    }}
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: "12px", top: "10px", color: "#9ca3af" }} size={16} />
                  <input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: "100%", padding: "8px 12px 8px 36px",
                      border: "1px solid #d1d5db", borderRadius: "8px",
                      fontSize: "14px", color: "#111827", outline: "none"
                    }}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Phone Number</label>
                <div style={{ position: "relative" }}>
                  <Phone style={{ position: "absolute", left: "12px", top: "10px", color: "#9ca3af" }} size={16} />
                  <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: "100%", padding: "8px 12px 8px 36px",
                      border: "1px solid #d1d5db", borderRadius: "8px",
                      fontSize: "14px", color: "#111827", outline: "none"
                    }}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Company</label>
                <div style={{ position: "relative" }}>
                  <Building style={{ position: "absolute", left: "12px", top: "10px", color: "#9ca3af" }} size={16} />
                  <input 
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    style={{
                      width: "100%", padding: "8px 12px 8px 36px",
                      border: "1px solid #d1d5db", borderRadius: "8px",
                      fontSize: "14px", color: "#111827", outline: "none"
                    }}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Department</label>
                <div style={{ position: "relative" }}>
                  <Shield style={{ position: "absolute", left: "12px", top: "10px", color: "#9ca3af" }} size={16} />
                  <input 
                    value={user.department || 'Not assigned'} 
                    disabled 
                    style={{
                      width: "100%", padding: "8px 12px 8px 36px",
                      border: "1px solid #e5e7eb", borderRadius: "8px",
                      fontSize: "14px", color: "#6b7280", background: "#f9fafb", cursor: "not-allowed"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>Role</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", top: "10px", color: "#9ca3af" }} />
                  <input 
                    value={user.role_title} 
                    disabled 
                    style={{
                      width: "100%", padding: "8px 12px 8px 36px",
                      border: "1px solid #e5e7eb", borderRadius: "8px",
                      fontSize: "14px", color: "#6b7280", background: "#f9fafb", cursor: "not-allowed"
                    }} 
                  />
                </div>
              </div>

            </div>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {success && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontSize: "13px", fontWeight: 500 }}>
                    <CheckCircle size={16} /> Profile updated successfully!
                  </div>
                )}
                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: "#1a6ef5", color: "#fff", border: "none",
                  padding: "10px 20px", borderRadius: "8px", fontSize: "14px",
                  fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1, transition: "background 0.2s"
                }}
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div style={{ 
        background: "#fff", 
        border: "1px solid #e5e7eb", 
        borderRadius: "12px", 
        padding: "24px",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Account Security</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, marginTop: "2px" }}>Manage your password and security settings</p>
          </div>
        </div>

        <div style={{ 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          padding: "16px", background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: "10px" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "20px", background: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <KeyRound size={18} color="#9ca3af" />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#111827", margin: 0 }}>Change Password</p>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, marginTop: "2px" }}>Update your account password regularly</p>
            </div>
          </div>
          <button style={{
            background: "#fff", border: "1px solid #d1d5db", color: "#374151",
            padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer"
          }}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
