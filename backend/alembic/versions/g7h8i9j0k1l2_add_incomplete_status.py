"""add incomplete status, migrate empty pending users

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-04-12
"""
from alembic import op

revision = "g7h8i9j0k1l2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Move pending users with incomplete profiles to new 'incomplete' status
    op.execute("""
        UPDATE users
        SET status = 'incomplete'
        WHERE status = 'pending'
          AND (
            profession IS NULL OR profession = '' OR
            bio IS NULL OR bio = '' OR
            city IS NULL OR city = '' OR
            photo_path IS NULL
          )
    """)


def downgrade() -> None:
    op.execute("UPDATE users SET status = 'pending' WHERE status = 'incomplete'")
