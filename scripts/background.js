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

function addCalEvent(token, sendResponse) {

    //This code segment creates a new event in the user's primary calendar
    fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            summary: "Tagged Event",
            description: "Event created by Chrome Extension",
            start: { dateTime: new Date().toISOString(), timeZone: "UTC" },
            end: { dateTime: new Date(new Date().getTime() + 3600000).toISOString(), timeZone: "UTC" },
            extendedProperties: {
                private: { extensionTag: "myCustomTag" }
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

    return true; // Keep the message channel open
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
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error("Auth Error:", chrome.runtime.lastError?.message || "Token missing");
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Authentication failed" });
                return;
            }
            addCalEvent(token, sendResponse);
        });
        return true; // Keep the message channel open
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
        return true; // Keep the message channel open
    }
});