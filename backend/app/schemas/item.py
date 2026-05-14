from datetime import datetime
from uuid import UUID
from typing import Optional, List, Dict
from pydantic import BaseModel


class TagOut(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class ItemBase(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_favorite: Optional[bool] = False
    tags: List[str] = []


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_favorite: Optional[bool] = None
    price: Optional[float] = None


class ItemOut(ItemBase):
    id: UUID
    owner_id: UUID
    image_url: str
    created_at: datetime
    tags: List[TagOut] = []
    price: Optional[float] = None
    times_worn: int = 0

    class Config:
        from_attributes = True


# AI Classification response models
class ClassificationPrediction(BaseModel):
    category: str
    subcategory: str
    confidence: float


class ClassificationResult(BaseModel):
    top_predictions: List[ClassificationPrediction]
    category: str
    subcategory: str
    dominant_color: str
    confidence: float
    attributes: Dict[str, str] = {}
    suggested_tags: List[str] = []
