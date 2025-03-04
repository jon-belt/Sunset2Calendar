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

function parseSunsetTime(date, time) {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes, seconds] = timePart.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }

    const dateTimeString = `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return new Date(dateTimeString);
}

function addCalEvent(token, locationText, startDate, endDate, sendResponse) {
    console.log("Adding Event..."); // Debugging
    console.log(`Location: ${locationText}`); // Debugging

    const coordinatesRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match = locationText.match(coordinatesRegex);

    if (match) {
        const latitude = match[1];
        const longitude = match[2];
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

        const dateRange = getDateRange(startDate, endDate);
        console.log(`Date Range: ${dateRange}`);

        for (let i = 0; i < dateRange.length; i++) {
            const date = dateRange[i];
            const url = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${date}&formatted=0`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const sunsetTime = data.results.sunset;
                    const sunriseTime = data.results.sunrise;

                    console.log('Date:', date, ', Sunset: ', sunsetTime, ', Sunrise:', sunriseTime);

                    const sunsetDateTime = parseSunsetTime(date, sunsetTime);
                    const eventEndTime = new Date(sunsetDateTime.getTime() + 60 * 1000);

                    fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                        method: "POST",
                        headers: {
                            "Authorization": "Bearer " + token,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            summary: "Sunset",
                            description: "Sunset Event Created by Sunset2Calendar",
                            start: { dateTime: sunsetDateTime.toISOString(), timeZone: "UTC" },
                            end: { dateTime: eventEndTime.toISOString(), timeZone: "UTC" },
                            extendedProperties: {
                                private: { extensionTag: "sunset" }
                            }
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Event Created:", data);
                        sendResponse({ success: !!data.id, eventId: data.id || null, error: data.error || null });
                    })
                    .catch(error => {
                        console.error("Error Creating Event:", error);
                        sendResponse({ success: false, error: error.message });
                    });

                    return true;
                })
                .catch(error => {
                    console.error('Error:', error);
                    sendResponse({ success: false, error: error.message });
                });
        }
    } else {
        console.error("Coordinates not found in the location text.");
        sendResponse({ success: false, error: "Coordinates not found in the location text." });
    }
}

// Function to remove calendar events by tag on a specific date
function removeCalEventsByTag(token, selectedDate, sendResponse) {
    const calendarId = "primary"; // Use the primary calendar
    const searchTag = "myCustomTag"; // Tag to search for

    // Convert selected date to YYYY-MM-DD format
    const targetDate = new Date(selectedDate);
    targetDate.setUTCHours(0, 0, 0, 0); // Normalize to midnight (UTC)

    // Set time range for the selected day
    const timeMin = targetDate.toISOString(); // Start of the day in UTC
    const timeMax = new Date(targetDate.getTime() + 86400000).toISOString(); // End of the day in UTC

    // Fetch only events within the selected day
    fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&timeMin=${timeMin}&timeMax=${timeMax}`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token } // Use the OAuth token for authorization
    })
    .then(response => response.json())
    .then(data => {
        if (!data.items || data.items.length === 0) {
            // If no events are found, send a failure response
            sendResponse({ success: false, error: "No events found on this date." });
            return;
        }

        // Filter events that have the correct tag
        const eventsToDelete = data.items.filter(event => 
            event.extendedProperties && 
            event.extendedProperties.private && 
            event.extendedProperties.private.extensionTag === searchTag
        );

        if (eventsToDelete.length === 0) {
            // If no tagged events are found, send a failure response
            sendResponse({ success: false, error: "No tagged events found on this date." });
            return;
        }

        // Delete only the matching events
        const deletePromises = eventsToDelete.map(event => 
            fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${event.id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token } // Use the OAuth token for authorization
            })
        );

        // Wait for all delete requests to complete
        Promise.all(deletePromises)
            .then(() => sendResponse({ success: true })) // Send a success response if all deletes succeed
            .catch(error => {
                console.error("Error Deleting Events:", error);
                // Send a failure response if there was an error during deletion
                sendResponse({ success: false, error: error.message });
            });
    })
    .catch(error => {
        console.error("Error Fetching Events:", error);
        // Send a failure response if there was an error during fetching
        sendResponse({ success: false, error: error.message });
    });

    return true; // Indicate that the response will be sent asynchronously
}

// Function to get an OAuth token
function getAuthToken(callback) {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
            console.error("Auth Error:", chrome.runtime.lastError);
            callback(null); // If there was an error, call the callback with null
        } else {
            console.log("Access Token:", token);
            callback(token); // Call the callback with the token
        }
    });
}

// Listener for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addEvent") {
        console.log(`Received locationText: ${request.locationText}`); // Debugging
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error("Auth Error:", chrome.runtime.lastError?.message || "Token missing");
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Authentication failed" });
                return;
            }
            addCalEvent(token, request.locationText, request.startDate, request.endDate, sendResponse);
        });
        return true;
    }

    if (request.action === "removeTaggedEvents") {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error("Auth Error:", chrome.runtime.lastError?.message || "Token missing");
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Authentication failed" });
                return;
            }
            removeCalEventsByTag(token, request.date, sendResponse);
        });
        return true;
    }
});