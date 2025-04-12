import { useState } from "react";
import MerchantDetail from "../components/MerchantDetail";

const Merchants = () => {
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  const [filters, setFilters] = useState({
    category: "",
    dateRange: "",
    flagType: ""
  });

  const merchants = [
    {
      name: "ShellCorp LLC",
      suspiciousTxns: 47,
      totalVolume: "$82,000",
      suspicionScore: 8,
      flags: [
        "12 round-tripping txns",
        "7 high-frequency spikes",
        "MCC: Retail - flagged for excess crypto traffic"
      ],
      chartData: [12, 7, 3],
      linkedAccounts: [
        { id: "ShellCorp LLC", type: "merchant" },
        { id: "User 1", amount: "$4000", type: "user" },
        { id: "User 2", amount: "$3500", type: "user" },
        { id: "User 3", amount: "$1500", type: "user" }
      ],
      edges: [
        { source: "User 1", target: "ShellCorp LLC" },
        { source: "User 2", target: "ShellCorp LLC" },
        { source: "User 3", target: "ShellCorp LLC" }
      ]
    },
    {
      name: "TravelCo",
      suspiciousTxns: 23,
      totalVolume: "$39,000",
      suspicionScore: 6,
      flags: [
        "Dormant → active spike",
        "Unusual ATM pattern"
      ],
      chartData: [5, 6, 2],
      linkedAccounts: [
        { id: "TravelCo", type: "merchant" },
        { id: "User A", amount: "$2700", type: "user" },
        { id: "User B", amount: "$1200", type: "user" }
      ],
      edges: [
        { source: "User A", target: "TravelCo" },
        { source: "User B", target: "TravelCo" }
      ]
    },
    {
      name: "CashDrop Express",
      suspiciousTxns: 12,
      totalVolume: "$17,500",
      suspicionScore: 5,
      flags: [
        "3 mirrored withdrawals",
        "Frequent small deposits"
      ],
      chartData: [3, 4, 5],
      linkedAccounts: [
        { id: "CashDrop Express", type: "merchant" },
        { id: "User X", amount: "$800", type: "user" },
        { id: "User Y", amount: "$900", type: "user" }
      ],
      edges: [
        { source: "User X", target: "CashDrop Express" },
        { source: "User Y", target: "CashDrop Express" }
      ]
    }
  ];  

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Merchant Tracker</h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", margin: "1.5rem 0" }}>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          style={dropdownStyle}
        >
          <option value="">Category</option>
          <option value="retail">Retail</option>
          <option value="crypto">Crypto</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          style={dropdownStyle}
        >
          <option value="">Date Range</option>
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
        </select>

        <select
          value={filters.flagType}
          onChange={(e) => setFilters({ ...filters, flagType: e.target.value })}
          style={dropdownStyle}
        >
          <option value="">Flag Type</option>
          <option value="round-tripping">Round-tripping</option>
          <option value="high-frequency">High-frequency</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "0 0 4px rgba(0,0,0,0.1)" }}>
        <thead style={{ backgroundColor: "#f4f4f4" }}>
          <tr>
            <th style={cellStyle}>Merchant Name</th>
            <th style={cellStyle}># Suspicious Txns</th>
            <th style={cellStyle}>Total Volume ($)</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((merchant, i) => (
            <tr key={i} onClick={() => setSelectedMerchant(merchant)} style={{ cursor: "pointer" }}>
              <td style={cellStyle}>{merchant.name}</td>
              <td style={cellStyle}>{merchant.suspiciousTxns}</td>
              <td style={cellStyle}>{merchant.totalVolume}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedMerchant && (
        <MerchantDetail
          merchant={selectedMerchant}
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  );
};

const cellStyle = {
  border: "1px solid #ccc",
  padding: "12px",
  textAlign: "left"
};

const dropdownStyle = {
  padding: "10px 14px",
  borderRadius: "6px",
  border: "1px solid #bbb",
  fontSize: "14px",
  backgroundColor: "#eef4ff", // 👈 Soft blue background
  color: "#333",
  fontWeight: "500"
};

export default Merchants;