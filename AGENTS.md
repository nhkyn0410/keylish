# AGENTS.md — KeyLish

Quy ước cho AI coding agents, áp dụng toàn monorepo. Chi tiết & lý do: `doc/SDLC/00-coding-standard.md`. Bối cảnh tài liệu: `CLAUDE.md`.

## Stack

pnpm 10 + Turborepo 2.9 · TypeScript 6 (**strict**, ES2022, moduleResolution Bundler) · NestJS 11 + Express (api) · Next.js 16 + React 19 + Tailwind 4 (user-web) · Next.js + Ant Design 6 (admin-web PARTIAL) · Prisma 7 + PostgreSQL 16 · Zod 4 · Vitest 4 + Supertest. Node 20+ (prod Render 22.16).

## Setup & lệnh

```bash
pnpm install
pnpm docker:up                       # Postgres local
pnpm db:generate && pnpm db:migrate  # Prisma client + migrate
pnpm dev:api        # NestJS  :3000
pnpm dev:user-web   # Next.js  :3001
pnpm dev:admin-web  # Next.js  :3002
pnpm check          # lint + typecheck — BẮT BUỘC trước khi commit
pnpm test           # Vitest + Supertest
pnpm format         # Prettier
```

## Cấu trúc

`apps/api` (NestJS: auth, admin, vocab, topics, traffic, mail, health, database) · `apps/user-web` (engine gõ ở `components/vocab/typing/`, data ở `infra/`, seed ở `data/seed/`) · `apps/admin-web` (PARTIAL chưa nối shared) · `packages/db` (Prisma) · `packages/shared` (Zod) · `scripts/` (pipeline).

## Code style

- TS **strict**, không tắt ở workspace con. `forceConsistentCasingInFileNames`.
- ESLint flat (`@eslint/js` + `typescript-eslint` recommended); `no-unused-vars` = error, bỏ qua prefix `_`.
- Prettier: `printWidth 100`, `semi: true`, **double quotes**, `trailingComma: "es5"`.
- Định danh **tiếng Anh**; chuỗi UI/email **tiếng Việt**. Comment nghiệp vụ tiếng Việt được phép (theo file).

## Ranh giới (BẮT BUỘC)

1. **Zod = nguồn validation.** Input ngoài (query/body) → `schema.safeParse()` → `BadRequestException`. Schema dùng chung ở `@keylish/shared`. Controller nhận `unknown`/`Record<string,unknown>` rồi ủy thác service.
2. **Controller mỏng** — logic + truy vấn ở service.
3. **Không vendor SDK trong domain**: mail = `fetch` REST tới Resend (không SDK); DB **chỉ** qua `DatabaseService` (Prisma client của `@keylish/db`).
4. **Không log token/password/OTP/PII.** IP → `ipHash` (HMAC-SHA256 + pepper). Mailer chỉ log link reset khi thiếu cấu hình (dev-only).
5. **OpenAPI** mô tả qua `@nestjs/swagger` decorators (tái dùng `CefrLevelSchema.options`).
6. **user-web local-first**: lấy vocab 3 tầng API→IndexedDB→seed (`infra/vocab/vocabApi.ts`). Logic thuần nên đặt ở `domain/` (đang refactor — task T-06).
7. **Task gate bắt buộc**: theo `doc/SDLC/11-tasks.md`, phải cập nhật tài liệu liên quan trước khi code; chỉ sửa source khi `Approval = APPROVED` và `Doc gate = READY` (hoặc `N/A` có lý do rõ).

## Test

Vitest unit + Supertest e2e (`apps/api/src/app.e2e.spec.ts`, `auth.service.spec.ts`). Vùng **MANDATORY**: auth (argon2 hash, session token, reset-token reuse/expiry), toàn vẹn từ vựng (`@@unique([en, level])`, CEFR enum), **engine gõ char-by-char + an toàn IME** (vùng dễ lỗi nhất), traffic idempotent theo giờ UTC. Lưu ý: `--passWithNoTests` đang bật → coverage thấp (R-7); thêm test khi đụng các vùng trên.

## Git

- Nhánh **`feature/*`** — **KHÔNG** commit thẳng `master`. Conventional commits (`feat(...)`, `fix(...)`).
- Đổi schema Prisma → tạo migration (`pnpm db:migrate`) **+ cập nhật `doc/SDLC/04-database.md`**.
- Không skip hook / không `--no-verify` trừ khi được yêu cầu rõ.

## Gotchas

- Env tách theo nhiệm vụ; **DB URL chỉ khai ở `packages/db/.env`** (api load với `override`). Prod: env trên dashboard, `AUTH_TOKEN_PEPPER` **bắt buộc** (app từ chối boot nếu thiếu).
- Admin API mặc định **OFF** ở production (`ADMIN_API_ENABLED`) — route admin 404.
- Versioning **không đồng nhất** (đã chốt giữ as-built — D-07): public + track `/api/v1/*`; auth/admin **không** version; health `/api/health`; docs `/api/docs`.
- Tính năng V2 (AI/flashcard/quiz/OAuth) **deferred** (D-04) — đừng tự thêm; mở OQ + APPROVER duyệt trước.
