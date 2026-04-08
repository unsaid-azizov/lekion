# Lekion Map - API Reference

Base URL: `/api/v1`
Auth: JWT Bearer token in `Authorization` header
Format: JSON

## Authentication

### Token Strategy

- **Access token**: 30-min expiry, contains `{sub: user_id, role, status}`
- **Refresh token**: 30-day expiry, httpOnly/Secure/SameSite=Strict cookie
- **Blacklist**: On logout, token `jti` stored in Redis with TTL = remaining expiry

### Middleware Dependencies

- `get_current_user` — decodes JWT, checks Redis blacklist
- `require_approved` — additionally checks `status == 'approved'`
- `require_admin` — additionally checks `role == 'admin'`

---

## Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | None | Register with referral code. Body: `{email, password, referral_code, first_name, last_name}` |
| `POST` | `/auth/login` | None | Login. Returns `{access_token}` + refresh cookie |
| `POST` | `/auth/refresh` | Refresh cookie | New access token |
| `POST` | `/auth/logout` | Bearer | Blacklist token |
| `GET` | `/auth/google` | None | Google OAuth redirect. Query: `referral_code` |
| `GET` | `/auth/google/callback` | None | OAuth callback |
| `GET` | `/auth/check-referral` | None | Validate referral code. Query: `code` |
| `POST` | `/auth/verify-email` | Bearer | Body: `{code}` |
| `POST` | `/auth/resend-verification` | Bearer | Resend verification email |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me` | Bearer | Current user profile |
| `PUT` | `/users/me` | Bearer | Update own profile |
| `POST` | `/users/me/photo` | Bearer | Upload avatar (multipart) |
| `DELETE` | `/users/me/photo` | Bearer | Remove avatar |
| `GET` | `/users/{id}` | Approved | Public profile |
| `GET` | `/users` | Approved | Search/list users. Query: `q, profession, city, country, page, per_page` |
| `GET` | `/users/me/referral` | Bearer | Referral code + invite stats |
| `POST` | `/users/me/referral/invite` | Approved | Send referral invite |
| `GET` | `/users/me/referral/tree` | Bearer | Referral chain |

### Businesses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/businesses` | Approved | Create business |
| `GET` | `/businesses` | Approved | Search/list. Query: `q, category_id, city, country, tags, min_rating, page, per_page` |
| `GET` | `/businesses/{id}` | Approved | Business details |
| `PUT` | `/businesses/{id}` | Owner | Update business |
| `DELETE` | `/businesses/{id}` | Owner/Admin | Deactivate business |
| `POST` | `/businesses/{id}/photos` | Owner | Upload photos (multipart, max 10) |
| `DELETE` | `/businesses/{id}/photos/{photo_id}` | Owner | Delete photo |

### Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/businesses/{id}/reviews` | Approved | Add review. Body: `{rating, comment}` |
| `GET` | `/businesses/{id}/reviews` | Approved | List reviews (paginated) |
| `PUT` | `/reviews/{id}` | Author | Edit review |
| `DELETE` | `/reviews/{id}` | Author/Admin | Delete review |
| `POST` | `/reviews/{id}/reply` | Biz owner | Reply to review. Body: `{text}` |

### Map

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/map/pins` | Approved | Pins for viewport. Query: `type=people\|businesses\|all, bounds=s,w,n,e, category_id, search` |
| `GET` | `/map/clusters` | Approved | Clustered pins for low zoom. Same query params |

**Pin response format:**
```json
{
  "people": [{"id": "...", "lat": 42.0, "lng": 47.5, "name": "...", "profession": "..."}],
  "businesses": [{"id": "...", "lat": 42.0, "lng": 47.5, "name": "...", "category_slug": "..."}]
}
```

### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/categories` | Approved | List all categories |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/users/pending` | Admin | Approval queue (paginated) |
| `POST` | `/admin/users/{id}/approve` | Admin | Approve user |
| `POST` | `/admin/users/{id}/reject` | Admin | Reject user. Body: `{reason}` |
| `POST` | `/admin/users/{id}/ban` | Admin | Ban user |
| `PUT` | `/admin/users/{id}/role` | Admin | Change role. Body: `{role}` |
| `GET` | `/admin/users` | Admin | List all users with admin filters |
| `DELETE` | `/admin/businesses/{id}` | Admin | Force-delete business |
| `DELETE` | `/admin/reviews/{id}` | Admin | Force-delete review |
| `GET` | `/admin/stats` | Admin | Dashboard stats |

## Registration Flow

```
1. User opens referral link: /ru/auth/register/ABC12345
2. Frontend checks: GET /auth/check-referral?code=ABC12345
3. User fills form -> POST /auth/register
4. Backend creates user (status=pending), sends verification email
5. User verifies: POST /auth/verify-email {code: "123456"}
6. User sees "pending approval" page, polls GET /users/me
7. Admin approves: POST /admin/users/{id}/approve
8. User's next poll returns status=approved -> redirect to profile edit
9. User completes profile -> full access
```

## Error Response Format

```json
{
  "detail": "REFERRAL_LIMIT_EXCEEDED",
  "message": "You have reached the invite limit. Try again later."
}
```

Error codes are machine-readable keys. Frontend maps them to localized messages.
