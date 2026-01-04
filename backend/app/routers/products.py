from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Product, Store, Unit
from ..schemas.product import ProductCreate, ProductUpdate, ProductResponse
from ..dependencies import get_current_store

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Create a new product"""
    # Validate base_unit if provided
    if product_data.base_unit:
        unit = db.query(Unit).filter(Unit.code == product_data.base_unit).first()
        if not unit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid unit code: {product_data.base_unit}"
            )

    product = Product(
        store_id=store.id,
        name=product_data.name,
        price=product_data.price,
        category=product_data.category,
        inventory=product_data.inventory if store.track_inventory else None,
        base_unit=product_data.base_unit,
        price_per_unit=product_data.price_per_unit
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = None,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """List all products for the current store"""
    query = db.query(Product).filter(Product.store_id == store.id)

    if category:
        query = query.filter(Product.category == category)

    products = query.all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Get a specific product"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.store_id == store.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Update a product"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.store_id == store.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Validate base_unit if provided
    if product_data.base_unit is not None:
        unit = db.query(Unit).filter(Unit.code == product_data.base_unit).first()
        if not unit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid unit code: {product_data.base_unit}"
            )
        product.base_unit = product_data.base_unit

    if product_data.name is not None:
        product.name = product_data.name
    if product_data.price is not None:
        product.price = product_data.price
    if product_data.category is not None:
        product.category = product_data.category
    if product_data.inventory is not None:
        if store.track_inventory:
            product.inventory = product_data.inventory
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inventory tracking is not enabled for this store"
            )
    if product_data.price_per_unit is not None:
        product.price_per_unit = product_data.price_per_unit

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Delete a product"""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.store_id == store.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return None
