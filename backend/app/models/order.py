from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Order(Base):
    __tablename__ = "quick_store__orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__stores.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_name = Column(String, nullable=True)
    total = Column(Numeric(10, 2), nullable=False)
    is_paid = Column(Boolean, default=False, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("quick_store__users.id"), nullable=False)

    # Relationships
    store = relationship("Store", back_populates="orders")
    created_by_user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    edit_history = relationship("OrderEditHistory", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "quick_store__order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String, nullable=False)  # Snapshot for history
    quantity = Column(Numeric(14, 4), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)  # Snapshot for history

    # Unit system fields (snapshots for historical accuracy)
    sold_in_unit = Column(String(10), nullable=True)  # Unit used at sale time
    base_unit = Column(String(10), nullable=True)     # Product's base unit (snapshot)
    quantity_in_base = Column(Numeric(14, 4), nullable=True)  # Converted to base unit

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class OrderEditHistory(Base):
    __tablename__ = "quick_store__order_edit_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__orders.id", ondelete="CASCADE"), nullable=False, index=True)
    edited_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    edited_by = Column(UUID(as_uuid=True), ForeignKey("quick_store__users.id"), nullable=False)
    previous_state = Column(JSONB, nullable=False)  # Store previous order state as JSON

    # Relationships
    order = relationship("Order", back_populates="edit_history")
    edited_by_user = relationship("User", back_populates="order_edits")
