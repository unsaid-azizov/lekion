# Lekion Map - Database Schema

## Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## Tables

### users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | |
| `password_hash` | `varchar(255)` | NULLABLE | NULL for Google OAuth-only |
| `google_id` | `varchar(255)` | UNIQUE, NULLABLE | Google OAuth subject ID |
| `first_name` | `varchar(100)` | NOT NULL | |
| `last_name` | `varchar(100)` | NOT NULL | |
| `patronymic` | `varchar(100)` | NULLABLE | |
| `profession` | `varchar(200)` | NULLABLE | |
| `bio` | `text` | NULLABLE | |
| `photo_path` | `varchar(500)` | NULLABLE | Relative path in uploads dir |
| `latitude` | `double precision` | NULLABLE | For map pin |
| `longitude` | `double precision` | NULLABLE | |
| `city` | `varchar(200)` | NULLABLE | |
| `country` | `varchar(100)` | NULLABLE | |
| `phone` | `varchar(50)` | NULLABLE | |
| `website` | `varchar(500)` | NULLABLE | |
| `telegram` | `varchar(100)` | NULLABLE | |
| `whatsapp` | `varchar(50)` | NULLABLE | |
| `instagram` | `varchar(100)` | NULLABLE | |
| `status` | `varchar(20)` | NOT NULL, default `'pending'` | `pending`, `approved`, `rejected`, `banned` |
| `role` | `varchar(20)` | NOT NULL, default `'user'` | `user`, `admin` |
| `referred_by` | `uuid` | FK -> `users.id`, NULLABLE | Who invited this user |
| `referral_code` | `varchar(20)` | UNIQUE, NOT NULL | 8-char alphanumeric |
| `is_visible_on_map` | `boolean` | NOT NULL, default `true` | |
| `email_verified` | `boolean` | NOT NULL, default `false` | |
| `search_vector` | `tsvector` | | Auto-updated via trigger |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:**
- `idx_users_email` — UNIQUE on `email`
- `idx_users_referral_code` — UNIQUE on `referral_code`
- `idx_users_status` — B-tree on `status`
- `idx_users_location` — B-tree on `(latitude, longitude)` WHERE both NOT NULL
- `idx_users_search` — GIN on `search_vector`
- `idx_users_name_trgm` — GIN using `pg_trgm` on `(first_name || ' ' || last_name)`
- `idx_users_referred_by` — B-tree on `referred_by`
- `idx_users_google_id` — UNIQUE on `google_id` WHERE NOT NULL

**Search vector trigger:**
```sql
setweight(to_tsvector('russian', coalesce(first_name,'')), 'A') ||
setweight(to_tsvector('russian', coalesce(last_name,'')), 'A') ||
setweight(to_tsvector('russian', coalesce(profession,'')), 'B') ||
setweight(to_tsvector('russian', coalesce(bio,'')), 'C') ||
setweight(to_tsvector('russian', coalesce(city,'')), 'B')
```

---

### categories

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `slug` | `varchar(100)` | UNIQUE, NOT NULL |
| `name_ru` | `varchar(200)` | NOT NULL |
| `icon` | `varchar(50)` | NULLABLE |
| `sort_order` | `integer` | NOT NULL, default `0` |
| `created_at` | `timestamptz` | NOT NULL |

Add `name_en`, `name_lez` columns (or a `category_translations` table) when new languages are added.

---

### businesses

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK | |
| `owner_id` | `uuid` | FK -> `users.id`, NOT NULL | |
| `name` | `varchar(300)` | NOT NULL | |
| `description` | `text` | NULLABLE | |
| `category_id` | `uuid` | FK -> `categories.id`, NULLABLE | |
| `tags` | `varchar(100)[]` | default `'{}'` | PostgreSQL array |
| `address` | `varchar(500)` | NOT NULL | |
| `city` | `varchar(200)` | NULLABLE | |
| `country` | `varchar(100)` | NULLABLE | |
| `latitude` | `double precision` | NOT NULL | |
| `longitude` | `double precision` | NOT NULL | |
| `phone` | `varchar(50)` | NULLABLE | |
| `website` | `varchar(500)` | NULLABLE | |
| `email` | `varchar(255)` | NULLABLE | |
| `telegram` | `varchar(100)` | NULLABLE | |
| `whatsapp` | `varchar(50)` | NULLABLE | |
| `working_hours` | `jsonb` | NULLABLE | `{"mon": {"open": "09:00", "close": "18:00"}, ...}` |
| `is_active` | `boolean` | NOT NULL, default `true` | |
| `average_rating` | `numeric(2,1)` | NOT NULL, default `0.0` | Denormalized, updated by trigger |
| `review_count` | `integer` | NOT NULL, default `0` | Denormalized |
| `search_vector` | `tsvector` | | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

**Indexes:**
- `idx_businesses_owner` — B-tree on `owner_id`
- `idx_businesses_category` — B-tree on `category_id`
- `idx_businesses_location` — B-tree on `(latitude, longitude)`
- `idx_businesses_search` — GIN on `search_vector`
- `idx_businesses_name_trgm` — GIN using `pg_trgm` on `name`
- `idx_businesses_tags` — GIN on `tags`
- `idx_businesses_rating` — B-tree on `average_rating DESC`

**Search vector trigger:**
```sql
setweight(to_tsvector('russian', coalesce(name,'')), 'A') ||
setweight(to_tsvector('russian', coalesce(description,'')), 'C') ||
setweight(to_tsvector('russian', coalesce(city,'')), 'B') ||
setweight(to_tsvector('russian', array_to_string(tags, ' ')), 'B')
```

---

### business_photos

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `business_id` | `uuid` | FK -> `businesses.id` ON DELETE CASCADE |
| `photo_path` | `varchar(500)` | NOT NULL |
| `sort_order` | `integer` | NOT NULL, default `0` |
| `created_at` | `timestamptz` | NOT NULL |

---

### reviews

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `business_id` | `uuid` | FK -> `businesses.id` ON DELETE CASCADE |
| `author_id` | `uuid` | FK -> `users.id` ON DELETE CASCADE |
| `rating` | `smallint` | NOT NULL, CHECK `1-5` |
| `comment` | `text` | NULLABLE |
| `owner_reply` | `text` | NULLABLE |
| `owner_reply_at` | `timestamptz` | NULLABLE |
| `created_at` | `timestamptz` | NOT NULL |
| `updated_at` | `timestamptz` | NOT NULL |

**Constraints:**
- UNIQUE on `(business_id, author_id)` — one review per user per business

**Trigger:** After INSERT/UPDATE/DELETE, recalculate `businesses.average_rating` and `businesses.review_count`.

---

### referral_invites

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `inviter_id` | `uuid` | FK -> `users.id`, NOT NULL |
| `invited_email` | `varchar(255)` | NULLABLE |
| `used_by` | `uuid` | FK -> `users.id`, NULLABLE |
| `used_at` | `timestamptz` | NULLABLE |
| `created_at` | `timestamptz` | NOT NULL |

**Index:** `idx_referral_invites_inviter_created` on `(inviter_id, created_at DESC)`

Rate limit enforced by: `COUNT(*) WHERE inviter_id = X AND created_at > now() - interval '7 days'`

---

### email_verifications

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `users.id` ON DELETE CASCADE |
| `code` | `varchar(6)` | NOT NULL |
| `expires_at` | `timestamptz` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL |

## Referral Chain Query

```sql
WITH RECURSIVE chain AS (
  SELECT id, first_name, last_name, referred_by, 0 as depth
  FROM users WHERE id = :user_id
  UNION ALL
  SELECT u.id, u.first_name, u.last_name, u.referred_by, c.depth + 1
  FROM users u JOIN chain c ON u.referred_by = c.id
)
SELECT * FROM chain ORDER BY depth;
```
