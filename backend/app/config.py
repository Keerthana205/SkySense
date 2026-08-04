import os
from pathlib import Path
from dotenv import load_dotenv

# Path to backend directory and .env file
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

# Load environment variables from backend/.env
load_dotenv(dotenv_path=ENV_PATH)

# Secret API key used for authenticating requests to OpenWeatherMap
OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

# Allowed origins for Cross-Origin Resource Sharing (CORS) from the frontend
ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500")

# Port number on which the FastAPI application server runs
PORT: int = int(os.getenv("PORT", "8000"))
