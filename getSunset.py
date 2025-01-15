##retrieves the sunset time based on the location of the user

import datetime
import requests



# lock to welwyn coords for now
lat = 51.832729
lon = -0.214410
date = "2025-01-15"

def getSunsetTime(lat, lon, date):
    req = f"https://api.sunrise-sunset.org/json?lat={lat}&lng={lon}&date={date}"
    response = requests.get(req)
    
    sunset = response.json()['results']['sunset']
    return sunset


x = getSunsetTime(lat, lon, date)
print(x)