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
          { id: "TravelCo", type: "merchant", label: "$300 Spending Spike" },
        ],
        links: [
          { source: "Chase Card", target: "Ansh Jain", type: "credit" },
          { source: "842976", target: "Ansh Jain", type: "transfer" },
          { source: "000", target: "Ansh Jain", type: "roundtripping" },
          { source: "Deposit", target: "Ansh Jain", type: "deposit" },
          { source: "Ansh Jain", target: "CryptoXchange", type: "highRisk" },
          { source: "Ansh Jain", target: "TravelCo", type: "merchant" },
        ]
      },
      "832541": {
        nodes: [
          { id: "Mary Johnson", type: "central" },
          { id: "CryptoX", type: "merchant", label: "$900" },
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
          { id: "ShellCorp", type: "merchant", label: "$1800" },
        ],
        links: [
          { source: "#234456", target: "David Black", type: "transfer" },
          { source: "ShellCorp", target: "David Black", type: "merchant" },
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

    const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 20)
      .attr("fill", d => {
        switch (d.type) {
          case "credit": return "#90caf9";
          case "transfer": return "#aed581";
          case "deposit": return "#fff176";
          case "highRisk": return "#ef9a9a";
          case "merchant": return "#ce93d8";
          default: return "#64b5f6";
        }
      })
      .call(drag(simulation));

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

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

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
      <div style={{ fontSize: "13px", marginTop: "15px" }}>
        <strong>Legend:</strong><br />
        ● Transfer &nbsp;&nbsp;
        <span style={{ backgroundColor: "#90caf9", padding: "2px 6px", borderRadius: "4px" }}>Credit Card</span> &nbsp;&nbsp;
        <span style={{ backgroundColor: "#aed581", padding: "2px 6px", borderRadius: "4px" }}>Transfer</span> &nbsp;&nbsp;
        <span style={{ backgroundColor: "#fff176", padding: "2px 6px", borderRadius: "4px" }}>Deposit</span> &nbsp;&nbsp;
        <span style={{ backgroundColor: "#ce93d8", padding: "2px 6px", borderRadius: "4px" }}>Merchant</span><br />
        <span style={{ borderBottom: "2px dashed #666" }}>Dashed</span> = Round-tripping &nbsp;&nbsp;
        <span style={{ color: "red", fontWeight: "bold" }}>Red</span> = High Risk
      </div>
    </div>
  );
};

export default NetworkGraph;