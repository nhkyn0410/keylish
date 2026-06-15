# 03 — Thiết kế Mức Chi tiết (LLD)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Thiết kế Mức Chi tiết (Low-Level Design) |
| Mã tài liệu | `03-lld` |
| Dự án | KeyLish |
| Phiên bản | 0.2.1 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu. |
| 0.2.0 | 2026-06-15 | AI Agent | Nâng cấp: sequence diagram cho auth flows; state machine typing engine; component tree user-web; file map; chi tiết guard chain, practice settings, seed data. |
| 0.2.1 | 2026-06-15 | AI Agent | G-4: gom RISK ID (R-7a→R-9, R-7b→R-13, R-7c→R-7, bỏ R-10 cũ) về PROJECT-STATE. |

### 1.3. Tham chiếu

| Tài liệu | Nội dung |
|---|---|
| `02-hld` | Kiến trúc tổng thể, module dependency |
| `01-srs` | FR, UC trace — FR-AUT, FR-PRC, FR-VOC, FR-ADM, FR-TRF |
| `07-security` | Auth, CSRF, session chi tiết |
| `04-database` | ERD, Prisma model |

## 2. File map tổng quan

```
apps/api/src/                              apps/user-web/src/
├── main.ts (bootstrap)                    ├── app/ (Next.js App Router)
├── app.module.ts                          │   ├── layout.tsx
├── app.e2e.spec.ts                        │   ├── (site)/page.tsx, layout.tsx
├── auth/                                  │   ├── (auth)/login, register, forgot-password,
│   ├── auth.module.ts                     │   │         reset-password
│   ├── auth.controller.ts                 │   └── (practice)/typing/page.tsx
│   ├── auth.service.ts (963 dòng)         ├── components/
│   ├── auth.service.spec.ts               │   ├── vocab/typing/
│   ├── auth.guard.ts                      │   │   ├── useTypingSession.ts (245 dòng)
│   └── auth.dto.ts                        │   │   ├── TypingFlow.tsx
├── admin/                                 │   │   ├── TypingScreen.tsx
│   ├── admin.module.ts                    │   │   ├── ListenScreen.tsx
│   ├── admin.controller.ts                │   │   ├── SetupMethod.tsx
│   ├── admin.service.ts (186 dòng)        │   │   ├── Summary.tsx
│   └── admin-gate.guard.ts                │   │   ├── primitives.tsx (369 dòng)
├── vocab/                                 │   │   └── practiceSettings.ts (115 dòng)
│   ├── vocab.module.ts                    │   ├── layout/
│   ├── vocab.controller.ts                │   │   ├── AppShell.tsx, AppHeader.tsx
│   └── vocab.service.ts (281 dòng)        │   │   ├── Header.tsx, Sidebar.tsx
├── topics/                                │   │   ├── ApiWarmer.tsx, TourButton.tsx
│   ├── topics.module.ts                   │   │   └── HomeWelcomeTour.tsx
│   ├── topics.controller.ts               │   ├── auth/
│   └── topics.service.ts (134 dòng)       │   │   ├── AuthFrame.tsx
├── traffic/                               │   │   └── UserSessionActions.tsx
│   ├── traffic.module.ts                  │   ├── ui/
│   ├── traffic.controller.ts              │   │   ├── NeoCard.tsx, NeoButton.tsx, NeoBadge.tsx
│   └── traffic.service.ts (63 dòng)       │   └── TrafficBeacon.tsx
├── mail/                                  ├── infra/
│   └── mail.service.ts (73 dòng)          │   ├── vocab/vocabApi.ts (272 dòng)
├── health/                                │   └── user/userApi.ts
│   ├── health.module.ts                   ├── data/seed/
│   └── health.controller.ts               │   ├── vocabulary.ts
└── database/                              │   └── seed-vocabulary.json
    ├── database.module.ts                 └── lib/
    └── database.service.ts (22 dòng)         └── tour.ts
```

## 3. Module API: Auth

**File**: `apps/api/src/auth/` — 5 files, ~1300 dòng tổng

### 3.1. Cấu trúc

```
auth.module.ts → imports: DatabaseModule, MailModule
                 controllers: AuthController
                 providers: AuthService, UserGuard, AdminGuard, CsrfGuard
                 exports: AuthService

auth.controller.ts → 17 endpoints, mỗi endpoint gọi service
auth.service.ts    → 963 dòng — toàn bộ logic auth + rate-limit + token + session
auth.guard.ts      → 3 guards: UserGuard, AdminGuard, CsrfGuard
auth.dto.ts        → Zod schemas + TypeScript types
```

### 3.2. Endpoint map

| Method | Path | Guard | Service method | Input schema | Trace FR |
|---|---|---|---|---|---|
| `GET` | `/user/csrf` | — | `issueCsrfToken` | — | FR-AUT-10 |
| `POST` | `/user/register` | CsrfGuard | `registerUser` | `UserRegisterSchema` | FR-AUT-01 |
| `POST` | `/user/login` | CsrfGuard | `loginUser` | `UserLoginSchema` | FR-AUT-02 |
| `POST` | `/user/logout` | UserGuard + CsrfGuard | `logoutUser` | — | FR-AUT-04 |
| `POST` | `/user/logout-all` | UserGuard + CsrfGuard | `logoutAllUserSessions` | — | FR-AUT-04 |
| `GET` | `/user/profile` | UserGuard | `getUserProfile` | — | FR-AUT-05 |
| `PATCH` | `/user/profile` | UserGuard + CsrfGuard | `updateUserProfile` | `UpdateProfileSchema` | FR-AUT-05 |
| `POST` | `/user/change-password` | UserGuard + CsrfGuard | `changeUserPassword` | `PasswordChangeSchema` | FR-AUT-06 |
| `POST` | `/user/forgot-password` | CsrfGuard | `forgotPassword` | `ForgotPasswordSchema` | FR-AUT-07 |
| `POST` | `/user/reset-password` | CsrfGuard | `resetPassword` | `ResetPasswordSchema` | FR-AUT-08 |
| `GET` | `/admin/csrf` | — | `issueCsrfToken` | — | FR-ADM-01 |
| `POST` | `/admin/login` | CsrfGuard | `loginAdmin` | `AdminLoginSchema` | FR-ADM-01 |
| `POST` | `/admin/logout` | AdminGuard + CsrfGuard | `logoutAdmin` | — | — |
| `POST` | `/admin/logout-all` | AdminGuard + CsrfGuard | `logoutAllAdminSessions` | — | — |
| `POST` | `/admin/change-password` | AdminGuard + CsrfGuard | `changeAdminPassword` | `PasswordChangeSchema` | — |

### 3.3. Schema validation (Zod)

```typescript
// auth.dto.ts
emailSchema     = z.string().trim().toLowerCase().email().max(320)
passwordSchema  = z.string().min(12).max(128)
usernameSchema  = z.string().trim().min(3).max(64)
                    .regex(/^[a-zA-Z0-9_.-]+$/)
displayNameSchema = z.string().trim().min(1).max(120).optional()

UserRegisterSchema     = { email, password, displayName? }
UserLoginSchema        = { email, password }
AdminLoginSchema       = { username, password }
PasswordChangeSchema   = { currentPassword, newPassword }  // đều passwordSchema
ForgotPasswordSchema   = { email }
ResetPasswordSchema    = { token: min(24).max(512), password: passwordSchema }
UpdateProfileSchema    = { displayName?, avatarUrl? (url, nullable) }
UpdateUserStatusSchema = { status: "ACTIVE" | "DISABLED" | "DELETED" }
```

### 3.4. Luồng Register (UC-02) — Chi tiết

```text
Client                          AuthController              AuthService                          DB / Prisma
  │                                   │                         │                                    │
  │──GET /user/csrf──────────────────►│                         │                                    │
  │◄──Set-Cookie: u-csrf=<csrfToken>──┤                         │                                    │
  │  (không httpOnly, path=/)         │                         │                                    │
  │                                   │                         │                                    │
  │──POST /user/register─────────────►│                         │                                    │
  │  Cookie: u-csrf=<csrfToken>       │                         │                                    │
  │  X-CSRF-Token: <csrfToken>        │                         │                                    │
  │  Body: {email, password, name?}   │                         │                                    │
  │                                   │──CsrfGuard.assertCsrf──►│                                    │
  │                                   │    compare cookie vs    │                                    │
  │                                   │    X-CSRF-Token header  │                                    │
  │                                   │    check Origin/Referer │                                    │
  │                                   │◄──OK────────────────────│                                    │
  │                                   │                         │                                    │
  │                                   │──registerUser(body,req)─►│                                    │
  │                                   │                         │──assertRateLimit("user:register:"+ip)│
  │                                   │                         │  limit=10, window=15ph              │
  │                                   │                         │──assertRateLimit("...acct:"+email)  │
  │                                   │                         │  limit=5, window=1h                  │
  │                                   │                         │──parseUserRegister(body)            │
  │                                   │                         │  UserRegisterSchema.safeParse       │
  │                                   │                         │  → BadRequestException nếu lỗi       │
  │                                   │                         │──normalizeEmail(body.email)         │
  │                                   │                         │  → trim().toLowerCase()              │
  │                                   │                         │──hashPassword(body.password)        │
  │                                   │                         │  argon2.hash(type: argon2id,         │
  │                                   │                         │    memoryCost: 19456,                │
  │                                   │                         │    timeCost: 2, parallelism: 1)     │
  │                                   │                         │──createToken() → randomBytes(32)    │
  │                                   │                         │  → base64url (43 chars)              │
  │                                   │                         │──hashToken(token)                   │
  │                                   │                         │  → HMAC-SHA256(token, pepper)       │
  │                                   │                         │  → hex (64 chars)                   │
  │                                   │                         │──$transaction──────────────────────►│
  │                                   │                         │  User.create(                       │
  │                                   │                         │    email, emailNormalized,          │
  │                                   │                         │    displayName)                     │
  │                                   │                         │  + UserIdentity.create(             │
  │                                   │                         │    provider: PASSWORD,              │
  │                                   │                         │    providerId: emailNormalized,     │
  │                                   │                         │    passwordHash)                    │
  │                                   │                         │  + UserSession.create(              │
  │                                   │                         │    tokenHash, userAgent,            │
  │                                   │                         │    ipHash, expiresAt)               │
  │                                   │                         │◄──{user, identities, sessions}─────│
  │                                   │                         │──P2002? → 409 Conflict             │
  │                                   │                         │──return { user, csrf, token }       │
  │                                   │◄──result────────────────│                                    │
  │                                   │──setSessionCookies      │                                    │
  │                                   │  Set-Cookie: __Host-user│                                    │
  │                                   │    httpOnly, path=/,    │                                    │
  │                                   │    sameSite=none/lax,   │                                    │
  │                                   │    secure, maxAge=30d   │                                    │
  │                                   │  Set-Cookie: __Host-    │                                    │
  │                                   │    u-csrf (no httpOnly) │                                    │
  │◄──200 {ok, user:{id,email,name}}──┤                         │                                    │
```

### 3.5. Luồng Login (UC-03) — timing attack protection

```text
loginUser(body, request):
  ┌─ assertRateLimit("user:login:" + ip, 20, 15ph)
  ├─ parseUserLogin(body) → UserLoginSchema
  ├─ normalizeEmail(email)
  ├─ assertRateLimit("user:login:acct:" + emailNormalized, 10, 15ph)
  │
  ├─ findUnique User by emailNormalized + include identities
  │
  ├─ if (!user || !identity || user.deletedAt || user.status !== "ACTIVE")
  │     └── absorbDummyVerify(password)       ◄── CHỐNG TIMING ORACLE
  │         └── argon2.verify(dummyHash, pass)    Luôn chạy Argon2 dù
  │         └── (bỏ qua lỗi)                      account không tồn tại
  │     └── throw 401 "Invalid credentials."      → thời gian phản hồi = nhau
  │
  ├─ verified = argon2.verify(hash, password)
  ├─ if (!verified) → throw 401
  │
  ├─ createToken() + hashToken()    ← session token mới mỗi login
  ├─ UserSession.create { tokenHash, userAgent, ipHash, expiresAt }
  │
  └─ return { user, csrf, token }
```

### 3.6. Luồng Forgot + Reset Password (UC-04)

```
Forgot:
  forgotPassword(input, request):
    assertRateLimit ip(5, 1h) + account(5, 1h)
    parseForgotPassword → ForgotPasswordSchema
    findUnique user by emailNormalized
    if (!user || deleted || DISABLED) → return { ok: true }  ← phản hồi đồng nhất

    token = createToken()   ← 43 chars base64url
    UserAuthToken.create {
      userId, purpose: "password-reset",
      tokenHash: HMAC-SHA256(token, pepper),
      expiresAt: now + 2h
    }
    MailService.sendPasswordReset(email, token)
      └── RESEND_API_KEY + AUTH_RESET_EMAIL_FROM?
          → fetch POST https://api.resend.com/emails (REST, không SDK)
          → không? → log link ra console (dev-only)

    return { ok: true }
    (Dev: kèm token nếu AUTH_EXPOSE_RESET_TOKEN=true)

Reset:
  resetPassword(input, request):
    assertRateLimit ip(5, 1h)
    parseResetPassword → ResetPasswordSchema
    tokenHash = hashToken(body.token)
    found = UserAuthToken.findUnique({ where: { tokenHash }, include: { user } })

    if (!found || found.usedAt || found.expiresAt < now
        || found.user.deletedAt || found.user.status !== "ACTIVE")
      → throw 401 "Invalid credentials."

    newHash = hashPassword(body.password)
    $transaction:
      UserIdentity.updateMany(where: {userId, provider:PASSWORD}, data: {passwordHash: newHash})
      UserAuthToken.update(where: {id}, data: {usedAt: now})       ← one-time
      UserSession.updateMany(where: {userId, revokedAt:null}, data: {revokedAt: now})  ← logout all

    return { ok: true }
```

### 3.7. Luồng Change Password (FR-AUT-06)

```text
changeUserPassword(session, input, request):
  parsePasswordChange → PasswordChangeSchema
  findFirst UserIdentity (userId, provider: PASSWORD)
  verifyPassword(body.currentPassword, current.passwordHash)  → sai → 401

  newHash = hashPassword(body.newPassword)
  newToken = createToken()
  $transaction:
    UserIdentity.update(id, { passwordHash: newHash })
    UserSession.updateMany(userId, revokedAt:null, { revokedAt: now })  ← logout all other devices
    UserSession.create({ userId, tokenHash, userAgent, ipHash, expiresAt })  ← mint new session

  setSessionCookies(response, "user", newToken, newCsrf)
  return { ok: true }
```

### 3.8. Token & Session internals

```typescript
// === Token tạo ===
createToken(): string {
  return randomBytes(32).toString("base64url")  // 43 ký tự an toàn URL
}

// === Hash token ===
hashToken(token): string {
  const pepper = process.env.AUTH_TOKEN_PEPPER || "keylish-dev-token-pepper"
  return createHmac("sha256", pepper).update(token).digest("hex")  // 64 hex chars
}

// === Session TTL ===
sessionTtlSeconds("user")  = USER_SESSION_TTL_DAYS ?? 30  → 2,592,000s
sessionTtlSeconds("admin") = ADMIN_SESSION_TTL_HOURS ?? 12 → 43,200s

// === Cookie naming ===
Production:  __Host-user, __Host-admin, __Host-u-csrf, __Host-a-csrf
Development: user, admin, u-csrf, a-csrf

// === Cookie attributes ===
sessionCookie: { httpOnly: true,  sameSite: none|lax, secure, path: "/", maxAge }
csrfCookie:    { httpOnly: false, sameSite: none|lax, secure, path: "/", maxAge }
// httpOnly=false để JS đọc CSRF token gửi lên header
```

### 3.9. Rate-limit implementation

```typescript
// In-memory Map — mất khi restart server
private readonly attempts = new Map<string, { count: number; resetAt: number }>();

assertRateLimit(key: string, limit: number, windowMs: number):
  bucketKey = key + ":" + limit + ":" + windowMs
  bucket = attempts.get(bucketKey)
  if (!bucket || bucket.resetAt <= now):
    attempts.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return
  if (bucket.count >= limit):
    throw 429 TooManyRequests { message, retryAfter }
  bucket.count++
```

### 3.10. Background purge job

```typescript
onModuleInit:
  purgeExpired()  // chạy ngay khi start
  purgeTimer = setInterval(purgeExpired, 24h)  // lặp mỗi 24h

purgeExpired:
  deleteMany UserSession: expiresAt < now OR revokedAt < (now - 7d)
  deleteMany AdminSession: expiresAt < now OR revokedAt < (now - 7d)
  deleteMany UserAuthToken: expiresAt < now OR usedAt != null
```

### 3.11. IP handling

```typescript
ipHash(request): string | null {
  const ip = request.ip ?? request.headers["x-forwarded-for"] ?? null
  return ip ? hashWithPepper(ip) : null
  // hashWithPepper: HMAC-SHA256(value, pepper)
}
// IP raw KHÔNG lưu — chỉ lưu hash
```

## 4. Module API: Admin

**Files**: `apps/api/src/admin/`
- `admin-gate.guard.ts` (38 dòng) — global gate
- `admin.controller.ts` (38 dòng) — dashboard + user management
- `admin.service.ts` (186 dòng) — business logic
- `admin.module.ts` (22 dòng) — wiring (borrows controllers từ vocab/topics/traffic)

### 4.1. AdminGateGuard — Global Gate

```typescript
// APP_GUARD — chạy cho MỌI request
canActivate(context):
  path = request.originalUrl ?? request.url
  if (path bắt đầu bằng "/api/admin" hoặc "/admin"):
    if (!isAdminApiEnabled())
      throw 404 NotFoundException     ← ẩn hoàn toàn surface

isAdminApiEnabled():
  ADMIN_API_ENABLED = "true"  → true
  ADMIN_API_ENABLED = "false" → false
  unset → dev: true / production: false   ← mặc định an toàn
```

### 4.2. Admin endpoints

| Method | Path | Guard | Service method | Logic |
|---|---|---|---|---|
| `GET` | `/admin/dashboard/summary` | AdminGuard | `getAdminSummary` | 3 count queries trong $transaction: user (active), topic, word |
| `GET` | `/admin/users` | AdminGuard | `listUsers` | Search+status filter, phân trang (default 20, max 100) |
| `GET` | `/admin/users/:id` | AdminGuard | `getUserById` | FindUnique, 404 nếu không có |
| `PATCH` | `/admin/users/:id` | AdminGuard+CsrfGuard | `updateUserById` | Chỉ update status (UpdateUserStatusSchema) |

```typescript
AdminSummaryDto = { users: number, topics: number, vocab: number, api: { status: "ok" } }

listUsers(input):
  parse: { search?, status?, page=1, pageSize=20 }
  where:
    search → OR: { email: { contains, insensitive } }, { displayName: { contains, insensitive } }
    status → { status }
  $transaction: [count, findMany({ orderBy: createdAt desc, skip, take })]

updateUserById(id, input):
  parse: UpdateUserStatusSchema
  User.update({ where: { id }, data: { status } })
  handle P2025 (not found) → 404
```

### 4.3. Admin vocabulary management

Controller `AdminVocabController` nằm ở `vocab.controller.ts`, dùng `VocabService.shared`:

```typescript
listVocab(input):
  parse: { search?, topicId?, level?, page=1, pageSize=20 }
  where: OR search(en/vi) + topicId filter + level filter
  $transaction: [count, findMany({ orderBy: updatedAt desc, skip, take, include: topic })]

createWord(input):
  parse: WordCreateSchema (en, vi, level?, frequency?, pos?, ipa?, example?, source?, topicId?)
  Word.create + include topic

updateWord(id, input):
  parse: WordUpdateSchema (all optional)
  Word.update + include topic

deleteWord(id):
  Word.delete (throw 404 nếu P2025)
```

### 4.4. Admin topic management

Controller `AdminTopicsController` nằm ở `topics.controller.ts`:

```typescript
deleteTopic(id):
  count = Word.count(where: { topicId })
  if (count > 0) → 400 "Topic still has words."
  Topic.delete({ where: { id } })
```

### 4.5. Admin traffic analytics

```typescript
AdminTrafficController.getTraffic(days):
  rangeDays = clamp(trunc(days), 1, 90)     ← tối đa 90 ngày
  since = now - rangeDays * 24h
  TrafficHourly.findMany({
    where: { hour: { gte: since } },
    orderBy: { hour: "asc" }
  })
  → { rangeDays, totalViews: sum(count), buckets: [{ hour: ISO, count }] }
```

## 5. Module API: Vocab

**File**: `apps/api/src/vocab/vocab.service.ts` (281 dòng)

### 5.1. Public read endpoints

```typescript
// GET /api/v1/vocab
findAll(query):
  parsed = VocabQuerySchema.safeParse(query)     ← schema từ @keylish/shared
  if (!parsed.success) → 400 BadRequest

  where:
    levels? → { level: { in: parsed.levels } }
    topics? → { topic: { slug: { in: parsed.topics } } }

  orderBy:
    random? → undefined (shuffle sau)
    default → [{ frequency: "desc" }, { en: "asc" }]

  take: random ? undefined : parsed.limit

  select: { id, en, vi, level, frequency, pos, ipa, example, source, topic: { slug } }

  if random:
    shuffle(rows).slice(0, parsed.limit)   ← Fisher-Yates shuffle
  else:
    rows

  map: topic.slug → topic (string)
  return WordDTO[]

// GET /api/v1/vocab/count
count(query):
  same filter logic → Word.count()
```

### 5.2. VocabQuerySchema (shared — `@keylish/shared`)

```typescript
csvList(item) = preprocess:
  if (null/empty) → undefined
  if (array) → flatMap(String → split(",") → trim → filter(Boolean))
  → z.array(item).optional()

VocabQuerySchema = {
  levels: csvList(CefrLevelSchema),      // "A1,A2" hoặc ["A1","A2"]
  topics: csvList(z.string().min(1).max(80)),  // "travel,food"
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  random: z.preprocess(boolean-ish, z.boolean().default(false))
}
```

## 6. Module API: Topics

**File**: `apps/api/src/topics/topics.service.ts` (134 dòng)

### 6.1. Public endpoint

```typescript
// GET /api/v1/topics
findAll():
  Topic.findMany({
    orderBy: { title: "asc" },
    select: { slug, title, _count: { select: { words: true } } }
  })
  → [{ slug, title, count }]
```

### 6.2. Admin CRUD

```typescript
listTopics({ search?, page=1, pageSize=20 }):
  where: title/slug contains search (insensitive)
  $transaction: [count, findMany({ skip, take, orderBy: title asc, _count: words })]

createTopic({ slug, title }): Topic.create

updateTopic(id, { slug?, title? }): Topic.update

deleteTopic(id):
  count = Word.count({ where: { topicId: id } })
  if (count > 0) → 400 "Topic still has words."
  Topic.delete
```

## 7. Module: Traffic

**File**: `apps/api/src/traffic/traffic.service.ts` (63 dòng)

### 7.1. Track endpoint

```typescript
// POST /api/v1/track
track(origin: string | undefined):
  if (!origin || !allowedOrigins().has(origin))
    return { counted: false }           ← không đếm, vẫn 204

  hour = currentHourBucket()            ← floor(now, UTC hour)
  TrafficHourly.upsert({
    where: { hour },
    create: { hour, count: 1 },
    update: { count: { increment: 1 } }
  })
  return { counted: true }

currentHourBucket(now = Date.now()): Date {
  return new Date(Math.floor(now / 3_600_000) * 3_600_000)
  // 3_600_000 ms = 1 giờ → truncate epoch millis đến giờ UTC
}
```

**Client-side**: `TrafficBeacon.tsx`
```typescript
function TrafficBeacon():
  useEffect:
    if (NODE_ENV !== "production") return
    if (sessionStorage.getItem("kl_visited")) return   ← 1 lần/phiên
    sessionStorage.setItem("kl_visited", "1")
    navigator.sendBeacon(apiBase + "/api/v1/track")
    // fallback: fetch(keepalive)
```

### 7.2. Analytics endpoint

```typescript
// GET /admin/analytics/traffic?days=30
getTraffic(days):
  rangeDays = clamp(trunc(days) || 30, 1, 90)   ← 1-90 ngày
  since = now - rangeDays * 24h
  rows = TrafficHourly.findMany({
    where: { hour: { gte: since } },
    orderBy: { hour: "asc" }
  })
  totalViews = rows.reduce(sum)
  return { rangeDays, totalViews, buckets: [{ hour: ISO, count }] }
```

## 8. Module: Mail

**File**: `apps/api/src/mail/mail.service.ts` (73 dòng)

### 8.1. Code detail

```typescript
@Injectable()
class MailService {
  async sendPasswordReset(email: string, token: string): Promise<{ delivered: boolean }>:
    link = resetLink(token)     ← WEB_APP_URL + "/reset-password?token=" + encodeURI(token)
    apiKey = process.env.RESEND_API_KEY?.trim()
    from   = process.env.AUTH_RESET_EMAIL_FROM?.trim()

    if (!apiKey || !from):
      log.warn(`Password reset email not sent. Link for ${email}: ${link}`)
      return { delivered: false }             ← dev mode

    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: email,
        subject: "Đặt lại mật khẩu KeyLish",
        html: resetHtml(link),
        text: `Đặt lại mật khẩu KeyLish: ${link}\n...`
      })
    })
    return { delivered: response.ok }
}
```

## 9. Module: DatabaseService

**File**: `apps/api/src/database/database.service.ts` (22 dòng)

```typescript
@Injectable()
class DatabaseService implements OnApplicationShutdown:
  connectionString = process.env.DATABASE_URL
                     || "postgresql://postgres:postgres@localhost:5432/keylish"
  { client, pool } = createPrismaClient(connectionString)   ← từ @keylish/db

  get client(): PrismaClient → this.resources.client        ← getter, không wrapper

  onApplicationShutdown():
    await client.$disconnect()
    await pool.end()
```

## 10. Module: Health

```typescript
// GET /api/health
health():
  return { status: "ok", service: "api", docs: "/api/docs" }
```

## 11. Guards — Chi tiết

**File**: `apps/api/src/auth/auth.guard.ts` (57 dòng)

### 11.1. UserGuard

```typescript
@Injectable()
class UserGuard implements CanActivate:
  canActivate(context):
    request = context.switchToHttp().getRequest()
    session = authService.authenticateUser(request)
    // Đọc cookie "user"/"__Host-user" → hashToken → findUnique UserSession
    // Kiểm tra: !record || revokedAt || expiresAt <= now
    //           || !record.user || deletedAt || status !== "ACTIVE"
    // → throw 401
    // Touch lastSeenAt nếu quá 10 phút
    request.userSession = session
    return true
```

### 11.2. AdminGuard

Tương tự UserGuard nhưng dùng cookie admin + `AdminSession`.

### 11.3. CsrfGuard

```typescript
@Injectable()
class CsrfGuard implements CanActivate:
  canActivate(context):
    request = context.switchToHttp().getRequest()
    path = request.originalUrl ?? request.url
    domain = path.includes("/admin/") ? "admin" : "user"
    authService.assertCsrf(request, domain)
    return true
```

### 11.4. assertCsrf — kiểm tra chi tiết

```typescript
assertCsrf(request, domain):
  method = request.method?.toUpperCase()
  if (!method || !UNSAFE_METHODS.has(method)) return   ← GET/HEAD/OPTIONS skip

  assertRequestOrigin(request)                           ← Origin hoặc Referer
  cookieValue = request.cookies[csrfCookieName(domain)]   ← CSRF cookie
  headerValue = request.headers["x-csrf-token"]            ← CSRF header
  if (!cookieValue || !headerValue || cookieValue !== headerValue)
    throw 403 Forbidden

assertRequestOrigin(request):
  origin = header("origin") ?? originFromReferer(header("referer"))
  if (!origin && production) → 403
  if (!allowedOrigins().has(origin)) → 403
```

## 12. user-web: Component Tree & Data Flow

### 12.1. App structure

```
layout.tsx (root)
├── AppShell.tsx
│   ├── ApiWarmer.tsx              ← warmApi() gọi /api/health để đánh thức Render
│   ├── TrafficBeacon.tsx          ← 1 lần/phiên sendBeacon /api/v1/track
│   ├── Header.tsx                 ← Logo, navigation, UserSessionActions
│   ├── Sidebar.tsx                ← Navigation links (chủ đề, luyện tập, ...)
│   ├── TourButton.tsx             ← driver.js product tour
│   └── {children}
│
├── (site)/ page.tsx               ← Home page + HomeWelcomeTour
├── (auth)/ layout.tsx
│   ├── login/page.tsx             ← AuthFrame (mode="login")
│   ├── register/page.tsx          ← AuthFrame (mode="register")
│   ├── forgot-password/page.tsx   ← Forgot password form
│   └── reset-password/page.tsx    ← Reset password form (token from URL)
├── (practice)/typing/page.tsx     ← TypingFlow (xem §13)
└── (site)/settings/account/page.tsx ← Account settings (profile, change password)
```

### 12.2. AuthFrame component

```text
AuthFrame (login/register):
  state machine:
    idle → submitting → done | error

  login mode:
    ┌─────────────────────────────────────┐
    │  Email input (neo style)            │
    │  Password input (min 12 chars)      │
    │  [ĐĂNG NHẬP] keycap primary button  │
    │  Link: Quên mật khẩu? / Đăng ký     │
    └─────────────────────────────────────┘

  register mode:
    ┌─────────────────────────────────────┐
    │  Email input                        │
    │  Password input                     │
    │  Display name (optional)            │
    │  [ĐĂNG KÝ] keycap primary button    │
    └─────────────────────────────────────┘

  error handling:
    - Validation inline (Zod)
    - 401 → "Email hoặc mật khẩu không hợp lệ" (không tiết lộ)
    - 409 → "Email đã được đăng ký"
    - 429 → retryAfter seconds countdown
```

## 13. user-web: Engine gõ char-by-char

**File**: `apps/user-web/src/components/vocab/typing/useTypingSession.ts` (245 dòng)

### 13.1. TypingFlow component coordination

```
TypingFlow.tsx (state machine):
                                    ┌──────────────┐
                                    │  SetupMethod  │ ← chọn topic pill + CEFR pills + mode (M1/M2)
                                    │  + fetchVocab │     + practice/test drill + tùy chọn
                                    └──────┬───────┘
                                           │ words: VocabWord[]
                                           │ config: SessionEngineConfig
                                           ▼
                          ┌────────────────────────────────┐
                          │  TypingScreen.tsx (M1)         │
                          │  "Nhìn nghĩa VI → gõ EN"      │
                          │  SourcePane: vi                │
                          │  Char-by-char cells            │
                          │  KeyboardMini gợi ý            │
                          │  Stats: WPM, accuracy, streak  │
                          └────────────────────────────────┘
                                     hoặc
                          ┌────────────────────────────────┐
                          │  ListenScreen.tsx (M2)         │
                          │  "Nghe TTS → gõ EN"           │
                          │  Button phát âm + trạng thái   │
                          │  Char-by-char cells            │
                          └────────────────────────────────┘
                                           │ onComplete(words, config)
                                           ▼
                                   ┌──────────────┐
                                   │   Summary    │
                                   │  kết quả     │
                                   └──────────────┘
```

### 13.2. SessionEngineConfig

```typescript
interface SessionEngineConfig {
  reveal: boolean;          // lộ ký tự đích (M1=false, M2 tùy drill)
  repeat: RepeatMode;       // "none" | "once" | "until"
  wrongAdvanceMs?: number;  // tự chuyển sau Nms khi sai (test mode)
  trimToTarget?: boolean;   // cắt input = target.length (mặc định true)
}
```

### 13.3. State machine đầy đủ

```text
                          startSession(words, config)
                               │
                    ┌──────────▼──────────┐
                    │    "typing"         │
                    │  index=0, status=   │
                    │  typing, typed=""   │
                    └──────────┬──────────┘
                               │ onChange → applyValue(raw):
                               │   composing? → return (IME đang soạn)
                               │   locked? → return
                               │   v = clean(raw): toLowercase, /[^a-z'-]/g → ""
                               │   trimToTarget? → v = v.slice(0, target.length)
                               │   setTyped(v)
                               │
                               │ onKeyDown(Enter):
                               │   composing || isComposing? → return (chặn IME)
                               │   status=wrong? → continueNext() / return (wrongAdvanceMs)
                               │   status=correct? → continueNext()
                               │   locked? → return
                               │
                               ▼
                    ┌──────────────────┐
                    │  finalize(value) │
                    │  locked = true   │
                    └────────┬─────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
     value === target               value !== target
               │                           │
               ▼                           ▼
    ┌──────────────────┐      ┌──────────────────────┐
    │   "correct"      │      │    "wrong"            │
    │  correct++       │      │   wrong++             │
    │  streak++        │      │   streak=0            │
    │  syncView()      │      │   wrongWords.push(w)  │
    │  scheduleAdvance │      │   (nếu chưa có)       │
    │    (600ms)       │      │                       │
    └──────────────────┘      │   willRequeue =        │
               │              │     repeat==="until"   │
               │              │     || (repeat==="once"│
               │              │        && !requeued)   │
               │              │   if willRequeue:      │
               │              │     setQueue([...q,w]) │
               │              │   status = "wrong"     │
               │              │   wrongAdvanceMs?      │
               │              │     → scheduleAdvance  │
               │              └──────────┬─────────────┘
               │                         │
               ▼                         ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │  doAdvance(q, index) │  │  continueNext()      │
    │  locked = false      │  │  → doAdvance(q,i)    │
    │  clearInput()        │  └──────────────────────┘
    │  setTyped("")        │
    │  setStatus("typing") │
    │  clearTimeout()      │
    │  ni = index + 1      │
    │  ni >= queue.length? │
    │    → finishSession() │
    │  → setIndex(ni)      │
    └──────────────────────┘
```

### 13.4. computeCells — Char-by-char matching

```typescript
function computeCells(target: string, typed: string, reveal: boolean): Cell[] {
  return Array.from(target).map((tch, i) => {
    let state: CharState;
    if (i < typed.length) {
      state = typed[i] === tch ? "ok" : "bad";
    } else if (i === typed.length) {
      state = "cur";                       // cursor position
    } else {
      state = "todo";
    }
    const ch = reveal
      ? tch                                 // show target char
      : i < typed.length ? typed[i] : "";   // show typed only
    return { ch, state };
  });
}
// CharState: "ok" (green) | "bad" (red+strikethrough) | "cur" (black block) | "todo" (dim)
```

### 13.5. IME safety — Chi tiết event flow

```text
Phím tắt kiểu gõ tiếng Việt (Unikey, EVKey, ...)

Normal typing (không IME):
  KeyDown('a') → onChange('a') → applyValue('a')
  KeyDown('b') → onChange('ab') → applyValue('ab')

IME composition (gõ tiếng Việt có dấu):
  KeyDown('h') → compositionstart → composing=true
  KeyDown('o') → onChange('ho') → if(composing) return (BỎ QUA)
  KeyDown('i') → onChange('hoi') → if(composing) return (BỎ QUA)
  compositionend('hoi') → composing=false → applyValue('hoi') ← CHỈ ÁP DỤNG KHI KẾT THÚC

Enter khi IME:
  KeyDown(Enter) → if (isComposing) return ← Enter KHÔNG submit từ
  (Người dùng đang chọn từ ghép — không được chấm sai)
```

### 13.6. Input sanitization

```typescript
const clean = (s: string) => s.toLowerCase().replace(/[^a-z'-]/g, "");
// 1. lowercase → "Hello" → "hello"
// 2. strip non [a-z'-] → "hello!" → "hello"
//    "don't" → "don't" (giữ ')
//    "état" → "etat" (bỏ dấu)
//    "đời" → "i" (sạch đến chỉ còn chữ hợp lệ)
```

### 13.7. Session result calculation

```typescript
interface SessionResult {
  correct: number;         // số từ đúng
  wrong: number;           // số từ sai
  wpm: number;             // correctChars / 5 / minutes
  accuracyPct: number;     // correctChars / totalChars * 100
  correctChars: number;    // tổng ký tự đúng (match position)
  totalChars: number;      // tổng ký tự target
  durationMs: number;      // thời gian phiên
  wrongWords: VocabWord[]; // danh sách từ sai (không trùng)
}

// WPM formula: tổng ký tự đúng / 5 (độ dài từ TB) / số phút
// accuracy: matching position — mỗi ký tự đúng vị trí +1
```

### 13.8. Requeue mechanism

```typescript
// finalize() khi sai:
const willRequeue =
  repeat === "until"                                   // lặp đến khi đúng
  || (repeat === "once" && !requeued.current.has(target));  // 1 lần duy nhất

if (willRequeue) {
  if (repeat === "once") requeued.current.add(target);  // đánh dấu đã requeue
  setQueue((q) => [...q, word]);                         // thêm cuối queue
}
// Queue dài ra → index vẫn tăng → từ sai sẽ gặp lại khi tới cuối
```

### 13.9. PracticeSettings (drill configuration)

```typescript
type Drill = "practice" | "test";
type HintLevel = "off" | "underline" | "first" | "full";
type ExampleMode = "off" | "show" | "cloze";
type FeedbackMode = "mark" | "char" | "reveal";
type RepeatMode = "none" | "once" | "until";
type LiveMode = "on" | "off";

interface PracticeSettings {
  hint: HintLevel;       // mức gợi ý
  example: ExampleMode;  // câu ví dụ
  feedback: FeedbackMode;// báo lỗi
  repeat: RepeatMode;    // lặp từ sai (dùng trong useTypingSession)
  live: LiveMode;        // tô màu real-time
}

// Mặc định Luyện tập (practice):
DEFAULT_PRACTICE = { hint: "underline", example: "show", feedback: "char", repeat: "once", live: "on" }

// Bị khoá khi Kiểm tra (test):
TEST_SETTINGS = { hint: "off", example: "off", feedback: "mark", repeat: "none", live: "off" }
// → ẩn mọi phao, chấm một lần, không gợi ý
```

## 14. user-web: Vocab data flow (local-first)

**File**: `apps/user-web/src/infra/vocab/vocabApi.ts` (272 dòng)

### 14.1. fetchVocab — 3-tier

```typescript
async fetchVocab(params): Promise<{ words: WordDTO[], source: VocabSource, error?: string }>
  query = normalizeQuery(params)       // mặc định levels?, topics?, limit=20, random=false
  key = cacheKey(query)                 // "vocab:A1:travel:20:0"
  apiUrl = process.env.NEXT_PUBLIC_API_URL

  if (apiUrl):                          // TẦNG 1: API
    try:
      res = await fetch(apiUrl + "/api/v1/vocab?" + toSearchParams(query))
      if (res.ok):
        parsed = VocabResponseSchema.parse(await res.json())
        if (parsed.length):
          await writeCache(key, parsed)  // ghi IndexedDB (cơ hội)
          return { words: parsed, source: "api" }
    catch (err):
      error = err.message

  cached = await readCache(key)          // TẦNG 2: IndexedDB
  if (cached.length):
    return { words: cached, source: "cache", error }

  return { words: filterSeed(query), source: "seed", error }  // TẦNG 3: seed
```

### 14.2. IndexedDB operations

```typescript
DB_NAME = "keylish-vocab-v1"
STORE_NAME = "responses"         // key-value store

async openDb(): Promise<IDBDatabase | null>
  // indexedDB.open(DB_NAME, 1)
  // onupgradeneeded: createObjectStore(STORE_NAME)

async readCache(key): Promise<WordDTO[]>
  // db.transaction(STORE_NAME, "readonly")
  // objectStore.get(key)

async writeCache(key, words): Promise<void>
  // db.transaction(STORE_NAME, "readwrite")
  // objectStore.put(words, key)
```

### 14.3. Seed vocabulary

```typescript
// data/seed/vocabulary.ts
import seed from "./seed-vocabulary.json";   // 112 từ curated

SEED_VOCABULARY: WordDTO[] = seed.words.map(w => ({
  id: `seed-${w.en}`,
  en: w.en, vi: w.vi, topic: w.topic,
  pos: w.pos, level: w.level,
  frequency: w.frequency ?? 0, source: "seed"
}));

SEED_TOPICS: string[] = unique(SEED_VOCABULARY.map(w => w.topic).filter(Boolean))
// Đề xuất chủ đề từ seed (fallback khi không có API)
```

## 15. user-web: API warmer

**File**: `apps/user-web/src/components/layout/ApiWarmer.tsx`

```typescript
// "use client" — mount trong AppShell
function ApiWarmer():
  useEffect:
    warmApi()
    // Fire-and-forget GET /api/health
    // Không await — không block rendering
    // Mục đích: đánh thức Render cold start sớm

// Trong vocabApi.ts:
export function warmApi(): void {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return
  fetch(apiUrl + "/api/health", { cache: "no-store" }).catch(() => {})
}

// loadTopicsAwait — retry logic:
export async function loadTopicsAwait(isAborted, attempts=30, delayMs=3500):
  let last = await fetchTopics()
  if (!apiConfigured() || last.source === "api") return last   // API đã thức
  for (let i = 1; i < attempts; i++):
    await sleep(delayMs)              // chờ 3.5s
    last = await fetchTopics()
    if (last.source === "api") return last   // API vừa thức
  return last   // vẫn là seed → fallback OK
```

## 16. Primitives & UI Components (user-web)

**File**: `apps/user-web/src/components/vocab/typing/primitives.tsx` (369 dòng)

| Component | Props | Mô tả |
|---|---|---|
| `Cell` | `{ state: "ok"|"bad"|"cur"|"todo", ch: string }` | Ký tự trong ô — màu + icon check/x |
| `Icon` | `{ name: IconName, size?, stroke?, fill? }` | 18 SVG icon (arrow, check, x, volume, star, ...) |
| `Star` | `{ size?, fill?, spin? }` | Ngôi sao trang trí neo-brutalism |
| `StatPill` | `{ icon, value, label?, bg? }` | Thẻ thống kê viền đen + shadow |
| `ProgressStrip` | `{ idx, total, ctx?, bg? }` | Thanh tiến trình "Từ X / Y" |
| `KeyboardMini` | `{ nextKey?, done[]? }` | Bàn phím mini gợi ý phím tiếp theo |
| `Logo` | `{ scale? }` | Logo KeyLish + keycap icon |
| `Mark` | `{ kind: "ok"|"bad" }` | Icon checkmark/x |

## 17. Scripts & Pipeline

| Script | File | Mô tả |
|---|---|---|
| `build-dataset` | `scripts/build-dataset.mjs` | Stream kaikki JSONL.gz → lọc entry VI → JOIN Maximax67 CSV → gán topic → `.data-tmp/dataset.json` |
| `build-vocab` | `scripts/build-vocab.mjs` | 112 từ curated → `user-web/src/data/seed/seed-vocabulary.json` |
| `vocab-shared` | `scripts/vocab-shared.mjs` | Dữ liệu 112 từ (biên soạn tay) |
| `seed` | `apps/api/scripts/seed.ts` | Đọc dataset.json → XÓA SẠCH → batch 1000 từ → Prisma |
| `seed-admin` | `apps/api/scripts/seed-admin.ts` | Tạo admin account mặc định |

## 18. user-web: Infra/userApi

**File**: `apps/user-web/src/infra/user/userApi.ts`

Các hàm gọi API phía user (auth, profile, ...):

```typescript
// Ví dụ các gọi phía client (từ AuthFrame, UserSessionActions)
// Sử dụng fetch với credentials: "include" để gửi cookie
```

## 19. RISK / Technical Debt

| Mã | Mô tả | Mức | Ảnh hưởng |
|---|---|---|---|
| R-5 | Logic gõ nằm ở `components/` thay vì `domain/` — `computeCells`, `clean`, `finalize` là pure function nhưng gắn với React hook | Trung bình | Khó unit-test riêng; khó tái sử dụng ở non-React context |
| R-9 | AuthService ~963 dòng — đảm nhận: rate-limit, token, session, password, CSRF, cookie, seed, purge. Nên tách provider | Thấp | Khó bảo trì, vi phạm SRP |
| R-13 | Rate-limit in-memory — mất khi restart server | Thấp | Scale nhỏ chấp nhận được (task T-08) |
| R-7 | Chưa có test cho engine gõ (vùng dễ lỗi nhất) — thuộc coverage thấp | Cao | `--passWithNoTests` che giấu |
| R-11 | Admin-web scaffold chưa kết nối `@keylish/shared` — có thể định nghĩa type trùng | Trung bình | Lệch contract khi hoàn thiện |

> RISK ID chuẩn ở `context/PROJECT-STATE.md` §2.
