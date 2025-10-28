from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Store, User, Company
from ..schemas.store import StoreCreate, StoreUpdate, StoreResponse
from ..dependencies import get_current_user, get_current_company

router = APIRouter(prefix="/api/stores", tags=["Stores"])


@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store_data: StoreCreate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Create a store for the current company"""
    # Check if company has reached max stores limit
    existing_count = db.query(Store).filter(Store.company_id == company.id).count()
    if existing_count >= company.max_stores:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Company has reached the maximum number of stores ({company.max_stores})"
        )

    store = Store(
        company_id=company.id,
        name=store_data.name,
        track_inventory=store_data.track_inventory
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("", response_model=List[StoreResponse])
async def list_stores(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Get all stores for the current company"""
    stores = db.query(Store).filter(Store.company_id == company.id).all()
    return stores


@router.get("/current", response_model=StoreResponse)
async def get_current_store(
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Get the current company's store"""
    store = db.query(Store).filter(Store.company_id == company.id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No store found for this company"
        )
    return store


@router.patch("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: str,
    store_data: StoreUpdate,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Update a store"""
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.company_id == company.id
    ).first()

    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    if store_data.name is not None:
        store.name = store_data.name
    if store_data.track_inventory is not None:
        store.track_inventory = store_data.track_inventory

    db.commit()
    db.refresh(store)
    return store


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store(
    store_id: str,
    company: Company = Depends(get_current_company),
    db: Session = Depends(get_db)
):
    """Delete a store"""
    store = db.query(Store).filter(
        Store.id == store_id,
        Store.company_id == company.id
    ).first()

    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    db.delete(store)
    db.commit()
    return None
