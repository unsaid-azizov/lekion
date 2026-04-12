from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import admin, auth, bot, businesses, categories, map, reviews, users
from app.config import settings
from app.core.redis import redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.initialize()
    yield
    await redis_client.close()


app = FastAPI(title="Lekion Map API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(businesses.router, prefix="/api/v1/businesses", tags=["businesses"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(map.router, prefix="/api/v1/map", tags=["map"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(bot.router, prefix="/api/v1/bot", tags=["bot"])

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")
