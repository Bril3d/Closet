from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
import uuid

from app.api.v1 import deps
from app.core.database import get_db
from app.models.item import Item, Tag
from app.models.user import User
from app.schemas.item import ItemOut, TagOut
from app.services.storage import storage

router = APIRouter()

def get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    tags = []
    for name in tag_names:
        name = name.lower().strip()
        if not name: continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags

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
    tags_json: str = Form("[]"), # Expecting JSON string of tags
) -> Any:
    """
    Create new item with image upload and tagging.
    """
    import json
    try:
        tag_list = json.loads(tags_json)
    except:
        tag_list = []

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

    # 2. Save Item and Tags
    db_tags = get_or_create_tags(db, tag_list)
    
    item = Item(
        owner_id=current_user.id,
        image_key=file_key,
        category=category,
        color=color,
        description=description,
        is_favorite=is_favorite,
        tags=db_tags
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return ItemOut(
        id=item.id,
        owner_id=item.owner_id,
        image_url=storage.get_presigned_url(item.image_key),
        category=item.category,
        color=item.color,
        description=item.description,
        is_favorite=item.is_favorite,
        created_at=item.created_at,
        tags=[TagOut(id=t.id, name=t.name) for t in item.tags]
    )

@router.get("/", response_model=List[ItemOut])
def read_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    is_favorite: Optional[bool] = Query(None),
) -> Any:
    """
    Retrieve user items with filtering.
    """
    query = db.query(Item).filter(Item.owner_id == current_user.id)
    
    if category:
        query = query.filter(Item.category == category)
    if color:
        query = query.filter(Item.color == color)
    if is_favorite is not None:
        query = query.filter(Item.is_favorite == is_favorite)
        
    items = query.offset(skip).limit(limit).all()
    
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
            created_at=item.created_at,
            tags=[TagOut(id=t.id, name=t.name) for t in item.tags]
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
