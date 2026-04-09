from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://lekion:lekion@localhost:5432/lekion"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"

    telegram_bot_token: str = ""
    telegram_bot_username: str = ""

    frontend_url: str = "http://localhost:3000"

    upload_dir: str = "/data/uploads"
    max_avatar_size: int = 5 * 1024 * 1024  # 5MB
    max_photo_size: int = 10 * 1024 * 1024  # 10MB

    referral_limit: int = 3
    referral_window_days: int = 7

    model_config = {"env_file": ".env"}


settings = Settings()
