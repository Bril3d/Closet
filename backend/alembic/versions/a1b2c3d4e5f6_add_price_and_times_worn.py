"""Add price and times_worn to items

Revision ID: a1b2c3d4e5f6
Revises: 80b5a475ab16
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'a1b2c3d4e5f6'
down_revision = '80b5a475ab16'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('items', sa.Column('price', sa.Float(), nullable=True))
    op.add_column('items', sa.Column('times_worn', sa.Integer(), server_default='0', nullable=True))


def downgrade():
    op.drop_column('items', 'times_worn')
    op.drop_column('items', 'price')
