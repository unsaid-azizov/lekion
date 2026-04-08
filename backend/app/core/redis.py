import redis.asyncio as redis

from app.config import settings


class RedisClient:
    def __init__(self):
        self._redis: redis.Redis | None = None

    async def initialize(self):
        self._redis = redis.from_url(settings.redis_url, decode_responses=True)

    async def close(self):
        if self._redis:
            await self._redis.close()

    @property
    def r(self) -> redis.Redis:
        assert self._redis is not None, "Redis not initialized"
        return self._redis

    async def blacklist_token(self, jti: str, ttl_seconds: int):
        await self.r.setex(f"blacklist:{jti}", ttl_seconds, "1")

    async def is_blacklisted(self, jti: str) -> bool:
        return await self.r.exists(f"blacklist:{jti}") > 0


redis_client = RedisClient()
