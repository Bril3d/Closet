"""
Analytics API — Wardrobe BI insights endpoints.
"""

from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, extract
from datetime import datetime, timedelta

from app.api.v1 import deps
from app.core.database import get_db
from app.models.item import Item, Tag, item_tags
from app.models.outfit import Outfit, outfit_items
from app.models.user import User

router = APIRouter()


@router.get("/summary")
def get_wardrobe_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Overall wardrobe summary stats."""
    total_items = db.query(func.count(Item.id)).filter(Item.owner_id == current_user.id).scalar() or 0
    total_outfits = db.query(func.count(Outfit.id)).filter(Outfit.owner_id == current_user.id).scalar() or 0
    total_favorites = db.query(func.count(Item.id)).filter(
        Item.owner_id == current_user.id, Item.is_favorite == True
    ).scalar() or 0
    total_categories = db.query(func.count(distinct(Item.category))).filter(
        Item.owner_id == current_user.id
    ).scalar() or 0

    # Wardrobe value (sum of prices)
    total_value = db.query(func.sum(Item.price)).filter(
        Item.owner_id == current_user.id,
        Item.price.isnot(None)
    ).scalar() or 0

    # Average cost per wear
    items_with_price = db.query(Item).filter(
        Item.owner_id == current_user.id,
        Item.price.isnot(None),
        Item.times_worn > 0
    ).all()
    avg_cpw = 0
    if items_with_price:
        cpw_list = [i.price / i.times_worn for i in items_with_price]
        avg_cpw = round(sum(cpw_list) / len(cpw_list), 2)

    # Style score: diversity metric (0-100)
    # Based on: category variety, color variety, outfit count
    color_count = db.query(func.count(distinct(Item.color))).filter(
        Item.owner_id == current_user.id
    ).scalar() or 0

    style_score = min(100, int(
        (min(total_categories, 6) / 6 * 30) +
        (min(color_count, 10) / 10 * 30) +
        (min(total_outfits, 10) / 10 * 20) +
        (min(total_items, 20) / 20 * 20)
    ))

    return {
        "total_items": total_items,
        "total_outfits": total_outfits,
        "total_favorites": total_favorites,
        "total_categories": total_categories,
        "total_value": round(float(total_value), 2),
        "avg_cost_per_wear": avg_cpw,
        "style_score": style_score,
    }


@router.get("/category-distribution")
def get_category_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Items per category for pie chart."""
    results = db.query(
        Item.category,
        func.count(Item.id).label("count")
    ).filter(
        Item.owner_id == current_user.id
    ).group_by(Item.category).all()

    return [{"category": r[0] or "Uncategorized", "count": r[1]} for r in results]


@router.get("/color-distribution")
def get_color_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Items per color for color palette visualization."""
    results = db.query(
        Item.color,
        func.count(Item.id).label("count")
    ).filter(
        Item.owner_id == current_user.id
    ).group_by(Item.color).all()

    # Map color names to hex codes for visualization
    COLOR_HEX = {
        "Black": "#111827", "White": "#F9FAFB", "Gray": "#6B7280",
        "Red": "#EF4444", "Blue": "#3B82F6", "Navy": "#1E3A5F",
        "Green": "#22C55E", "Yellow": "#EAB308", "Orange": "#F97316",
        "Pink": "#EC4899", "Purple": "#8B5CF6", "Brown": "#92400E",
        "Beige": "#D2B48C", "Burgundy": "#800020", "Teal": "#14B8A6",
        "Olive": "#6B8E23", "Coral": "#FF7F50", "Lavender": "#B4A7D6",
    }

    return [
        {
            "color": r[0] or "Unknown",
            "hex": COLOR_HEX.get(r[0], "#9CA3AF"),
            "count": r[1],
        }
        for r in results
    ]


@router.get("/timeline")
def get_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Items added over time (grouped by month)."""
    results = db.query(
        func.date_trunc('month', Item.created_at).label("month"),
        func.count(Item.id).label("count")
    ).filter(
        Item.owner_id == current_user.id
    ).group_by("month").order_by("month").all()

    return [
        {
            "month": r[0].strftime("%Y-%m") if r[0] else "Unknown",
            "count": r[1],
        }
        for r in results
    ]


@router.get("/outfit-stats")
def get_outfit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Most and least used items in outfits."""
    from app.services.storage import storage

    # Count how many outfits each item appears in
    item_usage = db.query(
        Item.id,
        Item.category,
        Item.color,
        Item.image_key,
        func.count(outfit_items.c.outfit_id).label("usage_count")
    ).outerjoin(
        outfit_items, Item.id == outfit_items.c.item_id
    ).filter(
        Item.owner_id == current_user.id
    ).group_by(Item.id).order_by(func.count(outfit_items.c.outfit_id).desc()).all()

    most_used = []
    least_used = []

    for r in item_usage[:5]:
        most_used.append({
            "id": str(r[0]),
            "category": r[1],
            "color": r[2],
            "image_url": storage.get_presigned_url(r[3]),
            "usage_count": r[4],
        })

    for r in item_usage[-5:]:
        least_used.append({
            "id": str(r[0]),
            "category": r[1],
            "color": r[2],
            "image_url": storage.get_presigned_url(r[3]),
            "usage_count": r[4],
        })

    return {
        "most_used": most_used,
        "least_used": least_used,
    }


@router.get("/sleeping-items")
def get_sleeping_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Items never used in any outfit — 'sleeping' clothes."""
    from app.services.storage import storage

    # Items that don't appear in any outfit
    used_item_ids = db.query(outfit_items.c.item_id).distinct().subquery()

    sleeping = db.query(Item).filter(
        Item.owner_id == current_user.id,
        ~Item.id.in_(db.query(used_item_ids))
    ).limit(20).all()

    return [
        {
            "id": str(item.id),
            "category": item.category,
            "color": item.color,
            "image_url": storage.get_presigned_url(item.image_key),
            "days_since_added": (datetime.utcnow() - item.created_at.replace(tzinfo=None)).days if item.created_at else 0,
        }
        for item in sleeping
    ]
