import { useEffect, useRef } from "react";
import * as d3 from "d3";

const NetworkGraph = ({ accountId }) => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 800;
    const height = 400;

    const graphData = {
      "123456": {
        nodes: [
          { id: "John Doe", type: "central" },
          { id: "ATM", type: "withdrawal", label: "$400" },
          { id: "Employer", type: "deposit", label: "$2500" },
        ],
        links: [
          { source: "ATM", target: "John Doe", type: "withdrawal" },
          { source: "Employer", target: "John Doe", type: "deposit" },
        ]
      },
      "789012": {
        nodes: [
          { id: "Ansh Jain", type: "central" },
          { id: "Chase Card", type: "credit", label: "$1200 Spending Spike" },
          { id: "842976", type: "transfer", label: "$200" },
          { id: "000", type: "transfer", label: "$400 Round-tripping" },
          { id: "Deposit", type: "deposit", label: "$3000" },
          { id: "CryptoXchange", type: "highRisk", label: "$1200" },
          { id: "TravelCo", type: "withdrawal", label: "$300 Spending Spike" },
        ],
        links: [
          { source: "Chase Card", target: "Ansh Jain", type: "credit" },
          { source: "842976", target: "Ansh Jain", type: "transfer" },
          { source: "000", target: "Ansh Jain", type: "roundtripping" },
          { source: "Deposit", target: "Ansh Jain", type: "deposit" },
          { source: "Ansh Jain", target: "CryptoXchange", type: "highRisk" },
          { source: "Ansh Jain", target: "TravelCo", type: "withdrawal" },
        ]
      },
      "832541": {
        nodes: [
          { id: "Mary Johnson", type: "central" },
          { id: "CryptoX", type: "withdrawal", label: "$900" },
          { id: "External Source", type: "deposit", label: "$1500" },
        ],
        links: [
          { source: "CryptoX", target: "Mary Johnson", type: "highRisk" },
          { source: "External Source", target: "Mary Johnson", type: "deposit" },
        ]
      },
      "763215": {
        nodes: [
          { id: "David Black", type: "central" },
          { id: "#234456", type: "transfer", label: "$600" },
          { id: "ShellCorp", type: "withdrawal", label: "$1800" },
        ],
        links: [
          { source: "#234456", target: "David Black", type: "transfer" },
          { source: "ShellCorp", target: "David Black", type: "withdrawal" },
        ]
      },
      "987654": {
        nodes: [
          { id: "Susan White", type: "central" },
          { id: "#989823", type: "transfer", label: "$1000 Round-tripping" },
          { id: "External Source", type: "deposit", label: "$2200" },
        ],
        links: [
          { source: "#989823", target: "Susan White", type: "roundtripping" },
          { source: "External Source", target: "Susan White", type: "deposit" },
        ]
      },
    };

    const data = graphData[accountId] || { nodes: [], links: [] };

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("stroke", d => d.type === "highRisk" ? "red" : "#666")
      .attr("stroke-dasharray", d => d.type === "roundtripping" ? "6,2" : "0");

    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(drag(simulation));

    // Draw shapes
    nodeGroup.append(d => d.type === "highRisk" ? document.createElementNS(d3.namespaces.svg, "rect") : document.createElementNS(d3.namespaces.svg, "circle"))
      .attr("r", d => d.type !== "highRisk" ? 20 : null)
      .attr("width", d => d.type === "highRisk" ? 28 : null)
      .attr("height", d => d.type === "highRisk" ? 28 : null)
      .attr("x", d => d.type === "highRisk" ? -14 : null)
      .attr("y", d => d.type === "highRisk" ? -14 : null)
      .attr("cx", d => d.type !== "highRisk" ? 0 : null)
      .attr("cy", d => d.type !== "highRisk" ? 0 : null)
      .attr("fill", d => {
        switch (d.type) {
          case "credit": return "#0072B2";       // Blue
          case "transfer": return "#009E73";     // Green
          case "deposit": return "#F0E442";      // Yellow
          case "withdrawal": return "#56B4E9";   // Sky Blue
          case "highRisk": return "#000000";     // Black square
          default: return "#999999";             // Central/neutral
        }
      });

    const label = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text(d => `${d.id}${d.label ? " - " + d.label : ""}`)
      .attr("font-size", 12)
      .attr("dx", d => d.id === "Chase Card" ? -25 : 25)
      .attr("text-anchor", d => d.id === "Chase Card" ? "end" : "start")
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function drag(simulation) {
      return d3.drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
    }
  }, [accountId]);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <svg ref={svgRef}></svg>
      <div style={{ fontSize: "15px", marginTop: "20px", lineHeight: "1.8" }}>
        <strong style={{ fontSize: "16px" }}>Legend:</strong><br />
        <span style={{ backgroundColor: "#0072B2", color: "#fff", padding: "4px 8px", borderRadius: "4px" }}>Credit Card</span> &nbsp;&nbsp;
        <span style={{ backgroundColor: "#009E73", color: "#fff", padding: "4px 8px", borderRadius: "4px" }}>Transfer</span> &nbsp;&nbsp;
        <span style={{ backgroundColor: "#F0E442", padding: "4px 8px", borderRadius: "4px" }}>Deposit</span> &nbsp;&nbsp;
        <span style={{ backgroundColor: "#56B4E9", color: "#000", padding: "4px 8px", borderRadius: "4px" }}>Withdrawal</span> &nbsp;&nbsp;
        <span style={{ backgroundColor: "#000", color: "#fff", padding: "4px 8px", borderRadius: "4px" }}>High Risk</span><br />
        <span style={{ borderBottom: "2px dashed #666" }}>Dashed</span> = Round-tripping &nbsp;&nbsp;
        <span style={{ color: "red", fontWeight: "bold" }}>Red line</span> = High Risk Path
      </div>

    </div>
  );
};

export default NetworkGraph;