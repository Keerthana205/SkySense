import httpx
from app.config import OPENWEATHER_API_KEY

BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
AIR_POLLUTION_URL = "https://api.openweathermap.org/data/2.5/air_pollution"
DIRECT_GEO_URL = "https://api.openweathermap.org/geo/1.0/direct"
REVERSE_GEO_URL = "https://api.openweathermap.org/geo/1.0/reverse"


async def get_current_weather(lat: float, lon: float):
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(BASE_URL, params=params)
        response.raise_for_status()
        return response.json()


async def get_forecast(lat: float, lon: float):
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(FORECAST_URL, params=params)
        response.raise_for_status()
        return response.json()


async def get_air_quality(lat: float, lon: float):
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(AIR_POLLUTION_URL, params=params)
        response.raise_for_status()
        return response.json()


async def search_city(query: str):
    params = {
        "q": query,
        "limit": 10,
        "appid": OPENWEATHER_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(DIRECT_GEO_URL, params=params)
        response.raise_for_status()
        return response.json()


async def reverse_geocode(lat: float, lon: float):
    params = {
        "lat": lat,
        "lon": lon,
        "limit": 5,
        "appid": OPENWEATHER_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(REVERSE_GEO_URL, params=params)
        response.raise_for_status()
        return response.json()
