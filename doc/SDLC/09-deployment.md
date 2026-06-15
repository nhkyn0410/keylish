# 09 — Triển khai và Vận hành (Deployment & Operation)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường      | Giá trị                                         |
| ----------- | ----------------------------------------------- |
| Tên         | Triển khai và Vận hành (Deployment & Operation) |
| Mã tài liệu | `09-deployment`                                 |
| Dự án       | KeyLish                                         |
| Phiên bản   | 0.1.0                                           |
| Trạng thái  | Approved                                        |
| Người viết  | AI Agent (soạn thảo SDLC), Nguyễn Hồng Khanh    |
| Người duyệt | Nguyễn Hồng Khanh                               |
| Ngày tạo    | 2026-06-15                                      |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật | Nội dung                                                     |
| --------- | ---------- | -------------- | ------------------------------------------------------------ |
| 0.1.0     | 2026-06-15 | AI Agent       | Bản Draft đầu — as-built deployment từ render.yaml + README. |

### 1.3. Tham chiếu

- `render.yaml` — Render blueprint
- README §Cấu hình môi trường / §Triển khai
- `01-srs` §2.3 — ràng buộc môi trường

## 2. Topology triển khai

```
                          Internet
                             │
               ┌─────────────┴─────────────┐
               │                           │
          Vercel (user-web)          Render (api)
          next start                 node dist/main.js
               │                           │
               └─────────────┬─────────────┘
                             │
                     Supabase (PostgreSQL)
```

## 3. Thành phần

| Thành phần       | Nền tảng           | URL (mẫu)                          | Free tier             |
| ---------------- | ------------------ | ---------------------------------- | --------------------- |
| `apps/user-web`  | Vercel             | `https://keylish.vercel.app`       | ✅                    |
| `apps/api`       | Render (blueprint) | `https://keylish-api.onrender.com` | ✅ (ngủ sau 15p)      |
| `apps/admin-web` | Local-only         | `http://localhost:3002`            | —                     |
| PostgreSQL       | Supabase           | Pooled/Direct connection string    | ✅ (pause sau 7 ngày) |

## 4. Env mapping

### 4.1. File env (dev)

| File                  | Đọc bởi                             | Chứa                                                           |
| --------------------- | ----------------------------------- | -------------------------------------------------------------- |
| `.env` (gốc)          | `docker compose`                    | `POSTGRES_*`, `PGADMIN_*`                                      |
| `packages/db/.env`    | API runtime (override) · Prisma CLI | `DATABASE_URL`, `DIRECT_URL`                                   |
| `apps/api/.env`       | API runtime                         | `PORT`, `AUTH_*`, `ADMIN_INITIAL_*`, `WEB_APP_URL`, `RESEND_*` |
| `apps/user-web/.env`  | user-web                            | `NEXT_PUBLIC_API_URL`                                          |
| `apps/admin-web/.env` | admin-web                           | `NEXT_PUBLIC_API_URL`                                          |

### 4.2. Env sản xuất (dashboard)

**Render (api)** — `render.yaml`:

| Key                     | Value           | Ghi chú             |
| ----------------------- | --------------- | ------------------- |
| `NODE_VERSION`          | `22.16.0`       |                     |
| `NODE_ENV`              | `production`    |                     |
| `ADMIN_API_ENABLED`     | `false`         | Mặc định OFF        |
| `DATABASE_URL`          | (sync:false)    | Supabase pooled URL |
| `DIRECT_URL`            | (sync:false)    | Supabase direct URL |
| `CORS_ORIGIN`           | (sync:false)    | Vercel domain       |
| `AUTH_TOKEN_PEPPER`     | (generateValue) | Random secret       |
| `AUTH_COOKIE_SAMESITE`  | `none`          | Cross-site          |
| `AUTH_ALLOWED_ORIGINS`  | (sync:false)    | Browser origins     |
| `WEB_APP_URL`           | (sync:false)    | Vercel URL          |
| `RESEND_API_KEY`        | (sync:false)    | Optional            |
| `AUTH_RESET_EMAIL_FROM` | (sync:false)    | Optional            |

**Vercel (user-web)**:

| Key                   | Value          |
| --------------------- | -------------- |
| `NEXT_PUBLIC_API_URL` | Render API URL |

**Supabase**:
| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://...?pgbouncer=true` (pooled) |
| `DIRECT_URL` | `postgresql://...` (direct, for migrations) |

### 4.3. Nguyên tắc

- **DB connection chỉ khai ở `packages/db/.env`** — API runtime load nó với `override`
- **Production**: đặt env trên dashboard, không dùng file `.env`
- **Pepper bắt buộc** ở production — app từ chối boot nếu thiếu
- Admin API mặc định OFF ở production (an toàn nếu quên cấu hình)

## 5. Build & Deploy

### 5.1. Render (render.yaml)

```yaml
services:
  - type: web
    name: keylish-api
    runtime: node
    plan: free
    region: singapore
    buildCommand: |
      corepack enable
      pnpm install --frozen-lockfile
      pnpm --filter @keylish/api... build
      pnpm db:deploy
    startCommand: node apps/api/dist/main.js
    healthCheckPath: /api/health
```

### 5.2. Vercel

- Import từ GitHub repo
- Framework preset: Next.js
- Root directory: `apps/user-web`
- Build command: mặc định (Next.js)
- Env: `NEXT_PUBLIC_API_URL`

### 5.3. Supabase

- Tạo project → lấy connection strings
- Chạy migration: `pnpm db:deploy` (dùng DIRECT_URL)
- Seed: `pnpm --filter @keylish/api seed` (dùng DIRECT_URL vì pooled không support cursor)

## 6. Cold start handling

Render free plan ngủ sau ~15 phút không request. Cơ chế prewarm:

1. **`warmApi()`**: user-web gọi `/api/health` ngay khi app mount (fire-and-forget)
2. **`loadTopicsAwait()`**: retry fetch topics mỗi 3.5s đến 30 lần (~105s) khi API chưa thức
3. **Seed offline**: nếu API không kịp thức, user-web fallback về seed 112 từ

## 7. Database migration

```bash
# Dev
docker compose up -d
pnpm db:generate
pnpm db:migrate

# Production (Supabase)
pnpm db:deploy     # chạy migration chưa áp dụng
pnpm db:generate   # tạo client (build-time)
```

## 8. Observability

| Công cụ             | Mục đích                                    |
| ------------------- | ------------------------------------------- |
| `/api/health`       | Health check (Render dùng cho auto-restart) |
| Render dashboard    | Logs, metrics, restart                      |
| Swagger `/api/docs` | API documentation                           |
| TrafficHourly       | Page-view analytics (admin API)             |

## 9. RISK

- **Cold start**: Render free ngủ sau 15p → UX chậm lần đầu. Prewarm giảm thiểu.
- **Supabase pause**: DB pause sau 7 ngày không hoạt động → cần manual wake.
- **Admin-web local-only**: không deploy, admin phải chạy local.
- README trỏ `doc/deploy.md` không tồn tại — file này thay thế.
