import { Link } from "react-router-dom";

const accounts = [
  { id: "123456", name: "John Doe", score: 9 },
  { id: "789012", name: "Ansh Jain", score: 8 },
  { id: "832541", name: "Mary Johnson", score: 7 },
  { id: "763215", name: "David Black", score: 6 },
  { id: "987654", name: "Susan White", score: 5 },
];

const Accounts = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Accounts</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={cellStyle}>Account ID</th>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Risk Score</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td style={cellStyle}>
                <Link to={`/account/${acc.id}`} style={{ color: "#0077cc", textDecoration: "none" }}>
                  {acc.id}
                </Link>
              </td>
              <td style={cellStyle}>{acc.name}</td>
              <td style={cellStyle}>{acc.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

export default Accounts;