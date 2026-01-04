from sqlalchemy import Column, String, Boolean, Numeric, Enum as SQLEnum
import enum

from ..database import Base


class Unit(Base):
    """
    Reference table for units of measurement.

    Each unit type has one base unit (is_base=True) with base_multiplier=1.0
    All other units are converted relative to their base unit.

    Unit types: weight, volume, count, length

    Examples:
    - WEIGHT: kg (base, 1.0), g (0.001), mg (0.000001), lbs (0.453592)
    - VOLUME: L (base, 1.0), mL (0.001), gal (3.78541)
    - COUNT: unit (base, 1.0), dozen (12.0)
    - LENGTH: m (base, 1.0), cm (0.01), mm (0.001)
    """
    __tablename__ = "quick_store__units"

    code = Column(String(10), primary_key=True)  # e.g., "kg", "L", "unit"
    name = Column(String(50), nullable=False)     # e.g., "Kilogram", "Liter"
    type = Column(String(10), nullable=False)     # "weight", "volume", "count", or "length"
    base_multiplier = Column(Numeric(20, 10), nullable=False)  # Conversion factor to base unit
    is_base = Column(Boolean, default=False, nullable=False)
    symbol = Column(String(10), nullable=False)   # Display symbol: "kg", "L", "dz"
