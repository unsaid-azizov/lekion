"""Telegram bot webhook — handles inline button callbacks."""
import uuid

from fastapi import APIRouter, Request
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.services.telegram_bot import announce_new_member, notify_user_approved, _post

router = APIRouter()


@router.post("/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()

    callback = data.get("callback_query")
    if not callback:
        return {"ok": True}

    callback_id = callback["id"]
    chat_id = callback["message"]["chat"]["id"]
    message_id = callback["message"]["message_id"]
    action, user_id_str = callback.get("data", ":").split(":", 1)

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        await _post("answerCallbackQuery", callback_query_id=callback_id, text="Неверный ID")
        return {"ok": True}

    async for db in get_db():
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
            await announce_new_member(user)
            answer = f"✅ {user.first_name} {user.last_name} одобрен"
        elif action == "reject":
            user.status = "rejected"
            await db.commit()
            answer = f"❌ {user.first_name} {user.last_name} отклонён"
        else:
            answer = "Неизвестное действие"

        await _post("answerCallbackQuery", callback_query_id=callback_id, text=answer)
        # Update the message to remove buttons
        await _post(
            "editMessageReplyMarkup",
            chat_id=chat_id,
            message_id=message_id,
            reply_markup={"inline_keyboard": []},
        )

    return {"ok": True}
