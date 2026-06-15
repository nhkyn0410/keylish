# 05 — Đặc tả API (API Specification)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Đặc tả API (API Specification) |
| Mã tài liệu | `05-api` |
| Dự án | KeyLish |
| Phiên bản | 0.2.1 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |
| Chuẩn áp dụng | ISO/IEC/IEEE 15289:2019 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu — as-built từ code + Swagger /api/docs. |
| 0.2.0 | 2026-06-15 | AI Agent | Bổ sung endpoint chi tiết 33 route, full Zod schemas, guard chain, rate limit, response types, auth flow, module dependency, Swagger coverage, cookie spec, error mapping. |
| 0.2.1 | 2026-06-15 | AI Agent | Chuẩn hóa format metadata (§1.1/§1.2); sửa F-1: tổng route 31→33, Auth User 11→10. |

## 2. Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| Global prefix | `/api` |
| Versioning | URI (`VersioningType.URI`) — public endpoints ở `/api/v1/*`, auth/admin **không version** |
| Format | JSON (request/response) |
| Auth | Cookie-based session (`UserGuard`/`AdminGuard`) + CSRF double-submit (`CsrfGuard`) |
| Validation | Zod (`.safeParse()` — ném `BadRequestException`) |
| Framework | NestJS 11 |
| Swagger | `GET /api/docs` (Swagger UI) — title "KeyLish API", description "KeyLish read-only vocabulary API and V2 auth surface" |

### 2.1. Bootstrap sequence (`src/main.ts`)

```
main.ts
├── Load env: apps/api/.env → packages/db/.env
├── assertProductionSecrets() → AUTH_TOKEN_PEPPER required in prod
├── NestFactory.create(AppModule)
├── app.set("trust proxy", 1)
├── app.use(cookieParser())
├── parseOrigins() → AUTH_ALLOWED_ORIGINS hoặc CORS_ORIGIN + localhost:3001,3002 (dev)
├── app.enableCors()
├── app.setGlobalPrefix("api")
├── app.enableVersioning(URI)
├── SwaggerModule.setup("docs")
└── app.listen(PORT ?? 3000)
```

### 2.2. Module dependency graph

```
AppModule
├── HealthModule          (standalone)
├── AuthModule            ← DatabaseModule, MailService
├── AdminModule           ← DatabaseModule, AuthModule, TopicsModule, VocabModule, TrafficModule
├── TopicsModule          ← DatabaseModule, AuthModule
├── VocabModule           ← DatabaseModule, AuthModule
└── TrafficModule         ← DatabaseModule
```

**Global guard**: `AdminGateGuard` (APP_GUARD) — 404 mọi route `/api/admin/*` nếu `ADMIN_API_ENABLED` không phải `"true"` (mặc định: `true` dev, `false` prod).

## 3. Route map — tổng thể 33 endpoints

### 3.1. Public (5 endpoints — không auth)

| Method | Path | Guards | Module | Mô tả | § |
|---|---|---|---|---|---|
| GET | `/api/health` | — | Health | Health check | 4.1 |
| GET | `/api/v1/topics` | — | Topics | Danh sách chủ đề + số từ | 4.2 |
| GET | `/api/v1/vocab` | — | Vocab | Danh sách từ vựng (lọc) | 4.3 |
| GET | `/api/v1/vocab/count` | — | Vocab | Đếm từ khớp lọc | 4.4 |
| POST | `/api/v1/track` | — | Traffic | Ghi lượt xem (204) | 4.5 |

### 3.2. Auth User (10 endpoints — session/csrf)

| Method | Path | Guards | Mô tả | § |
|---|---|---|---|---|
| GET | `/api/user/csrf` | — | Lấy CSRF token + cookie | 5.1 |
| POST | `/api/user/register` | CsrfGuard | Đăng ký tài khoản | 5.2 |
| POST | `/api/user/login` | CsrfGuard | Đăng nhập | 5.3 |
| POST | `/api/user/logout` | UserGuard, CsrfGuard | Đăng xuất (session hiện tại) | 5.4 |
| POST | `/api/user/logout-all` | UserGuard, CsrfGuard | Đăng xuất tất cả sessions | 5.5 |
| GET | `/api/user/profile` | UserGuard | Xem hồ sơ | 5.6 |
| PATCH | `/api/user/profile` | UserGuard, CsrfGuard | Cập nhật hồ sơ | 5.7 |
| POST | `/api/user/change-password` | UserGuard, CsrfGuard | Đổi mật khẩu | 5.8 |
| POST | `/api/user/forgot-password` | CsrfGuard | Quên mật khẩu | 5.9 |
| POST | `/api/user/reset-password` | CsrfGuard | Đặt lại mật khẩu | 5.10 |

### 3.3. Auth Admin (5 endpoints — session/csrf)

| Method | Path | Guards | Mô tả | § |
|---|---|---|---|---|
| GET | `/api/admin/csrf` | (AdminGateGuard) | Lấy CSRF token admin | 5.11 |
| POST | `/api/admin/login` | CsrfGuard | Đăng nhập admin | 5.12 |
| POST | `/api/admin/logout` | AdminGuard, CsrfGuard | Đăng xuất admin | 5.13 |
| POST | `/api/admin/logout-all` | AdminGuard, CsrfGuard | Đăng xuất tất cả admin sessions | 5.14 |
| POST | `/api/admin/change-password` | AdminGuard, CsrfGuard | Đổi mật khẩu admin | 5.15 |

### 3.4. Admin Dashboard (4 endpoints)

| Method | Path | Guards | Mô tả | § |
|---|---|---|---|---|
| GET | `/api/admin/dashboard/summary` | AdminGuard | Thống kê tổng quan | 6.1 |
| GET | `/api/admin/users` | AdminGuard | Danh sách user (phân trang) | 6.2 |
| GET | `/api/admin/users/:id` | AdminGuard | Chi tiết user | 6.3 |
| PATCH | `/api/admin/users/:id` | AdminGuard, CsrfGuard | Cập nhật user status | 6.4 |

### 3.5. Admin Topics (4 endpoints)

| Method | Path | Guards | Mô tả | § |
|---|---|---|---|---|
| GET | `/api/admin/topics` | AdminGuard | Danh sách chủ đề (phân trang) | 6.5 |
| POST | `/api/admin/topics` | AdminGuard, CsrfGuard | Tạo chủ đề | 6.6 |
| PATCH | `/api/admin/topics/:id` | AdminGuard, CsrfGuard | Sửa chủ đề | 6.7 |
| DELETE | `/api/admin/topics/:id` | AdminGuard, CsrfGuard | Xoá chủ đề | 6.8 |

### 3.6. Admin Vocab (4 endpoints)

| Method | Path | Guards | Mô tả | § |
|---|---|---|---|---|
| GET | `/api/admin/vocab` | AdminGuard | Danh sách từ (phân trang) | 6.9 |
| POST | `/api/admin/vocab` | AdminGuard, CsrfGuard | Tạo từ | 6.10 |
| PATCH | `/api/admin/vocab/:id` | AdminGuard, CsrfGuard | Sửa từ | 6.11 |
| DELETE | `/api/admin/vocab/:id` | AdminGuard, CsrfGuard | Xoá từ | 6.12 |

### 3.7. Admin Analytics (1 endpoint)

| Method | Path | Guards | Mô tả | § |
|---|---|---|---|---|
| GET | `/api/admin/analytics/traffic` | AdminGuard | Traffic analytics (hourly buckets) | 6.13 |

## 4. Public Endpoints — Chi tiết

### 4.1. GET /api/health

**Controller**: `HealthController.health()`

**Request**: Không params, không body.

**Response 200**:
```json
{ "status": "ok", "service": "api", "docs": "/api/docs" }
```

### 4.2. GET /api/v1/topics

**Controller**: `TopicsController.findAll()`

**Query logic** (`topics.service.ts:45`):
```typescript
prisma.topic.findMany({
  orderBy: { title: "asc" },
  select: {
    slug: true,
    title: true,
    _count: { select: { words: true } },
  },
});
```
Map mỗi topic → `{ slug, title, count }`. Không filter, không pagination — trả **tất cả** topics.

**Response 200**: `TopicDTO[]`
```typescript
{ slug: string; title: string; count: number }[]
```

**Swagger**: `@ApiOperation({ summary: "List topic summaries" })`

### 4.3. GET /api/v1/vocab

**Controller**: `VocabController.findAll()`

**Validation**: `VocabQuerySchema` (từ `@keylish/shared`)

| Query param | Zod type | Default | Ghi chú |
|---|---|---|---|
| `levels` | `csvList(CefrLevelSchema)` → `string[]` | undefined | CSV string hoặc array: A1,A2,B1,B2,C1,C2 |
| `topics` | `csvList(z.string().min(1).max(80))` → `string[]` | undefined | Topic slugs |
| `limit` | `z.coerce.number().int().min(1).max(100)` | 20 | Max items |
| `random` | `z.preprocess(→boolean)` | false | Random thứ tự |

**csvList preprocessor** (`packages/shared/src/vocab.ts:6`): chấp nhận string, string[], hoặc comma-separated string; normalize thành array.

**Query logic** (`vocab.service.ts:95`):
```typescript
const where = {
  ...(parsed.levels?.length ? { level: { in: parsed.levels } } : {}),
  ...(parsed.topics?.length ? { topic: { slug: { in: parsed.topics } } } : {}),
};
// Non-random: orderBy frequency desc, en asc; limit applied to Prisma query
// Random: fetch ALL matching rows → Fisher-Yates shuffle → slice(limit)
```

**Performance note**: Random mode `take` undefined → Prisma fetch toàn bộ rows matching filter, shuffle in-memory. Không scale tốt với dataset > 100k — nhưng chấp nhận cho MVP.

**Response 200**: `WordDTO[]`
```typescript
{
  id?: string;
  en: string;
  vi: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  frequency: number;
  pos: string | null;
  ipa: string | null;
  example: string | null;
  topic: string | null;       // topic slug (flattened from relation)
  source?: string;
}[]
```

Note: `topic` field là string (slug), không phải object — được flatten từ `{ slug: string } | null` → `string | null`.

**Swagger**: `@ApiOperation`, `@ApiQuery` × 4, `@ApiOkResponse`.

### 4.4. GET /api/v1/vocab/count

**Controller**: `VocabController.count()`

**Validation**: `VocabQuerySchema` — chỉ dùng `levels` + `topics`, bỏ qua `limit` + `random`.

**Query logic** (`vocab.service.ts:133`):
```typescript
prisma.word.count({ where: { ...filter by levels, topics } })
```

**Response 200**:
```typescript
{ count: number }
```

### 4.5. POST /api/v1/track

**Controller**: `TrafficController.track()`

**Auth**: Không guard — nhưng origin-check ở service layer.

**Logic** (`traffic.service.ts:37`):
```typescript
// 1. Origin check: origin ∈ allowedOrigins() (từ env AUTH_ALLOWED_ORIGINS)
if (!origin || !allowedOrigins().has(origin)) return { counted: false };

// 2. Upsert hourly bucket
const hour = currentHourBucket(); // Math.floor(Date.now() / 3_600_000) * 3_600_000
prisma.trafficHourly.upsert({
  where: { hour },
  create: { hour, count: 1 },
  update: { count: { increment: 1 } },
});
```

**Response**: `204 No Content` (`@HttpCode(204)`). Controller `await` nhưng không return — Express 204.

**Swagger**: `@ApiOperation({ summary: "Record a visit ..." })`

## 5. Auth Endpoints — Chi tiết

### 5.1. GET /api/user/csrf (và /api/admin/csrf)

**Controller**: `AuthController.getUserCsrf()` / `getAdminCsrf()`

**Logic**: `authService.issueCsrfToken()` → random 32-byte base64url → set cookie (không httpOnly) → return `{ token }`.

**Response 200**:
```json
{ "token": "base64url-32byte-random" }
```

**Cookie set**: `__Host-u-csrf` (prod) hoặc `u-csrf` (dev) — không httpOnly, path `/`.

**Cơ chế CSRF**: `CsrfGuard.assertCsrf()` (xem §7.3):
1. Bỏ qua safe methods (GET, HEAD, OPTIONS)
2. Origin check (dùng header `Origin` hoặc `Referer`)
3. `X-CSRF-Token` header === CSRF cookie value

### 5.2. POST /api/user/register

**Guards**: `CsrfGuard`

**Zod schema** (`UserRegisterSchema`):
```typescript
{
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(12).max(128),
  displayName?: z.string().trim().min(1).max(120),
}
```

**Logic** (`auth.service.ts:363`):
1. Rate limit: `user:register:{ip}` — 10/15min; `user:register:acct:{email}` — 5/1h
2. Hash password: Argon2id (memory=19456 KiB, time=2, parallelism=1)
3. Prisma transaction: `User.create({ identities: { create }, sessions: { create } })`
4. PK2002 → `ConflictException("Email is already registered.")`
5. Return session token + csrf token (set cookies)

**Response 200**:
```json
{
  "ok": true,
  "user": { "id": "cuid123", "email": "user@example.com", "displayName": "Linh", "avatarUrl": null }
}
```

**Response 409**: `{ "message": "Email is already registered.", "statusCode": 409 }`
**Response 429**: `{ "message": "Too many attempts. Please try again later.", "retryAfter": 600 }`

### 5.3. POST /api/user/login

**Guards**: `CsrfGuard`

**Zod schema** (`UserLoginSchema`):
```typescript
{ email: z.string().trim().toLowerCase().email().max(320), password: z.string().min(12).max(128) }
```

**Logic**:
1. Rate limit: login by ip 20/15min + by account 10/15min
2. `User.findUnique({ where: { emailNormalized } })` + verify Argon2id
3. Timing equalizer: dummy hash verify nếu user không tồn tại
4. Create session → set cookies

**Response 200**:
```json
{ "ok": true, "user": { "id": "...", "email": "...", "displayName": null, "avatarUrl": null } }
```

### 5.4. POST /api/user/logout

**Guards**: `UserGuard`, `CsrfGuard`

**Logic**: `UserSession.revokedAt = now()` — soft revoke, không hard delete.

**Response 200**: `{ "ok": true }` + clear cookies.

### 5.5. POST /api/user/logout-all

**Guards**: `UserGuard`, `CsrfGuard`

**Logic**: `UserSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now() } })`

**Response 200**: `{ "ok": true }` + clear cookies.

### 5.6. GET /api/user/profile

**Guards**: `UserGuard`

**Logic**: `User.findUnique({ where: { id } })` — kiểm tra status ACTIVE, không deleted.

**Response 200**:
```typescript
{ id: string; email: string; displayName: string | null; avatarUrl: string | null }
```

### 5.7. PATCH /api/user/profile

**Guards**: `UserGuard`, `CsrfGuard`

**Zod schema** (`UpdateProfileSchema`):
```typescript
{
  displayName?: z.string().trim().min(1).max(120);
  avatarUrl?: z.string().trim().url().max(512).nullable();
}
```

**Logic**: Partial update — chỉ set những field được gửi. `avatarUrl: undefined` → không update field; `avatarUrl: null` → clear avatar.

**Response 200**: `{ id, email, displayName, avatarUrl }`

### 5.8. POST /api/user/change-password

**Guards**: `UserGuard`, `CsrfGuard`

**Zod schema** (`PasswordChangeSchema`):
```typescript
{ currentPassword: z.string().min(12).max(128), newPassword: z.string().min(12).max(128) }
```

**Logic** (`auth.service.ts:531`):
1. Verify current password
2. Prisma transaction: update identity hash → revoke ALL sessions → create new session
3. Device change password vẫn giữ session (các device khác bị logout)

**Response 200**: `{ "ok": true }` + new cookie set.

### 5.9. POST /api/user/forgot-password

**Guards**: `CsrfGuard`

**Zod schema** (`ForgotPasswordSchema`):
```typescript
{ email: z.string().trim().toLowerCase().email().max(320) }
```

**Logic** (`auth.service.ts:605`):
1. Rate limit: ip 5/1h + account 5/1h
2. Tìm user by `emailNormalized`
3. Nếu không tồn tại hoặc không ACTIVE → return `{ ok: true }` (không tiết lộ)
4. Create `UserAuthToken` (purpose: "password-reset", TTL: 2h)
5. Gửi email qua Resend API (nếu cấu hình) hoặc log ra console

**Response 200**:
```json
{ "ok": true }
// Dev mode (AUTH_EXPOSE_RESET_TOKEN=true): { "ok": true, "token": "reset-token-here" }
```

**Mail fallback**: Nếu `RESEND_API_KEY` hoặc `AUTH_RESET_EMAIL_FROM` không set → `logger.warn()` với link reset — không throw.

### 5.10. POST /api/user/reset-password

**Guards**: `CsrfGuard`

**Zod schema** (`ResetPasswordSchema`):
```typescript
{ token: z.string().min(24).max(512), password: z.string().min(12).max(128) }
```

**Logic** (`auth.service.ts:637`):
1. Rate limit: 5/1h
2. `UserAuthToken.findUnique({ where: { tokenHash } })` + validate (not used, not expired, user ACTIVE)
3. Prisma transaction: update password → mark token used → revoke all sessions

**Response 200**: `{ "ok": true }`

### 5.11–5.15. Admin Auth

Tương tự user auth nhưng dùng `AdminGuard` thay vì `UserGuard`:

| Endpoint | Zod schema | Khác biệt so với User |
|---|---|---|
| GET `/api/admin/csrf` | — | Cookie `__Host-a-csrf` / `a-csrf` |
| POST `/api/admin/login` | `AdminLoginSchema` | Login by `username` (3–64 chars, `^[a-zA-Z0-9_.-]+$`), không hỗ trợ email |
| POST `/api/admin/logout` | — | Revoke admin session |
| POST `/api/admin/logout-all` | — | Revoke all admin sessions |
| POST `/api/admin/change-password` | `PasswordChangeSchema` | Cũng update `Admin.passwordChangedAt` |

**AdminLoginSchema**:
```typescript
{
  username: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(12).max(128),
}
```

**Admin login anti-enumeration**: Nếu username chứa `@` → early return `UnauthorizedException` (vì admin không dùng email).

## 6. Admin Endpoints — Chi tiết

### 6.1. GET /api/admin/dashboard/summary

**Controller**: `AdminController.summary()` — `AdminGuard`

**Logic**: `$transaction([user.count, topic.count, word.count])`

**Response 200**:
```typescript
{ users: number; topics: number; vocab: number; api: { status: "ok" } }
```

Note: `users` count chỉ đếm `deletedAt: null AND status !== "DELETED"`.

### 6.2. GET /api/admin/users

**Controller**: `AdminController.users()` — `AdminGuard`

**Zod schema** (inline trong `admin.service.ts:57`):
```typescript
{
  search?: string.trim();          // LIKE trên email + displayName
  status?: "ACTIVE" | "DISABLED" | "DELETED";
  page: coerce.number().min(1).default(1);
  pageSize: coerce.number().min(1).max(100).default(20);
}
```

**Query logic**: `$transaction([count, findMany])` — `orderBy: createdAt desc`, `skip/take` pagination.

**Response 200**:
```typescript
{
  total: number;
  page: number;
  pageSize: number;
  items: Array<{
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: "ACTIVE" | "DISABLED" | "DELETED";
    createdAt: Date;
    updatedAt: Date;
  }>;
}
```

### 6.3. GET /api/admin/users/:id

**Controller**: `AdminController.user()` — `AdminGuard`

**Logic**: `User.findUnique({ where: { id } })` — nếu null → `NotFoundException`.

**Response 200**: `AdminUserDetailDto` (extends `AdminUserListItemDto` + `deletedAt`).

### 6.4. PATCH /api/admin/users/:id

**Controller**: `AdminController.updateUser()` — `AdminGuard`, `CsrfGuard`

**Zod schema** (`UpdateUserStatusSchema`):
```typescript
{ status: z.enum(["ACTIVE", "DISABLED", "DELETED"]) }
```

**Logic**: `User.update({ where: { id }, data: { status } })`. Prisma P2025 → `NotFoundException`.

**Response 200**: `AdminUserDetailDto`.

### 6.5. GET /api/admin/topics

**Controller**: `AdminTopicsController.list()` — `AdminGuard`

**Zod schema** (`AdminTopicListSchema`):
```typescript
{
  search?: string.trim();    // LIKE trên title + slug
  page: coerce.number().min(1).default(1);
  pageSize: coerce.number().min(1).max(100).default(20);
}
```

**Query logic**: `$transaction([count, findMany])` — `orderBy: title asc`, `_count: { select: { words } }`.

**Response 200**:
```typescript
{
  total: number;
  page: number;
  pageSize: number;
  items: Array<{ id: string; slug: string; title: string; count: number }>;
}
```

### 6.6. POST /api/admin/topics

**Controller**: `AdminTopicsController.create()` — `AdminGuard`, `CsrfGuard`

**Zod schema** (`TopicCreateSchema`):
```typescript
{ slug: z.string().trim().min(2).max(80); title: z.string().trim().min(2).max(120) }
```

### 6.7. PATCH /api/admin/topics/:id

**Controller**: `AdminTopicsController.update()` — `AdminGuard`, `CsrfGuard`

**Zod schema** (`TopicUpdateSchema`): cả `slug` và `title` optional.

### 6.8. DELETE /api/admin/topics/:id

**Controller**: `AdminTopicsController.remove()` — `AdminGuard`, `CsrfGuard`

**Safety check**: Nếu topic còn word (`word.count > 0`) → `BadRequestException("Topic still has words.")`. Chỉ delete khi topic rỗng.

**Response 200**: `{ "ok": true }`

### 6.9. GET /api/admin/vocab

**Controller**: `AdminVocabController.list()` — `AdminGuard`

**Zod schema** (`AdminVocabListSchema`):
```typescript
{
  search?: string.trim();        // LIKE trên en + vi
  topicId?: string.trim();       // Exact match topicId
  level?: "A1"|"A2"|"B1"|"B2"|"C1"|"C2";
  page: coerce.number().min(1).default(1);
  pageSize: coerce.number().min(1).max(100).default(20);
}
```

**Query logic**: `$transaction([count, findMany])` — `orderBy: updatedAt desc`, include full topic relation `{ id, slug, title }`.

**Response 200**:
```typescript
{
  total: number;
  page: number;
  pageSize: number;
  items: Array<{
    id: string; en: string; vi: string;
    level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2" | null;
    frequency: number; pos: string | null; ipa: string | null;
    example: string | null; source: string;
    topic: { id: string; slug: string; title: string } | null;
  }>;
}
```

### 6.10. POST /api/admin/vocab

**Controller**: `AdminVocabController.create()` — `AdminGuard`, `CsrfGuard`

**Zod schema** (`WordCreateSchema`):
```typescript
{
  en: z.string().trim().min(1).max(120);
  vi: z.string().trim().min(1).max(240);
  level?: "A1"|"A2"|"B1"|"B2"|"C1"|"C2" | null;
  frequency: coerce.number().int().min(0).default(0);
  pos?: string.trim().max(120) | null;
  ipa?: string.trim().max(120) | null;
  example?: string.trim().max(500) | null;
  source: string.trim().max(120).default("admin");
  topicId?: string.trim() | null;
}
```

### 6.11. PATCH /api/admin/vocab/:id

**Controller**: `AdminVocabController.update()` — `AdminGuard`, `CsrfGuard`

**Zod schema** (`WordUpdateSchema`): tất cả optional, giống constraints create. Partial update — chỉ set field được gửi.

### 6.12. DELETE /api/admin/vocab/:id

**Controller**: `AdminVocabController.remove()` — `AdminGuard`, `CsrfGuard`

**Logic**: `prisma.word.delete({ where: { id } })`. Không safety check (không có FK dependency).

**Response 200**: `{ "ok": true }`

### 6.13. GET /api/admin/analytics/traffic?days=30

**Controller**: `AdminTrafficController.traffic()` — `AdminGuard`

**Query params**:
| Param | Default | Clamp | Ghi chú |
|---|---|---|---|
| `days` | 30 | [1, 90] | Lookback window |

**Response 200**:
```typescript
{
  rangeDays: number;            // Actual days queried
  totalViews: number;           // Sum of buckets
  buckets: Array<{              // Ordered by hour asc
    hour: string;               // ISO 8601 UTC
    count: number;
  }>;
}
```

## 7. Auth & Session

### 7.1. Guard chain

```
Request → AdminGateGuard (global) → Controller guard (@UseGuards)
         ↓
    AdminGateGuard: nếu path bắt đầu với /api/admin → check ADMIN_API_ENABLED
                    disabled → 404 Not Found
         ↓
    Controller guard: UserGuard / AdminGuard — read cookie → hash → lookup DB
         ↓
    Method guard (nếu có): CsrfGuard — assert Origin + X-CSRF-Token
```

### 7.2. Cookie specification

**Session cookie** (httpOnly):
| Domain | Dev name | Prod name | TTL | SameSite | Secure |
|---|---|---|---|---|---|
| User | `user` | `__Host-user` | 30 ngày | `lax` (dev) / `none` (prod) | khi SameSite=None |
| Admin | `admin` | `__Host-admin` | 12 giờ | `lax` (dev) / `none` (prod) | khi SameSite=None |

**CSRF cookie** (không httpOnly):
| Domain | Dev name | Prod name | TTL |
|---|---|---|---|
| User | `u-csrf` | `__Host-u-csrf` | = session TTL |
| Admin | `a-csrf` | `__Host-a-csrf` | = session TTL |

Session token: 32-byte random `base64url`. Lưu trong DB dưới dạng `HMAC-SHA256(token, AUTH_TOKEN_PEPPER)`.

### 7.3. CSRF mechanism

**CsrfGuard** (`auth.guard.ts`):
1. Bỏ qua safe methods (GET, HEAD, OPTIONS)
2. `assertRequestOrigin()`: kiểm tra `Origin` header (hoặc `Referer`) ∈ allowedOrigins
3. `cookieValue = request.cookies[csrfCookieName]`; `headerValue = request.headers["x-csrf-token"]`
4. So sánh: nếu không match → `ForbiddenException("Invalid CSRF token.")`

**Double-submit cookie pattern**: Server set CSRF cookie (không httpOnly) → client đọc cookie và gửi lại trong header `X-CSRF-Token`.

### 7.4. Rate limiting

In-process (`Map<string, { count, resetAt }>`), không Redis. Reset on restart.

| Pattern | Key | Limit | Window |
|---|---|---|---|
| Register IP | `user:register:{ip}` | 10 | 15 min |
| Register account | `user:register:acct:{email}` | 5 | 1 hour |
| Login IP | `user:login:{ip}` | 20 | 15 min |
| Login account | `user:login:acct:{email}` | 10 | 15 min |
| Admin login IP | `admin:login:{ip}` | 20 | 15 min |
| Admin login account | `admin:login:acct:{username}` | 10 | 15 min |
| Forgot IP | `user:forgot:{ip}` | 5 | 1 hour |
| Forgot account | `user:forgot:acct:{email}` | 5 | 1 hour |
| Reset IP | `user:reset:{ip}` | 5 | 1 hour |

Response 429: `{ "message": "Too many attempts. Please try again later.", "retryAfter": <seconds> }`

### 7.5. Session lifecycle

| Event | Action |
|---|---|
| Login / Register | `UserSession.create` (`tokenHash`, `userAgent`, `ipHash`, `expiresAt`) |
| Authenticated request (every 10 min) | Touch `lastSeenAt` |
| Logout | `UserSession.update` → `revokedAt = now()` |
| Password change | Revoke ALL sessions → create new one for current device |
| Reset password | Revoke ALL sessions |
| Background purge (24h interval) | `deleteMany` expired sessions + revoked > 7 days + used auth tokens |

### 7.6. Swagger coverage

| Khu vực | Decorators | Ghi chú |
|---|---|---|
| Public endpoints | `@ApiTags`, `@ApiOperation`, `@ApiQuery`, `@ApiOkResponse` | Đầy đủ |
| Auth endpoints | Chỉ `@ApiTags("auth")` | Thiếu `@ApiOperation`, `@ApiBody`, `@ApiOkResponse`, `@ApiUnauthorizedResponse` cho từng method |
| Admin endpoints | `@ApiTags` trên class | Hầu hết thiếu `@ApiOperation`, `@ApiBody`, `@ApiResponse` chi tiết |
| Admin-analytics | `@ApiOperation`, `@ApiOkResponse` | Có |
| Admin-topics/admin-vocab | Chỉ `@ApiTags` | Thiếu detail |

**Kết luận**: Swagger description hiện tại ghi "read-only vocabulary API" — mô tả cũ, không phản ánh auth/admin CRUD. Nhiều endpoint auth/admin thiếu decorator Swagger chi tiết.

### 7.7. Security hardening

| Biện pháp | Implement | Source |
|---|---|---|
| Session token hash | `HMAC-SHA256(token, pepper)` — không lưu plaintext | `auth.service.ts:84` |
| IP hash | `HMAC-SHA256(ip, pepper)` — không lưu IP thô | `auth.service.ts:930` |
| Password hash | Argon2id (configurable memory/time/parallelism) | `auth.service.ts:235` |
| Timing equalizer | Dummy hash verify cho account không tồn tại | `auth.service.ts:269` |
| CSRF double-submit | Cookie + header match | `auth.guard.ts` |
| Origin check | Allowlist từ env + dev localhost | `auth.service.ts:99` |
| Rate limit in-process | Map-based, reset on restart | `auth.service.ts:934` |
| Cookie prefix `__Host-` (prod) | HttpOnly + path `/` + Secure khi cross-site | `auth.service.ts:50` |
| Admin gate guard | 404 khi `ADMIN_API_ENABLED` = false (mặc định prod) | `admin-gate.guard.ts` |
| Seed token pepper in prod | `assertProductionSecrets()` — refuse boot without pepper | `main.ts` |

## 8. Error responses

Tất cả errors đều được NestJS `ExceptionFilter` mặc định handle:

| Status | Exception | Body format | Source |
|---|---|---|---|
| 400 | `BadRequestException` | `{ "message": "<zod error msg>", "statusCode": 400 }` | Zod validation fail |
| 401 | `UnauthorizedException` | `{ "message": "Authentication required." hoặc "Invalid credentials.", "statusCode": 401 }` | Auth guards, login fail |
| 403 | `ForbiddenException` | `{ "message": "Invalid CSRF token." hoặc "Invalid request origin.", "statusCode": 403 }` | CsrfGuard |
| 404 | `NotFoundException` | `{ "message": "User not found." hoặc "Not Found", "statusCode": 404 }` | Admin/user not found, admin gate |
| 409 | `ConflictException` | `{ "message": "Email is already registered.", "statusCode": 409 }` | Duplicate email |
| 429 | `HttpException(TOO_MANY_REQUESTS)` | `{ "message": "Too many attempts. Please try again later.", "retryAfter": N, "statusCode": 429 }` | Rate limit |

**Unhandled errors**: NestJS internal server error → `500 { "message": "Internal server error", "statusCode": 500 }`. Không có custom exception filter.

## 9. Environment variables

| Variable | Default | Required | Dùng tại |
|---|---|---|---|
| `PORT` | `3000` | — | `main.ts` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/keylish` | — | `database.service.ts` |
| `NODE_ENV` | — | — | Phân biệt dev/prod behavior |
| `AUTH_ALLOWED_ORIGINS` | — | — | CORS, CSRF origin, traffic origin |
| `AUTH_TOKEN_PEPPER` | `keylish-dev-token-pepper` | **Yes** (prod) | HMAC-SHA256 secret |
| `AUTH_COOKIE_SAMESITE` | `none` (prod) / `lax` (dev) | — | Cookie SameSite policy |
| `AUTH_ARGON2_MEMORY_KIB` | `19456` | — | Argon2id memory cost |
| `AUTH_ARGON2_ITERATIONS` | `2` | — | Argon2id time cost |
| `AUTH_ARGON2_PARALLELISM` | `1` | — | Argon2id parallelism |
| `USER_SESSION_TTL_DAYS` | `30` | — | User session TTL |
| `ADMIN_SESSION_TTL_HOURS` | `12` | — | Admin session TTL |
| `ADMIN_API_ENABLED` | `true` (dev) / `false` (prod) | — | Admin gate |
| `WEB_APP_URL` | `http://localhost:3001` | — | Reset password link |
| `RESEND_API_KEY` | — | — | Email delivery |
| `AUTH_RESET_EMAIL_FROM` | — | — | Email from address |
| `AUTH_EXPOSE_RESET_TOKEN` | `false` | — | Dev-only: return token in response |

## 10. Versioning & RISK

| ID | Mô tả | Loại |
|---|---|---|
| R-6 | Versioning không đồng nhất: `/api/v1/*` (vocab, topics, track) vs `/user/*`, `/admin/*` (auth). As-built. | RISK |
| OQ-09 | Có nên chuẩn hóa auth/admin về `/api/v1/`? → **D-07: giữ as-built; version hóa khi API public / breaking-change kế.** | DECISION |
| — | Swagger description ghi "read-only vocabulary API" — đã lỗi thời (có auth + admin CRUD). Cần update `DocumentBuilder` trong `main.ts`. | — |
| — | Auth endpoints thiếu Swagger decorator (`@ApiOperation`, `@ApiBody`, `@ApiResponse`). | — |
| — | Admin endpoints (topics, vocab CRUD) thiếu Swagger decorator. | — |

## 11. Trace FR

| FR | API Endpoint |
|---|---|
| FR-VOC-02 | `GET /api/v1/vocab` |
| FR-VOC-03 | `GET /api/v1/vocab/count` |
| FR-VOC-04 | `GET /api/v1/topics` |
| FR-AUT-01 | `POST /api/user/register` |
| FR-AUT-02 | `POST /api/user/login` |
| FR-AUT-04 | `POST /api/user/logout`, `/logout-all` |
| FR-AUT-05 | `GET|PATCH /api/user/profile` |
| FR-AUT-06 | `POST /api/user/change-password` |
| FR-AUT-07 | `POST /api/user/forgot-password` |
| FR-AUT-08 | `POST /api/user/reset-password` |
| FR-AUT-10 | `GET /api/user/csrf` |
| FR-TRF-01/02/03 | `POST /api/v1/track` |
| FR-ADM-03 | `GET /api/admin/dashboard/summary` |
| FR-ADM-04 | `GET|GET|PATCH /api/admin/users` |
| FR-ADM-05 | `GET|POST|PATCH|DELETE /api/admin/vocab`, `/api/admin/topics` |
| FR-ADM-06 | `GET /api/admin/analytics/traffic` |

## 12. Tham chiếu

- `03-lld` — Chi tiết service implementation, auth flow sequences
- `07-security` — Auth/csrf/session additional detail
- `apps/api/src/**/*.ts` — Toàn bộ source files
- `packages/shared/src/vocab.ts` — Shared Zod schemas
- Swagger UI: `GET /api/docs` (khi API chạy)
