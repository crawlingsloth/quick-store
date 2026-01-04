from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Unit
from ..schemas.unit import UnitResponse, UnitConversionRequest, UnitConversionResponse
from ..services.unit_service import UnitService

router = APIRouter(prefix="/api/units", tags=["Units"])


@router.get("", response_model=List[UnitResponse])
async def list_units(
    type: Optional[str] = Query(None, description="Filter by unit type: weight, volume, count, or length"),
    db: Session = Depends(get_db)
):
    """List all available units, optionally filtered by type"""
    query = db.query(Unit)

    if type:
        # Validate type
        valid_types = ["weight", "volume", "count", "length"]
        if type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid unit type. Must be one of: {', '.join(valid_types)}"
            )
        query = query.filter(Unit.type == type)

    units = query.order_by(Unit.type, Unit.code).all()
    return units


@router.get("/{code}", response_model=UnitResponse)
async def get_unit(
    code: str,
    db: Session = Depends(get_db)
):
    """Get a specific unit by code"""
    unit = db.query(Unit).filter(Unit.code == code).first()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unit not found: {code}"
        )

    return unit


@router.post("/convert", response_model=UnitConversionResponse)
async def convert_units(
    conversion: UnitConversionRequest,
    db: Session = Depends(get_db)
):
    """Convert a quantity from one unit to another"""
    # Validate units exist
    from_unit = db.query(Unit).filter(Unit.code == conversion.from_unit).first()
    if not from_unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source unit not found: {conversion.from_unit}"
        )

    to_unit = db.query(Unit).filter(Unit.code == conversion.to_unit).first()
    if not to_unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target unit not found: {conversion.to_unit}"
        )

    # Check compatibility
    if not UnitService.are_compatible(conversion.from_unit, conversion.to_unit, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incompatible units: {conversion.from_unit} ({from_unit.type}) and {conversion.to_unit} ({to_unit.type})"
        )

    # Perform conversion
    try:
        converted_quantity = UnitService.convert(
            conversion.quantity,
            conversion.from_unit,
            conversion.to_unit,
            db
        )

        return UnitConversionResponse(
            original_quantity=conversion.quantity,
            original_unit=conversion.from_unit,
            converted_quantity=converted_quantity,
            converted_unit=conversion.to_unit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversion failed: {str(e)}"
        )
