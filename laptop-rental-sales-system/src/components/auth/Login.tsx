import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Laptop } from "lucide-react";
import { loginApi } from "../../services/auth";
import { useNavigate } from "react-router-dom";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      setLoading(true);

      const data = await loginApi({ username, password });

      // ✅ SAVE TOKENS (EXACT MATCH WITH BACKEND)
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("username", username);

      // ✅ REACT ROUTER REDIRECT (NO PAGE RELOAD)
      navigate("/", { replace: true });

    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string' && detail.toLowerCase().includes('pending')) {
        setError("Your account is pending admin approval.");
      } else if (typeof detail === 'string' && detail.toLowerCase().includes('rejected')) {
        setError("Your account request has been rejected.");
      } else {
        setError("Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .auth-page * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
        .auth-input:focus { background: #fff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        .auth-input::placeholder { color: #a1a1aa; }
        .auth-btn:hover { background: #111827; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .auth-btn:active { transform: translateY(0); box-shadow: none; }
        .auth-link:hover { color: #2563eb; }
        .auth-eye:hover { color: #18181b; }
        .auth-check:checked { background-color: #2563eb; border-color: #2563eb; }
      `}</style>

      <div className="auth-page" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        padding: "20px",
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>

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
              Welcome back
            </h1>
            <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>
              Sign in to Mr. Laptop Management Suite
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

              {/* Username */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}>
                  Username
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={16}
                    color={focusedField === "username" ? "#3b82f6" : "#a1a1aa"}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      transition: "color 0.15s",
                    }}
                  />
                  <input
                    className="auth-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your username"
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 38px",
                      fontSize: "13px",
                      color: "#18181b",
                      background: "#f4f4f5",
                      border: "1px solid transparent",
                      borderRadius: "10px",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "6px",
                }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={16}
                    color={focusedField === "password" ? "#3b82f6" : "#a1a1aa"}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      transition: "color 0.15s",
                    }}
                  />
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 38px",
                      fontSize: "13px",
                      color: "#18181b",
                      background: "#f4f4f5",
                      border: "1px solid transparent",
                      borderRadius: "10px",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-eye"
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#a1a1aa",
                      padding: "2px",
                      display: "flex",
                      transition: "color 0.15s",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-check"
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: "1.5px solid #d1d5db",
                      cursor: "pointer",
                      accentColor: "#2563eb",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="auth-link"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#3b82f6",
                    transition: "color 0.15s",
                  }}
                >
                  Forgot password?
                </button>
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
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Divider + signup link */}
            <div style={{
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid #f3f4f6",
              textAlign: "center",
            }}>
              <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>
                Don't have an account?{" "}
                <button
                  onClick={() => navigate('/signup')}
                  className="auth-link"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#3b82f6",
                    transition: "color 0.15s",
                  }}
                >
                  Create account
                </button>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center",
            marginTop: "24px",
          }}>
            <span style={{ fontSize: "11px", color: "#d1d5db", fontWeight: 500 }}>
              © 2026 Mr. Laptop · Management Suite
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
