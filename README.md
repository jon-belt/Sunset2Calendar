# Sunset2Calendar

Sunset2Calendar is a Chrome extension that allows users to add and remove sunset and sunrise times to their Google Calendar. The extension utilizes geolocation features to determine the user's location and fetches the sunset and sunrise times for the selected date range. Users can choose to add either sunset or sunrise events, and the events are color-coded for easy identification.

## Features

- Add sunset or sunrise events to Google Calendar
- Remove sunset or sunrise events from Google Calendar
- Select a date range for adding or removing events
- Utilize geolocation to determine the user's location
- Color-coded events: yellow for sunrise and grey for sunset

## Installation

1. Clone the repository to your local machine:
    ```bash
    git clone https://github.com/yourusername/Sunset2Calendar.git
    ```

2. Open Chrome and navigate to `chrome://extensions/`.

3. Enable "Developer mode" by toggling the switch in the top right corner.

4. Click on the "Load unpacked" button and select the directory where you cloned the repository.

5. The Sunset2Calendar extension should now be installed and visible in your Chrome extensions.

## Usage

1. Click on the Sunset2Calendar extension icon in the Chrome toolbar to open the popup.

2. Select the date range for which you want to add or remove events.

3. Choose whether you want to add or remove events by clicking the corresponding button.

4. Toggle between sunrise and sunset events using the toggle button.

5. Click the "Add" button to add events to your Google Calendar or the "Remove" button to remove events.

## Development

### Prerequisites

- Node.js and npm installed on your machine

### Setup

1. Clone the repository to your local machine:
    ```bash
    git clone https://github.com/yourusername/Sunset2Calendar.git
    ```

2. Navigate to the project directory:
    ```bash
    cd Sunset2Calendar
    ```

3. Install the dependencies:
    ```bash
    npm install
    ```

### Building the Extension

To build the extension, run the following command:
```bash
npm run build

