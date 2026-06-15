# Phase D Guide - API Security Foundation

## Mục tiêu

Phase D đặt nền bảo mật cho V2.0.1 auth trên API NestJS:

- Một `AuthModule` duy nhất, không tách `user-auth`/`admin-auth`.
- Session cookie HttpOnly cho user/admin, không lưu auth token ở browser storage.
- CSRF double-submit cho mọi unsafe request.
- CORS bật `credentials: true` với allow-list origin.
- Password hash bằng Argon2id, session/reset token chỉ lưu hash.

## File chính

- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.guard.ts`
- `apps/api/src/auth/auth.dto.ts`
- `apps/api/src/main.ts`
- `apps/api/src/auth/auth.service.spec.ts`
- `apps/api/src/app.e2e.spec.ts`

## Env cần có

```bash
AUTH_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
AUTH_TOKEN_PEPPER=change-me-at-least-32-random-chars
AUTH_ARGON2_MEMORY_KIB=19456
AUTH_ARGON2_ITERATIONS=2
AUTH_ARGON2_PARALLELISM=1
USER_SESSION_TTL_DAYS=30
ADMIN_SESSION_TTL_HOURS=12
```

`AUTH_TOKEN_PEPPER` phải khác giá trị mẫu trên production. Nếu đổi pepper, session/reset token đang tồn tại sẽ không còn hợp lệ.

## Cookie

Development:

- User session: `user`
- Admin session: `admin`
- User CSRF: `u-csrf`
- Admin CSRF: `a-csrf`

Production:

- User session: `__Host-user`
- Admin session: `__Host-admin`
- User CSRF: `__Host-u-csrf`
- Admin CSRF: `__Host-a-csrf`

Session cookie là `HttpOnly`; CSRF cookie đọc được bằng client để gửi lại qua `X-CSRF-Token`.

## CSRF flow

User flow:

1. Client gọi `GET /api/user/csrf`.
2. API set cookie `u-csrf` hoặc `__Host-u-csrf` và trả `{ token }`.
3. Client gửi unsafe request với header `X-CSRF-Token: <token>`.

Admin flow tương tự qua `GET /api/admin/csrf`.

API cũng kiểm tra `Origin`/`Referer` cho unsafe methods. Local dev mặc định chấp nhận `http://localhost:3001` và `http://localhost:3002`; production phải cấu hình allow-list rõ ràng.

## Lệnh kiểm tra

```bash
pnpm --filter @keylish/api typecheck
pnpm --filter @keylish/api lint
pnpm --filter @keylish/api test
```

## Validation cần đạt

- Password verify đúng/sai được test.
- Token hash không lưu plaintext.
- Unsafe auth request thiếu CSRF trả `403`.
- CORS không dùng wildcard khi `credentials: true`.
- `UserGuard` và `AdminGuard` đọc cookie riêng theo domain.
