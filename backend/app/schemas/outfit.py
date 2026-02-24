from datetime import datetime
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from .item import ItemOut

class OutfitBase(BaseModel):
    name: str
    description: Optional[str] = None

class OutfitCreate(OutfitBase):
    item_ids: List[UUID]

class OutfitOut(OutfitBase):
    id: UUID
    owner_id: UUID
    items: List[ItemOut]
    created_at: datetime

    class Config:
        from_attributes = True
