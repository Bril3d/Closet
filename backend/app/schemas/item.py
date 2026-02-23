from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel

class ItemBase(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_favorite: Optional[bool] = False

class ItemCreate(ItemBase):
    pass

class ItemOut(ItemBase):
    id: UUID
    owner_id: UUID
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True
