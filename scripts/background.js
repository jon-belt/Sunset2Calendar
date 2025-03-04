function getDateRange(startDate, endDate) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let dateArray = [];

    if (start > end) {
        [start, end] = [end, start];
    }

    while (start <= end) {
        dateArray.push(start.toISOString().split('T')[0]);
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

function checkForDuplicateEvent(token, date, tag, callback) {
    const startOfDay = new Date(date).toISOString();
    const endOfDay = new Date(new Date(date).setDate(new Date(date).getDate() + 1)).toISOString();

    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&q=${tag}`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        const events = data.items || [];
        const duplicateEvent = events.find(event => event.extendedProperties && event.extendedProperties.private && event.extendedProperties.private.extensionTag === tag);
        callback(!!duplicateEvent);
    })
    .catch(error => {
        console.error("Error checking for duplicate event:", error);
        callback(false);
    });
}

function addCalEvent(token, locationText, startDate, endDate, toggleStatus, sendResponse) {
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

        let successCount = 0;
        let errorCount = 0;

        dateRange.forEach(date => {
            const url = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${date}&formatted=0`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const sunsetTime = data.results.sunset;
                    const sunriseTime = data.results.sunrise;

                    console.log('Date:', date, ', Sunset: ', sunsetTime, ', Sunrise:', sunriseTime);
                    
                    const sunsetDateTime = parseSunsetTime(date, sunsetTime);
                    const sunriseDateTime = parseSunsetTime(date, sunriseTime);

                    let eventTime, eventEndTime, tag;
                    if (toggleStatus === true) {
                        // Add sunrise event
                        eventTime = sunriseDateTime;
                        eventEndTime = new Date(sunriseDateTime.getTime() + 60 * 1000); // 1 minute later
                        tag = "Sunrise";
                    } else {
                        // Add sunset event
                        eventTime = sunsetDateTime;
                        eventEndTime = new Date(sunsetDateTime.getTime() + 60 * 1000); // 1 minute later
                        tag = "Sunset";
                    }

                    checkForDuplicateEvent(token, date, tag, isDuplicate => {
                        if (isDuplicate) {
                            console.log(`Duplicate event found for ${tag} on ${date}. Skipping...`);
                            errorCount++;
                            if (successCount + errorCount === dateRange.length) {
                                sendResponse({ success: successCount > 0, successCount, errorCount });
                            }
                        } else {
                            fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                                method: "POST",
                                headers: {
                                    "Authorization": "Bearer " + token,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    summary: tag,
                                    description: `${tag} Event Created by Sunset2Calendar`,
                                    start: { dateTime: eventTime.toISOString(), timeZone: "UTC" },
                                    end: { dateTime: eventEndTime.toISOString(), timeZone: "UTC" },
                                    extendedProperties: {
                                        private: { extensionTag: tag }
                                    }
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                console.log("Event Created:", data);
                                if (data.id) {
                                    successCount++;
                                } else {
                                    errorCount++;
                                }
                                if (successCount + errorCount === dateRange.length) {
                                    sendResponse({ success: successCount > 0, successCount, errorCount });
                                }
                            })
                            .catch(error => {
                                console.error("Error Creating Event:", error);
                                errorCount++;
                                if (successCount + errorCount === dateRange.length) {
                                    sendResponse({ success: successCount > 0, successCount, errorCount });
                                }
                            });
                        }
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    errorCount++;
                    if (successCount + errorCount === dateRange.length) {
                        sendResponse({ success: successCount > 0, successCount, errorCount });
                    }
                });
        });
    } else {
        console.error("Coordinates not found in the location text.");
        sendResponse({ success: false, error: "Coordinates not found in the location text." });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addEvent") {
        console.log(`Received locationText: ${request.locationText}`); // Debugging
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error("Auth Error:", chrome.runtime.lastError?.message || "Token missing");
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Authentication failed" });
                return;
            }
            addCalEvent(token, request.locationText, request.startDate, request.endDate, request.toggleStatus, sendResponse);
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