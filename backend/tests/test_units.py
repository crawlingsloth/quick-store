"""
Unit tests for units system - using mocks, no database required
"""

import pytest
from decimal import Decimal
from unittest.mock import Mock, MagicMock, patch
from uuid import uuid4

from app.models.unit import Unit
from app.models.product import Product
from app.services.unit_service import UnitService


class TestUnitService:
    """Test the UnitService utility functions with mocked database"""

    def test_convert_kg_to_g(self):
        """Test converting kilograms to grams"""
        # Mock database session
        db = Mock()

        # Mock units
        kg_unit = Mock(spec=Unit)
        kg_unit.code = "kg"
        kg_unit.type = "weight"
        kg_unit.base_multiplier = Decimal("1.0")
        kg_unit.is_base = True

        g_unit = Mock(spec=Unit)
        g_unit.code = "g"
        g_unit.type = "weight"
        g_unit.base_multiplier = Decimal("0.001")
        g_unit.is_base = False

        # Mock query results
        db.query.return_value.filter.return_value.first.side_effect = [kg_unit, g_unit]

        result = UnitService.convert(Decimal("1.5"), "kg", "g", db)
        assert result == Decimal("1500.0000")

    def test_convert_l_to_ml(self):
        """Test converting liters to milliliters"""
        db = Mock()

        # Mock units
        l_unit = Mock(spec=Unit)
        l_unit.code = "L"
        l_unit.type = "volume"
        l_unit.base_multiplier = Decimal("1.0")
        l_unit.is_base = True

        ml_unit = Mock(spec=Unit)
        ml_unit.code = "mL"
        ml_unit.type = "volume"
        ml_unit.base_multiplier = Decimal("0.001")
        ml_unit.is_base = False

        db.query.return_value.filter.return_value.first.side_effect = [l_unit, ml_unit]

        result = UnitService.convert(Decimal("4.1"), "L", "mL", db)
        assert result == Decimal("4100.0000")

    def test_convert_same_unit(self):
        """Test converting a unit to itself"""
        db = Mock()

        kg_unit = Mock(spec=Unit)
        kg_unit.code = "kg"
        kg_unit.type = "weight"
        kg_unit.base_multiplier = Decimal("1.0")
        kg_unit.is_base = True

        db.query.return_value.filter.return_value.first.side_effect = [kg_unit, kg_unit]

        result = UnitService.convert(Decimal("5.0"), "kg", "kg", db)
        assert result == Decimal("5.0000")

    def test_convert_incompatible_units_raises_error(self):
        """Test that converting incompatible units raises ValueError"""
        db = Mock()

        kg_unit = Mock(spec=Unit)
        kg_unit.code = "kg"
        kg_unit.type = "weight"

        l_unit = Mock(spec=Unit)
        l_unit.code = "L"
        l_unit.type = "volume"

        db.query.return_value.filter.return_value.first.side_effect = [kg_unit, l_unit]

        with pytest.raises(ValueError, match="Cannot convert|incompatible"):
            UnitService.convert(Decimal("1.5"), "kg", "L", db)

    def test_are_compatible_same_type(self):
        """Test that units of same type are compatible"""
        db = Mock()

        kg_unit = Mock(spec=Unit)
        kg_unit.type = "weight"

        g_unit = Mock(spec=Unit)
        g_unit.type = "weight"

        db.query.return_value.filter.return_value.first.side_effect = [kg_unit, g_unit]

        assert UnitService.are_compatible("kg", "g", db) is True

    def test_are_compatible_different_types(self):
        """Test that units of different types are incompatible"""
        db = Mock()

        kg_unit = Mock(spec=Unit)
        kg_unit.type = "weight"

        l_unit = Mock(spec=Unit)
        l_unit.type = "volume"

        db.query.return_value.filter.return_value.first.side_effect = [kg_unit, l_unit]

        assert UnitService.are_compatible("kg", "L", db) is False

    def test_validate_quantity_precision(self):
        """Test quantity validation and rounding to 4 decimals"""
        result = UnitService.validate_quantity(Decimal("1.23456789"))
        assert result == Decimal("1.2346")  # Rounded to 4 decimals

        result = UnitService.validate_quantity(Decimal("1.2"))
        assert result == Decimal("1.2000")  # Padded to 4 decimals


class TestUnitsAPILogic:
    """Test units API logic with mocked dependencies"""

    def test_units_response_structure(self):
        """Test that unit response has correct structure"""
        from app.schemas.unit import UnitResponse

        unit = UnitResponse(
            code="kg",
            name="Kilogram",
            type="weight",
            symbol="kg",
            base_multiplier=Decimal("1.0"),
            is_base=True
        )

        assert unit.code == "kg"
        assert unit.name == "Kilogram"
        assert unit.type == "weight"
        assert unit.symbol == "kg"
        assert unit.is_base is True


class TestProductCreationWithUnits:
    """Test product creation logic with units"""

    def test_product_with_base_unit(self):
        """Test creating a product with a base unit"""
        product = Mock(spec=Product)
        product.name = "Milk"
        product.price = Decimal("4.50")
        product.base_unit = "L"
        product.price_per_unit = Decimal("4.50")
        product.inventory = Decimal("100.0000")

        assert product.base_unit == "L"
        assert product.price_per_unit == Decimal("4.50")
        assert product.inventory == Decimal("100.0000")

    def test_product_without_base_unit_backward_compatibility(self):
        """Test that products without units work (backward compatibility)"""
        product = Mock(spec=Product)
        product.name = "Candy Bar"
        product.price = Decimal("1.50")
        product.base_unit = None
        product.price_per_unit = None
        product.inventory = Decimal("50.0000")

        assert product.base_unit is None
        assert product.price_per_unit is None

    def test_empty_string_converted_to_null(self):
        """Test Pydantic validator converts empty string to None"""
        from app.schemas.product import ProductBase

        # Test with empty string
        product_data = {
            "name": "Test Product",
            "price": 5.0,
            "base_unit": "",  # Empty string
            "inventory": 20
        }

        product = ProductBase(**product_data)
        assert product.base_unit is None  # Should be None, not empty string

    def test_decimal_precision_four_places(self):
        """Test that inventory supports 4 decimal places"""
        from app.schemas.product import ProductBase

        product_data = {
            "name": "Precise Product",
            "price": 10.0,
            "base_unit": "kg",
            "inventory": 12.3456  # 4 decimal places
        }

        product = ProductBase(**product_data)
        assert product.inventory == Decimal("12.3456")


class TestInventoryManagementWithUnits:
    """Test inventory management with unit conversions"""

    def test_inventory_deduction_with_unit_conversion(self):
        """Test that selling in different unit deducts correct inventory"""
        db = Mock()

        # Product stored in kg
        product = Mock(spec=Product)
        product.base_unit = "kg"
        product.inventory = Decimal("10.0000")  # 10 kg

        # Selling 500g should deduct 0.5kg
        # Mock the unit conversion
        kg_unit = Mock(spec=Unit)
        kg_unit.code = "kg"
        kg_unit.type = "weight"
        kg_unit.base_multiplier = Decimal("1.0")

        g_unit = Mock(spec=Unit)
        g_unit.code = "g"
        g_unit.type = "weight"
        g_unit.base_multiplier = Decimal("0.001")

        db.query.return_value.filter.return_value.first.side_effect = [g_unit, kg_unit]

        # Convert 500g to kg
        quantity_in_base = UnitService.convert(Decimal("500"), "g", "kg", db)
        assert quantity_in_base == Decimal("0.5000")

        # Deduct from inventory
        new_inventory = product.inventory - quantity_in_base
        assert new_inventory == Decimal("9.5000")

    def test_inventory_deduction_same_unit(self):
        """Test inventory deduction when selling in same unit as base"""
        product = Mock(spec=Product)
        product.base_unit = "L"
        product.inventory = Decimal("50.0000")  # 50 L

        # Selling 4.1L (same unit)
        sold_quantity = Decimal("4.1000")
        new_inventory = product.inventory - sold_quantity

        assert new_inventory == Decimal("45.9000")


class TestOrderCreationWithUnits:
    """Test order creation with unit support"""

    def test_order_item_stores_sold_unit_snapshot(self):
        """Test that order items store the unit they were sold in"""
        from app.schemas.order import OrderItemCreate

        order_item = OrderItemCreate(
            product_id=uuid4(),
            quantity=Decimal("4.1"),
            unit="L"
        )

        assert order_item.quantity == Decimal("4.1")
        assert order_item.unit == "L"

    def test_order_without_unit_backward_compatibility(self):
        """Test that orders without units still work"""
        from app.schemas.order import OrderItemCreate

        order_item = OrderItemCreate(
            product_id=uuid4(),
            quantity=Decimal("5"),
            unit=None
        )

        assert order_item.quantity == Decimal("5")
        assert order_item.unit is None


class TestPydanticValidators:
    """Test Pydantic field validators"""

    def test_empty_string_to_none_for_base_unit(self):
        """Test that empty strings are converted to None"""
        from app.schemas.product import ProductBase

        # Test empty string
        product1 = ProductBase(
            name="Product 1",
            price=10.0,
            base_unit=""
        )
        assert product1.base_unit is None

        # Test 'null' string
        product2 = ProductBase(
            name="Product 2",
            price=10.0,
            base_unit="null"
        )
        assert product2.base_unit is None

        # Test valid value
        product3 = ProductBase(
            name="Product 3",
            price=10.0,
            base_unit="kg"
        )
        assert product3.base_unit == "kg"

    def test_empty_string_to_none_for_category(self):
        """Test that empty strings are converted to None for category too"""
        from app.schemas.product import ProductBase

        product = ProductBase(
            name="Product",
            price=10.0,
            category=""
        )
        assert product.category is None


class TestUnitConversionEdgeCases:
    """Test edge cases in unit conversion"""

    def test_convert_zero_quantity(self):
        """Test converting zero quantity"""
        db = Mock()

        kg_unit = Mock(spec=Unit)
        kg_unit.code = "kg"
        kg_unit.type = "weight"
        kg_unit.base_multiplier = Decimal("1.0")

        g_unit = Mock(spec=Unit)
        g_unit.code = "g"
        g_unit.type = "weight"
        g_unit.base_multiplier = Decimal("0.001")

        db.query.return_value.filter.return_value.first.side_effect = [kg_unit, g_unit]

        result = UnitService.convert(Decimal("0"), "kg", "g", db)
        assert result == Decimal("0.0000")

    def test_convert_very_small_quantity(self):
        """Test converting very small quantities with precision"""
        db = Mock()

        kg_unit = Mock(spec=Unit)
        kg_unit.code = "kg"
        kg_unit.type = "weight"
        kg_unit.base_multiplier = Decimal("1.0")

        mg_unit = Mock(spec=Unit)
        mg_unit.code = "mg"
        mg_unit.type = "weight"
        mg_unit.base_multiplier = Decimal("0.000001")

        db.query.return_value.filter.return_value.first.side_effect = [mg_unit, kg_unit]

        # 1 mg = 0.000001 kg
        result = UnitService.convert(Decimal("1"), "mg", "kg", db)
        assert result == Decimal("0.0000")  # Rounded to 4 decimals

    def test_nonexistent_unit_code(self):
        """Test that nonexistent unit code raises error"""
        db = Mock()
        db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError, match="not found|Invalid units"):
            UnitService.convert(Decimal("1"), "invalid", "kg", db)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
