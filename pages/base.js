let currentURL = new URL(window.location);

$.get("bases/nav.html", function(data) {
    $("#nav").replaceWith(data);
    
    $("#nav").ready(function() {
        for (const loc of ["intro", "geo", "cs-details", "global-details", "insights", "about"]) {
            $("#nav-" + loc).on("click", function() {
                window.location.assign(loc.replace("-", "_") + ".html" + currentURL.search);
            });
        }
    })
});

// TODO: how do we manually script filters for each page? The HTML elements added this way aren't detected in JS
// $.get("bases/filters.html", function(data) {
//     $("#filters").replaceWith(data);
// });

