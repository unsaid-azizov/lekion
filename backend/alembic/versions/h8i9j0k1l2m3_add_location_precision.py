"""add location_precision to users

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-04-14
"""
import sqlalchemy as sa
from alembic import op

revision = "h8i9j0k1l2m3"
down_revision = "g7h8i9j0k1l2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("location_precision", sa.String(20), nullable=False, server_default="city"))


def downgrade() -> None:
    op.drop_column("users", "location_precision")
