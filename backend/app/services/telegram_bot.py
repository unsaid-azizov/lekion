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


async def announce_new_member(user, db: AsyncSession) -> None:
    """Announce approved member to all known groups + DM all users with telegram_id."""
    from app.models.bot_chat import BotChat
    from app.models.user import User

    name = f"{user.first_name} {user.last_name}".strip()
    profile_url = f"{settings.frontend_url}/profile/{user.id}"

    lines = [f"👋 <b>Новый участник — {name}</b>"]
    if user.profession:
        lines.append(f"💼 {user.profession}")
    if user.city:
        lines.append(f"📍 {user.city}")
    if user.bio:
        lines.append(f"\n{user.bio[:300]}")
    lines.append(f'\n<a href="{profile_url}">Профиль в Lekion</a>')
    text = "\n".join(lines)

    # Send to all known groups
    groups = await db.execute(select(BotChat.chat_id))
    for (chat_id,) in groups.all():
        await _post("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML")

    # DM all users with telegram_id (except the new member themselves)
    users = await db.execute(
        select(User.telegram_id).where(
            User.telegram_id.is_not(None),
            User.telegram_id != user.telegram_id,
            User.status == "approved",
        )
    )
    for (tg_id,) in users.all():
        await _post("sendMessage", chat_id=tg_id, text=text, parse_mode="HTML")
