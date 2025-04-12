// MerchantDetail.jsx
import { useEffect, useRef } from "react";
import * as d3 from "d3";

const MerchantNetwork = ({ merchant }) => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 600;
    const height = 300;

    // Define per-merchant graph setups
    const merchantGraphs = {
      "ShellCorp LLC": {
        nodes: [
          { id: "ShellCorp LLC", type: "merchant" },
          { id: "User 1", type: "user", label: "$4000" },
          { id: "User 2", type: "user", label: "$2500" },
          { id: "User 3", type: "user", label: "$1500" },
        ],
        links: [
          { source: "User 1", target: "ShellCorp LLC", amount: 4000 },
          { source: "User 2", target: "ShellCorp LLC", amount: 2500 },
          { source: "User 3", target: "ShellCorp LLC", amount: 1500 },
        ],
      },
      "TravelCo": {
        nodes: [
          { id: "TravelCo", type: "merchant" },
          { id: "Acct A", type: "user", label: "$800" },
          { id: "Acct B", type: "user", label: "$600" },
          { id: "Acct C", type: "user", label: "$300" },
        ],
        links: [
          { source: "Acct A", target: "TravelCo", pattern: "spike" },
          { source: "Acct B", target: "TravelCo", pattern: "spike" },
          { source: "Acct C", target: "TravelCo", pattern: "normal" },
        ],
      },
      "CashDrop Express": {
        nodes: [
          { id: "CashDrop Express", type: "merchant" },
          { id: "X1", type: "user", label: "$2000" },
          { id: "X2", type: "user", label: "$1500" },
        ],
        links: [
          { source: "X1", target: "CashDrop Express", pattern: "round" },
          { source: "X2", target: "CashDrop Express", pattern: "round" },
        ],
      },
    };

    const { nodes, links } = merchantGraphs[merchant.name] || { nodes: [], links: [] };

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => {
        if (d.pattern === "round") return "#8e24aa";
        if (d.pattern === "spike") return "#fb8c00";
        return "#999";
      })
      .attr("stroke-dasharray", (d) => (d.pattern === "round" ? "4,2" : ""))
      .attr("stroke-width", 2);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 20)
      .attr("fill", (d) => (d.type === "merchant" ? "#90caf9" : "#c5e1a5"))
      .call(
        d3
          .drag()
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
          })
      );

    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => `${d.id}${d.label ? ` - ${d.label}` : ""}`)
      .attr("font-size", 12)
      .attr("dx", 25)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
  }, [merchant]);

  return (
    <div style={{ textAlign: "center" }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default MerchantNetwork;