"""Telegram bot webhook."""
import uuid

from fastapi import APIRouter, Request
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.database import get_db
from app.models.bot_chat import BotChat
from app.models.user import User
from app.services.telegram_bot import announce_new_member, notify_user_approved, _post

router = APIRouter()

ADMIN_PASSWORD = "LekionForFuture2026!"


async def _save_group(db, chat: dict) -> None:
    chat_type = chat.get("type", "")
    if chat_type not in ("group", "supergroup"):
        return
    stmt = pg_insert(BotChat).values(
        chat_id=chat["id"],
        title=chat.get("title"),
    ).on_conflict_do_update(
        index_elements=["chat_id"],
        set_={"title": chat.get("title")},
    )
    await db.execute(stmt)
    await db.commit()


@router.post("/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()

    async for db in get_db():
        # ── Callback query (inline button press) ──
        callback = data.get("callback_query")
        if callback:
            callback_id = callback["id"]
            chat_id = callback["message"]["chat"]["id"]
            message_id = callback["message"]["message_id"]
            raw = callback.get("data", ":")
            action, user_id_str = raw.split(":", 1) if ":" in raw else (raw, "")

            try:
                user_id = uuid.UUID(user_id_str)
            except ValueError:
                await _post("answerCallbackQuery", callback_query_id=callback_id, text="Ошибка")
                return {"ok": True}

            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if not user:
                await _post("answerCallbackQuery", callback_query_id=callback_id, text="Пользователь не найден")
                return {"ok": True}

            if action == "approve":
                user.status = "approved"
                await db.commit()
                await db.refresh(user)
                await notify_user_approved(user)
                await announce_new_member(user, db)
                answer = f"✅ {user.first_name} {user.last_name} одобрен"
            elif action == "reject":
                user.status = "rejected"
                await db.commit()
                answer = f"❌ {user.first_name} {user.last_name} отклонён"
            else:
                answer = "Неизвестное действие"

            await _post("answerCallbackQuery", callback_query_id=callback_id, text=answer)
            await _post("editMessageReplyMarkup", chat_id=chat_id, message_id=message_id, reply_markup={"inline_keyboard": []})
            return {"ok": True}

        # ── Regular message ──
        message = data.get("message") or data.get("edited_message")
        if not message:
            return {"ok": True}

        chat = message.get("chat", {})
        await _save_group(db, chat)

        text = (message.get("text") or "").strip()
        sender = message.get("from", {})
        sender_tg_id = sender.get("id")

        if not text.startswith("/admin"):
            return {"ok": True}

        parts = text.split(maxsplit=1)
        password = parts[1].strip() if len(parts) > 1 else ""

        if password != ADMIN_PASSWORD:
            await _post("sendMessage", chat_id=chat["id"], text="❌ Неверный пароль.")
            return {"ok": True}

        # Find user by telegram_id
        result = await db.execute(select(User).where(User.telegram_id == sender_tg_id))
        user = result.scalar_one_or_none()

        if not user:
            await _post(
                "sendMessage",
                chat_id=chat["id"],
                text="❌ Аккаунт не найден. Сначала войдите на сайте через Telegram.",
            )
            return {"ok": True}

        if user.role == "admin":
            await _post("sendMessage", chat_id=chat["id"], text="✅ Вы уже администратор.")
            return {"ok": True}

        user.role = "admin"
        await db.commit()
        await _post(
            "sendMessage",
            chat_id=chat["id"],
            text=f"✅ {user.first_name}, вы теперь администратор Lekion! Новые заявки будут приходить вам в личку.",
        )

    return {"ok": True}
