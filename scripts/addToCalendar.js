document.getElementById('add-event').addEventListener('click', addEvent);

function getDateRange(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let dateArray = [];

    //ensure start date is before or equal to end date
    if (start > end) {
        [start, end] = [end, start];
    }

    while (start <= end) {
        dateArray.push(start.toISOString().split('T')[0]); //YYYY-MM-DD
        start.setDate(start.getDate() + 1);
    }

    return dateArray;
}

function getEventData(event) {
    const buttonId = event.target.id;
    //I know this is not the most optimum way to do this, but oh well

    const locationText = document.getElementById('current-location').textContent;

    //error checking for current location, as it must be not null
    if (locationText === "Current Location") {
        alert("Please select a location before adding to calendar");
        return;
    }

    //error checking for date selection, as it must be not null
    const startDate = document.getElementById('date-range-start').value;
    const endDate = document.getElementById('date-range-end').value;
    //console.log(`Start Date: ${startDate}, End Date: ${endDate}`);    //debugging
    if (startDate && endDate) {
        console.log(`Start Date: ${startDate}, End Date: ${endDate}`);
    } else {
        alert("Please select both start and end dates.");
    }

    //Extract coordinates using a regex
    const coordinatesRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match = locationText.match(coordinatesRegex);

    if (match) {
        const latitude = match[1];
        const longitude = match[2];
        //console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);    //debugging

        //Find sunset and sunrise times for date range
        const dateRange = getDateRange(startDate, endDate);
        //console.log(`Date Range: ${dateRange}`);  //debugging

        for (let i = 0; i < dateRange.length; i++) {
            const date = dateRange[i];
            const url = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${date}&formatted=0`

            fetch(url)
            .then(response => response.json())
            .then(data => {
                const sunsetTime = data.results.sunset;
                const sunriseTime = data.results.sunrise;

                console.log('Date:', date, ', Sunset: ', sunsetTime, ', Sunrise:', sunriseTime);

                ////Add to Google Calendar

                //Check if a sunset or sunrise needs adding
                const toggle = document.getElementById("changeButton");
                if (toggle.classList.contains("toggled")) {
                    //Add sunrise event
                } else {
                    //Add sunset event
                }
            })
            .catch(error => console.error('Error:', error))
        }
    }
    else {
        //console.error("Coordinates not found in the location text.");   //debugging
    }
};