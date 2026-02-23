from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import uuid

from app.api.v1 import deps
from app.core.database import get_db
from app.models.item import Item
from app.models.user import User
from app.schemas.item import ItemOut, ItemCreate
from app.services.storage import storage

router = APIRouter()

@router.post("/", response_model=ItemOut)
def create_item(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    file: UploadFile = File(...),
    category: str = Form(None),
    color: str = Form(None),
    description: str = Form(None),
    is_favorite: bool = Form(False),
) -> Any:
    """
    Create new item with image upload.
    """
    # 1. Upload to MinIO
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
    file_key = f"users/{current_user.id}/{uuid.uuid4()}.{file_extension}"
    
    try:
        file_data = file.file.read()
        storage.upload_file(
            file_data=file_data,
            file_key=file_key,
            content_type=file.content_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    # 2. Save to DB
    item = Item(
        owner_id=current_user.id,
        image_key=file_key,
        category=category,
        color=color,
        description=description,
        is_favorite=is_favorite
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # 3. Add generated URL to response
    return ItemOut(
        id=item.id,
        owner_id=item.owner_id,
        image_url=storage.get_presigned_url(item.image_key),
        category=item.category,
        color=item.color,
        description=item.description,
        is_favorite=item.is_favorite,
        created_at=item.created_at
    )

@router.get("/", response_model=List[ItemOut])
def read_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve user items.
    """
    items = db.query(Item).filter(Item.owner_id == current_user.id).offset(skip).limit(limit).all()
    
    # Add presigned URLs
    results = []
    for item in items:
        results.append(ItemOut(
            id=item.id,
            owner_id=item.owner_id,
            image_url=storage.get_presigned_url(item.image_key),
            category=item.category,
            color=item.color,
            description=item.description,
            is_favorite=item.is_favorite,
            created_at=item.created_at
        ))
    
    return results

@router.get("/{item_id}", response_model=ItemOut)
def read_item(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    item_id: uuid.UUID,
) -> Any:
    """
    Get item by ID.
    """
    item = db.query(Item).filter(Item.id == item_id, Item.owner_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return ItemOut(
        id=item.id,
        owner_id=item.owner_id,
        image_url=storage.get_presigned_url(item.image_key),
        category=item.category,
        color=item.color,
        description=item.description,
        is_favorite=item.is_favorite,
        created_at=item.created_at
    )

@router.delete("/{item_id}")
def delete_item(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    item_id: uuid.UUID,
) -> Any:
    """
    Delete item.
    """
    item = db.query(Item).filter(Item.id == item_id, Item.owner_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Delete from S3
    storage.delete_file(item.image_key)
    
    # Delete from DB
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}
