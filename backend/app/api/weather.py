from fastapi import APIRouter, HTTPException, Query
import httpx
from app.services.openweather import (
    get_air_quality,
    get_current_weather,
    get_forecast,
    reverse_geocode as reverse_geocode_service,
    search_city,
)

router = APIRouter()


@router.get("/weather")
async def read_weather(
    lat: float = Query(..., description="Latitude of the location"),
    lon: float = Query(..., description="Longitude of the location"),
):
    try:
        weather_data = await get_current_weather(lat, lon)
        return weather_data
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json()
        except Exception:
            detail = exc.response.text
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"OpenWeather API error: {str(exc)}"
        )


@router.get("/forecast")
async def read_forecast(
    lat: float = Query(..., description="Latitude of the location"),
    lon: float = Query(..., description="Longitude of the location"),
):
    try:
        forecast_data = await get_forecast(lat, lon)
        return forecast_data
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json()
        except Exception:
            detail = exc.response.text
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"OpenWeather API error: {str(exc)}"
        )


@router.get("/air-quality")
async def read_air_quality(
    lat: float = Query(..., description="Latitude of the location"),
    lon: float = Query(..., description="Longitude of the location"),
):
    try:
        air_quality_data = await get_air_quality(lat, lon)
        return air_quality_data
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json()
        except Exception:
            detail = exc.response.text
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"OpenWeather API error: {str(exc)}"
        )


@router.get("/geocode")
async def read_geocode(
    q: str = Query(..., description="Search query string for city name"),
):
    try:
        geocode_data = await search_city(q)
        return geocode_data
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json()
        except Exception:
            detail = exc.response.text
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"OpenWeather API error: {str(exc)}"
        )


@router.get("/reverse-geocode")
async def read_reverse_geocode(
    lat: float = Query(..., description="Latitude of the location"),
    lon: float = Query(..., description="Longitude of the location"),
):
    try:
        reverse_data = await reverse_geocode_service(lat, lon)
        return reverse_data
    except httpx.HTTPStatusError as exc:
        try:
            detail = exc.response.json()
        except Exception:
            detail = exc.response.text
        raise HTTPException(status_code=exc.response.status_code, detail=detail)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502, detail=f"OpenWeather API error: {str(exc)}"
        )

