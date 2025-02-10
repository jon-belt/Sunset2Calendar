const x = document.getElementById("current-location");

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('maps-button').addEventListener('click', getLocation);
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    console.log("Latitude: " + position.coords.latitude + 
    " Longitude: " + position.coords.longitude);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${apiKey}`;

    $.get(url, function(data) {
        console.log(data);
        if (data.results && data.results.length > 0) {
            x.innerHTML = data.results[11].formatted_address;
        } else {
            console.error("No address found for the given coordinates.");
        }
    }).fail(function() {
        console.error("Failed to fetch the address from the API.");
    });
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.error("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.error("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.error("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.error("An unknown error occurred.");
            break;
    }
}
