# Phase I Guide - Admin Web Integration

## Mục tiêu

Phase I nối `apps/admin-web` với admin API và biến admin panel thành công cụ quản trị dữ liệu thật:

- Login bằng username/password qua `/api/admin/login`.
- Dashboard shell kiểm tra session bằng protected API, không gọi `/api/admin/profile`.
- Overview/users/topics/vocab đọc dữ liệu từ API.
- Topic/vocab có create/edit/delete.

## File chính

- `apps/admin-web/src/infra/admin/adminApi.ts`
- `apps/admin-web/src/components/login-screen.tsx`
- `apps/admin-web/src/components/admin-shell.tsx`
- `apps/admin-web/src/app/dashboard/overview/page.tsx`
- `apps/admin-web/src/app/dashboard/users/page.tsx`
- `apps/admin-web/src/app/dashboard/topics/page.tsx`
- `apps/admin-web/src/app/dashboard/vocab/page.tsx`
- `apps/admin-web/src/app/dashboard/analytics/page.tsx`

## Env cần có

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Admin web dev server chạy ở port 3002:

```bash
pnpm --filter @keylish/admin-web dev
```

## Route admin-web

- `/` - login screen.
- `/dashboard/overview` - tổng quan user/topic/vocab/API.
- `/dashboard/users` - search, filter status, pagination, update status.
- `/dashboard/topics` - search, create, edit, delete.
- `/dashboard/vocab` - search, filter topic/level, create, edit, delete.
- `/dashboard/analytics` - placeholder vận hành cho traffic/analytics provider.

## CSRF trên client

`adminApi.ts` tự gọi `GET /api/admin/csrf` trước các unsafe request và gửi `X-CSRF-Token`. Mọi request admin dùng `credentials: "include"`.

## Lệnh kiểm tra

```bash
pnpm --filter @keylish/admin-web typecheck
pnpm --filter @keylish/admin-web lint
pnpm --filter @keylish/admin-web build
```

## Smoke test thủ công

1. Mở `http://localhost:3002/` và kiểm tra login screen render đúng.
2. Mở thẳng `http://localhost:3002/dashboard/overview` khi chưa có admin cookie; app phải redirect về `/`.
3. Đăng nhập bằng username đã seed, không dùng email.
4. Kiểm tra users/topics/vocab render loading/empty/error states ổn định.
5. Xác nhận admin web không gọi `/api/admin/profile`.
