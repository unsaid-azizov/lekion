# Lekion Map - Architecture Overview

## System Overview

A directory/map-based web app for the Lezgin community — businesses, professionals, and entrepreneurs displayed on an interactive map with search, profiles, ratings, and reviews.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + ShadCN UI + TypeScript |
| Backend | FastAPI (Python) |
| Database | PostgreSQL 16 (self-hosted) |
| Cache | Redis 7 |
| Maps | Yandex Maps JS API 2.1 |
| i18n | next-intl |
| Deployment | Docker Compose on VPS, Nginx reverse proxy |
| File Storage | Local filesystem (Docker volume) served by Nginx |

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS (Docker)                         │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │   Nginx      │───>│   Next.js    │    │   FastAPI     │  │
│  │   reverse    │───>│   (SSR)      │───>│   API server  │  │
│  │   proxy +    │    │   :3000      │    │   :8000       │  │
│  │   SSL/TLS    │    └──────────────┘    └───────┬───────┘  │
│  │   :80/:443   │                                │          │
│  └─────────────┘                          ┌──────┴──────┐   │
│                                           │             │   │
│                                    ┌──────▼──┐  ┌───────▼┐  │
│                                    │PostgreSQL│  │ Redis  │  │
│                                    │  :5432   │  │ :6379  │  │
│                                    └─────────┘  └────────┘  │
│                                                             │
│  ┌──────────────────┐                                       │
│  │  /data/uploads    │  (photos, avatars)                   │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
         │
         │ Client-side JS
         ▼
  ┌──────────────┐
  │ Yandex Maps  │  (loaded via JS API in browser)
  │ API (CDN)    │
  └──────────────┘
```

## Request Flow

1. Browser hits **Nginx** on port 80/443
2. Nginx routes `/api/*` to **FastAPI** (port 8000)
3. Nginx routes `/uploads/*` directly to the filesystem (static files)
4. Everything else goes to **Next.js** (port 3000)
5. Browser loads **Yandex Maps JS API** directly from Yandex CDN
6. Map pin data comes from FastAPI endpoints

## Redis Usage

- JWT token blacklist (logout invalidation)
- Referral invite rate limiting (sliding window)
- Search result caching (60s TTL)
- Map pin data caching (30s TTL)
- Category list caching (1h TTL)

## Key Architectural Decisions

1. **No separate search engine** — PostgreSQL `tsvector` + `pg_trgm` is sufficient for ~10K users
2. **Server-side pin filtering** — `/map/pins` filters by viewport bounds to avoid loading all pins
3. **JWT with Redis blacklist** — stateless auth with token revocation on logout
4. **Denormalized `average_rating`** on businesses — updated via DB trigger, avoids aggregate queries
5. **WebP-only photo storage** — all uploads converted to WebP to save space/bandwidth
6. **Locale always in URL** — `/ru/...`, `/en/...` for bookmarkable language preference

## Project Structure

```
lekion-map/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   ├── messages/                    # i18n translations
│   │   ├── ru.json
│   │   └── en.json
│   └── src/
│       ├── app/[locale]/           # Pages
│       ├── components/
│       │   ├── ui/                 # ShadCN components
│       │   ├── map/
│       │   ├── search/
│       │   ├── profile/
│       │   ├── business/
│       │   ├── review/
│       │   ├── auth/
│       │   ├── admin/
│       │   └── layout/
│       ├── lib/
│       │   ├── api.ts              # API client
│       │   ├── auth.ts             # Auth helpers
│       │   └── utils.ts
│       ├── hooks/
│       ├── types/
│       ├── i18n.ts
│       └── middleware.ts           # Locale routing
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py                 # FastAPI app
│       ├── config.py               # Settings (pydantic-settings)
│       ├── database.py             # SQLAlchemy engine + session
│       ├── models/                 # ORM models
│       ├── schemas/                # Pydantic schemas
│       ├── api/                    # Route handlers
│       ├── services/               # Business logic
│       ├── core/
│       │   ├── security.py         # JWT, password hashing
│       │   ├── deps.py             # FastAPI dependencies
│       │   └── redis.py            # Redis client
│       ├── utils/
│       │   └── images.py           # Image processing (Pillow)
│       └── templates/email/        # Email templates per locale
└── docs/
```

## Deployment

- **Docker Compose** with 5 services: nginx, frontend, backend, postgres, redis
- **SSL** via Let's Encrypt / Certbot
- **Backups**: daily `pg_dump` (30-day retention), weekly uploads rsync
- **Redis persistence**: AOF enabled
