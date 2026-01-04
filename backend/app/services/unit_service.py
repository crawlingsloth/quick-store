"""
Unit conversion service for QuickStore.

Provides utility functions for converting between units of measurement,
validating quantities, and checking unit compatibility.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from sqlalchemy.orm import Session

from ..models.unit import Unit


class UnitService:
    """Service for unit conversion and validation"""

    # Precision for all quantity calculations (4 decimal places)
    PRECISION = Decimal('0.0001')

    @staticmethod
    def convert(
        quantity: Decimal,
        from_unit: str,
        to_unit: str,
        db: Session
    ) -> Decimal:
        """
        Convert quantity from one unit to another compatible unit.

        Args:
            quantity: Amount to convert
            from_unit: Source unit code (e.g., "g")
            to_unit: Target unit code (e.g., "kg")
            db: Database session

        Returns:
            Converted quantity rounded to 4 decimal places

        Raises:
            ValueError: If units are invalid or incompatible

        Example:
            >>> convert(Decimal("500"), "g", "kg", db)
            Decimal("0.5000")
        """
        # Same unit, no conversion needed
        if from_unit == to_unit:
            return UnitService.validate_quantity(quantity)

        # Get unit definitions
        from_unit_obj = db.query(Unit).filter(Unit.code == from_unit).first()
        to_unit_obj = db.query(Unit).filter(Unit.code == to_unit).first()

        if not from_unit_obj or not to_unit_obj:
            raise ValueError(f"Invalid units: {from_unit}, {to_unit}")

        # Check compatibility (must be same type)
        if from_unit_obj.type != to_unit_obj.type:
            raise ValueError(
                f"Cannot convert {from_unit_obj.type} to {to_unit_obj.type}"
            )

        # Convert: from_unit → base → to_unit
        # Example: 500g → 0.5kg
        # Step 1: 500 * 0.001 = 0.5 (to base unit kg)
        # Step 2: 0.5 / 1.0 = 0.5 (from base to target)
        in_base = quantity * from_unit_obj.base_multiplier
        result = in_base / to_unit_obj.base_multiplier

        # Round to 4 decimal places
        return result.quantize(UnitService.PRECISION, rounding=ROUND_HALF_UP)

    @staticmethod
    def are_compatible(unit1: str, unit2: str, db: Session) -> bool:
        """
        Check if two units are compatible for conversion.

        Args:
            unit1: First unit code
            unit2: Second unit code
            db: Database session

        Returns:
            True if units are same type and can be converted

        Example:
            >>> are_compatible("kg", "g", db)
            True
            >>> are_compatible("kg", "L", db)
            False
        """
        u1 = db.query(Unit).filter(Unit.code == unit1).first()
        u2 = db.query(Unit).filter(Unit.code == unit2).first()

        if not u1 or not u2:
            return False

        return u1.type == u2.type

    @staticmethod
    def validate_quantity(quantity: Decimal) -> Decimal:
        """
        Validate and round quantity to 4 decimal places.

        Args:
            quantity: Quantity to validate

        Returns:
            Validated and rounded quantity

        Raises:
            ValueError: If quantity is negative

        Example:
            >>> validate_quantity(Decimal("1.23456789"))
            Decimal("1.2346")
        """
        if quantity < 0:
            raise ValueError("Quantity must be non-negative")

        return quantity.quantize(UnitService.PRECISION, rounding=ROUND_HALF_UP)

    @staticmethod
    def get_base_unit_for_type(unit_type: str, db: Session) -> Optional[Unit]:
        """
        Get the base unit for a given unit type.

        Args:
            unit_type: Type of unit ("weight", "volume", "count", or "length")
            db: Database session

        Returns:
            Base unit for the type, or None if not found

        Example:
            >>> get_base_unit_for_type("weight", db).code
            "kg"
        """
        return db.query(Unit).filter(
            Unit.type == unit_type,
            Unit.is_base == True
        ).first()
