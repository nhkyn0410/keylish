# KeyLish

**Học từ vựng tiếng Anh bằng cách gõ phím.**

KeyLish là monorepo web luyện từ vựng tiếng Anh. Người học chọn chủ đề, cấp độ CEFR và mode luyện tập, sau đó gõ từng từ char-by-char; engine hiện tại có xử lý IME tiếng Việt, lặp lại từ sai và màn tổng kết phiên.

> **Trạng thái dự án:** đang mở để tiếp tục phát triển. Trước khi làm việc, đọc [doc/README.md](doc/README.md), [doc/context/PROJECT-STATE.md](doc/context/PROJECT-STATE.md) và [doc/SDLC/11-tasks.md](doc/SDLC/11-tasks.md).

## Hiện trạng tính năng

| Mảng                     | Trạng thái | Ghi chú                                                                               |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------- |
| Luyện gõ từ vựng         | DONE       | Setup theo topic/CEFR/mode, gõ char-by-char, an toàn IME, summary                     |
| Vocab public             | DONE       | API + cache IndexedDB + seed offline; lọc topic/CEFR/search, phân trang               |
| Auth người học           | DONE       | Register/login/logout/profile/change/forgot/reset password bằng cookie session + CSRF |
| Traffic analytics        | DONE       | `POST /api/v1/track`, aggregate theo giờ UTC                                          |
| Admin API                | DONE       | Local/internal; production mặc định 404 qua `ADMIN_API_ENABLED=false`                 |
| Admin web                | PARTIAL    | Khung Next.js + Ant Design, local-only, chưa nối shared đầy đủ                        |
| Kho từ vựng cá nhân V2.1 | PARTIAL    | API/UI quản lý cơ bản, pick/tạo/xóa/filter; chưa luyện gõ theo kho cá nhân            |
| AI/flashcard/quiz/OAuth  | TODO       | Deferred V2, không tự mở scope nếu chưa có quyết định                                 |

## Tech Stack

Monorepo dùng pnpm workspaces + Turborepo.

| Workspace         | Vai trò                | Công nghệ                                |
| ----------------- | ---------------------- | ---------------------------------------- |
| `apps/api`        | Backend API            | NestJS 11, Express, OpenAPI, Prisma, Zod |
| `apps/user-web`   | Web học từ vựng        | Next.js 16, React 19, Tailwind 4         |
| `apps/admin-web`  | Admin panel local-only | Next.js, React, Ant Design 6             |
| `packages/db`     | Database package       | Prisma 7, PostgreSQL 16                  |
| `packages/shared` | Schema/type dùng chung | Zod 4                                    |
| `scripts/`        | Pipeline dữ liệu       | Node scripts                             |

Node production trên Render dùng 22.16; local cần Node 20+ và pnpm 10.

## API Chính

Versioning hiện không đồng nhất theo as-built: public/track dùng `/api/v1/*`, auth/admin/user-vocab không version. Đây là quyết định đã chốt trong `PROJECT-STATE` D-07.

| Nhóm         | Endpoint                                                                                                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health/docs  | `GET /api/health`, `GET /api/docs`                                                                                                                                                                               |
| Public vocab | `GET /api/v1/topics`, `GET /api/v1/vocab`, `GET /api/v1/vocab/count`                                                                                                                                             |
| Traffic      | `POST /api/v1/track`                                                                                                                                                                                             |
| User auth    | `/api/user/csrf`, `/api/user/register`, `/api/user/login`, `/api/user/logout`, `/api/user/logout-all`, `/api/user/profile`, `/api/user/change-password`, `/api/user/forgot-password`, `/api/user/reset-password` |
| User vocab   | `GET/POST/PATCH/DELETE /api/user/vocab*`                                                                                                                                                                         |
| Admin        | `/api/admin/*`                                                                                                                                                                                                   |

Chi tiết contract nằm ở [doc/SDLC/05-api.md](doc/SDLC/05-api.md).

## Bắt Đầu Local

```bash
pnpm install

pnpm docker:up
pnpm db:generate
pnpm db:migrate

pnpm dev:api        # http://localhost:3000
pnpm dev:user-web   # http://localhost:3001
pnpm dev:admin-web  # http://localhost:3002
```

Quality gates:

```bash
pnpm check
pnpm test
```

## Env

Mỗi file env có một nhiệm vụ. DB URL chỉ khai ở `packages/db/.env`; API runtime load file này với `override`, nên không đặt `DATABASE_URL` trong `apps/api/.env`.

| File                  | Đọc bởi                       | Chứa                                                           |
| --------------------- | ----------------------------- | -------------------------------------------------------------- |
| `.env`                | Docker Compose                | `POSTGRES_*`, `PGADMIN_*`                                      |
| `packages/db/.env`    | Prisma CLI, API runtime, seed | `DATABASE_URL`, `DIRECT_URL`                                   |
| `apps/api/.env`       | API runtime                   | `PORT`, `AUTH_*`, `ADMIN_INITIAL_*`, `WEB_APP_URL`, `RESEND_*` |
| `apps/user-web/.env`  | user-web                      | `NEXT_PUBLIC_API_URL`                                          |
| `apps/admin-web/.env` | admin-web                     | `NEXT_PUBLIC_API_URL`                                          |

Production env đặt trên dashboard Render/Vercel/Supabase, không dùng file `.env` thật.

## Nguồn Dữ Liệu Từ Vựng

Kho từ vựng được build từ hai nguồn miễn phí:

| Nguồn                                                                           | Cung cấp                      | License         |
| ------------------------------------------------------------------------------- | ----------------------------- | --------------- |
| [Maximax67/Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset) | Từ EN + CEFR + tần suất + POS | MIT             |
| [kaikki.org — English Wiktionary](https://kaikki.org/dictionary/English/)       | Nghĩa, IPA, ví dụ, POS        | CC BY-SA + GFDL |

Pipeline:

```bash
pnpm --filter @keylish/api build-dataset
pnpm --filter @keylish/api seed
```

## Cấu Trúc

```text
KeyLish/
├── apps/
│   ├── api/        # NestJS backend
│   ├── user-web/   # Next.js learning app
│   └── admin-web/  # Local-only admin UI
├── packages/
│   ├── db/         # Prisma schema, client, migrations
│   └── shared/     # Zod schemas and shared types
├── scripts/        # Dataset pipeline
└── doc/            # SDLC docs in Vietnamese
```

## Tài Liệu

- [doc/README.md](doc/README.md) — bản đồ tài liệu và checklist bắt đầu làm việc.
- [doc/context/PROJECT-STATE.md](doc/context/PROJECT-STATE.md) — trạng thái sống, risk, open question, decision.
- [doc/SDLC/11-tasks.md](doc/SDLC/11-tasks.md) — backlog còn lại.
- [doc/SDLC/09-deployment.md](doc/SDLC/09-deployment.md) — deploy/env chi tiết.

## Ghi Công & License Dữ Liệu

- Dữ liệu CEFR/tần suất/POS: [Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset) — MIT License.
- Dữ liệu nghĩa EN→VI, IPA, ví dụ: trích xuất từ [English Wiktionary](https://en.wiktionary.org/) qua [kaikki.org](https://kaikki.org/) — CC BY-SA và GFDL.
