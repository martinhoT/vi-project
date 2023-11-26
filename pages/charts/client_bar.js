function clientBarSetup(element, width, height, top, right, bottom, left, yLabel) {
    // Set up SVG dimensions
    const margin = { top: top, right: right, bottom: bottom, left: left };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(element)
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("transform", "translate(0," + h + ")")
        .classed("x-axis", true);
    svg.append("g")
        .classed("y-axis", true);
    svg.append("text")
        .classed("title", true);
    svg.append("text")
        .classed("title-y", true);

    // Color palette
    const color = d3.scaleOrdinal()
        .domain(["Customer", "Subscriber"])
        .range(["#FF7F0E", '#1F77B4']);

    // Add Y-axis title
    svg.select("text.title-y")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left)
        .attr("x", -h / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text(yLabel);

    return {
        svg: svg,
        w: w,
        h: h,
        margin: margin,
        color: color,
    }
}

// bar_data is expected to be an array of tuples where the first element is the client type and the second is the value
function clientBarUpdate(bar_data, chart_attributes) {
    const svg = chart_attributes.svg;
    const w = chart_attributes.w;
    const h = chart_attributes.h;
    const margin = chart_attributes.margin;
    const color = chart_attributes.color;

    const max_count = Math.max(...bar_data.map(d => d[1]));

    // Create rectangles based on the counts
    const bars = svg.selectAll("rect.data")
        .data(bar_data.sort((a, b) => d3.ascending(a[0], b[0])))
        .join("rect")
        .classed("data", true)
        .transition()
        .duration(1000)
        .attr("x", function (d, i) {
            return (i * (w / bar_data.length));
        })
        .attr("y", function (d) {
            return h - (h * d[1] / max_count);
        })
        .attr("width", (w / bar_data.length - 1))
        .attr("height", function (d) {
            return (h * d[1] / max_count);
        })
        .attr("fill", function (d) {
            return color(d[0]);
        });

    // Create x and y scales
    var xScale = d3.scaleBand()
        .domain(bar_data.map(d => d[0]))
        .range([0, w])
        .padding(0.1);

    var yScale = d3.scaleLinear()
        .domain([0, max_count])
        .range([h, 0]);

    // Create x and y axes
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    // Update x and y axes
    svg.select("g.x-axis")
        .transition()
        .call(xAxis);
    svg.select("g.y-axis")
        .transition()
        .call(yAxis);

}
