"""Add name field to BaseUser model

Revision ID: 202507080942
Revises: b42f7418e3c3
Create Date: 2025-07-08T09:42:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '202507080942'
down_revision = 'fc162b10c2ce'  # Updated to use the current head
branch_labels = None
depends_on = None


def upgrade():
    # Add name column to base_users table
    op.add_column('base_users', sa.Column('name', sa.String(100), nullable=True))


def downgrade():
    # Remove name column from base_users table
    op.drop_column('base_users', 'name')
