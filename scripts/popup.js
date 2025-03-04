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

        const toggle = document.getElementById("changeButton");
        const toggleStatus = toggle.classList.contains("toggled");

        chrome.runtime.sendMessage({
            action: 'addEvent',
            locationText: locationText,
            startDate: startDate,
            endDate: endDate,
            toggleStatus: toggleStatus
        }, function(response) {
            if (response && response.success) {
                alert(`Successfully added events!`);
            } else {
                alert(`Failed to add events. ${response.errorCount} errors occurred.`);
            }
        });
    });

    // Add an event listener to the "removeEvent" button
    document.getElementById("removeEvent").addEventListener("click", () => {
        const selectedDate = document.getElementById("eventDate").value;
        if (!selectedDate) {
            alert("Please select a date to remove events.");
            return;
        }

        chrome.runtime.sendMessage({ action: "removeTaggedEvents", date: selectedDate }, (response) => {
            if (response && response.success) {
                alert("Tagged events removed successfully!");
            } else {
                alert("Failed to remove events: " + (response.error || "Unknown error"));
            }
        });
    });
});