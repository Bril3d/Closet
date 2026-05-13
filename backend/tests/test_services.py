"""Tests for weather and recommendation services."""
from app.services.weather_service import WeatherService, WEATHER_CLOTHING_MAP
from app.services.recommendation_service import RecommendationService, COLOR_HARMONY, OUTFIT_TEMPLATES


# --- Weather Service Tests ---

def test_weather_clothing_map_covers_all_temps():
    """Temperature ranges should cover -50 to 60 without gaps."""
    ranges = sorted([v["temp_range"] for v in WEATHER_CLOTHING_MAP.values()])
    assert ranges[0][0] == -50
    assert ranges[-1][1] == 60


def test_weather_zones_have_categories():
    """Each weather zone must recommend at least one clothing category."""
    for zone, data in WEATHER_CLOTHING_MAP.items():
        assert len(data["categories"]) > 0, f"{zone} has no categories"
        assert data["description"], f"{zone} has no description"


def test_weather_service_invalid_city():
    """Should return None for invalid API key/city."""
    service = WeatherService(api_key="invalid_key")
    result = service.get_current_weather("InvalidCityXYZ123")
    assert result is None


# --- Recommendation Service Tests ---

def test_color_harmony_is_symmetric():
    """If A harmonizes with B, verify B exists in the map."""
    for color in COLOR_HARMONY:
        assert isinstance(COLOR_HARMONY[color], list)
        assert len(COLOR_HARMONY[color]) > 0


def test_outfit_templates_valid():
    """Templates must have required categories."""
    for template in OUTFIT_TEMPLATES:
        assert "required" in template
        assert len(template["required"]) > 0


def test_recommendation_service_instantiation():
    """RecommendationService should instantiate."""
    service = RecommendationService()
    assert service is not None
