from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., ge=1)


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    product_name: str
    quantity: int
    price: Decimal

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=100)


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    is_paid: bool = False


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=100)
    items: Optional[List[OrderItemCreate]] = Field(None, min_length=1)
    is_paid: Optional[bool] = None


class OrderResponse(OrderBase):
    id: UUID
    store_id: UUID
    total: Decimal
    is_paid: bool
    is_edited: bool
    created_at: datetime
    created_by: UUID
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class BulkUpdatePaymentRequest(BaseModel):
    order_ids: List[UUID] = Field(..., min_length=1, max_length=100)
    is_paid: bool


class BulkUpdateResult(BaseModel):
    order_id: UUID
    success: bool
    error: Optional[str] = None


class BulkUpdatePaymentResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[BulkUpdateResult]
