"use strict";

const API_BASE = "http://127.0.0.1:8000";

const MAX_SEARCH_HISTORY = 5;
const TOAST_DURATION_MS = 3000;
const DEBOUNCE_DELAY_MS = 300;
const CLOCK_INTERVAL_MS = 60000;

const STORAGE_KEYS = {
    SEARCH_HISTORY: "searchHistory",
    FAVORITE_CITIES: "favoriteCities"
};

function safeJsonParse(key, fallback = []) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Failed to parse localStorage item "${key}":`, error);
        return fallback;
    }
}

let searchHistory = safeJsonParse(STORAGE_KEYS.SEARCH_HISTORY, []);
const favoriteCitiesRaw = safeJsonParse(STORAGE_KEYS.FAVORITE_CITIES, []);

// Clean and sanitize any corrupted or string data from localStorage
const favoriteCities = Array.isArray(favoriteCitiesRaw) ? favoriteCitiesRaw.map(item => {
    if (typeof item === "string") {
        return { name: item, state: null, country: null, temp: "", weather: "Clouds", lat: null, lon: null };
    }
    if (item && typeof item === "object" && (item.name || item.cityName)) {
        return {
            name: item.name || item.cityName,
            state: item.state || null,
            country: item.country || item.countryCode || null,
            temp: item.temp || "",
            weather: item.weather || "Clouds",
            lat: item.lat || null,
            lon: item.lon || null
        };
    }
    return null;
}).filter(Boolean) : [];

localStorage.setItem(STORAGE_KEYS.FAVORITE_CITIES, JSON.stringify(favoriteCities));

let currentWeatherData = null;
let currentLatitude = null;
let currentLongitude = null;
let currentTimezone = null;
let currentForecastData = null;
let currentLocationData = null;

function getLocationName(locationObj) {
    if (!locationObj) return "";
    if (typeof locationObj === "string") return locationObj;

    return (
        locationObj.village ||
        locationObj.hamlet ||
        locationObj.suburb ||
        locationObj.town ||
        locationObj.city ||
        locationObj.name ||
        locationObj.cityName ||
        ""
    ).toString().trim();
}

function formatLocation(locationObj) {
    if (!locationObj) return "";
    if (typeof locationObj === "string") return locationObj;

    const name = getLocationName(locationObj);
    const state = locationObj.state ? locationObj.state.toString().trim() : "";
    const country = locationObj.country || locationObj.countryCode || locationObj.sys?.country || "";

    if (name && state && country) {
        return `${name}, ${state}, ${country}`;
    } else if (name && country) {
        return `${name}, ${country}`;
    } else if (name) {
        return name;
    }
    return "";
}

const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-btn");

const weatherIcon = document.querySelector(".weather-icon");

const temperature = document.querySelector(".temp");
const condition = document.querySelector(".condition");
const city = document.querySelector(".city");
const dateTime = document.querySelector(".date");

const feelsLike = document.querySelector(".feels-like");
const humidity = document.querySelector(".humidity");
const wind = document.querySelector(".wind");
const airQuality = document.querySelector(".air-quality");

const greeting = document.querySelector(".greeting-text");

const essentialsItems = document.querySelector(".essentials-items");
const whyBody = document.querySelector(".why-body");

const stars = document.querySelector(".stars");
const scoreStatus = document.querySelector(".score-status");
const scoreDescription = document.querySelector(".score-description");
const forecastCards = document.querySelectorAll(".forecast-card");
const forecastCardElements = Array.from(forecastCards).map(card => ({
    time: card.querySelector(".forecast-time"),
    icon: card.querySelector(".forecast-icon"),
    temp: card.querySelector(".forecast-temp")
}));

const favoriteButton = document.querySelector(".favorite-btn");
const favoriteList = document.querySelector(".favorite-list");

const toast = document.querySelector(".toast");
const toastTitle = document.querySelector(".toast-title");
const toastMessage = document.querySelector(".toast-message");
const toastIcon = document.querySelector(".toast-icon");

const app = document.querySelector(".app");
const appContent = document.querySelector(".app-content");

const hero = document.querySelector(".hero");
const cardsRow = document.querySelector(".cards-row");
const forecastSection = document.querySelector(".forecast-section");

const suggestionsBox = document.querySelector(".search-suggestions");

const forecastModal = document.querySelector(".forecast-modal");
const forecastDays = document.querySelector(".forecast-days");
const closeModal = document.querySelector(".close-modal");
const viewForecastButton = document.querySelector(".view-all-link");

function startUpdateAnimation() {

    appContent.classList.add("updating");

}

function stopUpdateAnimation() {

    appContent.classList.remove("updating");

}



let toastTimeout;

function showToast(title, message, icon = "info", color = "#437EF7") {

    toastTitle.textContent = title;

    toastMessage.textContent = message;

    toastIcon.textContent = icon;

    toastIcon.style.color = color;

    toast.style.borderLeftColor = color;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {

        toast.classList.remove("show");

    }, TOAST_DURATION_MS);

}

function animateUpdate(...elements) {

    elements.forEach(element => {

        if (!element) return;

        element.classList.remove("weather-transition");

        void element.offsetWidth;

        element.classList.add("weather-transition");

    });

}


function showSkeleton() {
    if (app) app.classList.add("loading");
}

function hideSkeleton() {
    if (app) app.classList.remove("loading");
}

function formatWeatherMain(weather) {
    if (!weather || typeof weather !== "string") return "Clouds";
    const map = {
        clear: "Clear",
        clouds: "Clouds",
        rain: "Rain",
        drizzle: "Drizzle",
        thunderstorm: "Thunderstorm",
        snow: "Snow",
        mist: "Mist",
        fog: "Fog",
        haze: "Haze",
        smoke: "Smoke",
        dust: "Dust",
        sand: "Sand",
        ash: "Ash",
        squall: "Squall",
        tornado: "Tornado"
    };
    const key = weather.trim().toLowerCase();
    return map[key] || (weather.charAt(0).toUpperCase() + weather.slice(1));
}

function getWeatherIcon(weather) {

    const formattedWeather = formatWeatherMain(weather);

    const icons = {

        Clear: "images/clear.webp",

        Clouds: "images/clouds.webp",

        Rain: "images/rain.webp",

        Drizzle: "images/drizzle.webp",

        Thunderstorm: "images/thunderstorm.webp",

        Snow: "images/snow.webp",

        Mist: "images/mist.webp",

        Fog: "images/mist.webp",

        Haze: "images/mist.webp",

        Smoke: "images/mist.webp",

        Dust: "images/mist.webp",

        Sand: "images/mist.webp",

        Ash: "images/mist.webp",

        Squall: "images/rain.webp",

        Tornado: "images/tornado.webp"

    };

    return icons[formattedWeather] || "images/clouds.webp";

}

function getLocalDate(timezoneOffset) {

    const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;

    return new Date(utc + timezoneOffset * 1000);

}

function updateTheme(weatherMain, timezoneOffset) {

    document.body.classList.remove(
        "theme-clear",
        "theme-clouds",
        "theme-rain",
        "theme-storm",
        "theme-snow",
        "theme-mist",
        "theme-night"
    );

    const now = getLocalDate(timezoneOffset);

    const hour = now.getHours();

    if (hour >= 19 || hour < 6) {

        document.body.classList.add("theme-night");

        return;

    }

    switch (weatherMain) {

        case "Clear":

            document.body.classList.add("theme-clear");
            break;

        case "Clouds":

            document.body.classList.add("theme-clouds");
            break;

        case "Rain":
        case "Drizzle":
        case "Squall":

            document.body.classList.add("theme-rain");
            break;

        case "Thunderstorm":
        case "Tornado":

            document.body.classList.add("theme-storm");
            break;

        case "Snow":

            document.body.classList.add("theme-snow");
            break;

        case "Mist":
        case "Fog":
        case "Haze":
        case "Smoke":
        case "Dust":
        case "Sand":
        case "Ash":

            document.body.classList.add("theme-mist");
            break;

        default:

            document.body.classList.add("theme-clouds");
            break;
    }

}

function isRainCondition(condition) {

    return (
        condition === "Rain" ||
        condition === "Drizzle" ||
        condition === "Thunderstorm" ||
        condition === "Squall"
    );

}

function hasUpcomingRain(forecastData) {

    if (!forecastData || !forecastData.list) {

        return false;

    }

    const upcomingList = forecastData.list.slice(0, 3);

    return upcomingList.some(item => {

        const condition = item.weather[0].main;

        return isRainCondition(condition);

    });

}

function hasUpcomingThunderstorm(forecastData) {

    if (!forecastData || !forecastData.list) {

        return false;

    }

    const upcomingList = forecastData.list.slice(0, 3);

    return upcomingList.some(item => {

        const condition = item.weather[0].main;

        return condition === "Thunderstorm";

    });

}

function getAirQuality(aqi) {

    switch (aqi) {

        case 1:
            return {
                text: "Good",
                className: "aqi-good"
            };

        case 2:
            return {
                text: "Fair",
                className: "aqi-fair"
            };

        case 3:
            return {
                text: "Moderate",
                className: "aqi-moderate"
            };

        case 4:
            return {
                text: "Poor",
                className: "aqi-poor"
            };

        case 5:
            return {
                text: "Very Poor",
                className: "aqi-very-poor"
            };

        default:
            return {
                text: "--",
                className: ""
            };

    }

}

function saveSearchHistory(searchData) {

    if (!searchData) return;

    let itemLabel = "";
    let historyEntry = searchData;

    if (typeof searchData === "string") {
        itemLabel = searchData.trim();
        historyEntry = itemLabel;
    } else if (typeof searchData === "object" && (searchData.name || searchData.cityName || searchData.village)) {
        itemLabel = formatLocation(searchData);
        historyEntry = {
            label: itemLabel,
            name: getLocationName(searchData),
            state: searchData.state || null,
            country: searchData.country || searchData.countryCode || null,
            lat: searchData.lat || null,
            lon: searchData.lon || null
        };
    }

    if (!itemLabel) return;

    const existingIndex = searchHistory.findIndex(entry => {
        const entryLabel = typeof entry === "string" ? entry : (entry.label || formatLocation(entry) || "");
        return entryLabel.toLowerCase() === itemLabel.toLowerCase();
    });

    if (existingIndex !== -1) {
        searchHistory.splice(existingIndex, 1);
    }

    searchHistory.unshift(historyEntry);

    if (searchHistory.length > MAX_SEARCH_HISTORY) {
        searchHistory.pop();
    }

    localStorage.setItem(
        STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify(searchHistory)
    );

}

function saveFavorite(weatherData, lat, lon) {

    if (!weatherData || !weatherData.name) {
        alert("Please search or load a city first.");
        return;
    }

    const favorite = {

        name: getLocationName(currentLocationData || weatherData),

        state: currentLocationData?.state || null,

        country: currentLocationData?.country || weatherData.sys?.country || null,

        temp: `${Math.round(weatherData.main.temp)}°C`,

        weather: weatherData.weather ? weatherData.weather[0].main : "Clouds",

        lat: lat,

        lon: lon

    };

    const existingIndex = favoriteCities.findIndex(cityItem =>
        cityItem.name && cityItem.name.toLowerCase() === favorite.name.toLowerCase()
    );

    if (existingIndex !== -1) {

        // Remove from favorites if already present (toggle)
        favoriteCities.splice(existingIndex, 1);

    } else {

        // Add to favorites
        favoriteCities.push(favorite);

    }

    localStorage.setItem(
        STORAGE_KEYS.FAVORITE_CITIES,
        JSON.stringify(favoriteCities)
    );

    displayFavorites();

}

function removeFavorite(index) {
    favoriteCities.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.FAVORITE_CITIES, JSON.stringify(favoriteCities));
    displayFavorites();
}

function updateFavoriteHeaderButton() {
    if (!favoriteButton) return;

    const currentCityName = getLocationName(currentLocationData || currentWeatherData);

    if (currentCityName) {
        const isFav = favoriteCities.some(
            cityItem => cityItem.name && cityItem.name.toLowerCase() === currentCityName.toLowerCase()
        );

        if (isFav) {
            favoriteButton.classList.add("is-favorite");
            favoriteButton.setAttribute("title", "Remove from Favorites");
        } else {
            favoriteButton.classList.remove("is-favorite");
            favoriteButton.setAttribute("title", "Add to Favorites");
        }
    } else {
        favoriteButton.classList.remove("is-favorite");
    }
}

function displayFavorites() {

    if (!favoriteList) return;

    // Remove cards and empty state
    favoriteList.querySelectorAll(".favorite-card, .favorites-empty").forEach(card => {
        card.remove();
    });

    if (favoriteCities.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "favorites-empty";
        emptyState.innerHTML = `
            <span class="material-symbols-outlined favorites-empty-icon" aria-hidden="true">favorite</span>
            <div class="favorites-empty-title">No favorite cities yet</div>
            <div class="favorites-empty-subtitle">Tap the ❤️ on any city to add it here.</div>
        `;
        favoriteList.appendChild(emptyState);
        updateFavoriteHeaderButton();
        return;
    }

    const currentCityName = getLocationName(currentLocationData || currentWeatherData);

    favoriteCities.forEach((cityItem, index) => {

        if (!cityItem || !cityItem.name) return;

        const card = document.createElement("div");

        card.className = "favorite-card";

        if (currentCityName && cityItem.name.toLowerCase() === currentCityName.toLowerCase()) {
            card.classList.add("favorite-card--active");
        }

        const cityName = formatLocation(cityItem);
        const cityTemp = cityItem.temp || "";
        const weatherIconSrc = getWeatherIcon(cityItem.weather || "Clouds");

        card.innerHTML = `
            <span class="material-symbols-outlined favorite-heart">favorite</span>

            <span class="city-name">${cityName}</span>

            ${cityTemp ? `<span class="city-temp">${cityTemp}</span>` : ""}

            <img
                src="${weatherIconSrc}"
                class="city-icon"
                alt="weather icon"
                width="24"
                height="24"
                loading="lazy"
                decoding="async">

            <span class="material-symbols-outlined remove-favorite-btn" title="Remove favorite">close</span>
        `;

        card.addEventListener("click", (e) => {

            if (e.target.classList.contains("remove-favorite-btn")) {
                e.stopPropagation();
                removeFavorite(index);
                return;
            }

            if (cityItem.lat && cityItem.lon) {
                fetchWeather(
                    cityItem.lat,
                    cityItem.lon,
                    { name: cityItem.name, country: "" }
                );
            } else if (cityItem.name) {
                searchInput.value = cityItem.name;
                searchWeather();
            }

        });

        favoriteList.appendChild(card);

    });

    updateFavoriteHeaderButton();

}


function updateCurrentWeather(
    weatherData,
    airData,
    locationData
) {
    const { main, weather, wind: windData, sys, name } = weatherData;

    temperature.textContent = `${Math.round(main.temp)}°C`;

    condition.textContent = formatWeatherMain(weather[0].main);

    if (locationData) {

        city.textContent = formatLocation(locationData);

    } else {

        city.textContent = formatLocation({ name, sys });

    }

    feelsLike.textContent = `${Math.round(main.feels_like)}°C`;

    humidity.textContent = `${main.humidity}%`;

    wind.textContent = `${Math.round(windData.speed * 3.6)} km/h`;

    const air = getAirQuality(
        airData?.list?.[0]?.main?.aqi
    );

    airQuality.textContent = air.text;

    airQuality.className = `air-quality ${air.className}`;

    weatherIcon.src = getWeatherIcon(weather[0].main);
}

function updateUI(
    weatherData,
    forecastData,
    airData,
    locationData
) {

    updateCurrentWeather(weatherData, airData, locationData);
    updateTheme(weatherData.weather[0].main, weatherData.timezone);
    updateGreeting(weatherData.timezone);
    updateDate(weatherData.timezone);

    updateEssentials(weatherData, forecastData);

    updateOutdoorScore(
        weatherData.main.temp,
        weatherData.weather[0].main,
        weatherData.main.humidity,
        Math.round(weatherData.wind.speed * 3.6),
        forecastData,
        airData
    );

    updateForecast(forecastData);

    displayFavorites();

    searchInput.value = "";

    animateUpdate(
        hero,
        cardsRow,
        forecastSection
    );
}

function displayForecastModal() {

    if (!currentForecastData) return;

    forecastDays.innerHTML = "";

    const dailyForecast = {};

    currentForecastData.list.forEach(item => {

        const date = new Date(item.dt * 1000);

        const day = date.toLocaleDateString("en-US", {
            weekday: "long"
        });

        if (!dailyForecast[day]) {

            dailyForecast[day] = {

                day,

                high: item.main.temp_max,

                low: item.main.temp_min,

                weather: item.weather[0].main,

                description: item.weather[0].description

            };

        }
        else {

            dailyForecast[day].high = Math.max(
                dailyForecast[day].high,
                item.main.temp_max
            );

            dailyForecast[day].low = Math.min(
                dailyForecast[day].low,
                item.main.temp_min
            );

        }

    });

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long"
    });

    const tomorrowDate = new Date();

    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const tomorrow = tomorrowDate.toLocaleDateString("en-US", {
        weekday: "long"
    });

    Object.values(dailyForecast)
        .slice(0, 5)
        .forEach(day => {

            let displayDay = day.day;

            if (day.day === today) {

                displayDay = "Today";

            }
            else if (day.day === tomorrow) {

                displayDay = "Tomorrow";

            }

            forecastDays.innerHTML += `

    <div class="forecast-day">

    <div class="forecast-day-left">

        <img
            src="${getWeatherIcon(day.weather)}"
            class="forecast-day-icon"
            alt="${day.weather} forecast icon"
            width="42"
            height="42"
            loading="lazy"
            decoding="async"
        >

        <div>

            <div class="forecast-day-name">

            ${displayDay}

            </div>

            <div class="forecast-day-condition">

                ${day.description}

            </div>

        </div>

    </div>

    <span class="forecast-day-temp">

        ${Math.round(day.high)}°
<span>/ ${Math.round(day.low)}°</span>

    </span>

</div>

`;

        });

    forecastModal.classList.remove("hidden");

}

let currentSuggestions = [];
let selectedSuggestionIndex = -1;
let suggestionTimeout;

function updateHighlightedSuggestion(index) {
    if (!suggestionsBox) return;
    const items = suggestionsBox.querySelectorAll(".suggestion-item");
    if (!items || items.length === 0) return;

    items.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add("selected");
            item.scrollIntoView({ block: "nearest" });
        } else {
            item.classList.remove("selected");
        }
    });
    selectedSuggestionIndex = index;
}

function selectSuggestion(entry) {

    if (!entry) return;

    let displayVal = "";
    let lat = null;
    let lon = null;
    let locationData = null;

    if (typeof entry === "string") {
        displayVal = entry;
    } else if (typeof entry === "object") {
        displayVal = formatLocation(entry);
        lat = entry.lat || null;
        lon = entry.lon || null;
        locationData = entry;
    }

    searchInput.value = displayVal;
    if (suggestionsBox) suggestionsBox.classList.add("hidden");
    selectedSuggestionIndex = -1;
    currentSuggestions = [];

    saveSearchHistory(entry);
    showSkeleton();

    if (lat !== null && lon !== null) {
        fetchWeather(lat, lon, locationData);
    } else {
        searchWeather();
    }

}

function showRecentSearches() {

    if (!suggestionsBox) return;

    suggestionsBox.innerHTML = "";
    currentSuggestions = [];
    selectedSuggestionIndex = -1;

    if (!searchHistory || searchHistory.length === 0) {
        suggestionsBox.innerHTML = `<div class="suggestion-empty">No recent searches</div>`;
        suggestionsBox.classList.remove("hidden");
        return;
    }

    const headerEl = document.createElement("div");
    headerEl.className = "suggestion-header";
    headerEl.textContent = "Recent Searches";
    suggestionsBox.appendChild(headerEl);

    const recentItems = searchHistory.slice(0, 5);
    currentSuggestions = recentItems;

    recentItems.forEach((entry, index) => {
        const item = document.createElement("div");
        item.className = "suggestion-item history-suggestion-item";

        let displayLabel = formatLocation(entry);

        item.innerHTML = `
            <span class="material-symbols-outlined suggestion-icon" aria-hidden="true">
                schedule
            </span>
            <div class="suggestion-info">
                <span class="suggestion-city">${displayLabel}</span>
            </div>
        `;

        item.addEventListener("mouseenter", () => {
            updateHighlightedSuggestion(index);
        });

        item.addEventListener("click", (e) => {
            e.stopPropagation();
            selectSuggestion(entry);
        });

        suggestionsBox.appendChild(item);
    });

    suggestionsBox.classList.remove("hidden");

}

async function showSuggestions() {

    const query = searchInput.value.trim();

    if (query.length < 2) {

        currentSuggestions = [];
        selectedSuggestionIndex = -1;
        if (suggestionsBox) {
            suggestionsBox.innerHTML = "";
            suggestionsBox.classList.add("hidden");
        }
        return;

    }

    if (!suggestionsBox) return;

    suggestionsBox.innerHTML = `<div class="suggestion-loading">Searching...</div>`;
    suggestionsBox.classList.remove("hidden");

    try {
        const response = await fetch(
            `${API_BASE}/geocode?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch suggestions");
        }

        const cities = await response.json();

        if (searchInput.value.trim() !== query) return;

        suggestionsBox.innerHTML = "";

        // Deduplicate cities by name, state, and country
        const uniqueCities = [];
        const seenKeys = new Set();

        (cities || []).forEach(city => {
            if (!city || !city.name || !city.country) return;
            const nameKey = city.name.trim().toLowerCase();
            const stateKey = (city.state || "").trim().toLowerCase();
            const countryKey = city.country.trim().toLowerCase();
            const key = `${nameKey}|${stateKey}|${countryKey}`;

            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueCities.push(city);
            }
        });

        const matchedCities = uniqueCities.slice(0, 5);
        currentSuggestions = matchedCities;
        selectedSuggestionIndex = -1;

        if (!matchedCities.length) {

            suggestionsBox.innerHTML = `<div class="suggestion-empty">No cities found</div>`;
            return;

        }

        matchedCities.forEach((city, index) => {

            const item = document.createElement("div");

            item.className = "suggestion-item";

            const locationText = formatLocation(city);

            item.innerHTML = `

                <span class="material-symbols-outlined suggestion-icon" aria-hidden="true">
                    location_on
                </span>

                <div class="suggestion-info">
                    <span class="suggestion-city">${locationText}</span>
                </div>

            `;

            item.addEventListener("mouseenter", () => {
                updateHighlightedSuggestion(index);
            });

            item.addEventListener("click", (e) => {

                e.stopPropagation();
                selectSuggestion(city);

            });

            suggestionsBox.appendChild(item);

        });

        suggestionsBox.classList.remove("hidden");

    } catch (error) {

        console.warn("Suggestion fetch error:", error);
        suggestionsBox.innerHTML = `<div class="suggestion-empty">No cities found</div>`;

    }

}

async function fetchApiData(url, errorMessage) {

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.weather && data.weather.length > 0) {
        data.weather[0].main = formatWeatherMain(data.weather[0].main);
    }

    if (data.list && Array.isArray(data.list)) {
        data.list.forEach(item => {
            if (item.weather && item.weather.length > 0) {
                item.weather[0].main = formatWeatherMain(item.weather[0].main);
            }
        });
    }

    return data;

}

async function fetchWeatherData(lat, lon) {

    return await fetchApiData(
        `${API_BASE}/weather?lat=${lat}&lon=${lon}`,
        "Failed to fetch weather data."
    );

}

async function fetchForecastData(lat, lon) {

    return await fetchApiData(
        `${API_BASE}/forecast?lat=${lat}&lon=${lon}`,
        "Failed to fetch forecast."
    );

}

async function fetchAirQualityData(lat, lon) {

    return await fetchApiData(
        `${API_BASE}/air-quality?lat=${lat}&lon=${lon}`,
        "Failed to fetch air quality."
    );

}

async function fetchWeather(lat, lon, locationData) {
    try {
        currentLocationData = locationData || null;

        const [weatherData, forecastData, airData] = await Promise.all([
            fetchWeatherData(lat, lon),
            fetchForecastData(lat, lon),
            fetchAirQualityData(lat, lon)
        ]);

        currentForecastData = forecastData;
        currentWeatherData = weatherData;
        currentLatitude = lat;
        currentLongitude = lon;
        currentTimezone = weatherData.timezone;

        startUpdateAnimation();

        updateUI(
            weatherData,
            forecastData,
            airData,
            locationData
        );

        hideSkeleton();

        stopUpdateAnimation();
    }
    catch (error) {

        console.error(error);
        hideSkeleton();
        alert("Unable to load weather data.");

    }

}

async function searchWeather() {
    try {

        const cityName = searchInput.value.trim();

        if (cityName === "") {
            showToast("Empty Search", "Please enter a city name.", "search", "#F59E0B");
            return;
        }

        showSkeleton();

        const geoResponse = await fetch(
            `${API_BASE}/geocode?q=${encodeURIComponent(cityName)}`
        );

        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            hideSkeleton();
            showToast("City Not Found", "Please enter a valid city name.", "error", "#EF4444");
            return;
        }

        const lat = geoData[0].lat;
        const lon = geoData[0].lon;

        saveSearchHistory(geoData[0]);

        await fetchWeather(lat, lon, geoData[0]);
    }
    catch (error) {

        console.error(error);
        hideSkeleton();
        showToast("Error", "Something went wrong. Please try again.", "error", "#EF4444");

    }

}
function getCurrentLocation() {

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
            loadCurrentWeather,
            showLocationError
        );

    } else {

        showToast("Error", "Geolocation is not supported by this browser.", "error", "#EF4444");

    }

}

async function loadCurrentWeather(position) {

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    let locationData = null;

    try {
        const reverseGeoResponse = await fetch(
            `${API_BASE}/reverse-geocode?lat=${lat}&lon=${lon}`
        );

        if (reverseGeoResponse.ok) {
            const geoData = await reverseGeoResponse.json();
            if (geoData && geoData.length > 0) {
                locationData = geoData[0];
            }
        }
    } catch (error) {
        console.warn("Failed to reverse geocode current location:", error);
    }

    await fetchWeather(lat, lon, locationData);
}

function showLocationError() {

    hideSkeleton();
    showToast("Error", "Location access denied.", "error", "#EF4444");

}

function updateGreeting(timezoneOffset) {

    const now = getLocalDate(timezoneOffset);

    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {

        greeting.textContent = "Good Morning";

    }
    else if (hour >= 12 && hour < 17) {

        greeting.textContent = "Good Afternoon";

    }
    else if (hour >= 17 && hour < 21) {

        greeting.textContent = "Good Evening";

    }
    else {

        greeting.textContent = "Good Night";

    }

}

function updateDate(timezoneOffset) {

    const now = getLocalDate(timezoneOffset);

    const date = now.toLocaleDateString("en-US", {

        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"

    });

    const time = now.toLocaleTimeString("en-US", {

        hour: "numeric",
        minute: "2-digit"

    });

    dateTime.textContent = `${date} • ${time}`;

}

function updateEssentials(weatherData, forecastData) {
    if (!essentialsItems || !whyBody) return;

    const temp = weatherData.main.temp;
    const weatherMain = weatherData.weather[0].main;
    const humidity = weatherData.main.humidity;
    const windSpeed = Math.round(weatherData.wind.speed * 3.6);

    // Check forecast for rain in upcoming forecast items
    let upcomingRain = false;
    let rainTimeText = "";

    if (forecastData && forecastData.list) {

        const upcomingList = forecastData.list.slice(0, 3);

        for (const item of upcomingList) {

            const mainCondition = item.weather[0].main;

            if (isRainCondition(mainCondition)) {

                upcomingRain = true;

                const forecastHour = new Date(item.dt * 1000).getHours();

                if (forecastHour >= 17 || forecastHour < 4) {

                    rainTimeText = "this evening";

                }
                else if (forecastHour >= 12 && forecastHour < 17) {

                    rainTimeText = "this afternoon";

                }
                else {

                    rainTimeText = "later today";

                }

                break;

            }

        }

    }

    let items = [];
    let whyIcon = "";
    let whyText = "";
    let whyClass = "why-sun";

    if (weatherMain === "Tornado") {

        items = [
            { icon: "🏠", label: "Seek indoor shelter" },
            { icon: "⚠️", label: "Move to an interior room away from windows" }
        ];

        whyIcon = "🌪";
        whyClass = "why-rain";
        whyText = "Tornado warning! Move to an interior room and stay away from windows.";

    }
    else if (weatherMain === "Thunderstorm") {

        items = [
            { icon: "🏠", label: "Stay indoors" },
            { icon: "⚡", label: "Avoid open areas and tall trees" },
            { icon: "☂", label: "Carry waterproof gear" }
        ];

        whyIcon = "⛈";
        whyClass = "why-rain";
        whyText = "Thunderstorms expected. Avoid outdoor activities and seek shelter if storms develop.";

    }
    else if (weatherMain === "Snow") {

        items = [
            { icon: "🧥", label: "Warm Jacket" },
            { icon: "🧣", label: "Scarf & gloves" },
            { icon: "☕", label: "Hot beverage" }
        ];

        whyIcon = "❄️";
        whyClass = "why-cold";
        whyText = "Snow expected today. Wear warm clothing.";

    }
    else if (weatherMain === "Drizzle") {

        items = [
            { icon: "☂", label: "Carry an umbrella" },
            { icon: "🧥", label: "Light waterproof jacket" }
        ];

        whyIcon = "🌦";
        whyClass = "why-rain";
        whyText = "Light drizzle expected today. Carry an umbrella if you'll be outdoors.";

    }
    else if (
        isRainCondition(weatherMain) ||
        (upcomingRain && weatherMain !== "Snow")
    ) {

        items = [
            { icon: "☂", label: "Carry an umbrella" },
            { icon: "👟", label: "Waterproof shoes" }
        ];

        if (temp > 30) {
            items.push({ icon: "👕", label: "Lightweight quick-dry clothing" });
        }

        whyIcon = "🌧";
        whyClass = "why-rain";

        if (isRainCondition(weatherMain)) {

            whyText = "Heavy rain expected today.";

        } else {

            whyText = `Heavy rain expected ${rainTimeText}.`;

        }

    }
    else if (
        weatherMain === "Mist" ||
        weatherMain === "Fog" ||
        weatherMain === "Haze" ||
        weatherMain === "Smoke" ||
        weatherMain === "Dust" ||
        weatherMain === "Sand" ||
        weatherMain === "Ash"
    ) {

        items = [
            { icon: "🚗", label: "Drive carefully" },
            { icon: "💡", label: "Use headlights" },
            { icon: "⚠️", label: "Watch slippery roads" }
        ];

        whyIcon = "🌫";
        whyClass = "why-cold";
        whyText = `Reduced visibility due to ${weatherMain.toLowerCase()}. Drive carefully and use headlights.`;

    }
    else if (weatherMain === "Clear" && temp >= 28) {
        items = [
            { icon: "🧢", label: "Cap" },
            { icon: "🕶", label: "Sunglasses" },
            { icon: "🧴", label: "Sunscreen" }
        ];
        whyIcon = "☀";
        whyClass = "why-sun";
        if (temp >= 32) {
            whyText = `High temperature (${Math.round(temp)}°C) expected today.`;
        } else {
            whyText = "Warm and sunny weather expected today.";
        }
    } else if (temp <= 10) {
        items = [
            { icon: "🧥", label: "Warm Jacket" },
            { icon: "🧣", label: "Scarf & gloves" },
            { icon: "☕", label: "Hot beverage" }
        ];
        whyIcon = "❄️";
        whyClass = "why-cold";
        whyText = `Cold temperatures (${Math.round(temp)}°C) expected today.`;
    } else if (temp <= 18) {
        items = [
            { icon: "🧥", label: "Warm Jacket" },
            { icon: "🧣", label: "Scarf" },
            { icon: "👟", label: "Closed shoes" }
        ];
        whyIcon = "🧥";
        whyClass = "why-cold";
        whyText = `Cool weather (${Math.round(temp)}°C) throughout the day.`;
    } else if (windSpeed >= 25) {
        items = [
            { icon: "🧥", label: "Windbreaker" },
            { icon: "🕶", label: "Sunglasses" },
            { icon: "🧢", label: "Secure cap" }
        ];
        whyIcon = "💨";
        whyClass = "why-cold";
        whyText = `High winds up to ${windSpeed} km/h predicted.`;
    } else if (humidity >= 80 && temp >= 24) {
        items = [
            { icon: "👕", label: "Light cotton clothes" },
            { icon: "💧", label: "Water bottle" },
            { icon: "🕶", label: "Sunglasses" }
        ];
        whyIcon = "💦";
        whyClass = "why-sun";
        whyText = `High humidity level (${humidity}%) today.`;
    } else {
        items = [
            { icon: "👕", label: "Light cotton clothes" },
            { icon: "🕶", label: "Sunglasses" },
            { icon: "👟", label: "Comfortable shoes" }
        ];
        whyIcon = "☀";
        whyClass = "why-sun";
        whyText = `Pleasant temperatures (${Math.round(temp)}°C) today.`;
    }

    essentialsItems.innerHTML = items.map(item => `
        <div class="essential-item">
            <span class="essential-icon">${item.icon}</span>
            <span class="essential-label">${item.label}</span>
        </div>
    `).join("");

    whyBody.className = `why-body ${whyClass}`;
    whyBody.innerHTML = `
        <span class="why-icon">${whyIcon}</span>
        <span class="why-text">${whyText}</span>
    `;
}

function updateOutdoorScore(temp, rawWeather, humidity, wind, forecastData, airData) {

    const weather = formatWeatherMain(rawWeather);
    let penalty = 0;
    const aqi = airData?.list?.[0]?.main?.aqi ?? 1;
    const upcomingRain = hasUpcomingRain(forecastData);
    const upcomingThunderstorm = hasUpcomingThunderstorm(forecastData);
    let status = "Excellent";
    let description = "Great day for walking, running & cycling.";

    // Weather condition score penalties
    if (weather === "Tornado") {
        penalty += 6;
    }
    else if (weather === "Thunderstorm") {
        penalty += 6;
    }
    else if (weather === "Snow") {
        penalty += 5;
    }
    else if (upcomingThunderstorm) {
        penalty += 5;
    }
    else if (
        weather === "Rain" ||
        weather === "Drizzle" ||
        weather === "Squall"
    ) {
        penalty += 2;
    }
    else if (
        weather === "Mist" ||
        weather === "Fog" ||
        weather === "Haze" ||
        weather === "Smoke" ||
        weather === "Dust" ||
        weather === "Sand" ||
        weather === "Ash"
    ) {
        penalty += 1;
    }
    else if (upcomingRain) {
        penalty += 2;
    }

    switch (aqi) {

        case 3:
            penalty += 1;
            break;

        case 4:
            penalty += 2;
            break;

        case 5:
            penalty += 3;
            break;

    }

    // Very hot
    if (temp >= 38) {

        penalty += 3;

    }
    else if (temp >= 33) {

        penalty += 2;

    }

    // Very cold
    if (temp <= 5) {

        penalty += 2;

    }
    else if (temp <= 12) {

        penalty += 1;

    }

    // High humidity
    if (humidity >= 90) {

        penalty += 2;

    }
    else if (humidity >= 75) {

        penalty += 1;

    }

    // Strong wind
    if (wind >= 25) {
        penalty += 1;
    }

    let score;

    if (penalty <= 1) {

        score = 5;

    }
    else if (penalty <= 3) {

        score = 4;

    }
    else if (penalty <= 5) {

        score = 3;

    }
    else if (penalty <= 7) {

        score = 2;

    }
    else {

        score = 1;

    }

    let statusClass = "excellent";
    if (score === 5) {
        status = "Excellent";
        statusClass = "excellent";
        description = "Great day for walking, running & cycling.";
    }
    else if (score === 4) {
        status = "Good";
        statusClass = "good";
        description = "Enjoy outdoor activities with a few precautions.";
    }
    else if (score === 3) {
        status = "Fair";
        statusClass = "fair";
        description = "Outdoor activities are possible, but plan carefully.";
    }
    else if (score === 2) {
        status = "Poor";
        statusClass = "poor";
        description = "Outdoor activities are not recommended.";
    }
    else {
        status = "Very Poor";
        statusClass = "very-poor";
        description = "Better to stay indoors today.";
    }

    if (stars) {
        stars.textContent = "★".repeat(score) + "☆".repeat(5 - score);
        stars.setAttribute("aria-label", `${score} out of 5 stars`);
    }
    if (scoreStatus) {

        scoreStatus.textContent = status;

        scoreStatus.className = `score-status ${statusClass}`;

    }

    if (stars) {
        stars.className = `stars ${statusClass}`;
    }

    if (scoreDescription) scoreDescription.textContent = description;
}

function updateForecast(forecastData) {

    const hourlyForecast = forecastData.list.slice(0, 6);

    hourlyForecast.forEach((item, index) => {

        const cardElements = forecastCardElements[index];

        if (!cardElements) return;

        const forecastTime = new Date(item.dt * 1000);

        cardElements.time.textContent = forecastTime.toLocaleTimeString([], {
            hour: "numeric"
        });

        cardElements.temp.textContent = `${Math.round(item.main.temp)}°C`;

        cardElements.icon.src = getWeatherIcon(item.weather[0].main);

    });

}

searchButton.addEventListener("click", searchWeather);

searchInput.addEventListener("keydown", function (event) {

    const isDropdownVisible = suggestionsBox && !suggestionsBox.classList.contains("hidden");
    const suggestionItems = suggestionsBox ? suggestionsBox.querySelectorAll(".suggestion-item") : [];

    if (isDropdownVisible && suggestionItems.length > 0) {

        if (event.key === "ArrowDown") {

            event.preventDefault();
            let nextIndex = selectedSuggestionIndex + 1;
            if (nextIndex >= suggestionItems.length) {
                nextIndex = 0;
            }
            updateHighlightedSuggestion(nextIndex);
            return;

        } else if (event.key === "ArrowUp") {

            event.preventDefault();
            let prevIndex = selectedSuggestionIndex - 1;
            if (prevIndex < 0) {
                prevIndex = suggestionItems.length - 1;
            }
            updateHighlightedSuggestion(prevIndex);
            return;

        } else if (event.key === "Escape") {

            event.preventDefault();
            suggestionsBox.classList.add("hidden");
            selectedSuggestionIndex = -1;
            return;

        } else if (event.key === "Enter") {

            if (selectedSuggestionIndex >= 0 && currentSuggestions[selectedSuggestionIndex]) {
                event.preventDefault();
                selectSuggestion(currentSuggestions[selectedSuggestionIndex]);
                return;
            }

        }

    } else if (event.key === "Escape") {

        if (suggestionsBox) suggestionsBox.classList.add("hidden");
        selectedSuggestionIndex = -1;
        return;

    }

    if (event.key === "Enter") {

        if (suggestionsBox) suggestionsBox.classList.add("hidden");
        selectedSuggestionIndex = -1;
        searchWeather();

    }

});

if (favoriteButton) {
    favoriteButton.addEventListener("click", () => {
        saveFavorite(
            currentWeatherData,
            currentLatitude,
            currentLongitude
        );
    });
}


document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {

        if (suggestionsBox) suggestionsBox.classList.add("hidden");
        selectedSuggestionIndex = -1;

    }
});

displayFavorites();

showSkeleton();

getCurrentLocation();

setInterval(() => {

    if (currentTimezone !== null) {

        updateDate(currentTimezone);

    }

}, CLOCK_INTERVAL_MS);


searchInput.addEventListener("focus", () => {

    const query = searchInput.value.trim();
    if (query.length === 0) {
        showRecentSearches();
    } else if (query.length >= 2) {
        showSuggestions();
    }

});

searchInput.addEventListener("input", () => {

    clearTimeout(suggestionTimeout);
    const query = searchInput.value.trim();

    if (query.length === 0) {
        showRecentSearches();
    } else if (query.length < 2) {
        currentSuggestions = [];
        selectedSuggestionIndex = -1;
        if (suggestionsBox) {
            suggestionsBox.innerHTML = "";
            suggestionsBox.classList.add("hidden");
        }
    } else {
        suggestionTimeout = setTimeout(() => {
            showSuggestions();
        }, DEBOUNCE_DELAY_MS);
    }

});

viewForecastButton.addEventListener("click", () => {

    displayForecastModal();

});

closeModal.addEventListener("click", () => {

    forecastModal.classList.add("hidden");

});

forecastModal.addEventListener("click", (e) => {

    if (e.target === forecastModal) {

        forecastModal.classList.add("hidden");

    }

});

