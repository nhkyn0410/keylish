# Phase H Guide - User Web Integration

## Mục tiêu

Phase H nối `apps/user-web` với user auth API:

- Login/register/forgot/reset password chạy qua `/api/user/*`.
- Sidebar hiển thị trạng thái đăng nhập qua `/api/user/profile`.
- Account settings cho phép cập nhật profile và đổi password.
- Client fetch luôn dùng `credentials: "include"`.

## File chính

- `apps/user-web/src/infra/user/userApi.ts`
- `apps/user-web/src/app/(auth)/layout.tsx`
- `apps/user-web/src/app/(auth)/login/page.tsx`
- `apps/user-web/src/app/(auth)/register/page.tsx`
- `apps/user-web/src/app/(auth)/forgot-password/page.tsx`
- `apps/user-web/src/app/(auth)/reset-password/page.tsx`
- `apps/user-web/src/app/(site)/settings/account/page.tsx`
- `apps/user-web/src/components/auth/UserSessionActions.tsx`
- `apps/user-web/src/components/layout/Sidebar.tsx`

## Env cần có

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Nếu chạy local trên `localhost`, client có fallback về `http://localhost:3000`, nhưng vẫn nên cấu hình env để build/deploy rõ ràng.

## Route user-web

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/settings/account`

## CSRF trên client

`userApi.ts` tự gọi `GET /api/user/csrf` trước các unsafe request, sau đó gửi header `X-CSRF-Token`. Không đọc session cookie bằng JS.

## Lệnh kiểm tra

```bash
pnpm --filter @keylish/user-web typecheck
pnpm --filter @keylish/user-web lint
pnpm --filter @keylish/user-web build
```

## Smoke test thủ công

1. Mở `http://localhost:3001/login`.
2. Mở `http://localhost:3001/register`.
3. Mở `http://localhost:3001/settings/account`.
4. Kiểm tra sidebar không còn link cũ trỏ nhầm app/path.
5. Kiểm tra DevTools storage không có auth token trong localStorage/sessionStorage.
