// Add an event listener to the "addEvent" button
document.getElementById("addEvent").addEventListener("click", () => {
    // Send a message to the background script to add an event
    chrome.runtime.sendMessage({ action: "addEvent" }, (response) => {
        if (!response) {
            alert("Failed to add event: No response received from background script.");
            return;
        }
        
        if (response.success) {
            alert("Event added successfully!");
        } else {
            alert("Failed to add event: " + (response.error || "Unknown error"));
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
            alert("Failed to remove events: " + (response.error || "Unknown error"));
        }
    });
});