function geoMapSetup(element, width, height, bay_area_geo, city_geos, zoom_callback) {
    const city_color = d3.scaleOrdinal(d3.schemeSet2);

    const svg = d3.select(element)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const {width: bWidth, height: bHeight} = svg.node().getBoundingClientRect();

    const projection = d3.geoMercator()
        .fitSize([bWidth, bHeight], bay_area_geo);

    const path = d3.geoPath()
        .projection(projection);

    const map = svg.append("g")
        .classed("geo", true);
    
    map
        .append("path")
        .classed("geo-map", true)
        .datum(bay_area_geo)
        .attr("d", path)
        .attr("fill", "lightgray") // this color has to be set or clicking on the map won't work
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    for (const city_geo of city_geos) {
        map
            .append("path")
            .classed("geo-map-city", true)
            .datum(city_geo)
            .attr("d", (d) => path(d.geo))
            .attr("fill", city_color(city_geo.city))
            .attr("stroke", d3.color(city_color(city_geo.city)).darker(1))
            .attr("stroke-width", 1);
    }

    // Setup zoom and pan
    const zoom = d3.zoom()
        .scaleExtent([1, 128])
        .on("zoom", zoomed);
    
    function zoomed(event) {
        const {transform} = event;
        map.attr("transform", `translate(${transform.x}, ${transform.y}) scale(${transform.k})`);
        map.selectAll("path.geo-map").attr("stroke-width", 1 / transform.k);
        map.selectAll("path.geo-map-city").attr("stroke-width", 1 / transform.k);

        zoom_callback(transform);
    }

    svg.call(zoom);

    return {
        map: map,
        projection: projection
    }
}