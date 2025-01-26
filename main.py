#Imports
import requests
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from datetime import datetime, timedelta

#Authentication for Google Calendar API
auth = ['https://www.googleapis.com/auth/calendar']

#Authenticates the User and builds a google calendar service
def authenticate_google_calendar():
    creds = None
    #Try to get the credentials from the token.json file
    try:
        creds = Credentials.from_authorized_user_file('token.json', auth)

    #If the credentials are not found, create a new token using the credentials.json file
    except Exception:
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', auth)
        creds = flow.run_local_server(port=0)

        #Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    #Builds the service object
    return build('calendar', 'v3', credentials=creds)

#Get the sunset time using the 'sunrise-sunset' api
def get_sunset_time(lat, lon, date):
    url = f"https://api.sunrise-sunset.org/json?lat={lat}&lng={lon}&date={date}&formatted=0"
    response = requests.get(url)
    sunset_time = response.json()['results']['sunset']
    return sunset_time

#Format sunset time into a format that can be used by the Google Calendar API
def format_sunset_time(sunset_time):
    sunset_time_obj = datetime.fromisoformat(sunset_time.replace('Z', '+00:00'))
    return sunset_time_obj.isoformat()

#Adds the event to Google Calendar
def add_event_to_calendar(service, sunset_time):
    formatted_sunset_time = format_sunset_time(sunset_time)
    
    #Convert the formatted sunset time into a datetime object
    sunset_datetime = datetime.fromisoformat(formatted_sunset_time)
    
    #Set the end time to 1 minute after the start time
    #This is so that the event is visible on the calendar, but not large enough to block out other events
    end_datetime = sunset_datetime + timedelta(minutes=1)
    
    # Format both start and end times back into ISO 8601 format, required by the Google Calendar API
    formatted_end_time = end_datetime.isoformat()

    #Create the event object, in json format
    formatted_sunset_time = format_sunset_time(sunset_time)
    event = {
        'summary': 'Sunset',
        'start': {
            'dateTime': formatted_sunset_time,
            'timeZone': 'UTC',
        },
        'end': {
            'dateTime': formatted_end_time,
            'timeZone': 'UTC',
        },
        'colorId': '7',
    }

    #Insert the event into Google Calendar
    event_result = service.events().insert(calendarId='primary', body=event).execute()
    print(f"Event created: {event_result['htmlLink']}")

#Main function to run the program
def run(day):
    service = authenticate_google_calendar()
    sunset_time = get_sunset_time(51.832729, -0.214410, day)
    add_event_to_calendar(service, sunset_time)

#Test Data
# days = ["2025-01-26"]
# day = days[0]

run("2025-01-26")