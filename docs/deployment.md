# Lekion Map - Deployment

## Docker Compose

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
      - uploads:/data/uploads
    depends_on: [frontend, backend]

  frontend:
    build: ./frontend
    env_file: .env.frontend
    expose: ["3000"]

  backend:
    build: ./backend
    env_file: .env.backend
    expose: ["8000"]
    volumes:
      - uploads:/data/uploads
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: lekion
      POSTGRES_USER: lekion
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru

volumes:
  pgdata:
  redisdata:
  uploads:
```

## Nginx Config

```nginx
upstream frontend { server frontend:3000; }
upstream backend  { server backend:8000; }

server {
    listen 443 ssl;
    server_name lekion.app;

    ssl_certificate /etc/letsencrypt/live/lekion.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lekion.app/privkey.pem;

    # Static uploads
    location /uploads/ {
        alias /data/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API -> FastAPI
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 20M;
    }

    # Everything else -> Next.js
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name lekion.app;
    return 301 https://$host$request_uri;
}
```

## Environment Variables

### Backend (.env.backend)
```
DATABASE_URL=postgresql://lekion:${DB_PASSWORD}@postgres:5432/lekion
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<random-64-char>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
GOOGLE_REDIRECT_URI=https://lekion.app/api/v1/auth/google/callback
SMTP_HOST=<smtp-server>
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<password>
FRONTEND_URL=https://lekion.app
YANDEX_MAPS_API_KEY=<from-yandex-developer>
```

### Frontend (.env.frontend)
```
NEXT_PUBLIC_API_URL=https://lekion.app/api/v1
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=<from-yandex-developer>
```

## File Storage

```
/data/uploads/
├── avatars/{user_id}/{uuid}.webp
└── businesses/{business_id}/{uuid}.webp
```

- Avatars: resized to 400x400, converted to WebP
- Business photos: max 1200x900, converted to WebP
- Max upload: 5MB avatars, 10MB business photos
- Served directly by Nginx (bypasses FastAPI)

## Backups

- **PostgreSQL**: daily `pg_dump` via cron -> `/data/backups/`, 30-day retention
- **Uploads**: weekly rsync to secondary location
- **Redis**: AOF persistence (survives restarts, reconstructable from DB if lost)

## SSL

Use Certbot with Docker:
```bash
docker run -it --rm \
  -v ./certbot/conf:/etc/letsencrypt \
  -v ./certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot -d lekion.app
```

Auto-renewal via cron: `0 0 1 * * docker run ...`
