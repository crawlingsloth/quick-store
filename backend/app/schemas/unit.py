"""
Pydantic schemas for Unit API responses and requests.
"""
from pydantic import BaseModel, Field
from decimal import Decimal


class UnitResponse(BaseModel):
    """Response schema for unit information"""
    code: str = Field(..., description="Unit code (e.g., 'kg', 'L')")
    name: str = Field(..., description="Full name (e.g., 'Kilogram')")
    type: str = Field(..., description="Unit type: weight, volume, count, or length")
    base_multiplier: Decimal = Field(..., description="Conversion factor to base unit")
    is_base: bool = Field(..., description="Whether this is the base unit for its type")
    symbol: str = Field(..., description="Display symbol (e.g., 'kg', 'L')")

    class Config:
        from_attributes = True


class UnitConversionRequest(BaseModel):
    """Request schema for converting between units"""
    quantity: Decimal = Field(..., ge=0, decimal_places=4, description="Quantity to convert")
    from_unit: str = Field(..., min_length=1, max_length=10, description="Source unit code")
    to_unit: str = Field(..., min_length=1, max_length=10, description="Target unit code")


class UnitConversionResponse(BaseModel):
    """Response schema for unit conversion"""
    original_quantity: Decimal = Field(..., description="Original quantity")
    original_unit: str = Field(..., description="Original unit code")
    converted_quantity: Decimal = Field(..., description="Converted quantity")
    converted_unit: str = Field(..., description="Target unit code")
