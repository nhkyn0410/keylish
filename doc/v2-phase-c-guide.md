# Phase C Guide - DB Auth Migration

## Mục tiêu

Phase C thêm nền dữ liệu cho V2.0.1 auth:

- `User` và `Admin` là hai bảng riêng.
- Không có `role`, không có `AdminStatus`, không có `emailVerifiedAt`.
- `AuthProvider` chỉ có `PASSWORD`.
- Session user/admin tách riêng bằng `UserSession` và `AdminSession`.
- Token reset password user chỉ lưu hash trong `UserAuthToken`.

## File chính

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/20260614000100_v2_auth/migration.sql`
- `apps/api/scripts/seed-admin.ts` (được dùng từ Phase D sau khi có password hasher)

## Env cần có

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/keylish
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/keylish
AUTH_TOKEN_PEPPER=change-me-at-least-32-random-chars
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=change-me-before-seeding
```

Production Supabase vẫn dùng:

- `DATABASE_URL`: transaction pooler `:6543` + `?pgbouncer=true` cho runtime.
- `DIRECT_URL`: session pooler `:5432` cho migrate/deploy.

## Lệnh chạy

```bash
pnpm --filter @keylish/db generate
pnpm --filter @keylish/db migrate
pnpm --filter @keylish/api seed-admin
```

`seed-admin` không in password ra log. Nếu admin đã tồn tại, script bỏ qua và chỉ báo username.

## Validation

- Prisma generate phải pass.
- Migration không tạo `AdminStatus` hoặc `emailVerifiedAt`.
- Admin đăng nhập bằng `usernameNormalized`, không bằng email.
- Không thêm bảng progress/review-event trong phase này.
