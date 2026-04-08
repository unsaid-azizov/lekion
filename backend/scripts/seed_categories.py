"""Seed business categories."""
import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.category import Category

CATEGORIES = [
    ("it", "IT и разработка", "💻", 1),
    ("marketing", "Маркетинг и реклама", "📢", 2),
    ("design", "Дизайн", "🎨", 3),
    ("finance", "Финансы и бухгалтерия", "💰", 4),
    ("legal", "Юридические услуги", "⚖️", 5),
    ("education", "Образование", "📚", 6),
    ("health", "Здоровье и медицина", "🏥", 7),
    ("beauty", "Красота и уход", "✨", 8),
    ("food", "Еда и общепит", "🍽️", 9),
    ("construction", "Строительство и ремонт", "🔨", 10),
    ("transport", "Транспорт и логистика", "🚛", 11),
    ("real-estate", "Недвижимость", "🏠", 12),
    ("tourism", "Туризм и путешествия", "✈️", 13),
    ("trade", "Торговля", "🛒", 14),
    ("consulting", "Консалтинг", "📊", 15),
    ("media", "Медиа и контент", "🎬", 16),
    ("auto", "Авто", "🚗", 17),
    ("other", "Другое", "📦", 99),
]


async def main():
    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        for slug, name_ru, icon, sort_order in CATEGORIES:
            existing = await db.execute(select(Category).where(Category.slug == slug))
            if existing.scalar_one_or_none():
                continue
            db.add(Category(id=uuid.uuid4(), slug=slug, name_ru=name_ru, icon=icon, sort_order=sort_order))
        await db.commit()
        print(f"Seeded {len(CATEGORIES)} categories")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
