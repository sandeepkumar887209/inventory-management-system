import { useNavigate } from "react-router-dom";
import { Clock, ArrowLeft, Laptop } from "lucide-react";

export default function PendingApproval() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .auth-page * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
        .auth-link:hover { color: #2563eb; }
      `}</style>

      <div className="auth-page" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9fafb",
        padding: "20px",
      }}>
        <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>

          {/* Logo */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "#2563eb",
            marginBottom: "32px",
          }}>
            <Laptop size={20} color="#fff" strokeWidth={2.2} />
          </div>

          {/* Card */}
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
            padding: "40px 32px",
          }}>
            {/* Icon */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#fef3c7",
              marginBottom: "20px",
            }}>
              <Clock size={26} color="#d97706" />
            </div>

            <h1 style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "8px",
            }}>
              Account Pending Approval
            </h1>

            <p style={{
              fontSize: "13.5px",
              color: "#6b7280",
              lineHeight: "1.6",
              marginBottom: "8px",
            }}>
              Your account has been created successfully and is now awaiting admin approval.
            </p>

            <p style={{
              fontSize: "13px",
              color: "#9ca3af",
              lineHeight: "1.5",
              marginBottom: "28px",
            }}>
              You'll be able to log in once an administrator reviews and approves your request.
            </p>

            {/* Status badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              marginBottom: "28px",
            }}>
              <div style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#f59e0b",
              }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#92400e" }}>
                Pending Review
              </span>
            </div>

            {/* Back to login */}
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "20px" }}>
              <button
                onClick={() => navigate("/login")}
                className="auth-link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#3b82f6",
                  transition: "color 0.15s",
                }}
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
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
