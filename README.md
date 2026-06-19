# KeyLish

**Học từ vựng tiếng Anh bằng cách gõ phím.**

KeyLish là ứng dụng web luyện gõ tiếng Anh, trong đó việc học từ vựng diễn ra thông qua chính hành động gõ: người học chọn **chủ đề (topic)**, **cấp độ (CEFR)** và **mode luyện tập**, sau đó gõ từng từ theo phương pháp đã chọn (ví dụ: nhìn nghĩa tiếng Việt → gõ từ tiếng Anh, nghe phát âm → gõ lại từ).

> Đây là phiên bản **V1** — tập trung duy nhất vào tính năng **gõ từ vựng**.

## Tính năng V1

- ⌨️ **Luyện gõ từ vựng** char-by-char, an toàn với IME/bộ gõ tiếng Việt
- 🗂️ Chọn **chủ đề** và **cấp độ CEFR** (A1–C2) trước mỗi phiên luyện
- 🎯 Nhiều **mode luyện tập**: nghĩa VI → gõ từ EN (mặc định), nghe phát âm (TTS trình duyệt) → gõ từ
- 🔁 Tự động **lặp lại từ gõ sai** và cho phép sửa lỗi ngay trong phiên
- 📊 Màn hình tổng kết sau mỗi phiên luyện
- 📦 Hoạt động **local-first**: cache từ vựng trên trình duyệt (IndexedDB), kèm seed offline dự phòng

## Tech stack

Monorepo quản lý bằng **pnpm workspaces + Turborepo**.

| Workspace         | Vai trò                         | Công nghệ                                                                  |
| ----------------- | ------------------------------- | -------------------------------------------------------------------------- |
| `apps/user-web`   | Ứng dụng web học từ vựng        | Next.js (App Router) · React · TypeScript · Tailwind CSS                   |
| `apps/admin-web`  | Admin panel V2                  | Next.js (App Router) · React · TypeScript · Ant Design                     |
| `apps/api`        | API đọc kho từ vựng (read-only) | NestJS 11 · Express · OpenAPI (Swagger) · nestjs-zod                       |
| `packages/db`     | Tầng database                   | Prisma 7 (driver adapter `pg`) · PostgreSQL (Docker local / Supabase prod) |
| `packages/shared` | Schema & type dùng chung        | Zod 4                                                                      |

Công cụ chung: TypeScript 6 · Vitest · tsup · tsx.

### API V1

Backend V1 chỉ phục vụ **đọc kho từ vựng**:

- `GET /api/v1/topics` — danh sách chủ đề
- `GET /api/v1/vocab` — danh sách từ vựng (lọc theo topic / cấp độ)
- `GET /api/health` - health check
- `GET /api/docs` - OpenAPI UI

## Nguồn dữ liệu từ vựng

Kho từ vựng được build từ hai nguồn miễn phí:

| Nguồn                                                                                   | Cung cấp                                        | License         |
| --------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------- |
| [Maximax67/Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset)         | Từ EN + cấp độ CEFR + tần suất + POS (~172k từ) | MIT             |
| [kaikki.org — English Wiktionary (Wiktextract)](https://kaikki.org/dictionary/English/) | Nghĩa EN→VI + IPA + ví dụ + POS (JSONL)         | CC BY-SA + GFDL |

Pipeline xử lý dữ liệu nằm trong `apps/api`:

```bash
pnpm --filter @keylish/api build-dataset   # tải & ghép dữ liệu từ 2 nguồn
pnpm --filter @keylish/api seed            # nạp dữ liệu vào Postgres
```

## Bắt đầu

Yêu cầu: **Node.js 20+** và **pnpm 10**.

```bash
# 1. Cài dependencies
pnpm install

# 2. Chạy Postgres local (Docker)
docker compose up -d
#    Copy packages/db/.env.example -> packages/db/.env (giữ DATABASE_URL local)

# 3. Generate Prisma client & migrate
pnpm --filter @keylish/db generate
pnpm --filter @keylish/db migrate

# 4. Chạy dev
pnpm --filter @keylish/api dev        # API (NestJS, port 3000)
pnpm --filter @keylish/user-web dev   # User Web (Next.js, port 3001)
pnpm --filter @keylish/admin-web dev  # Admin Web (Next.js, port 3002)
```

## Cấu hình môi trường (env)

Mỗi file env có **một nhiệm vụ**, không trùng lặp. Ai đọc file nào:

| File                  | Đọc bởi                                    | Chứa                                                           |
| --------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `.env` (gốc)          | `docker compose`                           | `POSTGRES_*`, `PGADMIN_*`                                      |
| `packages/db/.env`    | API runtime (override) · Prisma CLI · seed | `DATABASE_URL`, `DIRECT_URL`                                   |
| `apps/api/.env`       | API runtime · seed                         | `PORT`, `AUTH_*`, `ADMIN_INITIAL_*`, `WEB_APP_URL`, `RESEND_*` |
| `apps/user-web/.env`  | user-web                                   | `NEXT_PUBLIC_API_URL`                                          |
| `apps/admin-web/.env` | admin-web                                  | `NEXT_PUBLIC_API_URL`                                          |

- **Kết nối DB chỉ khai ở `packages/db/.env`** — API runtime load nó với `override` nên nó luôn thắng; đừng đặt `DATABASE_URL` ở `apps/api/.env`.
- **Local/dev bắt buộc dùng Docker Postgres**. Script DB sẽ chặn remote DB khi `NODE_ENV` khác `production`, trừ thao tác staging có chủ ý với `ALLOW_REMOTE_DB_FOR_DEV=true`.
- **Production** (Render/Vercel): đặt env trên dashboard, không dùng file `.env`; production DB là Supabase riêng.
- **Admin** là local-only: `apps/admin-web` chạy ở `localhost:3002`, API admin bật ở local và tắt trên Render qua `ADMIN_API_ENABLED=false`.
- Mỗi file có `*.env.example` đi kèm làm mẫu. Tất cả `.env` thật đều đã được `.gitignore`.

## Triển khai

| Thành phần       | Nền tảng                                                | Free tier                  |
| ---------------- | ------------------------------------------------------- | -------------------------- |
| `apps/user-web`  | [Vercel](https://vercel.com)                            | ✅                         |
| `apps/admin-web` | Local-only (công cụ nội bộ — không deploy)              | — (xem doc/v2.1.1)         |
| `apps/api`       | [Render](https://render.com) (Blueprint: `render.yaml`) | ✅ (ngủ sau 15p idle)      |
| PostgreSQL       | [Supabase](https://supabase.com)                        | ✅ (pause sau 7 ngày idle) |

Hướng dẫn chi tiết từng bước: [doc/SDLC/09-deployment.md](doc/SDLC/09-deployment.md).

## Cấu trúc thư mục

```
KeyLish/
├── apps/
│   ├── api/        # NestJS — vocab read API + scripts build dataset
│   ├── user-web/   # Next.js — giao diện luyện gõ
│   └── admin-web/  # Next.js — admin panel V2
├── packages/
│   ├── db/         # Prisma schema, client, migrations
│   └── shared/     # Zod schemas & types dùng chung
└── doc/            # Tài liệu thiết kế (tiếng Việt)
```

## Ghi công & License dữ liệu

- Dữ liệu CEFR/tần suất/POS: [Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset) — MIT License.
- Dữ liệu nghĩa EN→VI, IPA, ví dụ: trích xuất từ [English Wiktionary](https://en.wiktionary.org/) qua [kaikki.org](https://kaikki.org/) (Wiktextract) — phát hành theo **CC BY-SA** và **GFDL**; phần dữ liệu phái sinh từ nguồn này giữ nguyên license tương ứng.
