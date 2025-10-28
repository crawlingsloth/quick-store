from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Combo, ComboItem, Product, Store
from ..schemas.combo import ComboCreate, ComboUpdate, ComboResponse
from ..dependencies import get_current_store

router = APIRouter(prefix="/api/combos", tags=["Combos"])


@router.post("", response_model=ComboResponse, status_code=status.HTTP_201_CREATED)
async def create_combo(
    combo_data: ComboCreate,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Create a new combo"""
    # Verify all products exist and belong to the store
    product_ids = [item.product_id for item in combo_data.items]
    products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.store_id == store.id
    ).all()

    if len(products) != len(product_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more products not found"
        )

    combo = Combo(
        store_id=store.id,
        name=combo_data.name,
        total_price=combo_data.total_price
    )
    db.add(combo)
    db.flush()  # Get combo.id without committing

    # Add combo items
    for item_data in combo_data.items:
        combo_item = ComboItem(
            combo_id=combo.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity
        )
        db.add(combo_item)

    db.commit()
    db.refresh(combo)
    return combo


@router.get("", response_model=List[ComboResponse])
async def list_combos(
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """List all combos for the current store"""
    combos = db.query(Combo).filter(Combo.store_id == store.id).all()
    return combos


@router.get("/{combo_id}", response_model=ComboResponse)
async def get_combo(
    combo_id: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Get a specific combo"""
    combo = db.query(Combo).filter(
        Combo.id == combo_id,
        Combo.store_id == store.id
    ).first()

    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    return combo


@router.patch("/{combo_id}", response_model=ComboResponse)
async def update_combo(
    combo_id: str,
    combo_data: ComboUpdate,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Update a combo"""
    combo = db.query(Combo).filter(
        Combo.id == combo_id,
        Combo.store_id == store.id
    ).first()

    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    if combo_data.name is not None:
        combo.name = combo_data.name
    if combo_data.total_price is not None:
        combo.total_price = combo_data.total_price
    if combo_data.items is not None:
        # Verify all products exist
        product_ids = [item.product_id for item in combo_data.items]
        products = db.query(Product).filter(
            Product.id.in_(product_ids),
            Product.store_id == store.id
        ).all()

        if len(products) != len(product_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more products not found"
            )

        # Delete existing items
        db.query(ComboItem).filter(ComboItem.combo_id == combo.id).delete()

        # Add new items
        for item_data in combo_data.items:
            combo_item = ComboItem(
                combo_id=combo.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity
            )
            db.add(combo_item)

    db.commit()
    db.refresh(combo)
    return combo


@router.delete("/{combo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_combo(
    combo_id: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Delete a combo"""
    combo = db.query(Combo).filter(
        Combo.id == combo_id,
        Combo.store_id == store.id
    ).first()

    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    db.delete(combo)
    db.commit()
    return None
