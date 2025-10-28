from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class CustomerNameResponse(BaseModel):
    id: UUID
    store_id: UUID
    name: str
    last_used: datetime

    class Config:
        from_attributes = True
