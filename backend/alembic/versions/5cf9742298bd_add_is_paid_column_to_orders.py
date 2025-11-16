"""add is_paid column to orders

Revision ID: 5cf9742298bd
Revises: f6b7928a4b69
Create Date: 2025-11-16 16:57:46.877423

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5cf9742298bd'
down_revision = 'f6b7928a4b69'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add is_paid column to orders table
    op.add_column('orders', sa.Column('is_paid', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove is_paid column from orders table
    op.drop_column('orders', 'is_paid')
