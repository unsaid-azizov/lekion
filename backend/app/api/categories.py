from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_member
from app.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.business import CategoryOut

router = APIRouter()


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    _: User = Depends(require_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return list(result.scalars().all())
