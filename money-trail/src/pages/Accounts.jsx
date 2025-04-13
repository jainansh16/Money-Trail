import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation to detail page

// Define the base URL for your backend API
const API_BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs elsewhere

// This component lists multiple accounts
const Accounts = () => {
  // State to store the list of accounts fetched from the backend
  const [accounts, setAccounts] = useState([]);
  // State to handle loading status during fetch
  const [isLoading, setIsLoading] = useState(true);
  // State to handle potential errors during fetch
  const [error, setError] = useState(null);

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    // Define an async function inside useEffect to fetch the list of accounts
    const fetchAccounts = async () => {
      setIsLoading(true); // Indicate loading started
      setError(null); // Clear previous errors

      try {
        // Fetch data from the backend endpoint that returns all accounts
        const response = await fetch(`${API_BASE_URL}/api/getAccounts`);

        // Check if the HTTP response status is OK (e.g., 200)
        if (!response.ok) {
          // If not OK, construct an error message and throw it
          throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
        }

        // Parse the JSON response body
        const data = await response.json();
        // Update the 'accounts' state with the fetched data array
        setAccounts(data);

      } catch (err) {
        // If any error occurs during fetch or parsing, log it and update the error state
        console.error("Fetch error:", err);
        setError(err.message); // Set the error message for display
      } finally {
        // Set loading to false once the fetch attempt is complete (success or error)
        setIsLoading(false);
      }
    };

    fetchAccounts(); // Call the function to fetch data
  }, []); // The empty dependency array [] means this effect runs only once when the component mounts

  // --- Render Logic ---

  // Display a loading message while data is being fetched
  if (isLoading) {
    return <div style={{ padding: "2rem" }}>Loading accounts...</div>;
  }

  // Display an error message if the fetch failed
  if (error) {
    return <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>;
  }

  // If loading is complete and no error, display the table
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Accounts</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        {/* Table Header */}
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2", textAlign: 'left' }}>
            <th style={cellStyle}>Account ID</th>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Risk Score</th>
          </tr>
        </thead>
        {/* Table Body */}
        <tbody>
          {/* Check if the accounts array has data */}
          {accounts.length > 0 ? (
            // If yes, map over the array to create a table row for each account
            accounts.map((acc) => (
              // Use the unique MongoDB _id as the key for each row
              <tr key={acc._id}>
                {/* Account ID Cell - Link to the detail page */}
                <td style={cellStyle}>
                  <Link to={`/account/${acc._id}`} style={{ color: "#0077cc", textDecoration: "none" }}>
                    {acc._id} {/* Display the account ID */}
                  </Link>
                </td>
                {/* Name Cell - Combine first and last name */}
                <td style={cellStyle}>{`${acc.first_name || ''} ${acc.last_name || ''}`.trim()}</td>
                {/* Risk Score Cell - Display score or 'N/A' if undefined */}
                <td style={cellStyle}>{acc.score !== undefined ? acc.score : 'N/A'}</td>
              </tr>
            ))
          ) : (
            // If no accounts were fetched, display a message in a merged cell
            <tr>
              <td colSpan="3" style={{ ...cellStyle, textAlign: 'center', fontStyle: 'italic' }}>
                No accounts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Reusable style object for table cells
const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

// Export the component for use in routing
export default Accounts;
