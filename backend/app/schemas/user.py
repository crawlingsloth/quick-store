from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class CompanyInfo(BaseModel):
    """Nested company information for user response"""
    id: UUID
    name: str
    currency_symbol: str
    max_stores: int

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: str = Field(default="user", pattern="^(admin|user)$")
    company_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    company_id: Optional[UUID] = None


class UserResponse(UserBase):
    id: UUID
    role: str
    company_id: Optional[UUID]
    company: Optional[CompanyInfo] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserPasswordChange(BaseModel):
    new_password: str = Field(..., min_length=6)
