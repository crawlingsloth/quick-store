from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import CustomerName, Store
from ..schemas.customer import CustomerNameResponse
from ..dependencies import get_current_store

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerNameResponse])
async def list_customer_names(
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Get customer names for autocomplete"""
    customers = db.query(CustomerName).filter(
        CustomerName.store_id == store.id
    ).order_by(CustomerName.last_used.desc()).limit(100).all()

    return customers


@router.get("/names", response_model=List[str])
async def list_customer_names_simple(
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Get simple list of customer names for autocomplete"""
    customers = db.query(CustomerName.name).filter(
        CustomerName.store_id == store.id
    ).order_by(CustomerName.last_used.desc()).limit(100).all()

    return [c.name for c in customers]
