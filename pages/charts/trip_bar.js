// 'att' is an object with keys:
//  width: SVG width
//  height: SVG height
//  margin: SVG margins (top, right, bottom, left)
//  labels: labels for the X axis
//  logarithmic: whether the Y axis is logarithmic, boolean
//  width_scale: how much to scale the chart horizontally. Values greater than 1 will allow horizontal scrolling
//  x_label: label for the X axis
function tripBarSetup(element, att) {
    // Set the dimensions and margins of the graph
    const w = att.width - att.margin.left - att.margin.right;
    const totalWidth = att.width_scale * w;
    const h = att.height - att.margin.top - att.margin.bottom;

    const graph = d3.select(element)

    // Append the tooltip div to the graph
    const tooltip = graph
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Append the svg object to the respective section
    const outer_svg = graph.append("svg")
        .classed("outer-svg", true)
        .attr("width", w + att.margin.left + att.margin.right + 150) // add some more space for the legend
        .attr("height", h + att.margin.top + att.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + att.margin.left + "," + att.margin.top + ")");

    // Create a scrollable div which will contain the chart and X axis
    const scrollable_div = graph.append("div")
            .style("overflow-x", "scroll")
            .style("-webkit-overflow-scrolling", "touch")
            .style("position", "relative")
            .style("z-index", 1)
            .style("width", w + "px")
            .style("height", (h + att.margin.bottom + att.margin.top) + "px")
            .style("left", "60px")
            .style("top", (-h - att.margin.bottom - att.margin.top) + "px");

    const scrollable_div_svg = scrollable_div.append("svg")
            .classed("scrollable-svg", true)
            .attr("width", totalWidth)
            .attr("height", h + att.margin.bottom + att.margin.top)
            .style("display", "block");

    scrollable_div_svg.append("g")
        .classed("x-axis", true)
        .attr("transform", "translate(0," + (h + att.margin.top) + ")");
    outer_svg.append("g")
        .classed("y-axis", true);
    scrollable_div_svg.append("g")
        .classed("g-out", true);
    scrollable_div_svg.append("g")
        .classed("g-in", true);

    // Create X scale (necessary for the sorting methods)
    const x_max_length = 32;
    function truncateLabel(label) {
        return (label.length > x_max_length) ? label.slice(0, x_max_length - 3) + "..." : label;
    }
    const x = d3.scaleBand()
        .domain(att.labels.map(truncateLabel))
        .range([0, totalWidth])
        .padding([0.2]);

    function sortContent(sort_type, sort_ascending, stacked = false) {
        let sort_function = undefined;

        switch (sort_type) {
            case "alphabetic":
                sort_function = (a, b) => sort_ascending ? d3.ascending(a.label, b.label) : d3.descending(a.label, b.label)
                break;
            
            case "total_trips":
                sort_function = (a, b) => sort_ascending ? d3.ascending(a.value_in + a.value_out, b.value_in + b.value_out) : d3.descending(a.value_in + a.value_out, b.value_in + b.value_out);
                break;
            
            case "incoming_trips":
                sort_function = (a, b) => sort_ascending ? d3.ascending(a.value_in, b.value_in) : d3.descending(a.value_in, b.value_in);
                break;

            case "outgoing_trips":
                sort_function = (a, b) => sort_ascending ? d3.ascending(a.value_out, b.value_out) : d3.descending(a.value_out, b.value_out);
                break;
            
            default:
                console.log("ERROR: invalid sort type for traffic visualization");
                return;
        }

        sorted_in = scrollable_div_svg
            .selectAll("g.g-in")
            .selectAll("rect")
            .sort(sort_function);
        
        sorted_out = scrollable_div_svg
            .selectAll("g.g-out")
            .selectAll("rect")
            .sort(sort_function);

        // It doesn't matter whether we use sorted_in or sorted_out
        labels_sorted = sorted_out.data().map((d) => truncateLabel(d.label));

        x.domain(labels_sorted)
        scrollable_div_svg.select("g.x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));

        sorted_in
            .transition()
            .attr("x", (d) => x(truncateLabel(d.label)) + ((stacked) ? 0 : x.bandwidth() / 2));
        sorted_out
            .transition()
            .attr("x", (d) => x(truncateLabel(d.label)));
    }

    // Color palette
    const color = d3.scaleOrdinal()
            .domain(["start", "end"])
            .range(['#e41a1c', '#377eb8']);

    // Add Legend
    const legend_group = outer_svg.append("g")
        .attr("transform", "translate(" + (w + att.margin.left + att.margin.right) + "," + 20 + ")");
    
    legend_group.append("rect")
        .attr("fill", "white")
        .attr("width", 120)
        .attr("height", 50)
        .attr("z-index", 25);

    const legend = legend_group
            .selectAll("g")
            .data(color.domain().slice().reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d) { return d === "start" ? "Outgoing" : "Incoming"; });

    // Add X axis label
    outer_svg.append("text")
        .attr("transform", "translate(" + (w / 2) + " ," + (h + att.margin.top) + ")")
        .attr("y", 220 - att.margin.left)
        .style("text-anchor", "middle")
        .text(att.x_label);

    // Add Y axis label
    outer_svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - att.margin.left)
        .attr("x", 0 - h / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of Trips" + ((att.logarithmic) ? " (log scale)" : ""));

    // Default scroll position
    scrollable_div.node().scrollBy(0, 0);

    return {
        graph: graph,
        w: w,
        h: h,
        margin: att.margin,
        color: color,
        x: x,
        logarithmic: att.logarithmic,
        tooltip: tooltip,
        
        sortContent: sortContent,
        truncateLabel: truncateLabel,
    }
}

// bar_data is expected to be an array of objects {label: ..., value_in: ..., value_out: ...}
function tripBarUpdate(bar_data, chart_attributes, sort_type, sort_ascending, stacked) {
    const graph = chart_attributes.graph;
    const w = chart_attributes.w;
    const h = chart_attributes.h;
    const margin = chart_attributes.margin;
    const color = chart_attributes.color;
    const x = chart_attributes.x;
    const logarithmic = chart_attributes.logarithmic;
    const tooltip = chart_attributes.tooltip;
    const sortContent = chart_attributes.sortContent;
    const truncateLabel = chart_attributes.truncateLabel;

    const max_count = (stacked)
        ? d3.max(bar_data, function(d) { return d.value_in + d.value_out; })
        : d3.max(bar_data, function(d) { return Math.max(d.value_in, d.value_out); });

    const scrollable_div_svg = graph.select("svg.scrollable-svg");
    const outer_svg = graph.select("svg.outer-svg");

    // Update X axis
    scrollable_div_svg.select("g.x-axis")
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll("text")
            .attr("transform", "translate(-15,5), rotate(-90)")
            .style("text-anchor", "end");

    // Update Y axis
    const y = (logarithmic)
        ? d3.scaleLog()
            .base(10) // You can adjust the base as needed
            .domain([1, 2 * max_count])
            .range([h, 0])
        : d3.scaleLinear()
            .domain([0, max_count])
            .range([h, 0]);

    outer_svg.select("g.y-axis")
        .transition()
        .call(d3.axisLeft(y));

    // Show the bars for outgoing trips
    scrollable_div_svg.select("g.g-out")
        .selectAll("rect")
        .data(bar_data)
        .join("rect")
        .attr("x", (d) => x(truncateLabel(d.label)))
        .attr("y", (d) => {
            return (d.value_out + ((stacked) ? d.value_in : 0) > 0)
                ? y(d.value_out + ((stacked) ? d.value_in : 0)) + margin.top
                : 0; // the scale may be logarithmic, so we can't have 0 values
        })
        .attr("width", x.bandwidth() / (2 - stacked))  // evil
        .attr("height", (d) => {
            return (d.value_out + ((stacked) ? d.value_in : 0) > 0)
                ? h - y(d.value_out + ((stacked) ? d.value_in : 0))
                : 0; // don't render bars at all if no value is present
        })
        .attr("fill", color("start"))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.label + "<br>Outgoing Trips: " + d.value_out)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Show the bars for incoming trips
    scrollable_div_svg.select("g.g-in")
        .selectAll("rect")
        .data(bar_data)
        .join("rect")
        .attr("x", (d) => x(truncateLabel(d.label)) + ((stacked) ? 0 : x.bandwidth() / 2))
        .attr("y", (d) => {
            return (d.value_in > 0)
                ? y(d.value_in) + margin.top
                : 0;
        })
        .attr("width", x.bandwidth() / (2 - stacked))
        .attr("height", (d) => {
            return (d.value_in > 0)
                ? h - y(d.value_in)
                : 0;
        })
        .attr("fill", color("end"))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.label + "<br>Incoming Trips: " + d.value_in)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Default sort
    sortContent(sort_type, sort_ascending, stacked);
}