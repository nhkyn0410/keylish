# 02 — Thiết kế Kiến trúc Mức cao (HLD)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường        | Giá trị                                        |
| ------------- | ---------------------------------------------- |
| Tên           | Thiết kế Kiến trúc Mức cao (High-Level Design) |
| Mã tài liệu   | `02-hld`                                       |
| Dự án         | KeyLish                                        |
| Phiên bản     | 0.2.1                                          |
| Trạng thái    | Draft                                          |
| Người viết    | AI Agent (soạn thảo SDLC)                      |
| Người duyệt   | Nguyễn Hồng Khanh                              |
| Ngày tạo      | 2026-06-15                                     |
| Chuẩn áp dụng | ISO/IEC/IEEE 15289:2019                        |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật | Nội dung                                                                                                      |
| --------- | ---------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| 0.1.0     | 2026-06-15 | AI Agent       | Bản Draft đầu.                                                                                                |
| 0.2.0     | 2026-06-15 | AI Agent       | Nâng cấp: bổ sung sequence diagram, kiến trúc chi tiết, FR trace, quality attributes, cross-cutting concerns. |
| 0.2.1     | 2026-06-15 | AI Agent       | Sửa G-5 (~52% → ASSUMPTION); G-4 gom RISK (R-9→R-10) + phản ánh D-06/D-07.                                    |

### 1.3. Tham chiếu

| Tài liệu             | Nội dung                                       |
| -------------------- | ---------------------------------------------- |
| `00-coding-standard` | Stack, workspace, ranh giới, coding convention |
| `01-srs`             | Yêu cầu chức năng (FR), use case (UC), NFR     |
| `03-lld`             | Thiết kế chi tiết từng module API + engine gõ  |
| `04-database`        | ERD, Prisma schema, data pipeline              |
| `07-security`        | Auth, CSRF, session, cookie, rate-limit        |
| `09-deployment`      | Vercel/Render/Supabase topology, env mapping   |
| `10-adr`             | Quyết định kiến trúc (NestJS, Prisma, ...)     |

## 2. Tổng quan kiến trúc

### 2.1. Architectural style

KeyLish theo kiến trúc **Monorepo phân tách trách nhiệm (Separation of Concerns)** với:

- **Backend-first API** (NestJS) — xử lý logic nghiệp vụ tập trung (auth, admin, vocab, traffic)
- **Frontend thin client** (Next.js) — UI rendering, local-first caching, offline capability
- **Shared schema** (Zod) — hợp đồng type-safe giữa API và web, tránh lệch interface

Ở phía client, áp dụng **Opportunistic Cache pattern**: ưu tiên dùng API (fresh data), fallback qua IndexedDB cache, rồi seed offline. API không phải là dependency bắt buộc cho luồng chính (luyện gõ).

### 2.2. Các nguyên lý kiến trúc (Architecture Principles)

| #     | Nguyên lý                        | Mô tả                                                                        | Bằng chứng trong code                     |
| ----- | -------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| AP-01 | **Local-first**                  | Ứng dụng phải hoạt động được khi API không khả dụng                          | `vocabApi.ts`: 3 tầng API → cache → seed  |
| AP-02 | **Defense in depth**             | Auth tự xây nhiều lớp: Argon2 + HMAC + CSRF + rate-limit + origin check      | `auth.service.ts`, `admin-gate.guard.ts`  |
| AP-03 | **No vendor lock-in**            | Không SDK vendor trong domain; REST `fetch` cho mail; Prisma adapter pattern | `mail.service.ts`, `@keylish/db`          |
| AP-04 | **Controller mỏng, service dày** | Controller chỉ routing/guard; logic + DB query ở service                     | `auth.controller.ts` vs `auth.service.ts` |
| AP-05 | **Aggregate-on-write**           | Gộp dữ liệu ngay khi ghi, không lưu raw events                               | `traffic.service.ts`: upsert hourly       |
| AP-06 | **Admin surface mặc định đóng**  | Admin API 404 khi không bật; an toàn deploy public                           | `admin-gate.guard.ts`                     |

### 2.3. Sơ đồ kiến trúc tổng thể

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          TRÌNH DUYỆT (Browser)                                   │
│                                                                                  │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐      │
│  │   apps/user-web (Next.js 16)    │    │  apps/admin-web (Next.js 16)    │      │
│  │   ┌───────────────────────────┐ │    │  ┌───────────────────────────┐ │      │
│  │   │ App Router (pages)        │ │    │  │ Dashboard pages           │ │      │
│  │   │  (site)/ · (auth)/ ·      │ │    │  │ (overview, users, vocab,  │ │      │
│  │   │  (practice)/              │ │    │  │  topics, analytics)       │ │      │
│  │   └──────────┬────────────────┘ │    │  └───────────────────────────┘ │      │
│  │              │                  │    │  ┌───────────────────────────┐ │      │
│  │   ┌──────────▼────────────────┐ │    │  │ Ant Design 6 UI          │ │      │
│  │   │ Components                │ │    │  │ (tables, forms, charts)  │ │      │
│  │   │  typing/ (engine gõ)      │ │    │  └───────────────────────────┘ │      │
│  │   │  layout/ (AppShell, ...)  │ │    └──────────┬──────────────────────┘      │
│  │   │  auth/ (AuthFrame, ...)   │ │               │                              │
│  │   │  ui/ (NeoCard, ...)      │ │               │ (local-only PARTIAL)               │
│  │   └──────────────────────────┘ │               │                              │
│  │   ┌──────────────────────────┐ │               │                              │
│  │   │ Data layer               │ │               │                              │
│  │   │  infra/vocab/vocabApi.ts │ │               │                              │
│  │   │  infra/user/userApi.ts   │ │               │                              │
│  │   │  data/seed/ (112 từ)     │ │               │                              │
│  │   │  IndexedDB (opportunistic│ │               │                              │
│  │   │    cache)                │ │               │                              │
│  │   └──────────────────────────┘ │               │                              │
│  └────────────┬───────────────────┘               │                              │
│               │ HTTP fetch                        │ HTTP fetch                   │
│               │ NEXT_PUBLIC_API_URL               │ (khi dev local)              │
└───────────────┼───────────────────────────────────┼──────────────────────────────┘
                │                                   │
                ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     apps/api (NestJS 11 + Express)                              │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                      Express HTTP Server                                   │ │
│  │  Global prefix: /api · URI versioning · CORS · cookieParser · trust proxy  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                             │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │  Public (công khai)             │     Admin (gate: AdminGateGuard)        │ │
│  │  ┌──────────┐ ┌───────┐ ┌────┐ │     ┌───────┐ ┌────────────┐ ┌────────┐ │ │
│  │  │ Vocab    │ │Topics │ │Traf│ │     │Admin  │ │AdminVocab  │ │Admin   │ │ │
│  │  │Controller│ │Control│ │fic │ │     │Control│ │Controller  │ │Topics  │ │ │
│  │  │ GET /v1/ │ │ler    │ │Con │ │     │ler    │ │ CRUD /admin│ │Controll│ │ │
│  │  │ vocab    │ │GET    │ │trol│ │     │summary│ │ /vocab     │ │er      │ │ │
│  │  │ /count   │ │/v1/   │ │ler │ │     │users  │ │            │ │CRUD    │ │ │
│  │  └──────────┘ │topics  │ │POST│ │     │list   │ │            │ │/admin/ │ │ │
│  │               └───────┘ │/v1/│ │     └───────┘ └────────────┘ │topics  │ │ │
│  │                         │trac│ │                               └────────┘ │ │
│  │                         │k   │ │                                          │ │
│  │                         └────┘ │                                          │ │
│  └─────────────────────────────────┼──────────────────────────────────────────┘ │
│                                    │                                             │
│  ┌────────┐ ┌───────┐ ┌─────────┐ │ ┌──────────┐                              │ │
│  │ Auth   │ │Admin  │ │ Mail    │ │ │ Health   │                              │ │
│  │Control │ │Auth   │ │ Service │ │ │ Control  │                              │ │
│  │ler     │ │Control│ │(Resend) │ │ │ /health  │                              │ │
│  │ /user/*│ │ler    │ └─────────┘ │ └──────────┘                              │ │
│  │ /admin/*│ │/admin│              │                                             │ │
│  │ (login)│ │/login│              │                                             │ │
│  └────────┘ └───────┘              │                                             │ │
│                                    │                                             │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                         DatabaseService (Prisma)                          │ │
│  │              @keylish/db — Prisma Client 7 + @prisma/adapter-pg           │ │
│  └─────────────────────────────────┼──────────────────────────────────────────┘ │
└────────────────────────────────────┼───────────────────────────────────────────┘
                                     │
                                     ▼
                ╔══════════════════════════════════════╗
                ║    PostgreSQL (Docker/Supabase)      ║
                ║  10 tables · 3 enums · 15+ indexes   ║
                ╚══════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────┐
│                          packages/shared (Zod 4)                                 │
│  VocabQuerySchema · VocabResponseSchema · WordDTOSchema · TopicDTOSchema ·      │
│  CefrLevelSchema · VocabCountSchema                                              │
│  Dùng chung giữa apps/api và apps/user-web → đảm bảo contract đồng bộ            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4. 5 Workspace

| #    | Workspace         | Package              | Vai trò                                                    | Runtime                | Build tool   | FR trace               | Trạng thái |
| ---- | ----------------- | -------------------- | ---------------------------------------------------------- | ---------------------- | ------------ | ---------------------- | ---------- |
| W-01 | `apps/api`        | `@keylish/api`       | Backend NestJS (auth, vocab, admin, traffic, mail, health) | Node 22.16 (prod)      | `nest build` | FR-AUT/ADM/VOC/TRF/MAL | DONE       |
| W-02 | `apps/user-web`   | `@keylish/user-web`  | Web học từ vựng (Next.js App Router + React 19)            | Browser (Vercel)       | `next build` | FR-PRC/VOC             | DONE       |
| W-03 | `apps/admin-web`  | `@keylish/admin-web` | Admin panel V2 (Ant Design 6 Next.js)                      | Browser (local-only)   | `next build` | FR-ADM-07              | PARTIAL    |
| W-04 | `packages/db`     | `@keylish/db`        | Prisma schema, client generator, migrations                | Node (build + runtime) | `tsup`       | —                      | DONE       |
| W-05 | `packages/shared` | `@keylish/shared`    | Zod 4 schema/type dùng chung (vocab query, DTO)            | Node (build-time)      | `tsup`       | FR-VOC-02/03           | DONE       |

### 2.5. Phân luồng request (Request Flow)

```
Browser                          NestJS                            PostgreSQL
  │                                │                                  │
  │──GET /api/health─────────────►│ HealthController                  │
  │◄──{ status:"ok" }─────────────│  (không DB)                      │
  │                                │                                  │
  │──GET /api/v1/topics──────────►│ TopicsController                  │
  │                                │──►TopicsService                  │
  │                                │    ──►Topic.findMany()─────────►│
  │◄──[{slug,title,count}]───────│◄──result─────────────────────────│
  │                                │                                  │
  │──GET /api/v1/vocab?levels=A1─►│ VocabController                  │
  │                                │──►VocabService                   │
  │                                │    parse VocabQuerySchema (Zod)  │
  │                                │    ──►Word.findMany()──────────►│
  │◄──[{en,vi,level,...}]────────│◄──result─────────────────────────│
  │                                │                                  │
  │──POST /user/register─────────►│ AuthController (CsrfGuard)       │
  │  + CSRF cookie + header       │──►AuthService                    │
  │  + {email, password}          │    parse UserRegisterSchema (Zod) │
  │                                │    hashPassword (Argon2id)       │
  │                                │    $transaction:                 │
  │                                │      User.create                 │
  │                                │        + UserIdentity.create     │
  │                                │        + UserSession.create─────►│
  │◄──Set-Cookie: __Host-user─────│◄──result─────────────────────────│
  │◄──Set-Cookie: __Host-u-csrf───│                                  │
  │◄──{ ok, user }────────────────│                                  │
  │                                │                                  │
  │──POST /api/v1/track──────────►│ TrafficController                │
  │  Origin: https://keylish.app  │──►TrafficService                 │
  │                                │    allowedOrigins check          │
  │                                │    TrafficHourly.upsert─────────►│
  │◄──204 No Content──────────────│◄──done───────────────────────────│
```

## 3. Kiến trúc chi tiết theo module

### 3.1. Module Auth (FR-AUT-01..10)

**File**: `apps/api/src/auth/` — `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.guard.ts`, `auth.dto.ts`

**Trách nhiệm**:

- Đăng ký/đăng nhập/đăng xuất user (email + password)
- Đăng nhập/đăng xuất admin (username + password)
- Quản lý session (cookie token hash), CSRF, rate-limit
- Quên/đặt lại/đổi mật khẩu (mail + reset token)
- Background job: dọn phiên/token hết hạn (24h interval)

**Phụ thuộc**: `DatabaseService`, `MailService`

**Guard chain**:

```
Request → AdminGateGuard (global, chặn admin nếu tắt)
        → CsrfGuard (POST/PUT/PATCH/DELETE: CSRF + Origin check)
        → UserGuard hoặc AdminGuard (verify session cookie)
```

**Sequence — Đăng ký (UC-02)**:

```
Browser                     AuthController           AuthService                  DB
  │                              │                       │                         │
  │ 1. GET /user/csrf           │                       │                         │
  │◄──── Set-Cookie: u-csrf ────┤                       │                         │
  │ 2. POST /user/register      │                       │                         │
  │    Cookie: u-csrf=...       │                       │                         │
  │    X-CSRF-Token: ...        │                       │                         │
  │    {email, password}        │                       │                         │
  │                              │──registerUser(body, req)──►                     │
  │                              │                       │──assertRateLimit (ip)──►│
  │                              │                       │──assertRateLimit (acct)►│
  │                              │                       │──hashPassword(argon2)    │
  │                              │                       │──createToken()           │
  │                              │                       │──hashToken(pepper)       │
  │                              │                       │──$transaction──────────►│
  │                              │                       │   User.create            │
  │                              │                       │   UserIdentity.create    │
  │                              │                       │   UserSession.create────►│
  │                              │                       │◄──result────────────────│
  │                              │◄──{user, csrf, token}─│                         │
  │◄──Set-Cookie: __Host-user───┤                       │                         │
  │◄──Set-Cookie: __Host-u-csrf─┤                       │                         │
  │◄──{ok, user}────────────────┤                       │                         │
```

### 3.2. Module Vocab (FR-VOC-01..06)

**File**: `apps/api/src/vocab/` — `vocab.module.ts`, `vocab.controller.ts`, `vocab.service.ts`

**Hai controller trên cùng service**:
| Controller | Route | Auth | Mục đích |
|---|---|---|---|
| `VocabController` | `/api/v1/vocab`, `GET /count` | — | Public read |
| `AdminVocabController` | `/admin/vocab` (CRUD) | AdminGuard + CsrfGuard | Admin quản trị |

**Public vocab flow**:

```
Request → VocabController.findAll(query)
        → VocabService
            → VocabQuerySchema.safeParse(query)  (Zod 4, schema từ @keylish/shared)
            → Prisma: Word.findMany({
                where: { level: {in: levels}, topic: {slug: {in: topics}} },
                orderBy: random ? undefined : [frequency desc, en asc],
                take: random ? undefined : limit
              })
            → shuffle (nếu random) + slice(limit)
            → map topic.slug → trả về WordDTO[]
```

### 3.3. Module Topics (FR-VOC-04)

**File**: `apps/api/src/topics/` — `topics.module.ts`, `topics.controller.ts`, `topics.service.ts`

Tương tự Vocab: public read + admin CRUD. Public endpoint trả `{slug, title, count}` sắp xếp title asc.

### 3.4. Module Traffic (FR-TRF-01..03, FR-ADM-06)

**File**: `apps/api/src/traffic/` — `traffic.module.ts`, `traffic.controller.ts`, `traffic.service.ts`

**Aggregate-on-write pattern**:

```
track(origin)
  → origin trong allowedOrigins?
    → hour = floor(now, UTC hour)
    → TrafficHourly.upsert({
        where: { hour },
        create: { hour, count: 1 },
        update: { count: { increment: 1 } }
      })
    → return { counted: true }
  → không? → return { counted: false }

Kết quả: luôn trả 204 No Content, không tiết lộ có đếm hay không.
```

**Client-side dedup**: `TrafficBeacon.tsx` dùng `sessionStorage` flag → chỉ gửi 1 lần/phiên trình duyệt.

### 3.5. Module Admin (FR-ADM-01..06)

**File**: `apps/api/src/admin/`

**Ba tầng bảo vệ**:

1. **AdminGateGuard** (global APP_GUARD): 404 khi ADMIN_API_ENABLED không bật
2. **AdminGuard** (guard cục bộ): verify admin session cookie
3. **CsrfGuard** (unsafe methods): CSRF double-submit

**Admin controller structure**:

```
AdminController:
  GET  /admin/dashboard/summary → AdminService.getAdminSummary()
  GET  /admin/users             → AdminService.listUsers(query)
  GET  /admin/users/:id         → AdminService.getUserById(id)
  PATCH /admin/users/:id        → AdminService.updateUserById(id, body)
  (Vocab CRUD và Topic CRUD nằm ở AdminVocabController, AdminTopicsController
   — các controller này kế thừa service từ vocab/topics module)
```

### 3.6. Module Mail (FR-MAL-01)

**File**: `apps/api/src/mail/mail.service.ts` (73 dòng)

Thiết kế **zero-dependency**: gọi Resend REST API qua `global.fetch` — không SDK.

```
sendPasswordReset(email, token):
  → build link: WEB_APP_URL + /reset-password?token=...
  → RESEND_API_KEY + AUTH_RESET_EMAIL_FROM?
    → fetch POST https://api.resend.com/emails
      headers: Authorization Bearer {apiKey}
      body: { from, to, subject: "Đặt lại mật khẩu KeyLish", html, text }
    → response.ok? → { delivered: true }
    → lỗi? → log error → { delivered: false }
  → thiếu config? → log link ra console → { delivered: false }
  → response luôn đồng nhất (dù có gửi được hay không)
```

### 3.7. Module Health

**File**: `apps/api/src/health/health.controller.ts`

`GET /api/health` → `{ status: "ok", service: "api", docs: "/api/docs" }`
Render dùng healthCheckPath để restart.

## 4. Kiến trúc Local-First (user-web)

### 4.1. Ba tầng dữ liệu

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         fetchVocab(params)                               │
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ API có    │───►│ fetch    │───►│ response ok? │───►│ parse Zod     │  │
│  │ cấu hình? │    │ /api/v1/ │    │               │    │ VocabResponse │  │
│  └────┬─────┘    │ vocab    │    └───────┬───────┘    └───────┬───────┘  │
│       │          └──────────┘            │                    │          │
│       │không     ┌──────────┐            │không ok            │ok        │
│       └─────────►│ Indexed  │◄───────────┘                    │          │
│                  │ DB cache │                                 │          │
│                  └────┬─────┘                                 │          │
│                       │có                                     │          │
│                       │          ┌────────────────┐           │          │
│                       │          │ writeCache      │◄──────────┘          │
│                       │          │ (IndexedDB)     │                      │
│                       │          └────────────────┘                      │
│                       ▼                                                   │
│  ┌──────────────────────────────┐                                        │
│  │ Seed offline (112 từ curated)│ ← fallback cuối cùng                   │
│  │ apps/user-web/src/data/seed/ │   luôn có, kể cả offline hoàn toàn     │
│  └──────────────────────────────┘                                        │
│                                                                          │
│  Kết quả: { words: WordDTO[], source: "api"|"cache"|"seed", error? }     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Chiến lược cache

- **IndexedDB**: opportunistic write-through cache. Khi API thành công, ghi vào IndexedDB (cache key = query params hash). Lần sau cùng query → đọc cache trước khi fallback seed.
- **Seed offline**: 112 từ curated, bundled trong JS (`seed-vocabulary.json`). Luôn sẵn sàng.
- **Không có cache invalidation phức tạp**: cache đơn giản (key-value store). Dữ liệu từ vựng ít thay đổi.

### 4.3. Cold start handling

```
warmApi() → fire-and-forget GET /api/health (đánh thức Render)
loadTopicsAwait() → retry fetchTopics mỗi 3.5s × 30 lần (~105s)
  → nếu API thức trong lúc đó → dùng dữ liệu thật
  → nếu không → dùng seed
```

## 5. Shared Package (`@keylish/shared`)

**File**: `packages/shared/src/vocab.ts`

Đóng vai trò **contract** giữa API và web:

```
@keylish/shared
  CefrLevelSchema     → dùng bởi API (VocabService) + web (vocabApi.ts)
  VocabQuerySchema    → API parse input · web dùng type cho query params
  WordDTOSchema       → API response type · web parse response
  TopicDTOSchema      → API response · web TopicDTO
  VocabCountSchema    → API /count response
  VocabResponseSchema → mảng WordDTO
```

Lợi ích: đảm bảo API không bao giờ trả type khác với web mong đợi. Một schema → cả validation (runtime) lẫn type (compile-time).

## 6. Database Architecture

### 6.1. Connection Architecture

```
api (NestJS)                     packages/db                    PostgreSQL
  │                                │                               │
  │ DatabaseService                │ createPrismaClient(url)       │
  │   └── get client()            │   └── new PrismaClient({      │
  │                                │         adapter: new pg()    │
  │   Dùng Prisma Client          │       })                      │
  │   cho mọi truy vấn            │   └── pool.end() (shutdown)   │
  │                                │                               │
  │   onApplicationShutdown:      │                               │
  │     client.$disconnect()      │                               │
  │     pool.end()                │                               │
```

### 6.2. Migration Strategy

- **Dev**: `pnpm db:migrate` (Prisma Migrate dev — tạo migration file mới)
- **Prod**: `pnpm db:deploy` (Prisma Migrate deploy — chỉ chạy migration chưa áp dụng)
- Migration files ở `packages/db/prisma/migrations/`
- Seed: script độc lập `apps/api/scripts/seed.ts` — xóa sạch rồi nạp batch 1000 từ

## 7. Data Pipeline

### 7.1. Build dataset (offline script)

```
scripts/build-dataset.mjs
  (chạy local, không chạy trên server)

  Input:
    Maximax67 CSV (words.csv, word_pos.csv, pos_tags.csv) ─── MIT
    kaikki.org English Wiktionary JSONL.gz ─── CC BY-SA + GFDL

  Process:
    Stream kaikki từng dòng (không load full RAM)
    → Lọc entry có translation "vi"
    → JOIN với Maximax67 → gắn CEFR level, frequency, POS
    → Gán chủ đề (TOPIC_RULES: tối đa ~14 topics; tỉ lệ từ có chủ đề tùy chất lượng kaikki — ASSUMPTION)
    → Output: .data-tmp/dataset.json { words[], _meta }

  Fallback:
    Nếu không có kaikki → chạy curated-only (112 từ + cảnh báo)
```

### 7.2. Seed database

```
apps/api/scripts/seed.ts
  (gọi qua pnpm --filter @keylish/api seed)

  Process:
    XÓA SẠCH Word + Topic
    Đọc dataset.json
    → có? → batch 1000 từ → Prisma createMany/Topic create
    → không? → fallback seed 112 từ (vocab-shared.mjs)
```

### 7.3. Seed offline user-web

```
scripts/build-vocab.mjs
  → Đọc vocab-shared.mjs (112 từ curated)
  → Output: apps/user-web/src/data/seed/seed-vocabulary.json
  → user-web import để dùng offline
```

**Chi tiết đầy đủ**: `doc/vocab-pipeline.md` + `04-database.md` §6.

## 8. CORS, CSRF & Cookie Strategy

### 8.1. CORS

```
main.ts:
  app.enableCors({
    origin: allowedOrigins,  // AUTH_ALLOWED_ORIGINS || CORS_ORIGIN + localhost dev
    credentials: true,       // cho phép cookie cross-origin
    methods: [GET, POST, PATCH, PUT, DELETE, OPTIONS],
    allowedHeaders: [Content-Type, X-CSRF-Token],
  })
```

**Prod behavior**: chỉ origin user-web (Vercel) được gửi request có credentials.
**Dev behavior**: `localhost:3001` (user-web), `localhost:3002` (admin-web).

### 8.2. Cookie domains

| Môi trường  | User session  | Admin session  | User CSRF       | Admin CSRF      |
| ----------- | ------------- | -------------- | --------------- | --------------- |
| Production  | `__Host-user` | `__Host-admin` | `__Host-u-csrf` | `__Host-a-csrf` |
| Development | `user`        | `admin`        | `u-csrf`        | `a-csrf`        |

`__Host-` prefix yêu cầu: path=/ ; Secure; không có Domain attribute — bảo vệ khỏi subdomain attack.

### 8.3. CSRF double-submit

```
Unsafe request (POST/PUT/PATCH/DELETE):
  1. Kiểm tra Origin header (hoặc Referer fallback) — phải nằm trong allowedOrigins
  2. Đọc CSRF token từ cookie (không httpOnly) — cookieValue
  3. Đọc CSRF token từ header X-CSRF-Token — headerValue
  4. cookieValue === headerValue? → OK
  5. Không → 403 Forbidden
```

## 9. Module Dependency Graph

```
                          ┌──────────────────────┐
                          │     AppModule         │
                          │  global: APP_GUARD   │
                          │  AdminGateGuard      │
                          └──────┬───────────────┘
        ┌───────────┬───────────┼───────────┬───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
  │ Health   │ │ Auth     │ │ Topics │ │ Vocab  │ │ Traffic│ │ Admin    │
  │ Module   │ │ Module   │ │ Module │ │ Module │ │ Module │ │ Module   │
  └──────────┘ └────┬─────┘ └────────┘ └────────┘ └────────┘ └────┬─────┘
                    │                                              │
                    │  ┌──────────────┐     ┌──────────────┐       │
                    │  │ Database     │     │ Mail         │       │
                    │  │ Module       │     │ Service      │       │
                    │  └──────┬───────┘     └──────────────┘       │
                    │         │                                     │
                    └─────────┼─────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  @keylish/db      │
                    │  (Prisma Client)  │
                    └───────────────────┘
```

**AdminModule** phụ thuộc: AuthModule + TopicsModule + VocabModule + TrafficModule — các controller admin borrow service từ các module khác.

## 10. Deployment Topology

```
                          Internet
                             │
               ┌─────────────┴─────────────┐
               │                           │
          Vercel                      Render
     apps/user-web                 apps/api
     next start                    node dist/main.js
     ENV:                          ENV (render.yaml):
       NEXT_PUBLIC_API_URL           DATABASE_URL (Supabase pooled)
                                     DIRECT_URL (Supabase direct)
                                     AUTH_TOKEN_PEPPER
                                     CORS_ORIGIN
                                     WEB_APP_URL
                                     RESEND_API_KEY (optional)
               │                           │
               └─────────────┬─────────────┘
                             │
                     Supabase (PostgreSQL)
                     Free plan: pause sau 7 ngày idle

  apps/admin-web → local-only (localhost:3002)
  ──────────────────────────────────────
  Docker (dev): postgres:16-alpine + pgAdmin 4
```

**Chi tiết**: `09-deployment.md`.

## 11. Cross-cutting Concerns

### 11.1. Error Handling Strategy

| Layer      | Cơ chế                                                                 | Ví dụ                                          |
| ---------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| Controller | NestJS exception filter mặc định                                       | `BadRequestException`, `UnauthorizedException` |
| Service    | `safeParse` Zod → ném `BadRequestException`                            | Validation lỗi                                 |
| Guard      | Ném `ForbiddenException`, `UnauthorizedException`, `NotFoundException` | CSRF sai, session hết hạn, admin tắt           |
| DB         | Prisma `P2002` → `ConflictException`; `P2025` → `NotFoundException`    | Email trùng, not found                         |
| Global     | NestJS `ExceptionsHandler` — trả JSON `{ message, statusCode }`        | Lỗi không bắt được                             |

### 11.2. Logging Strategy

- **Logger**: NestJS `Logger` (built-in), scoped theo service name
- **Không log**: password, token thô, email, session cookie value
- **IP**: chỉ lưu hash (HMAC-SHA256 + pepper), không log IP thô
- **Dev-only warning**: MailService log reset link khi thiếu Resend config

### 11.3. Background Jobs

| Job                   | Trigger                            | Interval | Mô tả                                                                |
| --------------------- | ---------------------------------- | -------- | -------------------------------------------------------------------- |
| Purge sessions/tokens | `AuthService.onModuleInit` + timer | 24h      | Xóa session hết hạn, token đã dùng/hết hạn; giữ revoked 7 ngày audit |
| Traffic cleanup       | Không có (tự động)                 | —        | TrafficHourly luôn ≤ 24 dòng/ngày — không cần cleanup                |

## 12. Quality Attributes (NFR mapping)

| Attribute           | Mục tiêu                      | Cơ chế as-built                                         | NFR trace      |
| ------------------- | ----------------------------- | ------------------------------------------------------- | -------------- |
| **Performance**     | Cold start < 5s (với prewarm) | `warmApi()`, `loadTopicsAwait()`, seed offline fallback | NFR-PER-01     |
| **Scalability**     | Traffic tracking O(1) storage | Aggregate-on-write: 1 row/hour, không raw events        | NFR-PER-02     |
| **Security**        | Không lộ PII/token/password   | Argon2id, HMAC+pepper, httpOnly, ipHash, no-log         | NFR-SEC-01..04 |
| **Accessibility**   | WCAG AA, mù màu an toàn       | Màu + nhãn + hình dạng; Focus Zone; reduced-motion      | NFR-ACC-01     |
| **Maintainability** | Single source of truth        | `@keylish/shared` Zod schema; controller mỏng           | NFR-MNT-01     |
| **Usability**       | Giao diện tiếng Việt          | Be Vietnam Pro font; UI text tiếng Việt                 | NFR-USA-01     |
| **Reliability**     | Offline-capable               | IndexedDB cache + 112 từ seed; không crash khi API lỗi  | FR-VOC-05      |

## 13. RISK / OPEN QUESTION

| Mã   | Mô tả                                                                                             | Mức                     | Ảnh hưởng                                |
| ---- | ------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------- |
| R-5  | Layering user-web (`domain/infra/server`) chưa hoàn chỉnh — logic gõ ở `components/vocab/typing/` | Trung bình              | Khó unit-test engine gõ; khó tái sử dụng |
| R-6  | Versioning không đồng nhất: `/api/v1/*` (vocab, topics, track) vs `/user/*`, `/admin/*` (auth)    | Thấp (chấp nhận — D-07) | API surface không nhất quán              |
| R-10 | Không có hook pre-commit lint/typecheck — quality gate thủ công                                   | Thấp                    | Dễ commit code lỗi                       |

> RISK ID chuẩn ở `context/PROJECT-STATE.md` §2. OQ-09 (version hóa auth/admin) đã chốt **D-07**; OQ-10 (deploy admin-web) đã chốt **D-06** — xem PROJECT-STATE §4.
