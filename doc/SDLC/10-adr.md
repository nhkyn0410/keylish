# 10 — Biên bản Quyết định Kiến trúc (ADR)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Biên bản Quyết định Kiến trúc (Architecture Decision Records) |
| Mã tài liệu | `10-adr` |
| Dự án | KeyLish |
| Phiên bản | 0.2.2 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |
| Chuẩn áp dụng | ISO/IEC/IEEE 15289:2019 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu — 10 ADR as-built (MODE B). |
| 0.2.0 | 2026-06-15 | AI Agent | Bổ sung 8 ADR mới (11–18), cập nhật consequences code reference, thêm sơ đồ quan hệ ADR, supersedes chain. |
| 0.2.1 | 2026-06-15 | AI Agent | Chuẩn hóa format metadata (§1.1/§1.2). |
| 0.2.2 | 2026-06-15 | AI Agent | Sửa G-1: code-evidence ADR-003 (route groups (site)/(auth)/(practice)) + ADR-005 (`vocabApi.ts` thay `useVocab.ts`). |

## 2. Quy ước

Mỗi ADR = một quyết định kiến trúc as-built. Cấu trúc:

| Mục | Mô tả |
|---|---|
| Context | Bối cảnh, vấn đề cần giải quyết |
| Decision | Quyết định được chọn |
| Options Considered | Các phương án đã cân nhắc |
| Consequences | Hệ quả (tích cực + tiêu cực) |
| Status | `Accepted` · `Proposed` · `Deprecated` |
| Supersedes | ADR nào bị thay thế (nếu có) |
| Code Evidence | File source minh họa quyết định |

Status: Chỉ APPROVER (Nguyễn Hồng Khanh) được chốt `Accepted`.

## 3. Sơ đồ quan hệ ADR

```
Tech Stack Layer
  ADR-001 (NestJS) ─── ADR-008 (pnpm + Turborepo)
  ADR-002 (Prisma + PG) ─── ADR-013 (vocab pipeline)
  ADR-003 (Next.js App Router)
  ADR-016 (Centralized Prisma package)

Auth Layer
  ADR-004 (Auth tự xây)
    ├── ADR-011 (Cookie session > JWT)
    ├── ADR-012 (Stateless CSRF)
    └── ADR-014 (Soft-delete user)

Data Layer
  ADR-005 (Local-first IndexedDB)
  ADR-006 (Traffic aggregate-on-write)
  ADR-010 (Mail Resend REST)

Deployment Layer
  ADR-007 (Admin local-only)
  ADR-015 (AdminGateGuard global)

Governance Layer
  ADR-009 (Zod validation)
  ADR-017 (Owner-approver docs)
  ADR-018 (Deferred V2 features)
```

## 4. ADR-001: NestJS làm backend framework

| Trường | Giá trị |
|---|---|
| Mã | ADR-001 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần backend framework cho API vocabulary + auth + admin. Yêu cầu: TypeScript, dependency injection, modular, validation/OpenAPI tích hợp.

**Decision**: Dùng **NestJS 11** + Express platform.

**Options Considered**:
- **Express thuần**: thiếu DI, modular structure, phải tự tổ chức project.
- **Fastify**: nhanh hơn Express nhưng NestJS/Express ecosystem rộng hơn (Swagger, cookie-parser, testing).
- **Hono**: mới, ít thư viện, cộng đồng nhỏ.

**Consequences**:
- Tích hợp sẵn `@nestjs/swagger`, DI mạnh cho testing.
- Express platform quen thuộc, nhiều middleware.
- `cookieParser` middleware hoạt động out-of-box.
- `APP_GUARD` pattern cho global guard (AdminGateGuard).
- Nặng hơn Express thuần (metadata reflection, DI container).

**Code Evidence**: `apps/api/src/main.ts` (NestFactory, SwaggerModule, VersioningType, CORS); `apps/api/src/app.module.ts` (APP_GUARD).

---

## 5. ADR-002: Prisma + PostgreSQL

| Trường | Giá trị |
|---|---|
| Mã | ADR-002 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần ORM + database cho quan hệ User/Admin/Vocab/Traffic. Yêu cầu: type-safe, migration, connection pooling.

**Decision**: **Prisma 7** + `@prisma/adapter-pg` + **PostgreSQL 16**.

**Options Considered**:
- **Drizzle ORM**: nhẹ hơn, SQL-like, nhưng migration còn non ở thời điểm chọn.
- **TypeORM**: quen thuộc nhưng API phức tạp, type inference kém hơn Prisma.
- **SQLite**: không phù hợp cho production (auth + admin cần server).

**Consequences**:
- Prisma schema là single source of truth — migration, type, client đều từ schema.
- `@prisma/adapter-pg` dùng native `pg.Pool` — kiểm soát connection lifecycle.
- Build toolchain nặng hơn (prisma generate, preinstall hook).
- Migration cần thủ công `prisma migrate dev` / `prisma migrate deploy`.
- `cuid()` PK chống leaker số lượng bản ghi.

**Code Evidence**: `packages/db/prisma/schema.prisma` (10 models, 3 enums); `packages/db/src/index.ts` (pool + adapter wrapper); `packages/db/prisma/migrations/` (4 migrations).

---

## 6. ADR-003: Next.js App Router cho user-web

| Trường | Giá trị |
|---|---|
| Mã | ADR-003 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần frontend cho ứng dụng học từ vựng. Yêu cầu: SSR optional, routing linh hoạt, React ecosystem.

**Decision**: **Next.js 16 App Router** + **React 19**.

**Options Considered**:
- **Vite + React Router**: không có SSR, phải tự setup routing.
- **Remix**: tốt nhưng cộng đồng nhỏ hơn, learning curve riêng.

**Consequences**:
- App Router cho phép nested layouts, server components, dynamic routes (`[slug]`).
- Tailwind CSS 4 + lucide-react cho UI components.
- `use client` / `use server` boundary rõ ràng.
- API routes có sẵn nhưng không dùng (ưu tiên NestJS backend riêng).
- Bundle build phức tạp hơn Vite, build lâu hơn.

**Code Evidence**: `apps/user-web/` — App Router với route groups `(site)`/`(auth)`/`(practice)`; `app/(site)/page.tsx`, `app/(practice)/typing/page.tsx`.

---

## 7. ADR-004: Auth tự xây

| Trường | Giá trị |
|---|---|
| Mã | ADR-004 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần auth cho user (email/password) và admin (username/password). Yêu cầu: kiểm soát hoàn toàn session, CSRF, rate-limit. Không cần OAuth V1.

**Decision**: Tự xây auth với:
- **Argon2id** cho password hash
- **HMAC-SHA256** cookie session + `AUTH_TOKEN_PEPPER`
- **CSRF double-submit** (cookie + header X-CSRF-Token + Origin check)
- Rate limit in-process `Map<string, { count, resetAt }>`

**Options Considered**:
- **NextAuth/Auth.js**: tốt cho OAuth, nhưng phức tạp cho cookie session tự xây.
- **Lucia**: nhẹ, nhưng version chưa ổn định ở thời điểm chọn.
- **Passport.js**: callback-based, khó tích hợp NestJS DI.

**Consequences**:
- Toàn quyền kiểm soát (cookie name, TTL, hash method, env config).
- Timing equalizer: dummy Argon2 verify cho account ảo.
- Technical debt: rate-limit in-memory (mất khi restart), CSRF chưa rotation.
- Không dependency auth nặng — code tự quản lý.

**Code Evidence**: `apps/api/src/auth/auth.service.ts` (963 dòng — toàn bộ logic auth); `apps/api/src/auth/auth.guard.ts` (3 guards); `apps/api/src/auth/auth.dto.ts` (Zod schemas).

---

## 8. ADR-005: Local-first với IndexedDB + seed offline

| Trường | Giá trị |
|---|---|
| Mã | ADR-005 |
| Status | Accepted |
| Supersedes | — |

**Context**: Ứng dụng cần hoạt động khi API không khả dụng (cold start, mạng chậm). Yêu cầu: vẫn luyện gõ được khi mất API.

**Decision**: **IndexedDB cache** (opportunistic, write-through) + **seed offline 112 từ** bundled trong JS.

**Options Considered**:
- **Service Worker cache**: phức tạp hơn, không cần thiết cho V1.
- **localStorage**: giới hạn dung lượng, synchronous, blocking main thread.
- **Chỉ dùng API**: không local-first, không hoạt động offline.

**Consequences**:
- 3 tầng `fetchVocab`: API → IndexedDB cache → seed offline (112 từ curated).
- Cache IndexedDB là cơ hội (opportunistic) — không đảm bảo dữ liệu tồn tại.
- Seed 112 từ của 8 chủ đề đủ cho demo V1.
- Người dùng vẫn luyện được khi không có mạng.
- Dữ liệu phiên luyện gõ KHÔNG lưu (D-03) — IndexedDB chỉ cache vocab response.

**Code Evidence**: `apps/user-web/src/infra/vocab/vocabApi.ts` — `fetchVocab` 3-tier; `apps/user-web/src/data/seed/seed-vocabulary.json` (112 từ); `scripts/vocab-shared.mjs` (định nghĩa 112 từ gốc).

---

## 9. ADR-006: Traffic aggregate-on-write

| Trường | Giá trị |
|---|---|
| Mã | ADR-006 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần đếm lượt truy cập. Yêu cầu: chi phí lưu trữ thấp, không cần real-time chính xác.

**Decision**: **Aggregate-on-write**: upsert `TrafficHourly` (1 dòng/giờ UTC), increment count.

**Options Considered**:
- **Raw event log**: lưu mỗi page-view → DB phình to theo traffic, không cần thiết cho V1.
- **Analytics service (GA/Plausible)**: third-party dependency, privacy concerns, JavaScript blocking.

**Consequences**:
- Bảng traffic luôn ≤ 24 dòng/ngày → ~8.760 rows/năm — vĩnh viễn nhỏ.
- Upsert idempotent ở mức transaction (`hour` PK).
- Web dùng `sessionStorage` flag để chỉ gửi 1 request/phiên.
- Origin check trong service — chỉ count request từ allowed origins.
- Mất accuracy (không đếm được user block, ad-blocker, non-browser).

**Code Evidence**: `apps/api/src/traffic/traffic.service.ts` (63 dòng — upsert + query); Prisma `TrafficHourly` model.

---

## 10. ADR-007: Admin local-only (không deploy)

| Trường | Giá trị |
|---|---|
| Mã | ADR-007 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần admin panel quản lý nội dung (vocab, topics, users). Yêu cầu: đơn giản, an toàn, không cần public.

**Decision**: **Admin-web local-only** (không deploy). Admin API gated bằng `ADMIN_API_ENABLED` (mặc định OFF production).

**Options Considered**:
- **Admin API + dashboard public**: cần auth mạnh hơn, expose attack surface.
- **Admin như phần của user-web**: trộn codebase, phức tạp, bundle lớn.

**Consequences**:
- Admin-web (Ant Design 6) chạy local `http://localhost:3002`.
- Admin API 404 khi không bật — secure default khi quên env.
- AdminGuard kiểm tra AdminSession — tách biệt hoàn toàn với UserGuard.
- OQ-10: Cân nhắc deploy admin khi hoàn thiện V1.
- Hạn chế: admin không thể quản lý từ xa (phù hợp V1 scope).

**Code Evidence**: `apps/api/src/admin/admin-gate.guard.ts` (38 dòng — global 404 guard); `apps/admin-web/` (Ant Design admin panel).

---

## 11. ADR-008: Monorepo pnpm + Turborepo

| Trường | Giá trị |
|---|---|
| Mã | ADR-008 |
| Status | Accepted |
| Supersedes | — |

**Context**: Dự án có 5 workspaces (api, user-web, admin-web, db, shared). Yêu cầu: chia sẻ code, build cache, quản lý dependency hiệu quả.

**Decision**: **pnpm 10.27** workspace + **Turborepo 2.9**.

**Options Considered**:
- **npm workspaces**: chậm hơn pnpm (không content-addressable storage), không caching built-in.
- **Yarn Berry**: PnP còn nhiều vấn đề tương thích (tooling, ESM).
- **Nx**: mạnh nhưng nặng, overkill cho quy mô 5 workspaces.

**Consequences**:
- `pnpm-lock.yaml` deterministic — reproducible install.
- Turbo cache build/test/lint — skip nếu không có thay đổi.
- `@keylish/shared` dùng Zod schema cho API + web (single source of truth).
- `@keylish/db` đóng gói Prisma client + adapter — reimport ở api, scripts.
- Preinstall hook `prisma generate`.

**Code Evidence**: Root `pnpm-workspace.yaml`; `turbo.json` (pipeline: build, test, lint); `package.json` scripts.

---

## 12. ADR-009: Zod cho validation + OpenAPI

| Trường | Giá trị |
|---|---|
| Mã | ADR-009 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần runtime validation cho API input + type inference cho frontend. API có cả public và admin endpoints.

**Decision**: **Zod 4** cho validation runtime. `@nestjs/swagger` cho OpenAPI docs.

**Options Considered**:
- **Joi**: phổ biến nhưng thiếu type inference, không dùng được type.
- **class-validator**: decorator-based, gắn chặt NestJS, không dùng được ở frontend.
- **TypeBox**: nhanh, nhưng ecosystem nhỏ hơn Zod.

**Consequences**:
- Schema ở `@keylish/shared` dùng chung: `VocabQuerySchema`, `CefrLevelSchema`, `WordDTOSchema`, `TopicDTOSchema`.
- Controller nhận `unknown` → service `safeParse` → throw `BadRequestException`.
- CSV-list preprocessor cho multi-value query params (levels, topics).
- OpenAPI hiện một phần thủ công (Swagger decorator thủ công) — auth/admin endpoints thiếu decorator chi tiết. Chưa tích hợp `nestjs-zod` để sinh OpenAPI tự động từ Zod.

**Code Evidence**: `packages/shared/src/vocab.ts` (shared Zod schemas); `apps/api/src/auth/auth.dto.ts` (auth Zod schemas); `apps/api/src/vocab/vocab.service.ts` (inline Zod schemas).

---

## 13. ADR-010: Mail qua Resend REST (không SDK)

| Trường | Giá trị |
|---|---|
| Mã | ADR-010 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần gửi email reset password. Yêu cầu: tối thiểu dependency, đơn giản.

**Decision**: **Resend REST API** (native `fetch`) — không SDK.

**Options Considered**:
- **Nodemailer + SMTP**: cần SMTP server, cấu hình phức tạp, thêm dependency.
- **SendGrid SDK**: dependency nặng, API key management.
- **Resend SDK**: dependency dù REST đủ dùng — tránh dependency không cần thiết.

**Consequences**:
- Zero dependency cho mail.
- Khi thiếu `RESEND_API_KEY` → log reset link ra console (chấp nhận cho dev).
- Production bắt buộc `RESEND_API_KEY` + `AUTH_RESET_EMAIL_FROM` — nếu thiếu, mail không gửi nhưng không throw.
- Template HTML inline trong code (không template engine).
- `WEB_APP_URL` configurable cho reset link base.

**Code Evidence**: `apps/api/src/mail/mail.service.ts` (73 dòng — toàn bộ mail logic); gọi từ `auth.service.ts:629`.

---

## 14. ADR-011: Cookie session > JWT/Bearer

| Trường | Giá trị |
|---|---|
| Mã | ADR-011 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần session format cho auth. Yêu cầu: server-side revocable, không lưu sensitive data trong token.

**Decision**: **Cookie session**: random token (32-byte base64url) → HMAC-SHA256 → lưu hash trong DB. Cookie httpOnly + SameSite + Secure.

**Options Considered**:
- **JWT access + refresh token**: stateless, nhưng không revoke được, cần blacklist, token lớn hơn.
- **Bearer token (Authorization header)**: không auto-send, client phải tự quản lý storage, dễ bị XSS đánh cắp.
- **Session ID (cookie) + Redis**: cần Redis instance, cache invalidation phức tạp.

**Consequences**:
- Server-side revoke: cập nhật `revokedAt` trong DB → session lập tức vô hiệu.
- Cookie httpOnly: JS không đọc được → chống XSS theft.
- Cookie SameSite=None (prod): hoạt động cross-origin (web ≠ API domain).
- Mỗi request lookup DB (hash → findUnique) — chấp nhận latency.
- OQ-09: Không version prefix cho auth endpoints (khác public `/api/v1/*`).

**Code Evidence**: `apps/api/src/auth/auth.service.ts:84` (hashWithPepper), `:91` (createToken), `:252` (createToken public), `:256` (hashToken public), `:155` (sessionCookieBase).

---

## 15. ADR-012: Stateless CSRF (xoá csrfSecretHash)

| Trường | Giá trị |
|---|---|
| Mã | ADR-012 |
| Status | Accepted |
| Supersedes | — |

**Context**: Schema V1 chứa cột `UserSession.csrfSecretHash` để verify CSRF. Phát hiện cột không bao giờ đọc — CSRF được enforce stateless.

**Decision**: **Xoá `csrfSecretHash`** khỏi `UserSession` + `AdminSession`. CSRF hoàn toàn stateless: double-submit cookie + Origin check.

**Options Considered**:
- **Giữ cột**: dead code trong DB, misleading cho maintainer mới.
- **Stateful CSRF (session-based)**: lưu secret trong session → cần DB lookup cho CSRF.
- **Double-submit stateless**: server set cookie → client gửi lại trong header → so sánh cookie===header.

**Consequences**:
- Migration xoá column: `20260614010000_drop_session_csrf_secret`.
- CSRF không cần DB lookup — nhanh hơn.
- Origin check là security layer thứ hai (dù Origin header có thể spoof ở trình duyệt).
- Không rotation CSRF token — token chỉ đổi khi login/register mới.

**Code Evidence**: `packages/db/prisma/migrations/20260614010000_drop_session_csrf_secret/migration.sql`; `apps/api/src/auth/auth.guard.ts:47` (CsrfGuard); `apps/api/src/auth/auth.service.ts:333` (assertCsrf).

---

## 16. ADR-013: Vocabulary dual-source pipeline (streaming join)

| Trường | Giá trị |
|---|---|
| Mã | ADR-013 |
| Status | Accepted |
| Supersedes | — |

**Context**: Cần dataset từ vựng EN→VI lớn (~100k từ) với CEFR level, IPA, ví dụ. Dataset phải reproduce được, license rõ ràng.

**Decision**: **Pipeline 2 nguồn**: [Maximax67/Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset) (CSV, MIT) + [kaikki.org English Wiktionary](https://kaikki.org/dictionary/English/) (JSONL.gz, CC BY-SA). Streaming join + voting topic assignment.

**Options Considered**:
- **Chỉ 1 nguồn**: không đủ (kaikki có nghĩa VI nhưng không CEFR; Maximax67 có CEFR nhưng không VI).
- **Dataset tự build bằng LLM**: không reproduce được, license không rõ, tốn kém.
- **Mua dataset thương mại**: chi phí, không minh bạch.

**Consequences**:
- `build-dataset.mjs` stream kaikki (multi-GB, không load full RAM) JOIN với Maximax67 lookup maps.
- 112 từ curated làm core — override mọi source conflict.
- Topic assignment dùng voting ≥ 2/3 majority (tránh gán nhầm từ đa nghĩa).
- Output `dataset.json` có `_meta` section (sources, license, counts, generatedAt).
- `seed.ts` xoá sạch + batch insert 1000 từ/lần — idempotent.
- Fallback: 112 từ curated nếu không có kaikki file.

**Code Evidence**: `scripts/build-dataset.mjs` (474 dòng); `scripts/vocab-shared.mjs` (252 dòng — curated list + Maximax67 helpers + POS mapping); `apps/api/scripts/seed.ts` (144 dòng).

---

## 17. ADR-014: Soft-delete cho user accounts

| Trường | Giá trị |
|---|---|
| Mã | ADR-014 |
| Status | Accepted |
| Supersedes | — |

**Context**: User có thể yêu cầu xoá tài khoản. Cần giữ audit trail, không mất dữ liệu tham chiếu.

**Decision**: **Soft-delete**: `User.status = 'DELETED'` + `User.deletedAt = now()`. Không hard delete. Cascade delete chỉ cho identity/session/token (khi user bị xoá mềm, cascade không chạy).

**Options Considered**:
- **Hard delete**: mất audit trail, FK cascade mất dữ liệu liên quan.
- **Soft-delete với isDeleted flag**: thiếu timestamp, không biết khi nào xoá.
- **Status enum ACTIVE/DISABLED/DELETED**: cho phép 3 trạng thái rõ ràng.

**Consequences**:
- UserGuard kiểm tra `!user.deletedAt && user.status === 'ACTIVE'`.
- Admin có thể xem user DELETED trong danh sách user.
- Dashboard summary chỉ đếm `deletedAt: null AND status !== 'DELETED'`.
- Admin có thể set status DISABLED → chặn login tạm thời.
- Không thể khôi phục user sau soft-delete (không có undelete UI V1).

**Code Evidence**: Prisma schema `User.status @default(ACTIVE)` + `User.deletedAt DateTime?`; `auth.service.ts:506` (check active); `admin.service.ts:43` (count active only).

---

## 18. ADR-015: Global AdminGateGuard pattern

| Trường | Giá trị |
|---|---|
| Mã | ADR-015 |
| Status | Accepted |
| Supersedes | — |

**Context**: Admin API là local-only tool (ADR-007). Cần đảm bảo admin surface hoàn toàn ẩn trong production — kể cả login endpoint.

**Decision**: **AdminGateGuard** global (`APP_GUARD`) — 404 toàn bộ `/api/admin/*` khi `ADMIN_API_ENABLED` không `"true"`.

**Options Considered**:
- **Middleware check**: NestJS middleware không có access đến NestJS DI context, khó test.
- **Per-controller guard**: có thể quên guard ở controller mới, không đồng nhất.
- **APP_GUARD global**: một điểm duy nhất, được e2e test coverage, dễ maintain.

**Consequences**:
- Mặc định OFF trong production — secure default.
- Login endpoint cũng bị 404 — attacker không biết admin surface tồn tại.
- E2E test xác nhận: `ADMIN_API_ENABLED=false` → 404; `ADMIN_API_ENABLED=true` → pass guard → 401 (chờ session).
- Admin CRUD controllers register trong `AdminModule` — tất cả đều qua `/api/admin/*`.

**Code Evidence**: `apps/api/src/admin/admin-gate.guard.ts` (38 dòng); `apps/api/src/app.module.ts` (APP_GUARD provider); `apps/api/src/app.e2e.spec.ts:145` (e2e test).

---

## 19. ADR-016: Centralized Prisma client package (`@keylish/db`)

| Trường | Giá trị |
|---|---|
| Mã | ADR-016 |
| Status | Accepted |
| Supersedes | — |

**Context**: Prisma client cần dùng ở cả API app và seed scripts. Schema cần tách biệt khỏi business logic.

**Decision**: Tạo **`packages/db`** — đóng gói Prisma schema + generated client + adapter setup.

**Options Considered**:
- **Prisma client trong apps/api**: không dùng được cho seed, scripts khác.
- **Prisma trong mỗi workspace**: trùng schema, đồng bộ phức tạp.
- **Package riêng @keylish/db**: single source of truth, reexport convenience.

**Consequences**:
- Schema nằm ở `packages/db/prisma/schema.prisma`.
- `packages/db/src/index.ts` export `createPrismaClient(connectionString)` — khởi tạo pool + adapter + client.
- `DatabaseService` (NestJS) wrapper gọi `createPrismaClient` → quản lý lifecycle (onApplicationShutdown).
- Seed scripts import `createPrismaClient` trực tiếp → không cần NestJS context.
- Shared type re-export: `CefrLevel`, `UserStatus`, `AuthProvider`, `Prisma`.

**Code Evidence**: `packages/db/src/index.ts` (12 dòng — factory); `apps/api/src/database/database.service.ts` (22 dòng — NestJS wrapper); `apps/api/scripts/seed.ts` (import @keylish/db).

---

## 20. ADR-017: Owner-approver documentation governance

| Trường | Giá trị |
|---|---|
| Mã | ADR-017 |
| Status | Accepted |
| Supersedes | — |

**Context**: Bộ SDLC 13 file cần quy trình review để đảm bảo chất lượng và as-built accuracy. Nhiều người có thể edit.

**Decision**: **Chỉ APPROVER (Nguyễn Hồng Khanh)** được chốt trạng thái `Approved`. AI Agent viết, APPROVER duyệt. Gắn trạng thái Draft → Approved.

**Options Considered**:
- **Mọi người đều approve**: thiếu kiểm soát, dễ sai lệch so với code.
- **Không quy trình**: ai cũng sửa, không ai chịu trách nhiệm.
- **Code review tool (PR)**: nặng cho tài liệu, không cần thiết.

**Consequences**:
- Trạng thái hiện tại: tất cả `Draft`.
- `PROJECT-STATE.md` là nguồn duy nhất cho trạng thái tài liệu.
- RISK/OQ tracking trong PROJECT-STATE — APPROVER quyết định close.
- Mọi nội dung as-built (MODE B) — không suy diễn ngoài code.

**Code Evidence**: `doc/context/PROJECT-STATE.md` (trạng thái, RISK, OQ, DECISION); `doc/context/DOMAIN-MAP.md` + `GLOSSARY.md`.

---

## 21. ADR-018: Deferred V2 features

| Trường | Giá trị |
|---|---|
| Mã | ADR-018 |
| Status | Accepted |
| Supersedes | — |

**Context**: Nhiều tính năng mong muốn nhưng ngoài scope V1. Cần document rõ deferred items để tránh scope creep.

**Decision**: Deferred to V2 (không triển khai trong code hiện tại):

| Tính năng | Lý do deferred | ADR liên quan |
|---|---|---|
| Lịch sử phiên luyện gõ | Yêu cầu DB schema mới, API, UI; V1 focus core typing engine | ADR-004, ADR-005 |
| AI feedback (BYOK API key) | Cần API key management, prompt engineering, UI | — |
| Flashcard / quiz mode | Yêu cầu spaced repetition algorithm, UI mới | — |
| OAuth (Google, GitHub) | Auth tự xây đủ cho V1; cần UserIdentity mở rộng | ADR-004, ADR-011 |
| Redis-backed rate limit | In-memory đủ cho V1 traffic | ADR-004 |
| Auto OpenAPI from Zod | Manual Swagger decorator đủ cho V1 | ADR-009 |

**Options Considered**:
- **Làm hết V1**: scope quá lớn, delay release.
- **Không document**: mất traceability, dễ quên.

**Consequences**:
- V1 codebase giữ lean — không có dead schema/UI cho deferred features.
- `PROJECT-STATE.md` D-03/04 ghi rõ deferred.
- Khi V2, cần ADR mới cho từng feature (không modify ADR-018).
- D-03: V1 không lưu lịch sử phiên luyện gõ — sửa README cho đúng.

**Code Evidence**: `doc/context/PROJECT-STATE.md` (D-03, D-04); `00-coding-standard` (design principle §2 — deferred); không có code cho deferred features.

## 22. RISK

| ID | Mô tả |
|---|---|
| — | ADR-017 phụ thuộc vào APPROVER availability — nếu APPROVER bận, review chậm. |
| — | ADR-018 deferred list cần review định kỳ để tránh lạc hậu. |
| — | Một số ADR (010, 012) là implementation decision, không phải architectural — có thể merge với ADR khác. |
