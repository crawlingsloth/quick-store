from pydantic import BaseModel
from datetime import date, datetime
from uuid import UUID


class SessionResponse(BaseModel):
    id: UUID
    store_id: UUID
    date: date
    exported: bool
    created_at: datetime

    class Config:
        from_attributes = True
