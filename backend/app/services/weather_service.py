"""
Weather Service — Integration with OpenWeatherMap API.
Maps weather conditions to clothing recommendations.
"""

import logging
from typing import Optional, Dict, List
import requests

logger = logging.getLogger(__name__)


# Temperature-to-clothing mappings
WEATHER_CLOTHING_MAP = {
    "freezing": {
        "temp_range": (-50, 5),
        "categories": ["Outerwear", "Tops"],
        "description": "Bundle up! Heavy coat, layers, and warm accessories needed.",
        "suggested_attributes": ["wool", "knit", "long sleeves"],
    },
    "cold": {
        "temp_range": (5, 15),
        "categories": ["Outerwear", "Tops", "Bottoms"],
        "description": "Layer up with a jacket and warm clothing.",
        "suggested_attributes": ["long sleeves", "cotton", "denim"],
    },
    "mild": {
        "temp_range": (15, 22),
        "categories": ["Tops", "Bottoms", "Outerwear"],
        "description": "Perfect layering weather. Light jacket optional.",
        "suggested_attributes": ["cotton", "casual"],
    },
    "warm": {
        "temp_range": (22, 30),
        "categories": ["Tops", "Bottoms", "Dress"],
        "description": "Light and breathable clothing recommended.",
        "suggested_attributes": ["short sleeves", "cotton", "linen"],
    },
    "hot": {
        "temp_range": (30, 60),
        "categories": ["Tops", "Bottoms", "Dress", "Accessories"],
        "description": "Stay cool! Lightweight fabrics and sun protection.",
        "suggested_attributes": ["sleeveless", "short sleeves", "linen"],
    },
}


class WeatherService:
    """Fetches weather data and maps to clothing suggestions."""

    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
    GEO_URL = "http://api.openweathermap.org/geo/1.0/direct"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_current_weather(self, city: str) -> Optional[Dict]:
        """Get current weather for a city."""
        try:
            params = {
                "q": city,
                "appid": self.api_key,
                "units": "metric",
            }
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            weather_info = {
                "city": data.get("name", city),
                "country": data.get("sys", {}).get("country", ""),
                "temperature": round(data["main"]["temp"], 1),
                "feels_like": round(data["main"]["feels_like"], 1),
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"].capitalize(),
                "icon": data["weather"][0]["icon"],
                "wind_speed": round(data.get("wind", {}).get("speed", 0), 1),
            }

            # Determine weather zone
            temp = weather_info["temperature"]
            for zone_name, zone_data in WEATHER_CLOTHING_MAP.items():
                low, high = zone_data["temp_range"]
                if low <= temp < high:
                    weather_info["zone"] = zone_name
                    weather_info["clothing_advice"] = zone_data["description"]
                    weather_info["recommended_categories"] = zone_data["categories"]
                    weather_info["suggested_attributes"] = zone_data["suggested_attributes"]
                    break

            # Check for rain
            weather_desc = data["weather"][0].get("main", "").lower()
            if weather_desc in ("rain", "drizzle", "thunderstorm"):
                weather_info["rain_warning"] = True
                weather_info["clothing_advice"] += " Don't forget a waterproof layer!"
            else:
                weather_info["rain_warning"] = False

            return weather_info

        except requests.exceptions.RequestException as e:
            logger.error(f"Weather API error: {e}")
            return None

    def get_weather_by_coords(self, lat: float, lon: float) -> Optional[Dict]:
        """Get current weather by coordinates."""
        try:
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric",
            }
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            return self.get_current_weather(data.get("name", "Unknown"))

        except requests.exceptions.RequestException as e:
            logger.error(f"Weather API error: {e}")
            return None

    def search_cities(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for cities matching a query using the Geocoding API."""
        if not query or len(query) < 2:
            return []
            
        try:
            params = {
                "q": query,
                "limit": limit,
                "appid": self.api_key,
            }
            response = requests.get(self.GEO_URL, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            cities = []
            for item in data:
                city_info = {
                    "name": item.get("name", ""),
                    "country": item.get("country", ""),
                    "state": item.get("state", ""),
                    "lat": item.get("lat"),
                    "lon": item.get("lon"),
                }
                # Create a display name like "Paris, FR" or "Los Angeles, California, US"
                parts = [city_info["name"]]
                if city_info["state"]:
                    parts.append(city_info["state"])
                if city_info["country"]:
                    parts.append(city_info["country"])
                    
                city_info["display_name"] = ", ".join(parts)
                cities.append(city_info)
                
            return cities
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Geocoding API error: {e}")
            return []
