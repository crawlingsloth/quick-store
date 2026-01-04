"""add unit system

Revision ID: 194285429d4f
Revises: 40830494e3af
Create Date: 2026-01-04 12:25:23.986151

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '194285429d4f'
down_revision = '40830494e3af'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Step 1: Create UnitType enum (implicitly created with table)
    unit_type_enum = postgresql.ENUM('weight', 'volume', 'count', 'length', name='unittype')

    # Step 2: Create units table
    op.create_table(
        'quick_store__units',
        sa.Column('code', sa.String(10), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('type', unit_type_enum, nullable=False),
        sa.Column('base_multiplier', sa.Numeric(20, 10), nullable=False),
        sa.Column('is_base', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('symbol', sa.String(10), nullable=False),
        sa.PrimaryKeyConstraint('code')
    )

    # Step 3: Seed units with predefined data
    units_data = [
        # WEIGHT (base: kg)
        ("kg", "Kilogram", "weight", "1.0", True, "kg"),
        ("g", "Gram", "weight", "0.001", False, "g"),
        ("mg", "Milligram", "weight", "0.000001", False, "mg"),
        ("lbs", "Pound", "weight", "0.453592", False, "lbs"),
        ("oz", "Ounce", "weight", "0.0283495", False, "oz"),
        # VOLUME (base: L)
        ("L", "Liter", "volume", "1.0", True, "L"),
        ("mL", "Milliliter", "volume", "0.001", False, "mL"),
        ("gal", "Gallon", "volume", "3.78541", False, "gal"),
        ("fl_oz", "Fluid Ounce", "volume", "0.0295735", False, "fl oz"),
        # COUNT (base: unit)
        ("unit", "Unit", "count", "1.0", True, "unit"),
        ("dozen", "Dozen", "count", "12.0", False, "dz"),
        ("pack", "Pack", "count", "1.0", False, "pack"),
        # LENGTH (base: m)
        ("m", "Meter", "length", "1.0", True, "m"),
        ("cm", "Centimeter", "length", "0.01", False, "cm"),
        ("mm", "Millimeter", "length", "0.001", False, "mm"),
        ("ft", "Foot", "length", "0.3048", False, "ft"),
        ("in", "Inch", "length", "0.0254", False, "in"),
    ]

    for code, name, unit_type, multiplier, is_base, symbol in units_data:
        op.execute(
            f"INSERT INTO quick_store__units (code, name, type, base_multiplier, is_base, symbol) "
            f"VALUES ('{code}', '{name}', '{unit_type}', {multiplier}, {is_base}, '{symbol}')"
        )

    # Step 4: Add unit columns to products table
    op.add_column('quick_store__products',
                  sa.Column('base_unit', sa.String(10), nullable=True))
    op.add_column('quick_store__products',
                  sa.Column('price_per_unit', sa.Numeric(10, 2), nullable=True))

    # Step 5: Create foreign key after units are seeded
    op.create_foreign_key(
        'fk_product_base_unit',
        'quick_store__products', 'quick_store__units',
        ['base_unit'], ['code']
    )

    # Step 6: Alter inventory column from Integer to Numeric
    op.alter_column(
        'quick_store__products',
        'inventory',
        type_=sa.Numeric(14, 4),
        postgresql_using='inventory::numeric(14,4)'
    )

    # Step 7: Add unit columns to order_items table
    op.add_column('quick_store__order_items',
                  sa.Column('sold_in_unit', sa.String(10), nullable=True))
    op.add_column('quick_store__order_items',
                  sa.Column('base_unit', sa.String(10), nullable=True))
    op.add_column('quick_store__order_items',
                  sa.Column('quantity_in_base', sa.Numeric(14, 4), nullable=True))

    # Step 8: Alter quantity column in order_items
    op.alter_column(
        'quick_store__order_items',
        'quantity',
        type_=sa.Numeric(14, 4),
        postgresql_using='quantity::numeric(14,4)'
    )

    # Step 9: Update existing order_items to populate quantity_in_base
    op.execute(
        "UPDATE quick_store__order_items "
        "SET quantity_in_base = quantity "
        "WHERE quantity_in_base IS NULL"
    )

    # Step 10: Alter combo_items quantity for consistency
    op.alter_column(
        'quick_store__combo_items',
        'quantity',
        type_=sa.Numeric(14, 4),
        postgresql_using='quantity::numeric(14,4)'
    )


def downgrade() -> None:
    # Reverse all changes in reverse order

    # Revert combo_items quantity
    op.alter_column(
        'quick_store__combo_items',
        'quantity',
        type_=sa.Integer(),
        postgresql_using='ROUND(quantity)::integer'
    )

    # Revert order_items quantity
    op.alter_column(
        'quick_store__order_items',
        'quantity',
        type_=sa.Integer(),
        postgresql_using='ROUND(quantity)::integer'
    )

    # Remove order_items columns
    op.drop_column('quick_store__order_items', 'quantity_in_base')
    op.drop_column('quick_store__order_items', 'base_unit')
    op.drop_column('quick_store__order_items', 'sold_in_unit')

    # Revert products inventory
    op.alter_column(
        'quick_store__products',
        'inventory',
        type_=sa.Integer(),
        postgresql_using='ROUND(inventory)::integer'
    )

    # Remove products columns and foreign key
    op.drop_constraint('fk_product_base_unit', 'quick_store__products', type_='foreignkey')
    op.drop_column('quick_store__products', 'price_per_unit')
    op.drop_column('quick_store__products', 'base_unit')

    # Drop units table
    op.drop_table('quick_store__units')

    # Drop enum type
    op.execute('DROP TYPE unittype')
