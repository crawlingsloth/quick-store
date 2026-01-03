from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Company(Base):
    __tablename__ = "quick_store__companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    currency_symbol = Column(String, default="$", nullable=False)
    max_stores = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=True)  # Removed FK to avoid circular dependency

    # Relationships
    users = relationship("User", back_populates="company")
    stores = relationship("Store", back_populates="company", cascade="all, delete-orphan")
