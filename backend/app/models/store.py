from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Store(Base):
    __tablename__ = "quick_store__stores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("quick_store__companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    track_inventory = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="stores")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    combos = relationship("Combo", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="store", cascade="all, delete-orphan")
    customer_names = relationship("CustomerName", back_populates="store", cascade="all, delete-orphan")
