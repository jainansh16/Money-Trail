import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link for linking to accounts

// Define the base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

// Helper function to determine severity and color based on flag type
const getSeverity = (flagType) => {
    switch (flagType) {
        case 'Circular Funds':
        case 'Rapid Transfer':
            return { level: 'high', color: '#ef5350' }; // Red
        case 'High Frequency Transfer':
        case 'Dormant to Active':
            return { level: 'medium', color: '#ffa726' }; // Orange
        case 'High Frequency Purchase': // If you re-add this check later
             return { level: 'medium', color: '#ffa726' };
        default:
            return { level: 'low', color: '#66bb6a' }; // Green (or default)
    }
};

// Helper function to display relative time (simple version)
const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return `Just now`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};


const Alerts = () => {
  // State for the fetched alert events
  const [alertEvents, setAlertEvents] = useState([]);
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  // State for error handling
  const [error, setError] = useState(null);

  // useEffect to fetch recent fraud events when the component mounts
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch from the endpoint, maybe get more than 5 for an alerts page
        const response = await fetch(`${API_BASE_URL}/api/getRecentFraudEvents?limit=20`); // Fetch latest 20 events
        if (!response.ok) {
          throw new Error(`Failed to fetch alerts: ${response.status} ${response.statusText}`);
        }
        const events = await response.json();
        setAlertEvents(events); // Store the fetched events
      } catch (err) {
        console.error("Error fetching alert events:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, []); // Empty dependency array means run once on mount

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Triggered Alerts</h2>

      {/* Loading State */}
      {isLoading && <p>Loading alerts...</p>}

      {/* Error State */}
      {error && <p style={{ color: 'red' }}>Error loading alerts: {error}</p>}

      {/* Alerts List */}
      {!isLoading && !error && (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {alertEvents.length > 0 ? (
            alertEvents.map(event => {
              // Determine severity based on the flag type
              const { level: severity, color: severityColor } = getSeverity(event.flagType);
              // Format the entity string
              const entityString = `${event.accountName || 'Unknown'} (#${event.accountId.slice(-6)})`;

              return (
                <div
                  key={event._id} // Use the unique MongoDB ID for the event
                  style={{
                    padding: "1rem",
                    border: `2px solid ${severityColor}`, // Use dynamic color
                    borderRadius: "10px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* Display the actual flag type */}
                    <strong style={{ fontSize: "16px" }}>{event.flagType || 'Unknown Alert'}</strong>
                    {/* Display severity level */}
                    <span style={{
                      backgroundColor: severityColor,
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "12px"
                    }}>
                      {severity.toUpperCase()}
                    </span>
                  </div>
                  {/* Display the message logged by the backend */}
                  <p style={{ margin: "5px 0 0 0", color: "#333" }}>{event.message || 'No details available.'}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#777" }}>
                    {/* Link to the account and display formatted time */}
                    <em>
                        <Link to={`/account/${event.accountId}`} style={{color: 'inherit'}}>
                            {entityString}
                        </Link>
                         • {formatTimeAgo(event.timestamp)}
                    </em>
                  </p>
                </div>
              );
            })
          ) : (
            // Message if no alerts were fetched
            <p>No recent alerts found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
