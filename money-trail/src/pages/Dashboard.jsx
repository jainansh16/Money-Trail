const Dashboard = () => {
    return (
      <div className="dashboard">
        {/* TOP 5 RISKY ACCOUNTS */}
        <section>
          <h2>Top 5 Risky Accounts <span title="Based on suspicious activity scores">❓</span></h2>
          <div style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                border: "1px solid #ccc",
                padding: "1rem",
                borderRadius: "8px",
                width: "100px",
                textAlign: "center",
                backgroundColor: "#fff"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#eee",
                  borderRadius: "50%",
                  margin: "0 auto 10px"
                }}></div>
                <strong>Score: 8</strong>
              </div>
            ))}
          </div>
        </section>
  
        {/* RECENT SUSPICIOUS ACTIVITY */}
        <section style={{ marginTop: "2rem" }}>
          <h2>Recent Suspicious Activity <span title="Click for more info">❓</span></h2>
          <ul>
            <li>🕒 4:32 PM - Account #238 withdrew $40,000</li>
            <li>🕒 2:15 PM - Suspicious merchant activity flagged</li>
          </ul>
        </section>
  
        {/* SUSPICION SCORE DISTRIBUTION */}
        <section style={{ marginTop: "2rem" }}>
          <h2>Suspicion Score Distribution</h2>
          <div style={{ display: "flex", border: "1px solid #ccc", height: "30px", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ flex: 1, backgroundColor: "#b9fbc0" }}></div>
            <div style={{ flex: 1, backgroundColor: "#fcd5ce" }}></div>
            <div style={{ flex: 2, backgroundColor: "#ffadad" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "5px" }}>
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </section>
      </div>
    );
};
  
export default Dashboard;