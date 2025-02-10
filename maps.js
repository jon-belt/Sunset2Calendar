document.addEventListener("DOMContentLoaded", function () {
    const mapsButton = document.getElementById("maps-button");
    const locationInput = document.getElementById("location");

    mapsButton.addEventListener("click", function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    function successCallback(position) {
        const { latitude, longitude } = position.coords;
        const apiKey = "AIzaSyDWvJMeeHFlKJPGPZysC5H9d_znez3Z1Xc";
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

        fetch(geocodeUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    locationInput.value = data.results[0].formatted_address;
                } else {
                    alert("No address found.");
                }
            })
            .catch(error => console.error("Error fetching location:", error));
    }

    function errorCallback(error) {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location.");
    }
});
