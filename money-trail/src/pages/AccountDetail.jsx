import { useParams } from "react-router-dom";
import { useState } from "react";
import GaugeChart from "react-gauge-chart";
import NetworkGraph from "../components/NetworkGraph";

const accountsMap = {
  "123456": {
    name: "John Doe",
    score: 9,
    flags: ["Multiple logins from new IPs", "Unusual withdrawal timing"],
    transactions: [
      { date: "4/11/25", type: "Withdrawal", partner: "ATM", amount: 400, flagged: true },
      { date: "4/10/25", type: "Deposit", partner: "Employer", amount: 2500, flagged: false },
    ]
  },
  "789012": {
    name: "Ansh Jain",
    score: 8,
    flags: ["Round-Tripping", "High-Frequency Transfer", "Dormant → Active", "Rapid Withdrawals"],
    transactions: [
      { date: "4/11/25", type: "Transfer", partner: "#342897", amount: 4000, flagged: true },
      { date: "4/10/25", type: "Payment", partner: "#562341", amount: 1200, flagged: false },
    ]
  },
  "832541": {
    name: "Mary Johnson",
    score: 7,
    flags: ["Crypto purchase flagged", "Suspicious IP login"],
    transactions: [
      { date: "4/09/25", type: "Transfer", partner: "CryptoX", amount: 900, flagged: true },
      { date: "4/08/25", type: "Deposit", partner: "External Source", amount: 1500, flagged: false },
    ]
  },
  "763215": {
    name: "David Black",
    score: 6,
    flags: ["Login attempt from unknown device"],
    transactions: [
      { date: "4/07/25", type: "Transfer", partner: "#234456", amount: 600, flagged: true },
      { date: "4/06/25", type: "Payment", partner: "ShellCorp", amount: 1800, flagged: false },
    ]
  },
  "987654": {
    name: "Susan White",
    score: 5,
    flags: ["Round-tripping", "Merchant mismatch"],
    transactions: [
      { date: "4/05/25", type: "Transfer", partner: "#989823", amount: 1000, flagged: true },
      { date: "4/04/25", type: "Deposit", partner: "External Source", amount: 2200, flagged: false },
    ]
  },
};

const AccountDetail = () => {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");

  const account = accountsMap[id] || {
    name: "Unknown",
    score: 0,
    flags: [],
    transactions: [],
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Account Detail</h2>
      <h3>{account.name} - Account #{id}</h3>

      <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
        {["overview", "transaction", "network", "flags"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              backgroundColor: tab === t ? "#333" : "#eee",
              color: tab === t ? "#fff" : "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "2rem" }}>
        {tab === "overview" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4>Flags Triggered</h4>
              <ul>
                {account.flags.map((flag, i) => (
                  <li
                  key={i}
                  style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <span style={{ fontSize: "1.5rem" }}>🚩</span>
                  {flag}
                </li>
                ))}
              </ul>
            </div>
            <div style={{ width: "300px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "0.5rem", fontSize: "1.75rem" }}>Risk Score </h2>
            <GaugeChart
              id="gauge-chart1"
              nrOfLevels={11} // 0 to 10 means 11 segments
              arcsLength={Array(11).fill(1 / 11)} // 11 equal-length arcs
              colors={[
                "#00FF00", "#33FF00", "#66FF00", "#99FF00", "#CCFF00",
              "#FFFF00", "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000"
              ]}
              percent={account.score / 10} 
              textColor="#000"
              formatTextValue={() => `${account.score * 10}%`}
            />
            </div>
          </div>
        )}

        {tab === "transaction" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f4f4f4" }}>
              <tr>
                <th style={cell}>Date</th>
                <th style={cell}>Type</th>
                <th style={cell}>To/From</th>
                <th style={cell}>Amount</th>
                <th style={cell}>Flagged</th>
              </tr>
            </thead>
            <tbody>
              {account.transactions.map((txn, i) => (
                <tr key={i}>
                  <td style={cell}>{txn.date}</td>
                  <td style={cell}>{txn.type}</td>
                  <td style={cell}>{txn.partner}</td>
                  <td style={cell}>${txn.amount}</td>
                  <td style={cell}>{txn.flagged ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "network" && <NetworkGraph accountId={id} />}

        {tab === "flags" && (
          <ul>
            {account.flags.map((flag, i) => (
              <li
                key={i}
                style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ fontSize: "1.5rem" }}>🚩</span>
                {flag}
              </li>
            ))}
          </ul>
        
        )}
      </div>
    </div>
  );
};

const cell = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left"
};

export default AccountDetail;