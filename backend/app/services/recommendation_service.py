"""
Recommendation Service — AI outfit generation based on wardrobe data.
Uses color harmony, category balance, style consistency, and weather awareness.
"""

import random
import logging
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.models.item import Item
from app.models.outfit import outfit_items

logger = logging.getLogger(__name__)

# Color harmony rules (complementary pairs)
COLOR_HARMONY = {
    "Black": ["White", "Red", "Pink", "Blue", "Gray", "Beige", "Coral", "Lavender"],
    "White": ["Black", "Navy", "Blue", "Red", "Green", "Brown", "Teal", "Purple"],
    "Gray": ["Black", "White", "Blue", "Pink", "Purple", "Red", "Teal"],
    "Navy": ["White", "Beige", "Red", "Pink", "Coral", "Gray", "Brown"],
    "Blue": ["White", "Gray", "Brown", "Beige", "Orange", "Coral"],
    "Red": ["Black", "White", "Navy", "Gray", "Beige", "Blue"],
    "Green": ["White", "Black", "Brown", "Beige", "Navy"],
    "Brown": ["White", "Blue", "Beige", "Green", "Navy", "Teal"],
    "Beige": ["Navy", "Brown", "Black", "White", "Blue", "Burgundy", "Olive"],
    "Pink": ["Black", "Navy", "Gray", "White", "Blue"],
    "Purple": ["White", "Gray", "Black", "Beige", "Pink"],
    "Yellow": ["Navy", "Blue", "White", "Gray", "Black"],
    "Orange": ["Navy", "Blue", "White", "Black", "Brown"],
    "Burgundy": ["Beige", "White", "Navy", "Gray", "Black"],
    "Teal": ["White", "Black", "Beige", "Gray", "Brown"],
    "Olive": ["White", "Beige", "Brown", "Black", "Navy"],
    "Coral": ["Navy", "White", "Blue", "Beige", "Gray"],
    "Lavender": ["White", "Black", "Gray", "Navy", "Beige"],
}

# Required category composition for a valid outfit
OUTFIT_TEMPLATES = [
    {"required": ["Tops", "Bottoms"], "optional": ["Shoes", "Accessories", "Outerwear"]},
    {"required": ["Dress"], "optional": ["Shoes", "Accessories", "Outerwear"]},
]


class RecommendationService:
    """Generate smart outfit recommendations."""

    def recommend_outfit(
        self,
        db: Session,
        user_id: str,
        weather_categories: Optional[List[str]] = None,
        max_items: int = 4,
    ) -> Dict:
        """
        Generate an outfit recommendation.

        Algorithm:
        1. Pick a random outfit template (top+bottom or dress)
        2. Select items with color harmony
        3. Prefer least-used items (diversity boost)
        4. Filter by weather categories if provided
        """
        # Get all user items
        items = db.query(Item).filter(Item.owner_id == user_id).all()

        if not items:
            return {"items": [], "reason": "No items in your closet yet!"}

        # Group by category
        by_category: Dict[str, List[Item]] = {}
        for item in items:
            cat = item.category or "Tops"
            by_category.setdefault(cat, []).append(item)

        # Pick a template
        template = None
        for t in OUTFIT_TEMPLATES:
            if all(cat in by_category for cat in t["required"]):
                template = t
                break

        if not template:
            # Fallback: just return random items
            selected = random.sample(items, min(max_items, len(items)))
            return {
                "items": [self._item_to_dict(i) for i in selected],
                "reason": "Here are some items from your closet!",
            }

        # Build outfit
        outfit_items_list = []
        used_colors = []

        # 1. Select required items
        for cat in template["required"]:
            candidates = by_category.get(cat, [])
            if weather_categories and cat not in weather_categories:
                continue

            # Sort by least used (times_worn ascending) for diversity
            candidates.sort(key=lambda x: getattr(x, 'times_worn', 0) or 0)

            if not used_colors:
                # First item: pick randomly from top 3 least used
                pick = random.choice(candidates[:min(3, len(candidates))])
            else:
                # Subsequent items: prefer color harmony
                pick = self._pick_harmonious(candidates, used_colors)

            outfit_items_list.append(pick)
            if pick.color:
                used_colors.append(pick.color)

        # 2. Add optional items (up to max)
        for cat in template.get("optional", []):
            if len(outfit_items_list) >= max_items:
                break
            candidates = by_category.get(cat, [])
            if not candidates:
                continue
            if weather_categories and cat not in weather_categories:
                continue

            pick = self._pick_harmonious(candidates, used_colors)
            outfit_items_list.append(pick)
            if pick.color:
                used_colors.append(pick.color)

        # Build reason
        color_str = ", ".join(set(used_colors[:3]))
        reason = f"A {color_str} outfit with great color harmony!"

        return {
            "items": [self._item_to_dict(i) for i in outfit_items_list],
            "reason": reason,
            "color_palette": list(set(used_colors)),
        }

    def _pick_harmonious(self, candidates: List[Item], used_colors: List[str]) -> Item:
        """Pick an item that harmonizes with already-selected colors."""
        if not used_colors or not candidates:
            return random.choice(candidates) if candidates else candidates[0]

        # Score each candidate
        scored = []
        for item in candidates:
            score = 0
            item_color = item.color or ""

            for uc in used_colors:
                harmonious = COLOR_HARMONY.get(uc, [])
                if item_color in harmonious:
                    score += 3
                elif item_color == uc:
                    score += 1  # Monochrome is okay but less interesting

            # Diversity bonus: less worn items score higher
            times_worn = getattr(item, 'times_worn', 0) or 0
            score += max(0, 5 - times_worn)

            scored.append((item, score))

        scored.sort(key=lambda x: x[1], reverse=True)

        # Pick from top 3 with some randomness
        top = scored[:min(3, len(scored))]
        return random.choice(top)[0]

    def _item_to_dict(self, item: Item) -> Dict:
        """Convert item to serializable dict."""
        from app.services.storage import storage

        return {
            "id": str(item.id),
            "category": item.category,
            "color": item.color,
            "image_url": storage.get_presigned_url(item.image_key),
            "description": item.description,
            "is_favorite": item.is_favorite,
        }


recommendation_service = RecommendationService()
