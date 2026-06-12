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
- 📦 Hoạt động **local-first**: dữ liệu phiên lưu trên trình duyệt (IndexedDB), kèm seed offline dự phòng

## Tech stack

Monorepo quản lý bằng **pnpm workspaces + Turborepo**.

| Workspace         | Vai trò                         | Công nghệ                                                |
| ----------------- | ------------------------------- | -------------------------------------------------------- |
| `apps/web`        | Ứng dụng web                    | Next.js (App Router) · React · TypeScript · Tailwind CSS |
| `apps/api`        | API đọc kho từ vựng (read-only) | NestJS 11 · Express · OpenAPI (Swagger) · nestjs-zod     |
| `packages/db`     | Tầng database                   | Prisma 7 (driver adapter `pg`) · PostgreSQL (Neon)       |
| `packages/shared` | Schema & type dùng chung        | Zod 4                                                    |

Công cụ chung: TypeScript 5 · Vitest · tsup · tsx.

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

# 2. Chạy Postgres local (Docker) — hoặc trỏ DATABASE_URL tới Neon
docker compose up -d
#    Tạo .env trong packages/db với DATABASE_URL=postgresql://... (xem .env.example)

# 3. Generate Prisma client & migrate
pnpm --filter @keylish/db generate
pnpm --filter @keylish/db migrate

# 4. Chạy dev
pnpm --filter @keylish/api dev   # API (NestJS)
pnpm --filter @keylish/web dev   # Web (Next.js)
```

## Triển khai

| Thành phần | Nền tảng                                                | Free tier                   |
| ---------- | ------------------------------------------------------- | --------------------------- |
| `apps/web` | [Vercel](https://vercel.com)                            | ✅                          |
| `apps/api` | [Render](https://render.com) (Blueprint: `render.yaml`) | ✅ (ngủ sau 15p idle)       |
| PostgreSQL | [Neon](https://neon.tech)                               | ✅ (tự thức khi có kết nối) |

Hướng dẫn chi tiết từng bước: [doc/deploy.md](doc/deploy.md).

## Cấu trúc thư mục

```
KeyLish/
├── apps/
│   ├── web/        # Next.js — giao diện luyện gõ
│   └── api/        # NestJS — vocab read API + scripts build dataset
├── packages/
│   ├── db/         # Prisma schema, client, migrations
│   └── shared/     # Zod schemas & types dùng chung
└── doc/            # Tài liệu thiết kế (tiếng Việt)
```

## Ghi công & License dữ liệu

- Dữ liệu CEFR/tần suất/POS: [Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset) — MIT License.
- Dữ liệu nghĩa EN→VI, IPA, ví dụ: trích xuất từ [English Wiktionary](https://en.wiktionary.org/) qua [kaikki.org](https://kaikki.org/) (Wiktextract) — phát hành theo **CC BY-SA** và **GFDL**; phần dữ liệu phái sinh từ nguồn này giữ nguyên license tương ứng.
