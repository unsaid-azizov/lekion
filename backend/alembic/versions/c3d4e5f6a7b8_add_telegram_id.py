"""add telegram_id to users

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-09
"""

from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("telegram_id", sa.BigInteger(), nullable=True))
    op.create_unique_constraint("users_telegram_id_key", "users", ["telegram_id"])


def downgrade() -> None:
    op.drop_constraint("users_telegram_id_key", "users", type_="unique")
    op.drop_column("users", "telegram_id")
