import React from "react";

const alerts = [
  {
    id: 1,
    type: "High-Risk Transaction",
    entity: "Account #238",
    severity: "high",
    time: "Today, 4:32 PM",
    description: "Flagged for $40,000 withdrawal after dormant period"
  },
  {
    id: 2,
    type: "Pattern Detected",
    entity: "ShellCorp LLC",
    severity: "medium",
    time: "Today, 1:15 PM",
    description: "Round-tripping pattern with linked accounts"
  },
  {
    id: 3,
    type: "Unusual Merchant Spike",
    entity: "TravelCo",
    severity: "low",
    time: "Yesterday, 11:22 AM",
    description: "Spending spike detected during off-hours"
  }
];

const severityColor = {
  high: "#ef5350",
  medium: "#ffa726",
  low: "#66bb6a"
};

const Alerts = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Triggered Alerts</h2>
      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {alerts.map(alert => (
          <div
            key={alert.id}
            style={{
              padding: "1rem",
              border: `2px solid ${severityColor[alert.severity]}`,
              borderRadius: "10px",
              backgroundColor: "#f9f9f9",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "16px" }}>{alert.type}</strong>
              <span style={{
                backgroundColor: severityColor[alert.severity],
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "12px"
              }}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: "5px 0 0 0", color: "#333" }}>{alert.description}</p>
            <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#777" }}>
              <em>{alert.entity} • {alert.time}</em>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;