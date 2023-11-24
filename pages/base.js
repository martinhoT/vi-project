// Set filters' default values and get the filters' values if passed on the URL
// The undefined attributes will be set when the data is obtained and extents are extracted
// Whenever the filters change, dispatch the custom event 'data-update' with the appropriate details.
// D3 code should listen for these events
const filter = {
    cityTraversal: 1,
    clientType: 1,
    timeStart: undefined,
    timeEnd: undefined,
    selectedCity: undefined,
    selectedStation: undefined,

    selectStation: function(station) {
        this.selectedStation = station;
        this.selectedCity = undefined;
    },
    selectCity: function(city) {
        this.selectedCity = city;
        this.selectedStation = undefined;
    }
}

// Save a reference to the current URL
const currentURL = new URL(window.location);

// Initialize the navigation bar
$.get("bases/nav.html", function(data) {
    $("#nav").replaceWith(data);
    
    $("#nav").ready(function() {
        for (const loc of ["intro", "geo", "cs-details", "global-details", "insights", "about"]) {
            let element = $("#nav-" + loc);
            if (element === null)
                continue;

            if (currentURL.pathname == `/pages/${loc.replace("-", "_")}.html`)
                element.addClass("active");
            
            else {
                element.on("click", function() {
                    if (filter.timeStart !== undefined)
                        currentURL.searchParams.set("timeStart", filter.timeStart.getTime());
                    if (filter.timeEnd !== undefined)
                        currentURL.searchParams.set("timeEnd", filter.timeEnd.getTime());
                    if (filter.selectedCity !== undefined)
                        currentURL.searchParams.set("selectedCity", filter.selectedCity);
                    else
                        currentURL.searchParams.delete("selectedCity");
                    if (filter.selectedStation !== undefined)
                        currentURL.searchParams.set("selectedStation", filter.selectedStation);
                    else
                        currentURL.searchParams.delete("selectedStation");
                    currentURL.searchParams.set("cityTraversal", filter.cityTraversal);
                    currentURL.searchParams.set("clientType", filter.clientType);
                    window.location.assign(loc.replace("-", "_") + ".html" + currentURL.search);
                });
            }
        }
    })
});

for (const [key, value] of currentURL.searchParams) {
    let parsedValue = null;

    // Number
    if (["cityTraversal", "clientType"].includes(key))
        parsedValue = +value;

    // Date
    else if (["timeStart", "timeEnd"].includes(key))
        parsedValue = new Date(+value);

    // City/Station selection
    else if (["selectedCity", "selectedStation"].includes(key))
        parsedValue = value;

    if (parsedValue != null)
        filter[key] = parsedValue
}

$.get("bases/filters.html", function(data) {
    $("#filters").replaceWith(data);

    // Initialize the slider-3-toggle filters since they don't depend on the data
    $("#filters").ready(function() {
        $("#filters").show();

        for (let filter of ["#filter-city-traversal", "#filter-client-type"]) {
            for (let i = 0; i < 3; i++) {
                d3.select(filter).select(".slider-3-toggle-clickable-area-" + i).on("click", function() {
                    changeSlider3ToggleState(filter, i);
                });
            }
        }
    });
});

const changeSlider3ToggleState = function(filterId, state) {
    let left_position = 5 + 35 * state;
    d3.select(filterId).select(".slider-3-toggle-circle")
        .transition()
        .duration(1000)
        .ease(d3.easeExp)
        .style("left", left_position + "px");

    // Change the labels' color
    const labels = [".filter-label-left", ".filter-label-right"];
    const colors = [
        state <= 1 ? "#0CA789" : "#000000",
        state >= 1 ? "#0CA789" : "#000000",
    ];

    for (const i in labels)
        d3.select(filterId).select(labels[i])
            .transition()
            .duration(1000)
            .ease(d3.easeExp)
            .style("color", colors[i])
    
    let filterElem = d3.select(filterId);
    let changed = filterElem.property("value") != state;
    filterElem.property("value", state);
    if (changed) {
        if (filterId == "#filter-city-traversal") {
            filter.cityTraversal = state;
            console.log("Filter by city traversal");
        }
        else if (filterId == "#filter-client-type") {
            filter.clientType = state;
            console.log("Filter by client type");
        }

        document.getElementById("content").dispatchEvent(new Event('data-update'));
    }
}

// TODO: on brush single-click it disappears, let it stay?
// TODO: add play button? seems like it would be useful for Vis1
function addTimeSlider(initialLeft, initialRight, domain) {
    const timeSliderWidth = 200
    const timeSliderHeight = 20
    const timeSliderLabelWidth = 100

    let timeFilterSvg = d3.select('#filter-time').append('svg')
        .attr('width', timeSliderWidth + timeSliderLabelWidth * 2)
        .attr('height', timeSliderHeight)

    const timeSlider = timeFilterSvg.append('g')

    let x = d3.scaleLinear()
        .domain(domain)
        .range([0, timeSliderWidth])

    timeSlider.selectAll('text')
        .data([[0, 15], [timeSliderWidth + timeSliderLabelWidth, 15]])
        .join('text')
            .text('?')
            .attr('x', (d) => d[0] + 4) // add some padding
            .attr('y', (d) => d[1])
            .attr('text-align', (d, i) => i == 0 ? 'end' : 'start')
            
    var brush = d3.brushX()
        .extent([[0, 0], [timeSliderWidth, timeSliderHeight]])
        .on('brush', brushed)
        .on('end', brushEnded)
            
    
    var brushGroup = timeFilterSvg.append('g')
        .attr('class', 'brush')
        .attr('transform', 'translate(' + timeSliderLabelWidth + ',' + 0 + ')')
        .call(brush)
    
    brushGroup.select('.overlay')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
    
    brushGroup.selectAll('.handle')
        .attr('fill', 'gray')
    
    function brushed(event) {
        // Alternative: let selection = event.selection
        let selection = d3.brushSelection(this)
        if (selection == null)
            return

        let range = selection.map(x.invert)
        
        timeSlider.selectAll("text")
            .text(function(d, i) {
                let date = new Date(range[i]);
                let formatDaysMonths = (date) => (((date < 10) ? "0" : "") + date)  // add a leading zero to keep the same spacing
                return `${formatDaysMonths(date.getUTCDate())}/${formatDaysMonths(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`
            })
        
        // NOTE: comment if update every brush action is too heavy, and use brushEnded instead
        // callback(range[0], range[1])
    }

    function brushEnded() {
        let selection = d3.brushSelection(this);
        if (selection == null)
            return;

        let range = selection.map(x.invert);

        if (filter.timeStart.getTime() == range[0] && filter.timeEnd.getTime() == range[1])
            return;

        filter.timeStart = new Date(range[0]);
        filter.timeEnd = new Date(range[1]);
        console.log("Filter by time");

        document.getElementById("content").dispatchEvent(new Event('data-update'));
    }

    brush.move(brushGroup, [initialLeft, initialRight].map(x));

    let advanceMonthPlayInterval = undefined;

    function advanceMonth() {
        let selection = d3.brushSelection(brushGroup.node());
        if (selection == null)
            return;

        let range = selection.map(x.invert);

        const month = 30 * 24 * 60 * 60 * 1000;

        if (range[1] == x.domain()[1]) {
            d3.select("#filter-time-play")
                .property("value", "stopped")
                .classed("active", false);
            
            clearInterval(advanceMonthPlayInterval);
            advanceMonthPlayInterval = undefined;
    
            return;
        }

        if (range[1] + month > x.domain()[1]) {
            range[0] = x.domain()[1] - range[1] + range[0];
            range[1] = x.domain()[1];
        }
        else {
            range[0] += month;
            range[1] += month;
        }

        brush.move(brushGroup, range.map(x));
    }

    d3.select("#filter-time-play").on("click", function() {
        const current_state = d3.select(this).property("value");
        if (current_state == "playing") {
            d3.select(this)
                .property("value", "stopped")
                .classed("active", false);

            clearInterval(advanceMonthPlayInterval);
        }
        else if (current_state == "stopped") {
            d3.select(this)
                .property("value", "playing")
                .classed("active", true);
    
            // After 2 seconds, advance 1 trimester
            advanceMonthPlayInterval = setInterval(advanceMonth, 1500);
        }
    })

    return brush
}

// Setup the 3 filters present in most visualizations, requiring metadata and dependent lists.
// The metadata is used to set the initial values of the filters.
// The dependent lists are used to highlight the graphs that are affected by the filter.
// This function should be manually called
function setupFilters(metadata,
        filter_city_traversal_dependents = [],
        filter_client_type_dependents = [],
        filter_time_dependents = [],
    ) {
    const dateParser = d3.utcParse("%Y-%-m-%-d");
    let dateExtent = [dateParser(metadata["date_min"]), dateParser(metadata["date_max"])];
    
    if (filter.timeStart == null)
        filter.timeStart = dateExtent[0];
    if (filter.timeEnd == null)
        filter.timeEnd = dateExtent[1];

    // Highlight graphs that are affected by the filter
    function highlight_start(elements) {
        for (let element of elements) {
            d3.select(element)
                .transition()
                .duration(500)
                .style("box-shadow", "0px 0px 25px var(--filter-accent)");
        }
    }
    function highlight_stop(elements) {
        for (let element of elements) {
            d3.select(element)
                .transition()
                .duration(500)
                .style("box-shadow", "0px 0px 0px var(--filter-accent)");
        }
    }
    d3.select("#filter-city-traversal").on("mouseenter", function() {
        highlight_start(filter_city_traversal_dependents);
    });
    d3.select("#filter-city-traversal").on("mouseleave", function() {
        highlight_stop(filter_city_traversal_dependents);
    });
    d3.select("#filter-client-type").on("mouseenter", function() {
        highlight_start(filter_client_type_dependents);
    });
    d3.select("#filter-client-type").on("mouseleave", function() {
        highlight_stop(filter_client_type_dependents);
    });
    d3.select("#filter-time").on("mouseenter", function() {
        highlight_start(filter_time_dependents);
    });
    d3.select("#filter-time").on("mouseleave", function() {
        highlight_stop(filter_time_dependents);
    });

    console.log("Preparing filters...");
    // Initial filter state
    changeSlider3ToggleState("#filter-city-traversal", filter.cityTraversal)
    changeSlider3ToggleState("#filter-client-type", filter.clientType)

    addTimeSlider(filter.timeStart, filter.timeEnd, dateExtent);
    console.log("Filters prepared");
}