"""
Suggestions API — Weather-based and AI outfit suggestions.
"""

from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.v1 import deps
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.weather_service import WeatherService
from app.services.recommendation_service import recommendation_service

router = APIRouter()


@router.get("/weather")
def get_weather_suggestion(
    city: str = Query(..., description="City name for weather lookup"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get weather-based clothing suggestions.
    Returns current weather + recommended items from user's closet.
    """
    api_key = getattr(settings, 'OPENWEATHER_API_KEY', None)
    if not api_key:
        raise HTTPException(status_code=500, detail="Weather API key not configured")

    weather_service = WeatherService(api_key)
    weather = weather_service.get_current_weather(city)

    if not weather:
        raise HTTPException(status_code=404, detail=f"Could not fetch weather for '{city}'")

    # Get recommended outfit based on weather categories
    weather_categories = weather.get("recommended_categories", [])
    outfit = recommendation_service.recommend_outfit(
        db=db,
        user_id=str(current_user.id),
        weather_categories=weather_categories,
    )

    return {
        "weather": weather,
        "recommendation": outfit,
    }


@router.get("/outfit")
def get_outfit_suggestion(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get an AI-generated outfit recommendation based on wardrobe.
    Uses color harmony, category balance, and diversity boosting.
    """
    outfit = recommendation_service.recommend_outfit(
        db=db,
        user_id=str(current_user.id),
    )

    return outfit
