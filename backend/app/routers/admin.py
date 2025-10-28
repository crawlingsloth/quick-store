from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..models import User, Company
from ..schemas.user import UserCreate, UserUpdate, UserResponse, UserPasswordChange
from ..schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from ..security import get_password_hash
from ..dependencies import get_current_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Create a new company (admin only)"""
    company = Company(
        name=company_data.name,
        currency_symbol=company_data.currency_symbol,
        created_by=admin.id
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/companies", response_model=List[CompanyResponse])
async def list_companies(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """List all companies (admin only)"""
    companies = db.query(Company).all()
    return companies


@router.patch("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Update a company (admin only)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if company_data.name is not None:
        company.name = company_data.name
    if company_data.currency_symbol is not None:
        company.currency_symbol = company_data.currency_symbol
    if company_data.max_stores is not None:
        company.max_stores = company_data.max_stores

    db.commit()
    db.refresh(company)
    return company


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Create a new user and optionally assign to a company (admin only)"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # If company_id is provided, verify it exists
    if user_data.company_id:
        company = db.query(Company).filter(Company.id == user_data.company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        company_id=user_data.company_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Reload with company relationship
    user = db.query(User).options(joinedload(User.company)).filter(User.id == user.id).first()
    return user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """List all users (admin only)"""
    users = db.query(User).options(joinedload(User.company)).all()
    return users


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Update a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.email is not None:
        # Check if email already exists for another user
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        user.email = user_data.email

    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    if user_data.company_id is not None:
        # Verify company exists
        company = db.query(Company).filter(Company.id == user_data.company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        user.company_id = user_data.company_id

    db.commit()
    db.refresh(user)
    # Reload with company relationship
    user = db.query(User).options(joinedload(User.company)).filter(User.id == user_id).first()
    return user


@router.post("/users/{user_id}/change-password", response_model=UserResponse)
async def change_user_password(
    user_id: str,
    password_data: UserPasswordChange,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Change a user's password (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update password
    user.password_hash = get_password_hash(password_data.new_password)

    db.commit()
    db.refresh(user)
    # Reload with company relationship
    user = db.query(User).options(joinedload(User.company)).filter(User.id == user_id).first()
    return user
