import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link to make cards clickable
import SuspicionScoreChart from "../components/SuspicionScoreChart"; // Assuming this component exists

// Define the base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

const Dashboard = () => {
  // State for the top 5 risky accounts
  const [riskyAccounts, setRiskyAccounts] = useState([]);
  // State for loading status specifically for this section
  const [isLoadingRisky, setIsLoadingRisky] = useState(true);
  // State for errors specifically for this section
  const [riskyError, setRiskyError] = useState(null);

  // Fetch accounts data when the component mounts
  useEffect(() => {
    const fetchAndProcessAccounts = async () => {
      setIsLoadingRisky(true);
      setRiskyError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/getAccounts`);
        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
        }
        const allAccounts = await response.json();
        const sortedAccounts = [...allAccounts].sort((a, b) => (b.score || 0) - (a.score || 0));
        const top5 = sortedAccounts.slice(0, 5);
        setRiskyAccounts(top5);
      } catch (err) {
        console.error("Error fetching or processing accounts for dashboard:", err);
        setRiskyError(err.message);
      } finally {
        setIsLoadingRisky(false);
      }
    };
    fetchAndProcessAccounts();
  }, []);

  // Helper function to generate a summary message for high-risk accounts
  const getRiskSummary = (account) => {
      // You could potentially fetch detailed flags here if needed,
      // but for now, just use the score.
      return `Account ${account.first_name || ''} ${account.last_name || ''} (#${account._id.slice(-4)}) has a high risk score: ${account.score}/10`;
  };


  return (
    <div className="dashboard" style={{ padding: "2rem", fontSize: "18px" }}>
      {/* TOP 5 RISKY ACCOUNTS */}
      <section>
        <h2 style={{ fontSize: "28px", marginBottom: "1rem" }}>Top 5 Risky Accounts</h2>
        {isLoadingRisky ? ( <p>Loading risky accounts...</p> )
         : riskyError ? ( <p style={{ color: 'red' }}>Error loading accounts: {riskyError}</p> )
         : riskyAccounts.length > 0 ? (
          <div style={{ display: "flex", gap: "1.5rem", overflowX: "auto", paddingBottom: '1rem' }}>
            {riskyAccounts.map((acc) => (
              <Link to={`/account/${acc._id}`} key={acc._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ border: "1px solid #ccc", padding: "1.5rem", borderRadius: "10px", minWidth: "150px", textAlign: "center", backgroundColor: "#fff", fontSize: "18px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                  <div style={{ marginBottom: "12px", fontWeight: 'bold', wordBreak: 'break-word' }}>
                    {`${acc.first_name || ''} ${acc.last_name || ''}`.trim() || `Account ${acc._id.slice(-4)}`}
                  </div>
                  <strong>Score: {acc.score !== undefined ? acc.score : 'N/A'}</strong>
                </div>
              </Link>
            ))}
          </div>
        ) : ( <p>No account data found.</p> )}
      </section>

      {/* RECENT SUSPICIOUS ACTIVITY (Now shows top risky accounts) */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "1rem" }}>Current High-Risk Accounts</h2>
        {/* Use the same loading/error state as the Top 5 section */}
        {isLoadingRisky ? (
            <p>Loading activity...</p>
        ) : riskyError ? (
            <p style={{ color: 'red' }}>Error loading activity: {riskyError}</p>
        ) : riskyAccounts.length > 0 ? (
            // Display info for the top 2-3 accounts from the risky list
            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {riskyAccounts.slice(0, 3).map((acc) => ( // Show top 3
                    <li key={acc._id} style={{ display: "flex", alignItems: "center", marginBottom: "0.8rem", fontSize: "20px" }}>
                        <span style={{ fontSize: "1.8rem", marginRight: "0.8rem" }}>⚠️</span> {/* Changed icon */}
                        {/* Link the text to the account detail page */}
                        <Link to={`/account/${acc._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {getRiskSummary(acc)}
                        </Link>
                    </li>
                ))}
                {riskyAccounts.length === 0 && <li>No accounts with high risk scores found.</li>}
            </ul>
        ) : (
            <p>No account data to analyze for suspicious activity.</p>
        )}
      </section>

      {/* SUSPICION SCORE DISTRIBUTION */}
      <section style={{ marginTop: "2.5rem" }}>
        {/* ... (SuspicionScoreChart section remains the same) ... */}
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