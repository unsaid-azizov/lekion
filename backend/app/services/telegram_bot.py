"""Telegram Bot notifications."""
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

_BASE = f"https://api.telegram.org/bot{settings.telegram_bot_token}"


async def _post(method: str, **kwargs) -> dict:
    if not settings.telegram_bot_token:
        return {}
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{_BASE}/{method}", json=kwargs, timeout=10)
        return r.json()


async def notify_admin_new_application(user, db: AsyncSession) -> None:
    """Send all admins with telegram_id a new application notification."""
    from app.models.user import User

    result = await db.execute(
        select(User.telegram_id).where(User.role == "admin", User.telegram_id.is_not(None))
    )
    admin_ids = [row[0] for row in result.all()]
    if not admin_ids:
        return

    name = f"{user.first_name} {user.last_name}".strip()
    profile_url = f"{settings.frontend_url}/profile/{user.id}"
    text = (
        f"📋 <b>Новая заявка</b>\n\n"
        f"👤 <b>{name}</b>\n"
        f"💼 {user.profession or '—'}\n"
        f"📍 {user.city or '—'}\n"
        f"📝 {(user.bio or '—')[:200]}\n\n"
        f'<a href="{profile_url}">Открыть профиль</a>'
    )
    markup = {
        "inline_keyboard": [[
            {"text": "✅ Одобрить", "callback_data": f"approve:{user.id}"},
            {"text": "❌ Отклонить", "callback_data": f"reject:{user.id}"},
        ]]
    }
    for chat_id in admin_ids:
        await _post("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML", reply_markup=markup)


async def notify_user_approved(user) -> None:
    """DM the user when approved."""
    if not user.telegram_id:
        return
    await _post(
        "sendMessage",
        chat_id=user.telegram_id,
        text=(
            f"🎉 <b>{user.first_name}, добро пожаловать в Lekion!</b>\n\n"
            f"Ваша заявка одобрена. Теперь вы часть лезгинского сообщества.\n\n"
            f'<a href="{settings.frontend_url}">Открыть Lekion</a>'
        ),
        parse_mode="HTML",
    )


def _build_intro(user, profile_url: str) -> str:
    name = f"{user.first_name} {user.last_name}".strip()
    lines = [f"#интро <b>{name}</b>", ""]

    if user.profession:
        lines.append(f"💼 <b>{user.profession}</b>")
    if user.city:
        city_country = user.city
        if user.country and user.country != user.city:
            city_country += f", {user.country}"
        lines.append(f"📍 {city_country}")

    bio = (user.bio or "").strip()
    if bio:
        lines.append("")
        if len(bio) > 400:
            lines.append(bio[:400].rstrip() + f'...\n<a href="{profile_url}">читать далее →</a>')
        else:
            lines.append(bio)

    # Contacts
    contacts = []
    if user.telegram:
        tg = user.telegram if user.telegram.startswith("@") else f"@{user.telegram}"
        contacts.append(f'<a href="https://t.me/{user.telegram.lstrip("@")}">{tg}</a>')
    if user.website:
        site = user.website.rstrip("/")
        display = site.replace("https://", "").replace("http://", "")
        contacts.append(f'<a href="{site if site.startswith("http") else "https://" + site}">{display}</a>')
    if user.phone:
        contacts.append(f"📞 {user.phone}")
    if contacts:
        lines.append("")
        lines.append("📬 " + " · ".join(contacts))

    # Businesses
    businesses = getattr(user, "businesses", [])
    if businesses:
        lines.append("")
        lines.append("🏢 <b>Бизнесы:</b>")
        for biz in businesses:
            biz_url = f"{settings.frontend_url}/businesses/{biz.id}"
            cat = biz.category.name_ru if biz.category else ""
            suffix = f" — {cat}" if cat else ""
            lines.append(f'  • <a href="{biz_url}">{biz.name}</a>{suffix}')

    lines.append("")
    lines.append(f'🔗 <a href="{profile_url}">Профиль в Lekion</a>')
    return "\n".join(lines)


async def announce_new_member(user, db: AsyncSession) -> None:
    """Announce approved member to all known groups + DM all users with telegram_id."""
    from app.models.bot_chat import BotChat
    from app.models.user import User

    profile_url = f"{settings.frontend_url}/profile/{user.id}"
    text = _build_intro(user, profile_url)

    # Build recipient lists
    groups_result = await db.execute(select(BotChat.chat_id))
    group_ids = [row[0] for row in groups_result.all()]

    users_result = await db.execute(
        select(User.telegram_id).where(
            User.telegram_id.is_not(None),
            User.telegram_id != user.telegram_id,
            User.status == "approved",
        )
    )
    user_tg_ids = [row[0] for row in users_result.all()]

    all_recipients = group_ids + user_tg_ids

    # Send with photo if available, otherwise plain text
    photo_path = user.photo_path
    if photo_path:
        import os
        full_path = os.path.join(settings.upload_dir, photo_path)
        if os.path.exists(full_path):
            for chat_id in all_recipients:
                async with httpx.AsyncClient() as client:
                    with open(full_path, "rb") as f:
                        await client.post(
                            f"{_BASE}/sendPhoto",
                            data={"chat_id": chat_id, "caption": text, "parse_mode": "HTML"},
                            files={"photo": f},
                            timeout=15,
                        )
            return

    for chat_id in all_recipients:
        await _post("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML")


async def notify_new_business(biz, owner, db: AsyncSession) -> None:
    """Announce new business to all known groups and approved users."""
    from app.models.bot_chat import BotChat
    from app.models.user import User

    biz_url = f"{settings.frontend_url}/businesses/{biz.id}"
    owner_url = f"{settings.frontend_url}/profile/{owner.id}"
    owner_name = f"{owner.first_name} {owner.last_name}".strip()

    lines = [f"🏢 <b>Новый бизнес — {biz.name}</b>", ""]
    if biz.category:
        lines.append(f"📂 {biz.category.name_ru}")
    if biz.city:
        city_line = biz.city
        if biz.country and biz.country != biz.city:
            city_line += f", {biz.country}"
        lines.append(f"📍 {city_line}")
    if biz.description:
        desc = biz.description[:300].rstrip()
        if len(biz.description) > 300:
            desc += "..."
        lines.append(f"\n{desc}")
    lines.append(f'\n👤 Владелец: <a href="{owner_url}">{owner_name}</a>')
    lines.append(f'🔗 <a href="{biz_url}">{biz.name} в Lekion</a>')
    text = "\n".join(lines)

    groups_result = await db.execute(select(BotChat.chat_id))
    group_ids = [row[0] for row in groups_result.all()]

    users_result = await db.execute(
        select(User.telegram_id).where(
            User.telegram_id.is_not(None),
            User.status == "approved",
        )
    )
    user_tg_ids = [row[0] for row in users_result.all()]

    for chat_id in group_ids + user_tg_ids:
        await _post("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML")
