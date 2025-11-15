"""add max_stores column to companies

Revision ID: f6b7928a4b69
Revises: 3e0d67344305
Create Date: 2025-11-16 00:24:29.553957

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6b7928a4b69'
down_revision = '3e0d67344305'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add max_stores column to companies table
    op.add_column('companies', sa.Column('max_stores', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    # Remove max_stores column from companies table
    op.drop_column('companies', 'max_stores')
