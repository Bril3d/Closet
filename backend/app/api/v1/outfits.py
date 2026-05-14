from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.v1 import deps
from app.core.database import get_db
from app.models.outfit import Outfit
from app.models.item import Item
from app.models.user import User
from app.schemas.outfit import OutfitCreate, OutfitOut, OutfitUpdate
from app.schemas.item import ItemOut, TagOut

router = APIRouter()


def _build_item_out(item: Item, base_url: str) -> ItemOut:
    """Convert Item to ItemOut with proxied image URL."""
    return ItemOut(
        id=item.id,
        owner_id=item.owner_id,
        image_url=f"{base_url}/api/v1/images/{item.image_key}",
        category=item.category,
        color=item.color,
        description=item.description,
        is_favorite=item.is_favorite,
        created_at=item.created_at,
        tags=[TagOut(id=t.id, name=t.name) for t in item.tags]
    )


def _build_outfit_out(outfit: Outfit, base_url: str) -> OutfitOut:
    """Convert Outfit to OutfitOut with proxied image URLs."""
    return OutfitOut(
        id=outfit.id,
        name=outfit.name,
        description=outfit.description,
        owner_id=outfit.owner_id,
        created_at=outfit.created_at,
        items=[_build_item_out(item, base_url) for item in outfit.items]
    )


@router.get("/", response_model=List[OutfitOut])
def get_outfits(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve outfits for the current user.
    """
    base_url = str(request.base_url).rstrip("/")
    outfits = db.query(Outfit).filter(Outfit.owner_id == current_user.id).offset(skip).limit(limit).all()
    return [_build_outfit_out(o, base_url) for o in outfits]

@router.post("/", response_model=OutfitOut)
def create_outfit(
    outfit_in: OutfitCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new outfit.
    """
    base_url = str(request.base_url).rstrip("/")
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
    
    return _build_outfit_out(outfit, base_url)

@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get a single outfit by ID.
    """
    base_url = str(request.base_url).rstrip("/")
    outfit = db.query(Outfit).filter(
        Outfit.id == outfit_id,
        Outfit.owner_id == current_user.id
    ).first()
    
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outfit not found"
        )
    
    return _build_outfit_out(outfit, base_url)

@router.put("/{outfit_id}", response_model=OutfitOut)
def update_outfit(
    outfit_id: UUID,
    outfit_in: OutfitUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Update an outfit.
    """
    base_url = str(request.base_url).rstrip("/")
    outfit = db.query(Outfit).filter(
        Outfit.id == outfit_id,
        Outfit.owner_id == current_user.id
    ).first()
    
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outfit not found"
        )
    
    if outfit_in.name is not None:
        outfit.name = outfit_in.name
    if outfit_in.description is not None:
        outfit.description = outfit_in.description
    
    if outfit_in.item_ids is not None:
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
        outfit.items = items
        
    db.commit()
    db.refresh(outfit)
    
    return _build_outfit_out(outfit, base_url)

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
