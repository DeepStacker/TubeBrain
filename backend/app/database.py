"""Async SQLAlchemy database engine and session factory."""

import redis.asyncio as redis
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# Determine if using Supabase/pgbouncer (pooler URL contains 'pooler.supabase.com')
# pgbouncer in transaction mode requires statement_cache_size=0
is_supabase_pooler = 'pooler.supabase.com' in settings.DATABASE_URL

connect_args = {}
if is_supabase_pooler:
    # Disable prepared statement caching for pgbouncer compatibility
    connect_args["prepared_statement_cache_size"] = 0
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Redis Connection Pool ──
_redis_pool = None
_redis_client = None


async def init_redis_pool() -> None:
    """Initialize Redis connection pool."""
    global _redis_pool, _redis_client
    _redis_pool = redis.ConnectionPool.from_url(
        settings.REDIS_URL,
        max_connections=50,
        decode_responses=True,
    )
    _redis_client = redis.Redis(connection_pool=_redis_pool)


async def get_redis() -> redis.Redis:
    """Get Redis client from pool."""
    global _redis_client
    if _redis_client is None:
        await init_redis_pool()
    return _redis_client


async def close_redis_pool() -> None:
    """Close Redis connection pool."""
    global _redis_pool, _redis_client
    if _redis_client:
        await _redis_client.close()
    if _redis_pool:
        await _redis_pool.disconnect()


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
