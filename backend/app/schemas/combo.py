from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class ComboItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., ge=1)


class ComboItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int

    class Config:
        from_attributes = True


class ComboBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    total_price: Decimal = Field(..., ge=0, decimal_places=2)


class ComboCreate(ComboBase):
    items: List[ComboItemCreate] = Field(..., min_length=1)


class ComboUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    total_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    items: Optional[List[ComboItemCreate]] = Field(None, min_length=1)


class ComboResponse(ComboBase):
    id: UUID
    store_id: UUID
    created_at: datetime
    items: List[ComboItemResponse]

    class Config:
        from_attributes = True
