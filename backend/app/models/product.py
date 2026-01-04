from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Product(Base):
    __tablename__ = "quick_store__products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__stores.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    category = Column(String, nullable=True)
    inventory = Column(Numeric(14, 4), nullable=True)  # Null if inventory not tracked
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Unit system fields
    base_unit = Column(String(10), ForeignKey("quick_store__units.code"), nullable=True)
    price_per_unit = Column(Numeric(10, 2), nullable=True)  # Price per single base unit

    # Relationships
    store = relationship("Store", back_populates="products")
    unit_ref = relationship("Unit", foreign_keys=[base_unit])
    combo_items = relationship("ComboItem", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
