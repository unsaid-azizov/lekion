"""Seed test users for development."""

import asyncio
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import async_session
from app.models.user import User

TEST_USERS = [
    {
        "first_name": "Джамалдин",
        "last_name": "Меджидов",
        "profession": "строительство, стройматериалы, лес",
        "bio": "Руководитель отдела продаж в Стройсортимент — топ-3 Москвы в нише пиломатериалов. Лесозаготовка.",
        "city": "Москва",
        "country": "Россия",
        "website": "stroyassortiment.ru",
        "latitude": 55.75,
        "longitude": 37.62,
    },
    {
        "first_name": "Иннара",
        "last_name": "Назаралиева",
        "profession": "архитектура, дизайн, графика",
        "bio": "Архитектор в figura A. Графический дизайнер в Литрес. Фриланс: брендинг, полиграфия, иллюстрация, GIS-анализ.",
        "city": "Москва",
        "country": "Россия",
        "telegram": "@innara_design",
        "latitude": 55.76,
        "longitude": 37.58,
    },
    {
        "first_name": "Залина",
        "last_name": "Хаджиева",
        "profession": "финансы, бухгалтерия, мероприятия",
        "bio": "Финансист в C&U Co. Руководитель Молодёжного департамента ФЛНКА. Член Молодёжного парламента.",
        "city": "Москва",
        "country": "Россия",
        "telegram": "t.me/lezgimolodezh",
        "latitude": 55.73,
        "longitude": 37.65,
    },
    {
        "first_name": "Диана",
        "last_name": "Юзбекова",
        "profession": "медиа, журналистика, ТВ, ведущая",
        "bio": "Ведущая, журналист, редактор, сценарист на МУЗ-ТВ. Стилист фешн-съёмок. Брала интервью у Трампа и голливудских звёзд.",
        "city": "Москва",
        "country": "Россия",
        "website": "dianayuzbek.ru",
        "latitude": 55.78,
        "longitude": 37.55,
    },
    {
        "first_name": "Селим",
        "last_name": "Аллахкулиев",
        "profession": "SEO, сайты, веб-дизайн, разработка",
        "bio": "Руководитель web-студии. Сайты, web-дизайн, Битрикс24, AmoCRM, API-интеграции, 1С. SEO, GEO-продвижение.",
        "city": "Москва",
        "country": "Россия",
        "website": "webstudio-sa.ru",
        "latitude": 55.74,
        "longitude": 37.60,
    },
    {
        "first_name": "Давид",
        "last_name": "Букаров",
        "profession": "товарка, китай, игры, периферия",
        "bio": "Предприниматель, 19 лет. reship.pro — игровая периферия. Доставка из Китая. Сервис игровой валюты и подписок.",
        "city": "Москва",
        "country": "Россия",
        "latitude": 55.72,
        "longitude": 37.67,
    },
    {
        "first_name": "Ильяс",
        "last_name": "Букаров",
        "profession": "туризм, Дагестан, туры, языки",
        "bio": "Гид и организатор туров по Дагестану (dagestunning.ru). Онлайн-школа языков Кавказа (linguacaucasus.com). Английский.",
        "city": "Дагестан",
        "country": "Россия",
        "website": "dagestunning.ru",
        "latitude": 42.98,
        "longitude": 47.50,
    },
    {
        "first_name": "Самира",
        "last_name": "Казиахмедова",
        "profession": "медицина, иммунология, химия",
        "bio": "PhD в Дрездене — иммунология, кортизол и иммунитет (синдром Кушинга). Преподаватель химии/биологии.",
        "city": "Дрезден",
        "country": "Германия",
        "latitude": 51.05,
        "longitude": 13.74,
    },
    {
        "first_name": "Закир",
        "last_name": "Ширинов",
        "profession": "юрист, адвокат, право",
        "bio": "Адвокат. Общие и правовые вопросы. Юридические услуги в Казахстане.",
        "city": "Казахстан",
        "country": "Казахстан",
        "latitude": 43.24,
        "longitude": 76.95,
    },
    {
        "first_name": "Юсуф",
        "last_name": "Магомедов",
        "profession": "судоходство, морской бизнес, логистика",
        "bio": "Основатель логистической компании в Дубае. Морские перевозки, фрахт, экспедирование.",
        "city": "Дубай",
        "country": "ОАЭ",
        "website": "shipping-yusuf.ae",
        "latitude": 25.20,
        "longitude": 55.27,
    },
    {
        "first_name": "Али",
        "last_name": "Рамазанов",
        "profession": "финтех, кредиты, банк, МФО",
        "bio": "Основатель финтех-стартапа. Микрофинансирование, ипотека, кредитный скоринг.",
        "city": "Москва",
        "country": "Россия",
        "latitude": 55.77,
        "longitude": 37.59,
    },
    {
        "first_name": "Фатима",
        "last_name": "Агаева",
        "profession": "HoReCa, кофейня, напитки",
        "bio": "Владелица сети кофеен в Москве и Дагестане. Обжарка specialty-кофе. Обучение бариста.",
        "city": "Москва",
        "country": "Россия",
        "website": "coffeefatima.ru",
        "latitude": 55.71,
        "longitude": 37.63,
    },
    {
        "first_name": "Рустам",
        "last_name": "Шихсаидов",
        "profession": "Турция, логистика, реэкспорт",
        "bio": "Торговля и логистика между Турцией и Россией. Открытие компаний в Турции. ВНЖ.",
        "city": "Стамбул",
        "country": "Турция",
        "latitude": 41.01,
        "longitude": 28.98,
    },
    {
        "first_name": "Лейла",
        "last_name": "Мурадова",
        "profession": "фандрайзинг, НКО, переводчик, ВЭД",
        "bio": "Координатор международных проектов. Грантрайтер. Переводчик EN/RU/TR.",
        "city": "Москва",
        "country": "Россия",
        "latitude": 55.79,
        "longitude": 37.54,
    },
    {
        "first_name": "Магомед",
        "last_name": "Абдулаев",
        "profession": "торговля, открытие компаний, marketplace",
        "bio": "Помогаю открывать бизнес на маркетплейсах. Wildberries, Ozon. Консалтинг.",
        "city": "Москва",
        "country": "Россия",
        "latitude": 55.80,
        "longitude": 37.52,
    },
    {
        "first_name": "Сабина",
        "last_name": "Гасанова",
        "profession": "образование, онлайн-школа, репетитор",
        "bio": "Онлайн-школа по подготовке к ЕГЭ. Математика и физика. 200+ учеников.",
        "city": "Санкт-Петербург",
        "country": "Россия",
        "latitude": 59.93,
        "longitude": 30.32,
    },
    {
        "first_name": "Эмиль",
        "last_name": "Шахмарданов",
        "profession": "IT, разработка, ML, автоматизация",
        "bio": "Senior ML Engineer. Автоматизация бизнес-процессов, NLP, компьютерное зрение.",
        "city": "Берлин",
        "country": "Германия",
        "latitude": 52.52,
        "longitude": 13.41,
    },
    {
        "first_name": "Камиль",
        "last_name": "Исмаилов",
        "profession": "инвестиции, стратегия, Дубай",
        "bio": "Инвестиционный консультант в Дубае. Недвижимость, криптовалюта, стартапы.",
        "city": "Дубай",
        "country": "ОАЭ",
        "latitude": 25.19,
        "longitude": 55.28,
    },
    {
        "first_name": "Амина",
        "last_name": "Султанова",
        "profession": "дизайн интерьеров, архитектура",
        "bio": "Дизайнер интерьеров. Более 50 реализованных проектов в Москве и Дагестане.",
        "city": "Москва",
        "country": "Россия",
        "website": "amina-design.ru",
        "latitude": 55.69,
        "longitude": 37.61,
    },
    {
        "first_name": "Тимур",
        "last_name": "Гаджиев",
        "profession": "спорт, фитнес, тренер",
        "bio": "Персональный тренер и нутрициолог. Основатель фитнес-студии. Подготовка к соревнованиям.",
        "city": "Махачкала",
        "country": "Россия",
        "latitude": 42.97,
        "longitude": 47.50,
    },
]

async def seed():
    async with async_session() as db:
        for data in TEST_USERS:
            email = f"{data['first_name'].lower()}.{data['last_name'].lower()}@test.lekion.com"
            # transliterate for email
            email = (
                email.replace("а", "a").replace("б", "b").replace("в", "v").replace("г", "g")
                .replace("д", "d").replace("е", "e").replace("ё", "e").replace("ж", "zh")
                .replace("з", "z").replace("и", "i").replace("й", "y").replace("к", "k")
                .replace("л", "l").replace("м", "m").replace("н", "n").replace("о", "o")
                .replace("п", "p").replace("р", "r").replace("с", "s").replace("т", "t")
                .replace("у", "u").replace("ф", "f").replace("х", "kh").replace("ц", "ts")
                .replace("ч", "ch").replace("ш", "sh").replace("щ", "sch").replace("ъ", "")
                .replace("ы", "y").replace("ь", "").replace("э", "e").replace("ю", "yu")
                .replace("я", "ya")
            )

            user = User(
                email=email,
                first_name=data["first_name"],
                last_name=data["last_name"],
                profession=data.get("profession"),
                bio=data.get("bio"),
                city=data.get("city"),
                country=data.get("country"),
                website=data.get("website"),
                telegram=data.get("telegram"),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
                referral_code=secrets.token_urlsafe(6)[:8].upper(),
                status="approved",
                email_verified=True,
                is_visible_on_map=True,
            )
            db.add(user)

        await db.commit()
        print(f"Seeded {len(TEST_USERS)} test users")


if __name__ == "__main__":
    asyncio.run(seed())
