"""Database configuration and session management."""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def init_db():
    """Create all database tables and ensure schema migrations are applied."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate_columns(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)
            if "incidents" in inspector.get_table_names():
                existing = {col["name"] for col in inspector.get_columns("incidents")}
                columns_to_add = [
                    ("openrouter_analysis", "JSON"),
                    ("crisis_zone_id", "VARCHAR(100)"),
                    ("crisis_zone_name", "VARCHAR(200)"),
                    ("evolution_history", "JSON"),
                    ("priority_change_reason", "TEXT"),
                ]
                for col_name, col_type in columns_to_add:
                    if col_name not in existing:
                        connection.execute(text(f"ALTER TABLE incidents ADD COLUMN {col_name} {col_type}"))

        await conn.run_sync(_migrate_columns)


async def get_db() -> AsyncSession:
    """Dependency that provides a database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
