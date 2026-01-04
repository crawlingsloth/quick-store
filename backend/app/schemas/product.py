from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    category: Optional[str] = Field(None, max_length=50)
    inventory: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    base_unit: Optional[str] = Field(None, max_length=10)
    price_per_unit: Optional[Decimal] = Field(None, ge=0, decimal_places=2)

    @field_validator('category', 'base_unit', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        """Convert empty strings to None for optional string fields"""
        if v == '' or v == 'null':
            return None
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    category: Optional[str] = Field(None, max_length=50)
    inventory: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    base_unit: Optional[str] = Field(None, max_length=10)
    price_per_unit: Optional[Decimal] = Field(None, ge=0, decimal_places=2)

    @field_validator('category', 'base_unit', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        """Convert empty strings to None for optional string fields"""
        if v == '' or v == 'null':
            return None
        return v


class ProductResponse(ProductBase):
    id: UUID
    store_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
