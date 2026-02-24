from datetime import datetime
from uuid import UUID
from typing import Optional, List
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

class ItemOut(ItemBase):
    id: UUID
    owner_id: UUID
    image_url: str
    created_at: datetime
    tags: List[TagOut] = []

    class Config:
        from_attributes = True
