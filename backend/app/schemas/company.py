from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    currency_symbol: str = Field(default="$", max_length=5)
    max_stores: int = Field(default=1, ge=1)


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    currency_symbol: Optional[str] = Field(None, max_length=5)
    max_stores: Optional[int] = Field(None, ge=1)


class CompanyResponse(CompanyBase):
    id: UUID
    created_at: datetime
    created_by: Optional[UUID]

    class Config:
        from_attributes = True
