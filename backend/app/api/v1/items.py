from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
import uuid

from app.api.v1 import deps
from app.core.database import get_db
from app.models.item import Item, Tag
from app.models.user import User
from app.schemas.item import ItemOut, TagOut, ItemUpdate, ClassificationResult
from app.services.storage import storage
from app.services.ai_service import ai_service

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

def _item_to_out(item: Item) -> ItemOut:
    """Helper to convert Item model to ItemOut schema with presigned URL."""
    return ItemOut(
        id=item.id,
        owner_id=item.owner_id,
        image_url=storage.get_presigned_url(item.image_key),
        category=item.category,
        color=item.color,
        description=item.description,
        is_favorite=item.is_favorite,
        created_at=item.created_at,
        tags=[TagOut(id=t.id, name=t.name) for t in item.tags],
        price=item.price if hasattr(item, 'price') else None,
        times_worn=item.times_worn if hasattr(item, 'times_worn') else 0,
    )

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
    price: float = Form(None),
    tags_json: str = Form("[]"), # Expecting JSON string of tags
) -> Any:
    """
    Create new item with image upload, AI classification, and background removal.
    """
    import json
    try:
        tag_list = json.loads(tags_json)
    except:
        tag_list = []

    # 1. Read file data
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "bin"
    file_key = f"users/{current_user.id}/{uuid.uuid4()}.{file_extension}"
    
    try:
        file_data = file.file.read()
        
        # 2. Remove background
        file_data = ai_service.remove_background(file_data)
        
        # 3. Upload to MinIO
        storage.upload_file(
            file_data=file_data,
            file_key=file_key,
            content_type="image/png"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    # 4. AI Classification if metadata is missing
    final_category = category
    final_color = color
    if not final_category or not final_color:
        ai_results = ai_service.classify_image(file_data)
        if not final_category:
            final_category = ai_results.get("category", "Tops")
        if not final_color:
            final_color = ai_results.get("dominant_color", "Unknown")
        
        # Auto-add AI-suggested tags if user didn't provide any
        if not tag_list:
            suggested = ai_results.get("attributes", {})
            for key, value in suggested.items():
                if value and value != "Unknown":
                    tag_list.append(value.lower())

    # 5. Save Item and Tags
    db_tags = get_or_create_tags(db, tag_list)

    item = Item(
        owner_id=current_user.id,
        image_key=file_key,
        category=final_category,
        color=final_color,
        description=description,
        is_favorite=is_favorite,
        tags=db_tags
    )
    
    # Set price if provided and column exists
    if price is not None and hasattr(item, 'price'):
        item.price = price
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return _item_to_out(item)

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
    return [_item_to_out(item) for item in items]

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
    
    return _item_to_out(item)

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

@router.post("/classify", response_model=ClassificationResult)
def classify_item(
    *,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Classify an item image using AI (FashionSigLIP).
    Returns category, subcategory, color, confidence, attributes, and suggested tags.
    """
    file.file.seek(0)
    file_data = file.file.read()
    
    results = ai_service.classify_image(file_data)
    suggested_tags = ai_service.suggest_tags(file_data)
    results["suggested_tags"] = suggested_tags
    
    return results

@router.patch("/{item_id}", response_model=ItemOut)
def update_item(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    item_id: uuid.UUID,
    item_in: ItemUpdate,
) -> Any:
    """
    Update an item.
    """
    item = db.query(Item).filter(Item.id == item_id, Item.owner_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(item, field):
            setattr(item, field, value)
    
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return _item_to_out(item)
