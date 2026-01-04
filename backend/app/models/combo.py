from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Combo(Base):
    __tablename__ = "quick_store__combos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__stores.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    store = relationship("Store", back_populates="combos")
    items = relationship("ComboItem", back_populates="combo", cascade="all, delete-orphan")


class ComboItem(Base):
    __tablename__ = "quick_store__combo_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    combo_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__combos.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Numeric(14, 4), nullable=False)

    # Relationships
    combo = relationship("Combo", back_populates="items")
    product = relationship("Product", back_populates="combo_items")
