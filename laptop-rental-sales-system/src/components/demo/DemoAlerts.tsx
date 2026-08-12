import React from "react";
import { C } from "./ui";

export function DemoAlerts({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a1a", margin: 0, marginBottom: "8px" }}>
        Demo Alerts
      </h1>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "24px" }}>
        Due-date tracking has been disabled.
      </p>
      <div
        style={{
          textAlign: "center", padding: "80px",
          background: "#fff", border: "1px solid #ebebeb",
          borderRadius: "14px", color: C.teal.text,
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
        <div style={{ fontWeight: 500, fontSize: "14px" }}>No alerts configured</div>
        <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
          Return dates are no longer tracked in this system.
        </div>
      </div>
    </div>
  );
}
