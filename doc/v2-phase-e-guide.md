# Phase E Guide - User Auth API

## Mục tiêu

Phase E triển khai auth API cho người học, vẫn nằm trong một `AuthController` và một `AuthService` duy nhất:

- User đăng ký/đăng nhập bằng email + password.
- Không có verify email trong V2.0.1.
- Session user tách khỏi admin session.
- `/api/user/profile` là nguồn trạng thái đăng nhập cho user-web.

## Endpoint

| Method | Path                        | Auth | CSRF | Ghi chú                                |
| ------ | --------------------------- | ---- | ---- | -------------------------------------- |
| GET    | `/api/user/csrf`            | No   | No   | Cấp token CSRF user                    |
| POST   | `/api/user/register`        | No   | Yes  | Tạo user + password identity + session |
| POST   | `/api/user/login`           | No   | Yes  | Set user session cookie                |
| POST   | `/api/user/logout`          | Yes  | Yes  | Revoke current session                 |
| POST   | `/api/user/logout-all`      | Yes  | Yes  | Revoke toàn bộ user sessions           |
| GET    | `/api/user/profile`         | Yes  | No   | Trả profile đã sanitize                |
| PATCH  | `/api/user/profile`         | Yes  | Yes  | Cập nhật displayName/avatarUrl         |
| POST   | `/api/user/forgot-password` | No   | Yes  | Response generic, không leak email     |
| POST   | `/api/user/reset-password`  | No   | Yes  | Dùng reset token, revoke sessions      |
| POST   | `/api/user/change-password` | Yes  | Yes  | Yêu cầu current password               |

Không tạo endpoint verify email trong phase này.

## DTO và chính sách

- Email được normalize bằng `trim().toLowerCase()` vào `emailNormalized`.
- Password user tối thiểu 12 ký tự, tối đa 128 ký tự.
- Response login/register trả profile tối thiểu: `id`, `email`, `displayName`, `avatarUrl`.
- Login sai trả lỗi generic `Invalid credentials.`.
- User bị `DISABLED`, `DELETED` hoặc có `deletedAt` không được authenticate.

## Password reset

`forgot-password` tạo `UserAuthToken` với `purpose = "password-reset"`, chỉ lưu `tokenHash` và hết hạn sau 2 giờ.

Trong dev có thể bật:

```bash
AUTH_EXPOSE_RESET_TOKEN=true
```

Biến này chỉ dùng để test local. Production không được bật vì reset token plaintext chỉ nên gửi qua email provider.

## Lệnh kiểm tra

```bash
pnpm --filter @keylish/api test
pnpm --filter @keylish/api typecheck
```

## Validation cần đạt

- User login set user cookie, không set admin cookie.
- `/api/user/profile` reject admin cookie.
- Logout revoke session hiện tại.
- Change/reset password revoke session cũ.
- Không có token auth trong localStorage/sessionStorage/IndexedDB.
