"""add search vector triggers and backfill

Revision ID: a1b2c3d4e5f6
Revises: 5cb17b9346e2
Create Date: 2026-04-06
"""
from alembic import op

revision = "a1b2c3d4e5f6"
down_revision = "5cb17b9346e2"
branch_labels = None
depends_on = None


def upgrade():
    # --- Users ---
    op.execute("""
        CREATE OR REPLACE FUNCTION users_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('russian', coalesce(NEW.first_name, '')), 'A') ||
                setweight(to_tsvector('russian', coalesce(NEW.last_name, '')), 'A') ||
                setweight(to_tsvector('russian', coalesce(NEW.profession, '')), 'B') ||
                setweight(to_tsvector('russian', coalesce(NEW.city, '')), 'C') ||
                setweight(to_tsvector('russian', coalesce(NEW.bio, '')), 'D') ||
                setweight(to_tsvector('simple', coalesce(NEW.first_name, '')), 'A') ||
                setweight(to_tsvector('simple', coalesce(NEW.last_name, '')), 'A');
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql
    """)

    op.execute("DROP TRIGGER IF EXISTS users_search_vector_trigger ON users")

    op.execute("""
        CREATE TRIGGER users_search_vector_trigger
            BEFORE INSERT OR UPDATE OF first_name, last_name, profession, city, bio
            ON users
            FOR EACH ROW
            EXECUTE FUNCTION users_search_vector_update()
    """)

    op.execute("""
        UPDATE users SET search_vector =
            setweight(to_tsvector('russian', coalesce(first_name, '')), 'A') ||
            setweight(to_tsvector('russian', coalesce(last_name, '')), 'A') ||
            setweight(to_tsvector('russian', coalesce(profession, '')), 'B') ||
            setweight(to_tsvector('russian', coalesce(city, '')), 'C') ||
            setweight(to_tsvector('russian', coalesce(bio, '')), 'D') ||
            setweight(to_tsvector('simple', coalesce(first_name, '')), 'A') ||
            setweight(to_tsvector('simple', coalesce(last_name, '')), 'A')
    """)

    # --- Businesses ---
    op.execute("""
        CREATE OR REPLACE FUNCTION businesses_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector :=
                setweight(to_tsvector('russian', coalesce(NEW.name, '')), 'A') ||
                setweight(to_tsvector('russian', coalesce(NEW.description, '')), 'B') ||
                setweight(to_tsvector('russian', coalesce(NEW.address, '')), 'C') ||
                setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A');
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql
    """)

    op.execute("DROP TRIGGER IF EXISTS businesses_search_vector_trigger ON businesses")

    op.execute("""
        CREATE TRIGGER businesses_search_vector_trigger
            BEFORE INSERT OR UPDATE OF name, description, address
            ON businesses
            FOR EACH ROW
            EXECUTE FUNCTION businesses_search_vector_update()
    """)

    op.execute("""
        UPDATE businesses SET search_vector =
            setweight(to_tsvector('russian', coalesce(name, '')), 'A') ||
            setweight(to_tsvector('russian', coalesce(description, '')), 'B') ||
            setweight(to_tsvector('russian', coalesce(address, '')), 'C') ||
            setweight(to_tsvector('simple', coalesce(name, '')), 'A')
    """)


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS users_search_vector_trigger ON users")
    op.execute("DROP FUNCTION IF EXISTS users_search_vector_update()")
    op.execute("DROP TRIGGER IF EXISTS businesses_search_vector_trigger ON businesses")
    op.execute("DROP FUNCTION IF EXISTS businesses_search_vector_update()")
    op.execute("UPDATE users SET search_vector = NULL")
    op.execute("UPDATE businesses SET search_vector = NULL")
