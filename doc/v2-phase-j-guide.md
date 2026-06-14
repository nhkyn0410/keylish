# Phase J Guide - Release Hardening

## Mục tiêu

Phase J là checklist đóng gói trước khi deploy V2.0.1:

- Build/test toàn bộ workspace liên quan.
- Kiểm tra cookie flags production.
- Kiểm tra CORS theo domain thật.
- Seed admin đầu tiên an toàn.
- Smoke test user-web và admin-web trên local/preview.

## Validation bắt buộc

```bash
pnpm --filter @keylish/db generate
pnpm --filter @keylish/db build
pnpm --filter @keylish/api typecheck
pnpm --filter @keylish/api lint
pnpm --filter @keylish/api test
pnpm --filter @keylish/api build
pnpm --filter @keylish/user-web typecheck
pnpm --filter @keylish/user-web lint
pnpm --filter @keylish/user-web build
pnpm --filter @keylish/admin-web typecheck
pnpm --filter @keylish/admin-web lint
pnpm --filter @keylish/admin-web build
pnpm format:check
```

Nếu `format:check` fail do file sinh tự động hoặc legacy formatting, format riêng phần cần thiết trước khi release.

## Production env checklist

API:

```bash
DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres
AUTH_ALLOWED_ORIGINS=https://app.keylish.com,https://admin.keylish.com
AUTH_TOKEN_PEPPER=<random-32-bytes-or-longer>
ADMIN_SESSION_TTL_HOURS=12
USER_SESSION_TTL_DAYS=30
```

User web/admin web:

```bash
NEXT_PUBLIC_API_URL=https://api.keylish.com
```

Seed admin:

```bash
ADMIN_INITIAL_USERNAME=<admin-username>
ADMIN_INITIAL_PASSWORD=<strong-password>
pnpm --filter @keylish/api seed-admin
```

Sau khi seed xong, gỡ hoặc rotate `ADMIN_INITIAL_PASSWORD` khỏi môi trường deploy nếu không còn cần dùng.

## Cookie checklist

Trên production, kiểm tra `Set-Cookie`:

- Session cookie có `HttpOnly`.
- Cookie có `Secure`.
- Cookie có `SameSite=Lax`.
- Cookie có `Path=/`.
- Cookie `__Host-*` không set `Domain`.
- User và admin cookie không ghi đè nhau.

## CORS checklist

- Chỉ allow origin user/admin thật.
- Không dùng `*` khi `credentials: true`.
- Preview domain chỉ được allow nếu chủ động thêm vào `AUTH_ALLOWED_ORIGINS` hoặc `CORS_ORIGIN`.
- Unsafe request từ origin lạ phải trả `403`.

## Smoke test release

User web:

- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/settings/account` render được.
- Login/register tạo session và refresh vẫn giữ trạng thái.
- Logout làm `/api/user/profile` trả `401`.

Admin web:

- `/` render login screen.
- `/dashboard/overview` redirect về `/` nếu chưa có admin cookie.
- Login bằng username đã seed vào được dashboard.
- Users/topics/vocab list render và thao tác CRUD cơ bản hoạt động.
- Không có request tới `/api/admin/profile`.

API:

- `/api/v1/topics`, `/api/v1/vocab`, `/api/v1/vocab/count` vẫn public.
- Admin resource endpoint thiếu cookie trả `401`.
- Unsafe endpoint thiếu CSRF trả `403`.
