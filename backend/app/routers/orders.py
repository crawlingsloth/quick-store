from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from datetime import date as date_type
from decimal import Decimal

from ..database import get_db
from ..models import Order, OrderItem, OrderEditHistory, Product, Store, User, CustomerName
from ..schemas.order import OrderCreate, OrderUpdate, OrderResponse, BulkUpdatePaymentRequest, BulkUpdatePaymentResponse, BulkUpdateResult
from ..dependencies import get_current_store, get_current_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def update_inventory(db: Session, product_id: str, quantity_change: int, store: Store):
    """Helper function to update product inventory"""
    if not store.track_inventory:
        return

    product = db.query(Product).filter(Product.id == product_id).first()
    if product and product.inventory is not None:
        product.inventory += quantity_change
        if product.inventory < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product: {product.name}"
            )


def save_customer_name(db: Session, customer_name: str, store_id: str):
    """Helper function to save or update customer name"""
    if not customer_name:
        return

    customer = db.query(CustomerName).filter(
        CustomerName.store_id == store_id,
        CustomerName.name == customer_name
    ).first()

    if customer:
        customer.last_used = datetime.utcnow()
    else:
        customer = CustomerName(
            store_id=store_id,
            name=customer_name
        )
        db.add(customer)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    store: Store = Depends(get_current_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new order"""
    # Verify all products exist and belong to the store
    product_ids = [item.product_id for item in order_data.items]
    products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.store_id == store.id
    ).all()

    if len(products) != len(product_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more products not found"
        )

    # Create product lookup map
    product_map = {str(p.id): p for p in products}

    # Calculate total and prepare order items
    total = Decimal(0)
    order_items_data = []

    for item_data in order_data.items:
        product = product_map[str(item_data.product_id)]

        # Check inventory before creating order
        if store.track_inventory and product.inventory is not None:
            if product.inventory < item_data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient inventory for product: {product.name}"
                )

        item_total = product.price * item_data.quantity
        total += item_total

        order_items_data.append({
            "product_id": item_data.product_id,
            "product_name": product.name,
            "quantity": item_data.quantity,
            "price": product.price
        })

    # Create order
    order = Order(
        store_id=store.id,
        customer_name=order_data.customer_name,
        total=total,
        is_paid=order_data.is_paid,
        created_by=current_user.id
    )
    db.add(order)
    db.flush()  # Get order.id without committing

    # Add order items and update inventory
    for item_data in order_items_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            quantity=item_data["quantity"],
            price=item_data["price"]
        )
        db.add(order_item)

        # Update inventory (deduct)
        update_inventory(db, str(item_data["product_id"]), -item_data["quantity"], store)

    # Save customer name
    save_customer_name(db, order_data.customer_name, str(store.id))

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    date_filter: Optional[str] = None,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """List orders for the current store with optional date filter"""
    query = db.query(Order).filter(Order.store_id == store.id)

    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(
                func.date(Order.created_at) == filter_date
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )

    orders = query.order_by(Order.created_at.desc()).all()
    return orders


@router.get("/today", response_model=List[OrderResponse])
async def list_today_orders(
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """List today's orders for the current store"""
    today = date_type.today()
    orders = db.query(Order).filter(
        Order.store_id == store.id,
        func.date(Order.created_at) == today
    ).order_by(Order.created_at.desc()).all()
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Get a specific order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.store_id == store.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_data: OrderUpdate,
    store: Store = Depends(get_current_store),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.store_id == store.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Save previous state for edit history
    previous_state = {
        "customer_name": order.customer_name,
        "total": float(order.total),
        "items": [
            {
                "product_id": str(item.product_id),
                "product_name": item.product_name,
                "quantity": item.quantity,
                "price": float(item.price)
            }
            for item in order.items
        ]
    }

    # Track if actual order content was edited (not just payment status)
    content_edited = False

    # Update customer name if provided
    if order_data.customer_name is not None:
        if order.customer_name != order_data.customer_name:
            content_edited = True
        order.customer_name = order_data.customer_name
        save_customer_name(db, order_data.customer_name, str(store.id))

    # Update payment status if provided
    if order_data.is_paid is not None:
        order.is_paid = order_data.is_paid

    # Update items if provided
    if order_data.items is not None:
        content_edited = True
        # Restore inventory from old order items
        for old_item in order.items:
            if old_item.product_id:
                update_inventory(db, str(old_item.product_id), old_item.quantity, store)

        # Verify all new products exist
        product_ids = [item.product_id for item in order_data.items]
        products = db.query(Product).filter(
            Product.id.in_(product_ids),
            Product.store_id == store.id
        ).all()

        if len(products) != len(product_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more products not found"
            )

        # Create product lookup map
        product_map = {str(p.id): p for p in products}

        # Calculate new total and prepare new order items
        total = Decimal(0)
        new_order_items = []

        for item_data in order_data.items:
            product = product_map[str(item_data.product_id)]

            # Check inventory
            if store.track_inventory and product.inventory is not None:
                if product.inventory < item_data.quantity:
                    # Restore inventory before raising error
                    for old_item in order.items:
                        if old_item.product_id:
                            update_inventory(db, str(old_item.product_id), -old_item.quantity, store)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient inventory for product: {product.name}"
                    )

            item_total = product.price * item_data.quantity
            total += item_total

            new_order_items.append({
                "product_id": item_data.product_id,
                "product_name": product.name,
                "quantity": item_data.quantity,
                "price": product.price
            })

        # Delete old order items
        db.query(OrderItem).filter(OrderItem.order_id == order.id).delete()

        # Add new order items and update inventory
        for item_data in new_order_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data["product_id"],
                product_name=item_data["product_name"],
                quantity=item_data["quantity"],
                price=item_data["price"]
            )
            db.add(order_item)

            # Update inventory (deduct)
            update_inventory(db, str(item_data["product_id"]), -item_data["quantity"], store)

        order.total = total

    # Mark order as edited and save edit history only if content was changed
    if content_edited:
        order.is_edited = True
        edit_history = OrderEditHistory(
            order_id=order.id,
            edited_by=current_user.id,
            previous_state=previous_state
        )
        db.add(edit_history)

    db.commit()
    db.refresh(order)
    return order


@router.post("/bulk/update-payment", response_model=BulkUpdatePaymentResponse)
async def bulk_update_payment(
    request: BulkUpdatePaymentRequest,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Bulk update payment status for multiple orders"""
    results = []
    successful = 0
    failed = 0

    # Validate all orders belong to the current store
    orders = db.query(Order).filter(
        Order.id.in_(request.order_ids),
        Order.store_id == store.id
    ).all()

    # Create a map of found orders
    order_map = {str(order.id): order for order in orders}

    # Process each order ID
    for order_id in request.order_ids:
        order_id_str = str(order_id)

        if order_id_str not in order_map:
            # Order not found or doesn't belong to store
            results.append(BulkUpdateResult(
                order_id=order_id,
                success=False,
                error="Order not found or access denied"
            ))
            failed += 1
            continue

        try:
            # Update payment status
            order = order_map[order_id_str]
            order.is_paid = request.is_paid
            db.commit()

            results.append(BulkUpdateResult(
                order_id=order_id,
                success=True
            ))
            successful += 1

        except Exception as e:
            db.rollback()
            results.append(BulkUpdateResult(
                order_id=order_id,
                success=False,
                error=str(e)
            ))
            failed += 1

    # Return appropriate status code
    response = BulkUpdatePaymentResponse(
        total=len(request.order_ids),
        successful=successful,
        failed=failed,
        results=results
    )

    return response


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Delete an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.store_id == store.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Restore inventory before deleting
    for item in order.items:
        if item.product_id:
            update_inventory(db, str(item.product_id), item.quantity, store)

    db.delete(order)
    db.commit()
    return None
