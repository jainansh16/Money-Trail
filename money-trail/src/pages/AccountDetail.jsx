// import React, { useState, useEffect, useRef, useMemo } from "react"; // Added useRef and useMemo
// import { useParams, Link } from "react-router-dom";
// import GaugeChart from "react-gauge-chart";
// import * as d3 from 'd3'; // Import D3

// // Define the base URL for your backend API
// const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

// // Component to show details for a single account, including the network graph
// const AccountDetail = () => {
//   const { id } = useParams(); // Get the account ID from the URL path
//   const [tab, setTab] = useState("overview"); // State for currently selected tab

//   // State variables for fetched data, loading status, and errors
//   const [accountDetails, setAccountDetails] = useState(null); // Holds fetched account details
//   const [transactions, setTransactions] = useState([]); // Holds fetched transactions list
//   const [isLoading, setIsLoading] = useState(true); // Tracks if data is being loaded
//   const [error, setError] = useState(null); // Stores any fetch errors

//   // --- Network Graph Specific State & Refs ---
//   const svgRef = useRef(null); // Ref for the SVG element for D3
//   const graphWidth = 800; // Define graph dimensions
//   const graphHeight = 600;
//   // --- End Network Graph Specific State & Refs ---


//   // useEffect hook: runs after render and when 'id' changes to fetch data
//   useEffect(() => {
//     if (!id) {
//         setIsLoading(false);
//         setError("No Account ID provided.");
//         return;
//     }
//     const fetchAccountData = async () => {
//       setIsLoading(true);
//       setError(null);
//       setAccountDetails(null);
//       setTransactions([]);
//       try {
//         const response = await fetch(`${API_BASE_URL}/api/getAccount/${id}`);
//         if (!response.ok) {
//           if (response.status === 404) { throw new Error(`Account with ID ${id} not found.`); }
//           else { throw new Error(`Failed to fetch account data: ${response.status} ${response.statusText}`); }
//         }
//         const data = await response.json();
//         setAccountDetails(data.accountDetails || null);
//         setTransactions(data.transactions || []);
//         if (data.accountDetails && !data.accountDetails.flags) {
//             data.accountDetails.flags = [];
//         }
//       } catch (err) {
//         console.error("Fetch error:", err);
//         setError(err.message);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchAccountData();
//   }, [id]);

//   // --- Prepare data for rendering (Account Name, Score, Flags) ---
//   const accountName = useMemo(() =>
//     accountDetails ? `${accountDetails.first_name || ''} ${accountDetails.last_name || ''}`.trim() || "Unknown" : "Unknown",
//     [accountDetails]
//   );
//   const riskScore = useMemo(() =>
//     accountDetails && accountDetails.score !== undefined ? accountDetails.score : 0,
//     [accountDetails]
//   );
//   const gaugePercent = useMemo(() => riskScore / 10, [riskScore]);
//   const flags = useMemo(() => (accountDetails && accountDetails.flags) || [], [accountDetails]);


//   // --- Network Graph Data Processing using useMemo ---
//   const graphData = useMemo(() => {
//     if (!id || !accountName || !transactions) return { nodes: [], links: [], nodeTypeColors: {} };
//     const nodes = [{ id: id, name: accountName, type: 'Account', isCenter: true }];
//     const links = [];
//     const nodeIds = new Set([id]);
//     const nodeTypeColors = {
//         'Account': '#888', 'Deposit': '#FFFF00', 'Withdrawal': '#6495ED',
//         'Transfer': '#32CD32', 'Purchase': '#4682B4', 'Credit Card': '#4682B4',
//         'High Risk': '#000000', 'Unknown': '#D3D3D3'
//     };

//     transactions.forEach((txn, index) => {
//       let partnerNodeId = null, partnerName = null, partnerType = 'Unknown';
//       let linkType = txn.type, linkStyle = 'solid', linkColor = '#999';

//       switch (txn.type) {
//         case 'Deposit':
//           partnerNodeId = `deposit_source_${txn.description || index}`;
//           partnerName = txn.description || 'Deposit Source'; partnerType = 'Deposit'; break;
//         case 'Withdrawal':
//           partnerNodeId = `withdrawal_dest_${txn.description || index}`;
//           partnerName = txn.description || 'Withdrawal Dest.'; partnerType = 'Withdrawal'; break;
//         case 'Transfer Out':
//           partnerNodeId = txn.payee_id; partnerName = `Account ${txn.payee_id?.slice(-6)}`; partnerType = 'Transfer'; break;
//         case 'Transfer In':
//           partnerNodeId = txn.payer_id; partnerName = `Account ${txn.payer_id?.slice(-6)}`; partnerType = 'Transfer'; break;
//         case 'Purchase':
//           partnerNodeId = txn.merchant_id; partnerName = `Merchant ${txn.merchant_id?.slice(-6)}`; partnerType = 'Purchase'; break;
//         default:
//           partnerNodeId = `unknown_${index}`; partnerName = txn.description || 'Unknown Entity'; break;
//       }

//       if (partnerNodeId && !nodeIds.has(partnerNodeId)) {
//         nodeIds.add(partnerNodeId);
//         nodes.push({ id: partnerNodeId, name: partnerName, type: partnerType, isCenter: false });
//       }
//       // // Example Link Styling (adapt if flags are on transactions)
//       // if (txn.flags?.includes('Round-tripping')) linkStyle = 'dashed';
//       // if (txn.flags?.includes('High Risk')) {
//       //     linkColor = 'red';
//       //     const partnerNode = nodes.find(n => n.id === partnerNodeId);
//       //     if (partnerNode) partnerNode.type = 'High Risk'; // Optionally color node too
//       // }
//       if (partnerNodeId) {
//         links.push({ source: id, target: partnerNodeId, type: linkType, amount: txn.amount, style: linkStyle, color: linkColor });
//       }
//     });
//     return { nodes, links, nodeTypeColors };
//   }, [transactions, id, accountName]);


//   // --- D3 Rendering using useEffect for Network Graph ---
//   useEffect(() => {
//     if (tab !== 'network' || !graphData || !svgRef.current) return;

//     const { nodes, links, nodeTypeColors } = graphData;
//     const svg = d3.select(svgRef.current);
//     svg.selectAll("*").remove();
//     svg.attr('width', graphWidth).attr('height', graphHeight)
//        .attr('viewBox', [-graphWidth / 2, -graphHeight / 2, graphWidth, graphHeight])
//        .style('max-width', '100%').style('height', 'auto');

//     const simulation = d3.forceSimulation(nodes)
//       .force("link", d3.forceLink(links).id(d => d.id).distance(120)) // Increased distance slightly
//       .force("charge", d3.forceManyBody().strength(-350)) // Increased repulsion slightly
//       .force("center", d3.forceCenter(0, 0));

//     const link = svg.append("g")
//         .attr("stroke-opacity", 0.6)
//       .selectAll("line").data(links).join("line")
//         .attr("stroke-width", 2).attr("stroke", d => d.color)
//         .style("stroke-dasharray", d => d.style === 'dashed' ? "5,5" : null);

//     const node = svg.append("g")
//         .attr("stroke", "#fff").attr("stroke-width", 1.5)
//       .selectAll("g").data(nodes).join("g");

//     node.append("circle")
//         .attr("r", d => d.isCenter ? 15 : 10)
//         .attr("fill", d => nodeTypeColors[d.type] || nodeTypeColors['Unknown']);

//     // --- FIX for Node Labels ---
//     node.append("text")
//         .attr("x", d => d.isCenter ? 18 : 13) // Position text slightly outside the circle radius
//         .attr("dy", "0.35em") // Better vertical alignment
//         .text(d => d.name)
//         .style("font-size", "10px") // Explicit font size
//         .attr("fill", "black") // Explicit fill color
//         .clone(true).lower() // Background for readability
//         .attr("fill", "none")
//         .attr("stroke", "white")
//         .attr("stroke-width", 3);
//     // --- End FIX ---

//     node.append("title").text(d => `${d.type}: ${d.name}\nID: ${d.id}`);
//     link.append("title").text(d => `${d.type}: $${d.amount?.toFixed(2)}\n(${d.source.id} -> ${d.target.id})`);

//     const drag = simulation => { /* ... drag functions ... */
//         function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
//         function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
//         function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
//         return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
//     }
//     node.call(drag(simulation));

//     simulation.on("tick", () => {
//       link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
//       node.attr("transform", d => `translate(${d.x},${d.y})`);
//     });

//     return () => { simulation.stop(); };
//   }, [graphData, tab]); // Rerun effect if graphData or tab changes


//   // Helper function to format transaction partner details
//   const formatPartner = (txn) => { /* ... same as before ... */
//       switch (txn.type) {
//           case 'Deposit': case 'Withdrawal': return txn.description || '-';
//           case 'Transfer Out': return `To: ${txn.payee_id || 'Unknown'}`;
//           case 'Transfer In': return `From: ${txn.payer_id || 'Unknown'}`;
//           case 'Purchase': return `Merchant: ${txn.merchant_id || 'Unknown'}`;
//           default: return txn.partner_id || txn.description || '-';
//       }
//   };

//   // Conditional Rendering based on state
//   if (isLoading) return <div style={{ padding: "2rem" }}>Loading account data...</div>;
//   if (error) return <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>;
//   if (!accountDetails) return <div style={{ padding: "2rem" }}>Account data could not be loaded.</div>;

//   // Main JSX Return
//   return (
//     <div style={{ padding: "2rem" }}>
//       <h2>Account Detail</h2>
//       <h3>{accountName} - Account #{id}</h3>
//       {/* Tab Navigation */}
//       <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
//         {["overview", "transaction", "network", "flags"].map((t) => (
//           <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", backgroundColor: tab === t ? "#333" : "#eee", color: tab === t ? "#fff" : "#000", border: "none", borderRadius: "5px", cursor: "pointer" }}>
//             {t.charAt(0).toUpperCase() + t.slice(1)}
//           </button>
//         ))}
//       </div>

//       {/* Tab Content */}
//       <div style={{ marginTop: "2rem" }}>
//         {/* Overview Tab */}
//         {tab === "overview" && ( /* ... overview content ... */
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <div>
//               <h4>Flags Triggered</h4>
//               {flags.length > 0 ? ( <ul> {flags.map((flag, i) => ( <li key={i} style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ fontSize: "1.5rem" }}>🚩</span> {flag}</li> ))} </ul> ) : ( <p>No flags triggered.</p> )}
//             </div>
//             <div style={{ width: "300px" }}>
//               <h2 style={{ textAlign: "center", marginBottom: "0.5rem", fontSize: "1.75rem" }}>Risk Score</h2>
//               <GaugeChart id={`gauge-chart-${id}`} nrOfLevels={11} arcsLength={Array(11).fill(1 / 11)} colors={[ "#00FF00", "#33FF00", "#66FF00", "#99FF00", "#CCFF00", "#FFFF00", "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000" ]} percent={gaugePercent} textColor="#000" formatTextValue={() => `${riskScore}/10`} />
//             </div>
//           </div>
//         )}

//         {/* Transaction Tab */}
//         {tab === "transaction" && ( /* ... transaction table ... */
//            transactions.length > 0 ? (
//               <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                 <thead style={{ backgroundColor: "#f4f4f4" }}><tr><th style={cell}>Date</th><th style={cell}>Type</th><th style={cell}>To/From/Description</th><th style={cell}>Amount</th><th style={cell}>Status</th></tr></thead>
//                 <tbody>{transactions.map((txn) => (<tr key={txn._id || txn.transaction_id || Math.random()}><td style={cell}>{new Date(txn.transaction_date).toLocaleDateString()}</td><td style={cell}>{txn.type}</td><td style={cell}>{formatPartner(txn)}</td><td style={cell}>${txn.amount.toFixed(2)}</td><td style={cell}>{txn.status}</td></tr>))}</tbody>
//               </table>
//            ) : ( <p>No transaction data available.</p> )
//         )}

//         {/* Network Tab */}
//         {tab === "network" && (
//             <div>
//                 {/* FIX: Moved SVG container *before* the legend div */}
//                 <svg ref={svgRef}></svg>

//                 {/* Legend Div */}
//                 <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
//                     <span style={legendItemStyle(graphData.nodeTypeColors['Credit Card'] || '#4682B4')}>Credit Card</span>
//                     <span style={legendItemStyle(graphData.nodeTypeColors['Transfer'] || '#32CD32')}>Transfer</span>
//                     <span style={legendItemStyle(graphData.nodeTypeColors['Deposit'] || '#FFFF00')}>Deposit</span>
//                     <span style={legendItemStyle(graphData.nodeTypeColors['Withdrawal'] || '#6495ED')}>Withdrawal</span>
//                     <span style={legendItemStyle(graphData.nodeTypeColors['High Risk'] || '#000000')}>High Risk</span>
//                     <span style={{ marginLeft: '20px' }}>Dashed = Round-tripping</span>
//                     <span style={{ marginLeft: '20px' }}><span style={{color: 'red', fontWeight: 'bold'}}>Red line</span> = High Risk Path</span>
//                 </div>
//             </div>
//         )}

//         {/* Flags Tab */}
//         {tab === "flags" && ( /* ... flags list ... */
//            flags.length > 0 ? ( <ul>{flags.map((flag, i) => ( <li key={i} style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ fontSize: "1.5rem" }}>🚩</span> {flag}</li> ))}</ul> ) : ( <p>No flags triggered.</p> )
//         )}
//       </div>
//     </div>
//   );
// };

// // Cell style
// const cell = { border: "1px solid #ccc", padding: "10px", textAlign: "left" };
// // Legend item style helper
// const legendItemStyle = (color) => ({
//     display: 'inline-block', padding: '4px 8px', backgroundColor: color,
//     color: ['#FFFF00', '#D3D3D3'].includes(color) ? '#333' : '#fff',
//     borderRadius: '4px', fontSize: '0.9em'
// });

// export default AccountDetail;








import React, { useState, useEffect, useRef, useMemo } from "react"; // Added useRef and useMemo
import { useParams, Link } from "react-router-dom"; // Import Link if needed
import GaugeChart from "react-gauge-chart";
import * as d3 from 'd3'; // Import D3 for network graph

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

// Helper function to display relative time
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


// Component to show details for a single account
const AccountDetail = () => {
  const { id } = useParams(); // Get the account ID from the URL path
  const [tab, setTab] = useState("overview"); // State for currently selected tab

  // State variables for fetched data, loading status, and errors
  const [accountDetails, setAccountDetails] = useState(null); // Holds fetched account details
  const [transactions, setTransactions] = useState([]); // Holds fetched transactions list
  const [accountFraudEvents, setAccountFraudEvents] = useState([]); // Holds specific fraud events for this account
  const [isLoading, setIsLoading] = useState(true); // Tracks if data is being loaded
  const [error, setError] = useState(null); // Stores any fetch errors

  // --- Network Graph Specific State & Refs ---
  const svgRef = useRef(null); // Ref for the SVG element for D3
  const graphWidth = 800; // Define graph dimensions
  const graphHeight = 600;
  // --- End Network Graph Specific State & Refs ---


  // useEffect hook: runs after render and when 'id' changes to fetch data
  useEffect(() => {
    if (!id) {
        setIsLoading(false);
        setError("No Account ID provided.");
        return;
    }
    const fetchAccountData = async () => {
      setIsLoading(true);
      setError(null);
      setAccountDetails(null);
      setTransactions([]);
      setAccountFraudEvents([]); // Reset all states

      try {
        // Fetch data from the backend endpoint that returns details, transactions, and events
        const response = await fetch(`${API_BASE_URL}/api/getAccount/${id}`);
        if (!response.ok) {
          if (response.status === 404) { throw new Error(`Account with ID ${id} not found.`); }
          else { throw new Error(`Failed to fetch account data: ${response.status} ${response.statusText}`); }
        }
        const data = await response.json();

        // Update all relevant states
        setAccountDetails(data.accountDetails || null);
        setTransactions(data.transactions || []);
        setAccountFraudEvents(data.fraudEvents || []); // Set the account-specific fraud events

        // Placeholder for flags array on accountDetails if needed by overview tab
        // This assumes the overview tab might show flags differently than the dedicated flags tab
        if (data.accountDetails && !data.accountDetails.flags) {
            data.accountDetails.flags = [];
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccountData();
  }, [id]); // Dependency array includes 'id' to refetch if the ID changes


  // --- Prepare data for rendering (Account Name, Score, Flags from User Doc) ---
  // Memoized calculations to avoid re-calculating on every render
  const accountName = useMemo(() =>
    accountDetails ? `${accountDetails.first_name || ''} ${accountDetails.last_name || ''}`.trim() || "Unknown" : "Unknown",
    [accountDetails]
  );
  const riskScore = useMemo(() =>
    accountDetails && accountDetails.score !== undefined ? accountDetails.score : 0,
    [accountDetails]
  );
  const gaugePercent = useMemo(() => riskScore / 10, [riskScore]);
  // 'flags' here represents the arrays stored on the User object (rapid, dormant etc containing txn IDs)
  // This might be used differently than the 'accountFraudEvents' state which holds logged event details
  const userDocumentFlags = useMemo(() => {
      if (!accountDetails) return {};
      return {
          rapid: accountDetails.rapid || [],
          frequency_transfer: accountDetails.frequency_transfer || [],
          frequency_purchase: accountDetails.frequency_purchase || [],
          dormant: accountDetails.dormant || [],
          circular: accountDetails.circular || []
      };
  }, [accountDetails]);


  // --- Network Graph Data Processing using useMemo ---
  const graphData = useMemo(() => {
    if (!id || !accountName || !transactions) return { nodes: [], links: [], nodeTypeColors: {} };
    const nodes = [{ id: id, name: accountName, type: 'Account', isCenter: true }];
    const links = [];
    const nodeIds = new Set([id]);
    const nodeTypeColors = {
        'Account': '#888', 'Deposit': '#FFFF00', 'Withdrawal': '#6495ED',
        'Transfer': '#32CD32', 'Purchase': '#4682B4', 'Credit Card': '#4682B4',
        'High Risk': '#000000', 'Unknown': '#D3D3D3'
    };

    transactions.forEach((txn, index) => {
      let partnerNodeId = null, partnerName = null, partnerType = 'Unknown';
      let linkType = txn.type, linkStyle = 'solid', linkColor = '#999';

      switch (txn.type) {
        case 'Deposit':
          partnerNodeId = `deposit_source_${txn.description || index}`;
          partnerName = txn.description || 'Deposit Source'; partnerType = 'Deposit'; break;
        case 'Withdrawal':
          partnerNodeId = `withdrawal_dest_${txn.description || index}`;
          partnerName = txn.description || 'Withdrawal Dest.'; partnerType = 'Withdrawal'; break;
        case 'Transfer Out':
          partnerNodeId = txn.payee_id; partnerName = `Account ${txn.payee_id?.slice(-6)}`; partnerType = 'Transfer'; break;
        case 'Transfer In':
          partnerNodeId = txn.payer_id; partnerName = `Account ${txn.payer_id?.slice(-6)}`; partnerType = 'Transfer'; break;
        case 'Purchase':
          partnerNodeId = txn.merchant_id; partnerName = `Merchant ${txn.merchant_id?.slice(-6)}`; partnerType = 'Purchase'; break;
        default:
          partnerNodeId = `unknown_${index}`; partnerName = txn.description || 'Unknown Entity'; break;
      }

      if (partnerNodeId && !nodeIds.has(partnerNodeId)) {
        nodeIds.add(partnerNodeId);
        nodes.push({ id: partnerNodeId, name: partnerName, type: partnerType, isCenter: false });
      }
      // Add link styling logic here if needed based on transaction flags (txn.flags)
      if (partnerNodeId) {
        links.push({ source: id, target: partnerNodeId, type: linkType, amount: txn.amount, style: linkStyle, color: linkColor });
      }
    });
    return { nodes, links, nodeTypeColors };
  }, [transactions, id, accountName]);


  // --- D3 Rendering using useEffect for Network Graph ---
  useEffect(() => {
    if (tab !== 'network' || !graphData || !svgRef.current) return;

    const { nodes, links, nodeTypeColors } = graphData;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render
    svg.attr('width', graphWidth).attr('height', graphHeight)
       .attr('viewBox', [-graphWidth / 2, -graphHeight / 2, graphWidth, graphHeight])
       .style('max-width', '100%').style('height', 'auto');

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(0, 0));

    const link = svg.append("g").attr("stroke-opacity", 0.6).selectAll("line")
      .data(links).join("line").attr("stroke-width", 2).attr("stroke", d => d.color)
      .style("stroke-dasharray", d => d.style === 'dashed' ? "5,5" : null);

    const node = svg.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5)
      .selectAll("g").data(nodes).join("g");

    node.append("circle").attr("r", d => d.isCenter ? 15 : 10)
        .attr("fill", d => nodeTypeColors[d.type] || nodeTypeColors['Unknown']);

    node.append("text").attr("x", d => d.isCenter ? 18 : 13).attr("dy", "0.35em")
        .text(d => d.name).style("font-size", "10px").attr("fill", "black")
        .clone(true).lower().attr("fill", "none").attr("stroke", "white").attr("stroke-width", 3);

    node.append("title").text(d => `${d.type}: ${d.name}\nID: ${d.id}`);
    link.append("title").text(d => `${d.type}: $${d.amount?.toFixed(2)}\n(${d.source.id} -> ${d.target.id})`);

    const drag = simulation => { /* ... drag functions ... */
        function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
        function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
        function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
        return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }
    node.call(drag(simulation));

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); }; // Cleanup simulation
  }, [graphData, tab]); // Rerun effect if graphData or tab changes


  // Helper function to format transaction partner details
  const formatPartner = (txn) => {
      switch (txn.type) {
          case 'Deposit': case 'Withdrawal': return txn.description || '-';
          case 'Transfer Out': return `To: ${txn.payee_id || 'Unknown'}`;
          case 'Transfer In': return `From: ${txn.payer_id || 'Unknown'}`;
          case 'Purchase': return `Merchant: ${txn.merchant_id || 'Unknown'}`;
          default: return txn.partner_id || txn.description || '-';
      }
  };

  // --- Conditional Rendering ---
  if (isLoading) return <div style={{ padding: "2rem" }}>Loading account data...</div>;
  if (error) return <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>;
  if (!accountDetails) return <div style={{ padding: "2rem" }}>Account data could not be loaded.</div>;

  // --- Main JSX Return ---
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Account Detail</h2>
      <h3>{accountName} - Account #{id}</h3>
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
        {["overview", "transaction", "network", "flags"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", backgroundColor: tab === t ? "#333" : "#eee", color: tab === t ? "#fff" : "#000", border: "none", borderRadius: "5px", cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: "2rem" }}>
        {/* Overview Tab */}
        {tab === "overview" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4>Flags Triggered</h4>
              {/* This currently shows flags based on the arrays in the User doc, not the event log */}
              {/* You might want to change this logic depending on what 'flags' should represent here */}
              {Object.entries(userDocumentFlags).filter(([key, value]) => value.length > 0).length > 0 ? (
                 <ul>
                    {Object.entries(userDocumentFlags).map(([key, value]) =>
                        value.length > 0 ? <li key={key} style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</li> : null
                    )}
                 </ul>
               ) : ( <p>No flags triggered.</p> )}
            </div>
            <div style={{ width: "300px" }}>
              <h2 style={{ textAlign: "center", marginBottom: "0.5rem", fontSize: "1.75rem" }}>Risk Score</h2>
              <GaugeChart id={`gauge-chart-${id}`} nrOfLevels={11} arcsLength={Array(11).fill(1 / 11)} colors={[ "#00FF00", "#33FF00", "#66FF00", "#99FF00", "#CCFF00", "#FFFF00", "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000" ]} percent={gaugePercent} textColor="#000" formatTextValue={() => `${riskScore}/10`} />
            </div>
          </div>
        )}

        {/* Transaction Tab */}
        {tab === "transaction" && (
           transactions.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f4f4f4" }}><tr><th style={cell}>Date</th><th style={cell}>Type</th><th style={cell}>To/From/Description</th><th style={cell}>Amount</th><th style={cell}>Status</th></tr></thead>
                <tbody>{transactions.map((txn) => (<tr key={txn._id || txn.transaction_id || Math.random()}><td style={cell}>{new Date(txn.transaction_date).toLocaleDateString()}</td><td style={cell}>{txn.type}</td><td style={cell}>{formatPartner(txn)}</td><td style={cell}>${txn.amount.toFixed(2)}</td><td style={cell}>{txn.status}</td></tr>))}</tbody>
              </table>
           ) : ( <p>No transaction data available.</p> )
        )}

        {/* Network Tab */}
        {tab === "network" && (
            <div>
                <svg ref={svgRef}></svg>
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={legendItemStyle(graphData.nodeTypeColors['Credit Card'] || '#4682B4')}>Credit Card</span>
                    <span style={legendItemStyle(graphData.nodeTypeColors['Transfer'] || '#32CD32')}>Transfer</span>
                    <span style={legendItemStyle(graphData.nodeTypeColors['Deposit'] || '#FFFF00')}>Deposit</span>
                    <span style={legendItemStyle(graphData.nodeTypeColors['Withdrawal'] || '#6495ED')}>Withdrawal</span>
                    <span style={legendItemStyle(graphData.nodeTypeColors['High Risk'] || '#000000')}>High Risk</span>
                    <span style={{ marginLeft: '20px' }}>Dashed = Round-tripping</span>
                    <span style={{ marginLeft: '20px' }}><span style={{color: 'red', fontWeight: 'bold'}}>Red line</span> = High Risk Path</span>
                </div>
            </div>
        )}

        {/* Flags Tab - Displays events from fraudEvents collection */}
        {tab === "flags" && (
            <div>
                <h4>Detected Fraud Alerts for this Account</h4>
                {/* Check the accountFraudEvents state */}
                {accountFraudEvents.length > 0 ? (
                    <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {accountFraudEvents.map(event => {
                             const { level: severity, color: severityColor } = getSeverity(event.flagType);
                             return (
                                <div key={event._id} style={{ padding: "1rem", border: `2px solid ${severityColor}`, borderRadius: "10px", backgroundColor: "#f9f9f9", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <strong style={{ fontSize: "16px" }}>{event.flagType || 'Unknown Alert'}</strong>
                                        <span style={{ backgroundColor: severityColor, color: "#fff", padding: "2px 8px", borderRadius: "6px", fontSize: "12px" }}>
                                            {severity.toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={{ margin: "5px 0 0 0", color: "#333" }}>{event.message || 'No details available.'}</p>
                                    <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#777" }}>
                                        <em>{formatTimeAgo(event.timestamp)}</em>
                                        {/* Optional: Link to transaction details if needed */}
                                    </p>
                                </div>
                             );
                        })}
                    </div>
                 ) : (
                    <p>No specific fraud alerts logged for this account.</p>
                 )
                }
            </div>
        )}
      </div>
    </div>
  );
};

// Cell style
const cell = { border: "1px solid #ccc", padding: "10px", textAlign: "left" };
// Legend item style helper
const legendItemStyle = (color) => ({ display: 'inline-block', padding: '4px 8px', backgroundColor: color, color: ['#FFFF00', '#D3D3D3'].includes(color) ? '#333' : '#fff', borderRadius: '4px', fontSize: '0.9em' });

// Exporting as AccountDetail
export default AccountDetail;
