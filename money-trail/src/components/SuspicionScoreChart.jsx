import { useEffect, useRef } from "react";
import * as d3 from "d3";

const SuspicionScoreChart = () => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear existing

    const width = svgRef.current.clientWidth;
    const height = 100;
    const margin = { top: 10, right: 20, bottom: 30, left: 20 };

    const svgEl = svg
      .attr("width", width)
      .attr("height", height + margin.top + margin.bottom);

    const chart = svgEl.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear().domain([1, 10]).range([0, width - margin.left - margin.right]);

    // Gradient
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "risk-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#b9fbc0"); // green
    gradient.append("stop").attr("offset", "50%").attr("stop-color", "#fcd5ce"); // peach
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ffadad"); // red

    // Main bar
    chart
      .append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", width - margin.left - margin.right)
      .attr("height", 30)
      .style("fill", "url(#risk-gradient)")
      .style("stroke", "black");

    // Axis
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d"));
    chart
      .append("g")
      .attr("transform", `translate(0, ${20 + 30})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "12px");

    // Threshold Labels
    chart
      .append("text")
      .attr("x", xScale(2))
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Low (1–3)");

    chart
      .append("text")
      .attr("x", xScale(5))
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Medium (4–6)");

    chart
      .append("text")
      .attr("x", xScale(8.5))
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("High (7–10)");
  }, []);

  return <svg ref={svgRef} style={{ width: "100%" }} />;
};

export default SuspicionScoreChart;