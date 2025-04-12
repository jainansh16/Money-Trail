import { useEffect, useRef } from "react";
import * as d3 from "d3";

const NetworkGraph = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 800;
    const height = 400;

    const nodes = [
      { id: "Ansh Jain", type: "central" },
      { id: "Chase Card", type: "credit", label: "$1200 Spending Spike" },
      { id: "842976", type: "transfer", label: "$200" },
      { id: "000", type: "transfer", label: "$400 Round-tripping" },
      { id: "Deposit", type: "deposit", label: "$3000" },
      { id: "CryptoXchange", type: "highRisk", label: "$1200" },
      { id: "TravelCo", type: "merchant", label: "$300 Spending Spike" },
    ];

    const links = [
      { source: "Chase Card", target: "Ansh Jain", type: "credit" },
      { source: "842976", target: "Ansh Jain", type: "transfer" },
      { source: "000", target: "Ansh Jain", type: "roundtripping" },
      { source: "Deposit", target: "Ansh Jain", type: "deposit" },
      { source: "Ansh Jain", target: "CryptoXchange", type: "highRisk" },
      { source: "Ansh Jain", target: "TravelCo", type: "merchant" },
    ];

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("stroke", d => d.type === "highRisk" ? "red" : "#666")
      .attr("stroke-dasharray", d => d.type === "roundtripping" ? "6,2" : "0");

    // Tooltip container
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
      .style("opacity", 0);

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 20)
      .attr("fill", d => {
        switch (d.type) {
          case "credit": return "#90caf9";       // Blue
          case "transfer": return "#aed581";     // Green
          case "deposit": return "#fff176";      // Yellow
          case "highRisk": return "#ef9a9a";     // Red
          case "merchant": return "#ce93d8";     // Purple
          default: return "#64b5f6";             // Central node
        }
      })
      .call(drag(simulation))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(`<strong>${getTooltip(d)}</strong>`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(150).style("opacity", 0);
      });

    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
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

    function getTooltip(d) {
      if (d.id === "Ansh Jain") return "Central Account";
      if (d.type === "credit") return `Credit Card: ${d.label}`;
      if (d.type === "transfer") return `Transfer: ${d.label}`;
      if (d.type === "deposit") return `Deposit: ${d.label}`;
      if (d.type === "highRisk") return `High-Risk Vendor: ${d.label}`;
      if (d.type === "merchant") return `Merchant Purchase: ${d.label}`;
      return d.label || d.id;
    }
  }, []);

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