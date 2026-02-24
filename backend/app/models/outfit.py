import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# Association table for Outfit <-> Item (Many-to-Many)
outfit_items = Table(
    "outfit_items",
    Base.metadata,
    Column("outfit_id", UUID(as_uuid=True), ForeignKey("outfits.id", ondelete="CASCADE"), primary_key=True),
    Column("item_id", UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
)

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="outfits")
    items = relationship("Item", secondary=outfit_items, backref="outfits")
