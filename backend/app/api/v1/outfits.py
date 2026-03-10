from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.v1 import deps
from app.core.database import get_db
from app.models.outfit import Outfit
from app.models.item import Item
from app.models.user import User
from app.schemas.outfit import OutfitCreate, OutfitOut
from app.schemas.item import ItemOut, TagOut
from app.services.storage import storage

router = APIRouter()

@router.get("/", response_model=List[OutfitOut])
def get_outfits(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve outfits for the current user.
    """
    outfits = db.query(Outfit).filter(Outfit.owner_id == current_user.id).offset(skip).limit(limit).all()
    
    results = []
    for o in outfits:
        o_items = []
        for item in o.items:
            o_items.append(ItemOut(
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
        results.append(OutfitOut(
            id=o.id,
            name=o.name,
            description=o.description,
            owner_id=o.owner_id,
            created_at=o.created_at,
            items=o_items
        ))
    return results

@router.post("/", response_model=OutfitOut)
def create_outfit(
    outfit_in: OutfitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new outfit.
    """
    # Verify items belong to user
    items = db.query(Item).filter(
        Item.id.in_(outfit_in.item_ids),
        Item.owner_id == current_user.id
    ).all()
    
    if len(items) != len(outfit_in.item_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more items not found or do not belong to you"
        )

    outfit = Outfit(
        name=outfit_in.name,
        description=outfit_in.description,
        owner_id=current_user.id,
        items=items
    )
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    
    o_items = []
    for item in outfit.items:
        o_items.append(ItemOut(
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

    return OutfitOut(
        id=outfit.id,
        name=outfit.name,
        description=outfit.description,
        owner_id=outfit.owner_id,
        created_at=outfit.created_at,
        items=o_items
    )

@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get a single outfit by ID.
    """
    outfit = db.query(Outfit).filter(
        Outfit.id == outfit_id,
        Outfit.owner_id == current_user.id
    ).first()
    
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outfit not found"
        )
    
    o_items = []
    for item in outfit.items:
        o_items.append(ItemOut(
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

    return OutfitOut(
        id=outfit.id,
        name=outfit.name,
        description=outfit.description,
        owner_id=outfit.owner_id,
        created_at=outfit.created_at,
        items=o_items
    )

@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_outfit(
    outfit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete an outfit.
    """
    outfit = db.query(Outfit).filter(
        Outfit.id == outfit_id,
        Outfit.owner_id == current_user.id
    ).first()
    
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outfit not found"
        )
        
    db.delete(outfit)
    db.commit()
    return None
