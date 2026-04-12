"""Telegram Bot notifications."""
import httpx

from app.config import settings

_BASE = f"https://api.telegram.org/bot{settings.telegram_bot_token}"


async def _post(method: str, **kwargs) -> dict:
    if not settings.telegram_bot_token:
        return {}
    async with httpx.AsyncClient() as client:
        r = await client.post(f"{_BASE}/{method}", json=kwargs, timeout=10)
        return r.json()


async def notify_admin_new_application(user) -> None:
    """Send admin a message with Approve/Reject buttons when user submits onboarding."""
    if not settings.telegram_admin_chat_id:
        return

    name = f"{user.first_name} {user.last_name}".strip()
    profession = user.profession or "—"
    city = user.city or "—"
    bio = (user.bio or "—")[:200]
    profile_url = f"{settings.frontend_url}/profile/{user.id}"

    text = (
        f"📋 <b>Новая заявка</b>\n\n"
        f"👤 <b>{name}</b>\n"
        f"💼 {profession}\n"
        f"📍 {city}\n"
        f"📝 {bio}\n\n"
        f'<a href="{profile_url}">Открыть профиль</a>'
    )

    await _post(
        "sendMessage",
        chat_id=settings.telegram_admin_chat_id,
        text=text,
        parse_mode="HTML",
        reply_markup={
            "inline_keyboard": [[
                {"text": "✅ Одобрить", "callback_data": f"approve:{user.id}"},
                {"text": "❌ Отклонить", "callback_data": f"reject:{user.id}"},
            ]]
        },
    )


async def notify_user_approved(user) -> None:
    """DM the user when their application is approved."""
    if not user.telegram_id:
        return

    name = user.first_name or "Привет"
    profile_url = f"{settings.frontend_url}/profile/{user.id}"

    await _post(
        "sendMessage",
        chat_id=user.telegram_id,
        text=(
            f"🎉 <b>{name}, добро пожаловать в Lekion!</b>\n\n"
            f"Ваша заявка одобрена. Теперь вы часть лезгинского сообщества.\n\n"
            f'<a href="{settings.frontend_url}">Открыть Lekion</a>'
        ),
        parse_mode="HTML",
    )


async def announce_new_member(user) -> None:
    """Post a member card to the community channel."""
    if not settings.telegram_channel_id:
        return

    name = f"{user.first_name} {user.last_name}".strip()
    profession = user.profession or ""
    city = user.city or ""
    profile_url = f"{settings.frontend_url}/profile/{user.id}"

    lines = [f"👋 <b>Новый участник — {name}</b>"]
    if profession:
        lines.append(f"💼 {profession}")
    if city:
        lines.append(f"📍 {city}")
    if user.bio:
        lines.append(f"\n{user.bio[:300]}")
    lines.append(f'\n<a href="{profile_url}">Профиль в Lekion</a>')

    await _post(
        "sendMessage",
        chat_id=settings.telegram_channel_id,
        text="\n".join(lines),
        parse_mode="HTML",
    )
