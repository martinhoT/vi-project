$.get("bases/nav.html", function(data) {
    $("#nav").replaceWith(data);
});

// TODO: how do we manually script filters for each page? The HTML elements added this way aren't detected in JS
// $.get("bases/filters.html", function(data) {
//     $("#filters").replaceWith(data);
// });

