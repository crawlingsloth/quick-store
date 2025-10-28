from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class StoreBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    track_inventory: bool = False


class StoreCreate(StoreBase):
    pass


class StoreUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    track_inventory: Optional[bool] = None


class StoreResponse(StoreBase):
    id: UUID
    company_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
