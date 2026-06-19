# 09 — Triển khai và Vận hành (Deployment & Operation)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường      | Giá trị                                         |
| ----------- | ----------------------------------------------- |
| Tên         | Triển khai và Vận hành (Deployment & Operation) |
| Mã tài liệu | `09-deployment`                                 |
| Dự án       | KeyLish                                         |
| Phiên bản   | 0.1.1                                           |
| Trạng thái  | Draft                                           |
| Người viết  | AI Agent (soạn thảo SDLC), Nguyễn Hồng Khanh    |
| Người duyệt | Nguyễn Hồng Khanh                               |
| Ngày tạo    | 2026-06-15                                      |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật | Nội dung                                                                                                                |
| --------- | ---------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 0.1.0     | 2026-06-15 | AI Agent       | Bản Draft đầu — as-built deployment từ render.yaml + README.                                                            |
| 0.1.1     | 2026-06-19 | AI Agent       | Tách rõ local/dev với production DB; thêm guard chống dùng remote DB khi dev; thêm live admin local-only qua env riêng. |

### 1.3. Tham chiếu

- `render.yaml` — Render blueprint
- README §Cấu hình môi trường / §Triển khai
- `01-srs` §2.3 — ràng buộc môi trường

## 2. Topology triển khai

### 2.1. Local/dev

```
localhost:3001 (user-web) ─┐
localhost:3002 (admin-web) ├── localhost:3000 (api) ── Docker Postgres :5432
                           │
                           └── pgAdmin :5050 (tuỳ chọn)
```

- Local/dev **BẮT BUỘC** dùng Docker Postgres qua `packages/db/.env`.
- `apps/admin-web` chỉ chạy local và chỉ trỏ tới API local. Admin API bật ở local, tắt ở production.
- Supabase production URL **KHÔNG** được đặt trong `.env` local.

### 2.2. Production

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
| `packages/db/.env`    | API runtime (override) · Prisma CLI | `DATABASE_URL`, `DIRECT_URL` local Docker                      |
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

- **DB connection local chỉ khai ở `packages/db/.env`** — API runtime load nó với `override`
- **Local/dev dùng Docker Postgres**; script DB chặn remote DB khi `NODE_ENV` khác `production`
- **Production**: đặt env trên Render/Vercel dashboard, không dùng file `.env`
- **Supabase production URL không xuất hiện trong file local**; nếu đã lộ trên máy dev thì rotate credential
- **Staging/one-off remote**: chỉ chạy khi có chủ ý bằng `ALLOW_REMOTE_DB_FOR_DEV=true`
- **Pepper bắt buộc** ở production — app từ chối boot nếu thiếu
- Admin API mặc định OFF ở production; admin-web không deploy

### 4.4. Live admin local-only

`apps/admin-web` có thể chạy local để xem/chỉnh dữ liệu Supabase production khi cần vận hành.
Đây là chế độ có chủ ý, tách khỏi dev thường ngày:

1. Giữ `packages/db/.env` trỏ Docker local.
2. Tạo file ignored riêng, ví dụ `packages/db/.env.admin-prod`, chứa Supabase production
   `DATABASE_URL`/`DIRECT_URL`.
3. Chạy API local với:

```powershell
$env:KEYLISH_DB_ENV_FILE="packages/db/.env.admin-prod"
$env:ALLOW_REMOTE_DB_FOR_DEV="true"
pnpm dev:api
```

4. Chạy admin-web local ở terminal khác: `pnpm dev:admin-web`.

Không chạy `pnpm db:migrate`, `pnpm db:studio`, `seed`, hoặc `seed-admin` trong shell đang bật live
admin. Schema change remote ngoài production deploy phải có thêm `ALLOW_REMOTE_SCHEMA_CHANGE=true`.

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
- Seed production chỉ chạy thủ công khi có kế hoạch release/restore rõ ràng; script seed mặc định bị guard
  chặn remote vì thao tác này xoá và nạp lại `Word`/`Topic`.

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
pnpm db:migrate     # guard: chỉ cho DB local, trừ staging override có chủ ý

# Production (Supabase)
pnpm db:deploy     # Render chạy với NODE_ENV=production + env dashboard
pnpm db:generate   # tạo client (build-time)
```

`pnpm --filter @keylish/api seed` xoá và nạp lại `Word`/`Topic`, nên chỉ dùng cho local.
Muốn reset dữ liệu staging từ xa phải đặt cả `ALLOW_REMOTE_DB_FOR_DEV=true` và
`ALLOW_DESTRUCTIVE_SEED=true`.

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
- **Env leak**: nếu production DB URL từng được dùng ở local, rotate credential và cập nhật dashboard.
