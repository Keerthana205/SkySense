# SkySense

SkySense is a modern, responsive personal weather dashboard designed to help users quickly check real-time meteorological conditions and plan their day. It provides current weather data, atmospheric metrics, timezone-aware forecasts, contextual lifestyle recommendations, and an outdoor suitability score.

The project pairs a lightweight, accessible vanilla JavaScript frontend with a Python FastAPI backend that serves as a secure proxy to the OpenWeatherMap API.

---

## Implemented Features

### Real-Time Weather & Atmospheric Conditions
- **Live Metrics**: Displays current temperature in Celsius, dynamic condition titles, and optimized weather graphics.
- **Detailed Atmospheric Stats**: Tracks feels-like temperature, humidity percentage, wind speed (converted from m/s to km/h), and European Air Quality Index (AQI 1–5 scale with color-coded labels).
- **Location Resolution**: Uses reverse geocoding to display accurate city, state/region, and country information.
- **Graceful Geolocation Fallback**: Detects user location via browser geolocation; automatically defaults to London if location access is denied or unavailable, ensuring the UI is never left in an unpopulated state.

### Forecasts & Timezone Awareness
- **Hourly Forecast**: 6-slot (18-hour) forecast in 3-hour increments, accurately adjusted to the target location's local timezone.
- **5-Day Extended Forecast Modal**: Aggregates forecasts into daily high/low temperatures with representative midday (14:00) weather conditions and relative calendar labels ("Today", "Tomorrow"). Accessible via modal dialog with `Escape` key and backdrop dismissal.

### Smart Lifestyle Insights
- **Today's Essentials**: Contextual clothing and gear recommendations based on temperature, wind speed, precipitation forecasts, and day/night status (e.g., warm waterproof jackets in cold rain, sunscreen and sunglasses during warm sunny days, comfortable evening wear at night).
- **Outdoor Activity Score**: Algorithmic 1-to-5 star rating evaluating temperature comfort bands, wind velocity, rain probability, thunderstorms, and air pollution to guide outdoor activities like walking, running, and cycling.

### Search & Personalization
- **City Search with Autocomplete**: Debounced search input (300 ms) with direct geocoding and full keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
- **Recent Searches**: Caches recent search queries in `localStorage` for quick access on focus.
- **Favorite Cities**: Allows saving favorite cities to `localStorage` with active city badges, toast feedback, and one-click loading.
- **Dynamic Day/Night Themes**: Automatically adapts UI background gradients and hero glow effects based on the target city's time of day and weather condition.
- **In-App Toast Notifications**: Clean animated alerts for user feedback, empty searches, and favorite toggles.

---

## Technologies Used

### Frontend
- **HTML5 & CSS3**: Semantic markup, CSS Custom Properties, Flexbox, CSS Grid, shimmer skeleton animations, and responsive breakpoints down to mobile devices.
- **Vanilla JavaScript (ES6+)**: Pure client-side logic for DOM updates, timezone math, and recommendation algorithms without external framework dependencies.
- **Google Fonts**: Poppins font family and Material Symbols Outlined icons.
- **Web Storage API**: `localStorage` for persisting search history and favorite cities across sessions.
- **Web Geolocation API**: `navigator.geolocation` for automatic user position detection.

### Backend
- **Python 3.9+**: Core backend runtime.
- **FastAPI**: Modern, lightweight ASGI web framework for building REST API endpoints.
- **Uvicorn**: High-performance ASGI server for running the FastAPI application.
- **HTTPX**: Asynchronous HTTP client for communicating with upstream weather services.
- **python-dotenv**: Environment configuration management.
- **FastAPI CORSMiddleware**: Secure cross-origin resource sharing configuration.

### External APIs & Services
- **OpenWeatherMap API**: Upstream provider for Current Weather (`/weather`), 5-Day Forecast (`/forecast`), Air Pollution (`/air_pollution`), Direct Geocoding (`/geo/1.0/direct`), and Reverse Geocoding (`/geo/1.0/reverse`).
- **Render**: Cloud platform hosting the live FastAPI backend service (`https://skysense-qcma.onrender.com`).

---

## How It Works

SkySense uses a reverse proxy architecture to protect third-party API credentials:

```
[Browser Client] ──(JSON Request)──> [FastAPI Backend] ──(+ API Key)──> [OpenWeatherMap API]
```

1. **Client Request**: The frontend calls backend endpoints (`/weather`, `/forecast`, `/air-quality`, `/geocode`, `/reverse-geocode`).
2. **Server-Side Security**: The FastAPI backend injects the `OPENWEATHER_API_KEY` stored securely in its environment variables (`.env`) and queries OpenWeatherMap via `httpx`.
3. **Safe Delivery**: The backend handles errors and delivers normalized JSON data back to the client. The API key is never exposed to the browser.

---

## Local Setup

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template and add your OpenWeatherMap API key
cp .env.example .env

# Start FastAPI server on port 8000
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
1. In `script.js`, set `API_BASE` to `"http://localhost:8000"` (or leave the Render URL to use the deployed cloud backend).
2. Serve `index.html` using VS Code Live Server (`http://127.0.0.1:5500`), Python (`python -m http.server 5500`), or simply open `index.html` in your browser.

---

## Project Status

- **Current Status**: Complete, fully functional, and actively maintained as a personal project.
- **Live Backend Deployment**: Deployed on Render (`https://skysense-qcma.onrender.com`). Free-tier instances sleep after inactivity and take approximately 30–50 seconds on the initial wake-up request.

### Planned Improvements
- [ ] Unit toggle between Metric (°C, km/h) and Imperial (°F, mph).
- [ ] Severe weather alert banners when official storm or extreme weather advisories are issued.
- [ ] Automated test suites (Pytest for backend routes, integration testing for frontend calculations).
