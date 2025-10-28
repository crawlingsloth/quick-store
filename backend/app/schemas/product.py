from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    category: Optional[str] = Field(None, max_length=50)
    inventory: Optional[int] = Field(None, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    category: Optional[str] = Field(None, max_length=50)
    inventory: Optional[int] = Field(None, ge=0)


class ProductResponse(ProductBase):
    id: UUID
    store_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
