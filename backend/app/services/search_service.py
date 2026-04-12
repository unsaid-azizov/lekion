import math

from sqlalchemy import Select, case, func, literal, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.business import Business
from app.models.user import User


def _tsqueries(q: str):
    """Build tsqueries for both russian-stemmed and simple prefix matching."""
    words = q.strip().split()
    if not words:
        return None, None
    prefix_expr = " & ".join(f"{w}:*" for w in words)
    simple_tsq = func.to_tsquery("simple", prefix_expr)
    russian_tsq = func.to_tsquery("russian", prefix_expr)
    return simple_tsq, russian_tsq


def _ilike_boost(col, q):
    """Return 1.0 if col contains q as substring, else 0.0."""
    return case((col.ilike(f"%{q}%"), literal(1.0)), else_=literal(0.0))


def apply_user_search(query: Select, q: str | None, profession: str | None, city: str | None, country: str | None, *, for_count: bool = False) -> Select:
    query = query.where(User.status == "approved", User.is_visible_on_map.is_(True))

    if q:
        q = q.strip()
        simple_tsq, russian_tsq = _tsqueries(q)
        full_name = func.concat(User.first_name, " ", User.last_name)
        name_sim = func.similarity(full_name, q)
        first_sim = func.similarity(func.coalesce(User.first_name, ""), q)
        last_sim = func.similarity(func.coalesce(User.last_name, ""), q)
        prof_sim = func.similarity(func.coalesce(User.profession, ""), q)
        city_sim = func.similarity(func.coalesce(User.city, ""), q)

        name_hit = _ilike_boost(full_name, q)
        prof_hit = _ilike_boost(func.coalesce(User.profession, ""), q)
        city_hit = _ilike_boost(func.coalesce(User.city, ""), q)
        bio_hit = _ilike_boost(func.coalesce(User.bio, ""), q)

        filters = [
            name_sim > 0.15,
            first_sim > 0.3,
            last_sim > 0.3,
            prof_sim > 0.15,
            city_sim > 0.3,
            name_hit == 1.0,
            prof_hit == 1.0,
            city_hit == 1.0,
            bio_hit == 1.0,
        ]
        if simple_tsq is not None:
            filters.append(User.search_vector.op("@@")(simple_tsq))
            filters.append(User.search_vector.op("@@")(russian_tsq))

        query = query.where(or_(*filters))

        if not for_count:
            best_name = func.greatest(name_sim, first_sim, last_sim)
            rank = name_hit * 5 + prof_hit * 4 + bio_hit * 3 + city_hit * 2 + best_name * 2 + prof_sim
            if simple_tsq is not None:
                ts_rank = func.ts_rank_cd(User.search_vector, simple_tsq) + func.ts_rank_cd(User.search_vector, russian_tsq)
                rank = rank + ts_rank * 20
            admin_boost = case((User.role == "admin", literal(100.0)), else_=literal(0.0))
            query = query.order_by((rank + admin_boost).desc())

    if not q and not for_count:
        admin_boost = case((User.role == "admin", literal(1.0)), else_=literal(0.0))
        query = query.order_by(admin_boost.desc(), User.created_at.asc())

    if profession:
        query = query.where(User.profession.ilike(f"%{profession}%"))
    if city:
        query = query.where(User.city.ilike(f"%{city}%"))
    if country:
        query = query.where(User.country == country)
    return query


def apply_business_search(
    query: Select,
    q: str | None,
    category_id: str | None,
    city: str | None,
    country: str | None,
    tags: list[str] | None,
    min_rating: float | None,
    *,
    for_count: bool = False,
) -> Select:
    query = query.where(Business.is_active.is_(True))

    if q:
        q = q.strip()
        simple_tsq, russian_tsq = _tsqueries(q)
        name_sim = func.similarity(Business.name, q)
        city_sim = func.similarity(func.coalesce(Business.city, ""), q)

        name_hit = _ilike_boost(Business.name, q)
        desc_hit = _ilike_boost(func.coalesce(Business.description, ""), q)
        city_hit = _ilike_boost(func.coalesce(Business.city, ""), q)
        addr_hit = _ilike_boost(func.coalesce(Business.address, ""), q)

        filters = [name_sim > 0.15, city_sim > 0.3, name_hit == 1.0, desc_hit == 1.0, city_hit == 1.0, addr_hit == 1.0]
        if simple_tsq is not None:
            filters.append(Business.search_vector.op("@@")(simple_tsq))
            filters.append(Business.search_vector.op("@@")(russian_tsq))

        query = query.where(or_(*filters))

        if not for_count:
            rank = name_hit * 5 + desc_hit * 3 + city_hit * 2 + addr_hit + name_sim * 2
            if simple_tsq is not None:
                ts_rank = func.ts_rank_cd(Business.search_vector, simple_tsq) + func.ts_rank_cd(Business.search_vector, russian_tsq)
                rank = rank + ts_rank * 20
            query = query.order_by(rank.desc())

    if category_id:
        query = query.where(Business.category_id == category_id)
    if city:
        query = query.where(Business.city.ilike(f"%{city}%"))
    if country:
        query = query.where(Business.country == country)
    if tags:
        query = query.where(Business.tags.op("&&")(tags))
    if min_rating is not None:
        query = query.where(Business.average_rating >= min_rating)
    return query


async def paginate(db: AsyncSession, query: Select, count_query: Select, page: int, per_page: int) -> dict:
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    result = await db.execute(query.offset((page - 1) * per_page).limit(per_page))
    items = list(result.scalars().all())

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if per_page else 0,
    }
