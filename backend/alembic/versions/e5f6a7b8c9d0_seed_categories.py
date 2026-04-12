"""seed categories

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-12
"""
import uuid
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None

CATEGORIES = [
    ("it-tech", "ИТ и технологии", "💻", 1),
    ("design-creative", "Дизайн и креатив", "🎨", 2),
    ("marketing-media", "Маркетинг и медиа", "📣", 3),
    ("education-coaching", "Образование и коучинг", "📚", 4),
    ("finance-law", "Финансы и юриспруденция", "⚖️", 5),
    ("medicine-health", "Медицина и здоровье", "🏥", 6),
    ("construction-repair", "Строительство и ремонт", "🏗️", 7),
    ("beauty-wellness", "Красота и уход", "💆", 8),
    ("food-catering", "Еда и кейтеринг", "🍽️", 9),
    ("trade-retail", "Торговля и ритейл", "🛒", 10),
    ("logistics-transport", "Логистика и транспорт", "🚚", 11),
    ("realty", "Недвижимость", "🏠", 12),
    ("tourism-events", "Туризм и мероприятия", "✈️", 13),
    ("production-manufacturing", "Производство", "🏭", 14),
    ("agriculture", "Сельское хозяйство", "🌾", 15),
    ("other", "Другое", "🔹", 99),
]


def upgrade() -> None:
    categories_table = sa.table(
        "categories",
        sa.column("id", sa.UUID),
        sa.column("slug", sa.String),
        sa.column("name_ru", sa.String),
        sa.column("icon", sa.String),
        sa.column("sort_order", sa.Integer),
    )
    op.bulk_insert(
        categories_table,
        [
            {"id": str(uuid.uuid4()), "slug": slug, "name_ru": name, "icon": icon, "sort_order": order}
            for slug, name, icon, order in CATEGORIES
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM categories")
