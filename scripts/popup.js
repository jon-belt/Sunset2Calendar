document.addEventListener('DOMContentLoaded', function () {
    // Add an event listener to the "addEvent" button
    document.getElementById('addEvent').addEventListener('click', function () {
        const locationText = document.getElementById('current-location').textContent;
        const startDate = document.getElementById('date-range-start').value;
        const endDate = document.getElementById('date-range-end').value;

        if (locationText === "Current Location") {
            alert("Please select a location before adding to calendar");
            return;
        }

        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        chrome.runtime.sendMessage({
            action: 'addEvent',
            locationText: locationText,
            startDate: startDate,
            endDate: endDate
        }, function(response) {
            if (response && response.success) {
                console.log('Event added successfully:', response.eventId);
            } else {
                console.error('Error adding event:', response ? response.error : 'No response from background script');
            }
        });
    });

    // Add an event listener to the "removeEvent" button
    document.getElementById("removeEvent").addEventListener("click", () => {
        // Get the selected date from the input field
        const selectedDate = document.getElementById("eventDate").value;
        // Check if a date was selected
        if (!selectedDate) {
            // Notify the user to select a date if none was selected
            alert("Please select a date to remove events.");
            return;
        }

        // Send a message to the background script to remove tagged events on the selected date
        chrome.runtime.sendMessage({ action: "removeTaggedEvents", date: selectedDate }, (response) => {
            // Check if the response indicates success
            if (response && response.success) {
                // Notify the user that the tagged events were removed successfully
                alert("Tagged events removed successfully!");
            } else {
                // Notify the user that the event removal failed, with an error message if available
                alert("Failed to remove events: " + (response ? response.error : "No response from background script"));
            }
        });
    });
});