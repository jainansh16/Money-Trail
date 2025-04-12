import SuspicionScoreChart from "../components/SuspicionScoreChart";

const Dashboard = () => {
  return (
    <div className="dashboard" style={{ padding: "2rem", fontSize: "18px" }}>
      {/* TOP 5 RISKY ACCOUNTS */}
      <section>
        <h2 style={{ fontSize: "28px", marginBottom: "1rem" }}>Top 5 Risky Accounts</h2>
        <div style={{ display: "flex", gap: "1.5rem", overflowX: "auto" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              border: "1px solid #ccc",
              padding: "1.5rem",
              borderRadius: "10px",
              width: "120px",
              textAlign: "center",
              backgroundColor: "#fff",
              fontSize: "20px"
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#eee",
                borderRadius: "50%",
                margin: "0 auto 12px"
              }}></div>
              <strong>Score: 8</strong>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT SUSPICIOUS ACTIVITY */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "1rem" }}>Recent Suspicious Activity</h2>
        <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
          <li style={{ display: "flex", alignItems: "center", marginBottom: "0.8rem", fontSize: "20px" }}>
            <span style={{ fontSize: "1.8rem", marginRight: "0.8rem" }}>🕒</span>
            2 days ago – Account #238 withdrew $40,000
          </li>
          <li style={{ display: "flex", alignItems: "center", fontSize: "20px" }}>
            <span style={{ fontSize: "1.8rem", marginRight: "0.8rem" }}>🕒</span>
            3 days ago – Suspicious merchant activity flagged
          </li>
        </ul>
      </section>

      {/* SUSPICION SCORE DISTRIBUTION */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "0.8rem" }}>Suspicion Score Distribution</h2>
        <p style={{ fontSize: "18px", marginBottom: "12px" }}>
          This visualization shows how risk levels (Low, Medium, High) are categorized based on account suspicion scores:
        </p>
        <SuspicionScoreChart />
      </section>
    </div>
  );
};

export default Dashboard;