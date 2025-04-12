import { useParams } from "react-router-dom";
import { useState } from "react";
import GaugeChart from "react-gauge-chart";
import NetworkGraph from "../components/NetworkGraph";

const AccountDetail = () => {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");

  const account = {
    id: "789012",
    name: "Ansh Jain",
    score: 8,
    flags: [
      "Round-Tripping",
      "High-Frequency Transfer",
      "Dormant → Active",
      "Rapid Withdrawals"
    ],
    transactions: [
      { date: "4/11/25", type: "Transfer", partner: "#342897", amount: 4000, flagged: true },
      { date: "4/10/25", type: "Payment", partner: "#562341", amount: 1200, flagged: false },
      { date: "4/09/25", type: "Transfer", partner: "#873012", amount: 900, flagged: true },
      { date: "4/08/25", type: "Deposit", partner: "External Source", amount: 1500, flagged: false },
    ]
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Account Detail</h2>
      <h3>{account.name} - Account #{account.id}</h3>

      {/* Tabs */}
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

      {/* Tab Content */}
      <div style={{ marginTop: "2rem" }}>
        {tab === "overview" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4>Flags Triggered</h4>
              <ul>
                {account.flags.map((flag, i) => (
                  <li key={i}>✅ {flag}</li>
                ))}
              </ul>
            </div>
            <div style={{ width: "300px" }}>
              <GaugeChart
                id="gauge-chart1"
                nrOfLevels={10}
                percent={account.score / 10}
                textColor="#000"
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

        {tab === "network" && <NetworkGraph />}

        {tab === "flags" && (
          <div>
            <ul>
              {account.flags.map((flag, i) => (
                <li key={i}>✅ {flag}</li>
              ))}
            </ul>
          </div>
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