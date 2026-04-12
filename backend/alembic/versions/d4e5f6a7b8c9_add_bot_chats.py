"""add bot_chats table

Revision ID: d4e5f6a7b8c9
Revises: e7e07ceaf042
Create Date: 2026-04-12
"""
from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "e7e07ceaf042"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bot_chats",
        sa.Column("chat_id", sa.BigInteger(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("bot_chats")
