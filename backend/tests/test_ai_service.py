"""Tests for AI service functions."""
from unittest.mock import patch, MagicMock
from app.services.ai_service import AIService, CATEGORY_MAP, SUBCATEGORY_MAP, NAMED_COLORS


def test_category_map_completeness():
    """Every category label should map to a category and subcategory."""
    for label in CATEGORY_MAP:
        assert label in SUBCATEGORY_MAP, f"Missing subcategory for {label}"


def test_named_colors_are_valid_rgb():
    """All named colors should be valid RGB tuples."""
    for name, rgb in NAMED_COLORS.items():
        assert len(rgb) == 3, f"{name} has wrong tuple length"
        for v in rgb:
            assert 0 <= v <= 255, f"{name} has invalid value {v}"


def test_category_groups():
    """All categories should map to known groups."""
    valid_groups = {"Tops", "Bottoms", "Outerwear", "Shoes", "Dress", "Accessories"}
    for label, group in CATEGORY_MAP.items():
        assert group in valid_groups, f"{label} maps to unknown group {group}"


def test_ai_service_instantiation():
    """AIService should instantiate without loading model."""
    service = AIService()
    assert service is not None


def test_classify_image_fallback():
    """classify_image should return graceful fallback on invalid data."""
    service = AIService()
    result = service.classify_image(b"not an image")
    assert "category" in result
    assert "dominant_color" in result
    assert "top_predictions" in result
    assert result["confidence"] == 0.0


def test_detect_color_fallback():
    """detect_color should return Unknown on invalid data."""
    service = AIService()
    result = service.detect_color(b"not an image")
    assert result == "Unknown"


def test_suggest_tags_fallback():
    """suggest_tags should return empty list on invalid data."""
    service = AIService()
    result = service.suggest_tags(b"not an image")
    assert isinstance(result, list)
