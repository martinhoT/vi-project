function clientBarSetup(element, width, height, top, right, bottom, left) {
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

    // Add legend
    const legend = svg.selectAll(".legend")
        .data(["Customer", "Subscriber"])
        .join("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("x", w - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", (d) => color(d));

    legend.append("text")
        .attr("x", w - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text((d) => d);
    
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
    let svg = chart_attributes.svg;
    let w = chart_attributes.w;
    let h = chart_attributes.h;
    let margin = chart_attributes.margin;
    let color = chart_attributes.color;

    let maxCount = Math.max(...bar_data.map(d => d[1]));

    // Create rectangles based on the counts
    svg.selectAll("rect.data")
        .data(bar_data)
        .join("rect")
        .classed("data", true)
        .attr("x", function (d, i) {
            return (i * (w / bar_data.length));
        })  
        .attr("y", function (d) {
            return h - (h * d[1] / maxCount);
        })
        .attr("width", (w / bar_data.length - 1))
        .attr("height", function (d) {
            return (h * d[1] / maxCount);
        })
        .attr("fill", function (d) {
            return color(d[0]);
        });

    // Create x and y scales
    var xScale = d3.scaleBand()
        .domain(d3.range(bar_data.length))
        .range([0, w])
        .padding(0.1);

    var yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([h, 0]);

    // Create x and y axes
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    // Append x and y axes to the SVG
    svg.select("g.x-axis").call(xAxis);
    svg.select("g.y-axis").call(yAxis);

    // Add title to the chart
    svg.select("text.title")
        .attr("x", w / 2)
        .attr("y", -margin.top / 2.3)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Subscription Types Occurrences");

    // Add Y-axis title
    svg.select("text.title-y")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -h / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Count");
}