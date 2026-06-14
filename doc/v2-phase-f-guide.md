# Phase F Guide - Admin Auth API

## Mục tiêu

Phase F triển khai auth API cho admin trong cùng `AuthModule`, nhưng tách session/cookie/bảng dữ liệu khỏi user:

- Admin đăng nhập bằng `username` + password.
- Admin không có email, display name, status hoặc role.
- Không có public admin register.
- Không có `/api/admin/profile`.

## Endpoint

| Method | Path                         | Auth | CSRF | Ghi chú                         |
| ------ | ---------------------------- | ---- | ---- | ------------------------------- |
| GET    | `/api/admin/csrf`            | No   | No   | Cấp token CSRF admin            |
| POST   | `/api/admin/login`           | No   | Yes  | Set admin session cookie        |
| POST   | `/api/admin/logout`          | Yes  | Yes  | Revoke current admin session    |
| POST   | `/api/admin/logout-all`      | Yes  | Yes  | Revoke toàn bộ admin sessions   |
| POST   | `/api/admin/change-password` | Yes  | Yes  | Đổi password và revoke sessions |

Các endpoint không tồn tại trong V2.0.1:

- `GET /api/admin/profile`
- `PATCH /api/admin/profile`
- `POST /api/admin/register`

## Seed admin đầu tiên

Admin được tạo bằng script nội bộ:

```bash
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=<strong-password>
pnpm --filter @keylish/api seed-admin
```

Script bỏ qua nếu admin đã tồn tại và không in password ra log. `ADMIN_INITIAL_PASSWORD` không được giữ giá trị `change-me...`.

## Chính sách đăng nhập

- `username` được normalize bằng `trim().toLowerCase()`.
- Nếu username chứa `@`, API reject để tránh nhầm với email login.
- Password admin tối thiểu 15 ký tự.
- Admin session TTL mặc định 12 giờ qua `ADMIN_SESSION_TTL_HOURS`.

## Lệnh kiểm tra

```bash
pnpm --filter @keylish/api test
pnpm --filter @keylish/api typecheck
pnpm --filter @keylish/api lint
```

## Validation cần đạt

- Admin login set admin cookie, không set user cookie.
- Admin login bằng email-like username phải fail.
- `AdminGuard` reject user cookie.
- `UserGuard` reject admin cookie.
- Không có route `/api/admin/profile` trong controller.
