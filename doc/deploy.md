# Hướng dẫn triển khai (Deploy)

Kiến trúc production:

```
Người dùng ── Vercel (apps/web, Next.js) ── Render (apps/api, NestJS) ── Neon (Postgres)
```

Cả 3 đều dùng free tier → chi phí **$0/tháng**. Chọn region **Singapore** cho Render và Neon (gần Việt Nam).

## 1. Neon — Database

1. Tạo tài khoản tại [neon.tech](https://neon.tech) → **New Project**: tên `keylish`, region **AWS ap-southeast-1 (Singapore)**.
2. Vào **Connect**, lấy **2 connection string**:
   - **Pooled** (host chứa `-pooler`) → dùng làm `DATABASE_URL` — cho API runtime.
   - **Direct** (host không có `-pooler`) → dùng làm `DIRECT_URL` — cho migration.

   `packages/db/prisma.config.ts` đã ưu tiên `DIRECT_URL` khi chạy Prisma CLI.
3. Migrate + seed từ máy local (PowerShell):

   ```powershell
   $env:DATABASE_URL = "<pooled connection string>"
   $env:DIRECT_URL   = "<direct connection string>"
   pnpm db:deploy                              # chạy migration lên Neon
   pnpm --filter @keylish/api build-dataset    # build dataset từ 2 nguồn
   pnpm --filter @keylish/api seed             # nạp dữ liệu vào Neon
   ```

   Seed là việc một lần (dữ liệu read-only); cập nhật dữ liệu sau này chỉ cần chạy lại 2 lệnh cuối.

## 2. Render — API

**Cách A — Blueprint (khuyến nghị):** repo đã có `render.yaml`.

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → kết nối repo KeyLish.
2. Render đọc `render.yaml`, hỏi các env secret — nhập:

   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** connection string |
   | `DIRECT_URL` | Neon **direct** connection string (dùng khi migrate trong lúc build) |
   | `CORS_ORIGIN` | Domain Vercel, ví dụ `https://keylish.vercel.app` (điền sau bước 3 cũng được) |

3. **Apply** → chờ build & deploy.

**Cách B — thủ công:** New → Web Service → chọn repo, rồi cấu hình đúng các giá trị như trong `render.yaml` (Root Directory để trống, Health Check Path `/api/health`, plan Free, region Singapore).

Kiểm tra sau khi deploy (thay bằng URL thật của service):

- `https://keylish-api.onrender.com/api/health` → 200
- `https://keylish-api.onrender.com/api/docs` → Swagger UI
- `https://keylish-api.onrender.com/api/v1/topics` → có dữ liệu (sau khi seed)

> ⚠️ **Free tier ngủ sau ~15 phút không có traffic**, request đầu tiên mất 30–60s đánh thức. Chấp nhận được cho v1 vì web local-first + có seed offline. Nếu khó chịu: nâng Render Starter hoặc chuyển Railway (~$5/tháng).

## 3. Vercel — Web

1. [vercel.com](https://vercel.com) → **Add New → Project** → import repo KeyLish.
2. Cấu hình:
   - **Root Directory**: `apps/web`
   - Framework: Next.js (tự nhận diện), build command mặc định
   - Vercel tự nhận pnpm workspace qua lockfile ở root (không cần config thêm cho `@keylish/shared`)
3. Environment Variables:

   | Biến | Giá trị |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://keylish-api.onrender.com` |

   (Quy ước cho code web khi gọi API — khi implement phần gọi API hãy đọc biến này.)
4. **Deploy** → nhận domain `https://<project>.vercel.app`.

## 4. Nối CORS

Quay lại Render → **Environment** → set `CORS_ORIGIN` = domain Vercel thật (nhiều origin phân tách bằng dấu phẩy, ví dụ thêm preview domain). Save → Render tự redeploy.

## 5. Checklist hoàn tất

- [ ] `GET /api/health` trả 200
- [ ] `GET /api/v1/topics` và `/api/v1/vocab` trả dữ liệu
- [ ] Web Vercel load bình thường
- [ ] Web gọi API không bị lỗi CORS (kiểm tra DevTools console)
- [ ] Push branch chính → cả Render lẫn Vercel tự deploy

## Vận hành về sau

| Việc | Cách làm |
|---|---|
| Đổi schema DB | Sửa `schema.prisma` → `pnpm db:migrate` (local) → push; Render tự chạy `db:deploy` khi build |
| Cập nhật dữ liệu vocab | Chạy lại `build-dataset` + `seed` từ local với env trỏ Neon |
| Xem log API | Render dashboard → Logs |
| Xem/sửa data trực tiếp | Neon dashboard → SQL Editor, hoặc pgAdmin trỏ direct URL |
