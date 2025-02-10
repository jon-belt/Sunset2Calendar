document.getElementById("maps-button").addEventListener("click", function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const response = await fetch(`http://localhost:3000/get-location?lat=${latitude}&lng=${longitude}`);
                const data = await response.json();

                if (data.results.length > 0) {
                    document.getElementById("location").value = data.results[0].formatted_address;
                } else {
                    alert("Location not found!");
                }
            } catch (error) {
                console.error("Error fetching location:", error);
            }
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});
