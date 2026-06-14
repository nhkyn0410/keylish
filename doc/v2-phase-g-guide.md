# Phase G Guide - Admin Resource API

## Mục tiêu

Phase G đưa các API quản trị tài nguyên về đúng module sở hữu tài nguyên, không nhồi vào auth:

- Dashboard/users nằm trong `AdminModule`.
- Topic CRUD admin nằm trong `TopicsModule`.
- Vocab CRUD admin nằm trong `VocabModule`.
- Public V1 topic/vocab endpoint vẫn giữ nguyên.

## File chính

- `apps/api/src/admin/admin.controller.ts`
- `apps/api/src/admin/admin.service.ts`
- `apps/api/src/topics/topics.controller.ts`
- `apps/api/src/topics/topics.service.ts`
- `apps/api/src/vocab/vocab.controller.ts`
- `apps/api/src/vocab/vocab.service.ts`
- `apps/api/src/auth/auth.guard.ts`

## Endpoint admin

| Method | Path                           | Module         |
| ------ | ------------------------------ | -------------- |
| GET    | `/api/admin/dashboard/summary` | `AdminModule`  |
| GET    | `/api/admin/users`             | `AdminModule`  |
| GET    | `/api/admin/users/:id`         | `AdminModule`  |
| PATCH  | `/api/admin/users/:id`         | `AdminModule`  |
| GET    | `/api/admin/topics`            | `TopicsModule` |
| POST   | `/api/admin/topics`            | `TopicsModule` |
| PATCH  | `/api/admin/topics/:id`        | `TopicsModule` |
| DELETE | `/api/admin/topics/:id`        | `TopicsModule` |
| GET    | `/api/admin/vocab`             | `VocabModule`  |
| POST   | `/api/admin/vocab`             | `VocabModule`  |
| PATCH  | `/api/admin/vocab/:id`         | `VocabModule`  |
| DELETE | `/api/admin/vocab/:id`         | `VocabModule`  |

Tất cả endpoint admin resource dùng `AdminGuard`; unsafe methods dùng thêm `CsrfGuard`.

## Endpoint public giữ nguyên

- `GET /api/v1/topics`
- `GET /api/v1/vocab`
- `GET /api/v1/vocab/count`

## Nguyên tắc mở rộng

- Nếu sau này user sở hữu vocab riêng, route user-vocab phải được đặt trong `VocabModule`, không đặt vào `AuthModule`.
- `AuthModule` chỉ xử lý login/logout/session/password/profile tối thiểu.
- Service trả DTO đã sanitize, không trả thẳng Prisma model có trường nhạy cảm.

## Lệnh kiểm tra

```bash
pnpm --filter @keylish/api test
pnpm --filter @keylish/api build
```

## Validation cần đạt

- User cookie không truy cập được admin resource.
- Thiếu admin cookie trả `401`.
- Thiếu/sai CSRF trên create/update/delete trả `403`.
- Public V1 topic/vocab vẫn hoạt động sau khi thêm admin controllers.
- Xóa topic/vocab phải tôn trọng ràng buộc hiện có.
