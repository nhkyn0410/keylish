# 07 — Bảo mật và Phân quyền (Security & Permission)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường        | Giá trị                                       |
| ------------- | --------------------------------------------- |
| Tên           | Bảo mật và Phân quyền (Security & Permission) |
| Mã tài liệu   | `07-security`                                 |
| Dự án         | KeyLish                                       |
| Phiên bản     | 0.2.3                                         |
| Trạng thái    | Draft                                         |
| Người viết    | AI Agent (soạn thảo SDLC)                     |
| Người duyệt   | Nguyễn Hồng Khanh                             |
| Ngày tạo      | 2026-06-15                                    |
| Chuẩn áp dụng | ISO/IEC/IEEE 15289:2019                       |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật | Nội dung                                                                                                                                                                                                                     |
| --------- | ---------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0     | 2026-06-15 | AI Agent       | Bản Draft đầu — auth tự xây as-built.                                                                                                                                                                                        |
| 0.2.0     | 2026-06-15 | AI Agent       | Bổ sung threat model, guard implementation detail, CORS config, auth attack mitigation matrix, anti-enumeration, production safety checks, e2e test coverage, session purge lifecycle, code-level audit với file references. |
| 0.2.1     | 2026-06-15 | AI Agent       | Chuẩn hóa format metadata (§1.1/§1.2).                                                                                                                                                                                       |
| 0.2.2     | 2026-06-15 | AI Agent       | Phase ③ V2.1: thêm §21 bảo mật kho cá nhân (cô lập userId, ownership, cascade).                                                                                                                                              |
| 0.2.3     | 2026-06-20 | AI Agent       | Sync kho cá nhân sang as-built: `/api/user/vocab*` đã dùng UserGuard/CSRF và cô lập `userId`.                                                                                                                                |

## 2. Tham chiếu

- `00-coding-standard` §6 — ranh giới bảo mật
- `01-srs` §4.3 — FR-AUT
- `03-lld` §2 — chi tiết auth service
- `05-api` — toàn bộ endpoint specification

## 3. Threat model

| Mục tiêu                       | Vector tấn công            | Biện pháp phòng thủ                                                  | Hiệu quả                         |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| Session token                  | Đánh cắp cookie (XSS)      | `httpOnly` cookie — JS không đọc được                                | DONE                             |
| Session token                  | Man-in-the-Middle          | `Secure` flag (production), `SameSite=None` cross-site               | DONE                             |
| CSRF                           | Cross-site request forgery | Double-submit cookie + Origin check                                  | DONE                             |
| Password                       | Brute force                | Rate limiting (in-memory)                                            | DONE (partial — mất khi restart) |
| Password                       | Database leak              | Argon2id hash — configurable cost                                    | DONE                             |
| Token                          | Database leak              | HMAC-SHA256 + pepper — không lưu raw                                 | DONE                             |
| User enumeration (login)       | Timing attack              | Dummy Argon2 verify cho account ảo                                   | DONE                             |
| User enumeration (register)    | Error message              | `ConflictException` — không tránh được hoàn toàn                     | WARNING (chấp nhận)              |
| User enumeration (forgot)      | Response difference        | Luôn return `{ ok: true }`                                           | DONE                             |
| User enumeration (admin login) | Username format            | Từ chối `@` trong username ngay cả khi username tồn tại              | DONE                             |
| IP tracking                    | Log IP thô                 | HMAC-SHA256(ip, pepper) — không reversible                           | DONE                             |
| Admin surface                  | Public exposure            | `AdminGateGuard` — 404 khi `ADMIN_API_ENABLED=false` (mặc định prod) | DONE                             |
| Reset token                    | Token reuse                | One-time (`usedAt`) + TTL 2 giờ                                      | DONE                             |
| Session reuse                  | Session theft              | `revokedAt` check + `expiresAt` check                                | DONE                             |
| Injection (SQL)                | Query injection            | Prisma ORM — parameterized queries                                   | DONE                             |
| Injection (NoSQL)              | Zod schema                 | Type coercion + strict validation                                    | DONE                             |

## 4. Mô hình auth tổng quan

KeyLish dùng **auth tự xây** (không thư viện như NextAuth, Lucia):

| Layer         | Công nghệ                                    | File                                                   |
| ------------- | -------------------------------------------- | ------------------------------------------------------ |
| Password hash | Argon2id (`argon2` package)                  | `src/auth/auth.service.ts`                             |
| Session token | 32-byte random `base64url`                   | `src/auth/auth.service.ts:91`                          |
| Token hash    | `HMAC-SHA256(token, AUTH_TOKEN_PEPPER)`      | `src/auth/auth.service.ts:84`                          |
| Guards        | NestJS `CanActivate` (3 guards)              | `src/auth/auth.guard.ts`                               |
| Admin gate    | Global `AdminGateGuard` (APP_GUARD)          | `src/admin/admin-gate.guard.ts`                        |
| Validation    | Zod `safeParse`                              | `src/auth/auth.dto.ts`, `packages/shared/src/vocab.ts` |
| Rate limit    | In-process `Map<string, { count, resetAt }>` | `src/auth/auth.service.ts`                             |
| Email (reset) | Resend REST API / console log fallback       | `src/mail/mail.service.ts`                             |

### 4.1. Hai vai trò + Khách

| Vai trò              | Định danh | Session cookie                        | TTL     | API access                                    |
| -------------------- | --------- | ------------------------------------- | ------- | --------------------------------------------- |
| **Khách (Guest)**    | —         | —                                     | —       | Public: GET `/api/v1/*`, POST `/api/v1/track` |
| **Người học (User)** | Email     | `__Host-user` (prod) / `user` (dev)   | 30 ngày | Auth (profile, password) + public             |
| **Admin**            | Username  | `__Host-admin` (prod) / `admin` (dev) | 12 giờ  | Admin CRUD (gated by `ADMIN_API_ENABLED`)     |

## 5. Guard chain — Implementation detail

Mọi request đi qua **3 lớp guard**:

```
Request
  │
  ▼
┌──────────────────────────────────────────────┐
│ 1. AdminGateGuard (global, APP_GUARD)        │
│    File: src/admin/admin-gate.guard.ts       │
│    - path.startsWith("/api/admin") or "/admin"│
│    - !isAdminApiEnabled() → 404 NotFound     │
│    - Resolution:                             │
│        ADMIN_API_ENABLED="true"  → ON        │
│        ADMIN_API_ENABLED="false" → OFF       │
│        unset → ON (dev) / OFF (prod)         │
│                                              │
│    Logic: process.env.ADMIN_API_ENABLED      │
│           ?.trim().toLowerCase()             │
└──────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────┐
│ 2. @UseGuards(UserGuard | AdminGuard)        │
│    File: src/auth/auth.guard.ts              │
│                                             │
│    UserGuard.canActivate():                  │
│      authService.authenticateUser(request)   │
│      → read cookie "user"/"__Host-user"      │
│      → hashToken(token) → findUnique DB     │
│      → validate: !revokedAt, expiresAt > now,│
│        user.status === ACTIVE, !user.deleted │
│      → attach request.userSession           │
│                                             │
│    AdminGuard.canActivate():                 │
│      authService.authenticateAdmin(request)  │
│      → read cookie "admin"/"__Host-admin"    │
│      → hashToken(token) → findUnique DB     │
│      → validate: !revokedAt, expiresAt > now│
│      → attach request.adminSession          │
│                                             │
│    Cả hai đều throw UnauthorizedException    │
│    nếu token missing, expired, revoked,      │
│    hoặc user bị disabled/deleted             │
└──────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────┐
│ 3. @UseGuards(CsrfGuard) (unsafe methods)    │
│    File: src/auth/auth.guard.ts              │
│                                             │
│    CsrfGuard.canActivate():                  │
│      authService.assertCsrf(request, domain) │
│      → path.includes("/admin/") → "admin"   │
│                       else    → "user"       │
│                                             │
│    assertCsrf():                             │
│      1. Skip safe methods                    │
│         (GET, HEAD, OPTIONS)                 │
│      2. assertRequestOrigin():               │
│         Origin header ∈ allowedOrigins()     │
│         Fallback: Referer header → URL.origin│
│         Thiếu Origin (dev): bỏ qua           │
│         Thiếu Origin (prod): 403             │
│      3. cookie[csrfName] ===                 │
│         header["x-csrf-token"]              │
│         → 403 ForbiddenException             │
└──────────────────────────────────────────────┘
```

### 5.1. Session touch optimization

`UserGuard`/`AdminGuard` không ghi DB trên mọi request:

```typescript
// auth.service.ts:847
shouldTouch(lastSeenAt): boolean {
  return Date.now() - lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS; // 10 min
}
```

Chỉ update `lastSeenAt` khi cũ hơn 10 phút — giảm 99.9% write.

## 6. Password handling

### 6.1. Hashing

```typescript
// auth.service.ts:235
async hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: Number(process.env.AUTH_ARGON2_MEMORY_KIB ?? 19456),  // KiB
    timeCost: Number(process.env.AUTH_ARGON2_ITERATIONS ?? 2),
    parallelism: Number(process.env.AUTH_ARGON2_PARALLELISM ?? 1),
  });
}
```

Configurable qua env — có thể tăng cost khi hardware mạnh hơn.

### 6.2. Zod validation rules

| Field       | Schema                                                        | File             |
| ----------- | ------------------------------------------------------------- | ---------------- |
| Email       | `z.string().trim().toLowerCase().email().max(320)`            | `auth.dto.ts:4`  |
| Password    | `z.string().min(12).max(128)`                                 | `auth.dto.ts:5`  |
| Username    | `z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9_.-]+$/)` | `auth.dto.ts:6`  |
| DisplayName | `z.string().trim().min(1).max(120).optional()`                | `auth.dto.ts:13` |
| AvatarUrl   | `z.string().trim().url().max(512).nullable().optional()`      | `auth.dto.ts:47` |
| Reset token | `z.string().min(24).max(512)`                                 | `auth.dto.ts:41` |
| CSRF token  | `z.string().min(16).max(256)`                                 | `auth.dto.ts:60` |

### 6.3. Timing attack protection

```typescript
// auth.service.ts:269
private async absorbDummyVerify(password: string) {
  await this.verifyPassword(password, await this.getDummyHash());
  // ignore error — only burns comparable CPU time
}
```

- Dummy hash cached: `this.dummyHashPromise = this.hashPassword("keylish-timing-equalizer-placeholder")`
- Chạy ở login (user + admin) khi account không tồn tại
- Phản hồi lỗi luôn đồng nhất: `"Invalid credentials."` (401)

### 6.4. Admin login anti-enumeration

```typescript
// auth.service.ts:425
if (username.includes("@")) {
  await this.absorbDummyVerify(body.password);
  throw new UnauthorizedException("Invalid credentials.");
}
```

Username chứa `@` → immediate reject (admin không dùng email format). Attacker không thể dùng email làm username để probe admin tồn tại.

## 7. Session & Cookie

### 7.1. Cookie names (env-dependent)

| Mục           | Dev name | Prod name       | Cookie attribute differences                                   |
| ------------- | -------- | --------------- | -------------------------------------------------------------- |
| User session  | `user`   | `__Host-user`   | `__Host-` prefix yêu cầu `Secure` + `path=/` + không subdomain |
| Admin session | `admin`  | `__Host-admin`  |                                                                |
| User CSRF     | `u-csrf` | `__Host-u-csrf` |                                                                |
| Admin CSRF    | `a-csrf` | `__Host-a-csrf` |                                                                |

Source: `auth.service.ts:117` — `cookieNames(domain)`

### 7.2. Cookie attributes

```typescript
// auth.service.ts:155
sessionCookieBase = {
  httpOnly: true,                                    // JS không đọc được
  sameSite: process.env.AUTH_COOKIE_SAMESITE         // "lax" (dev) / "none" (prod)
            ?? (isProduction() ? "none" : "lax"),
  secure: isProduction() || cookieSameSite() === "none",  // HTTPS only
  path: "/",
  maxAge: sessionTtlSeconds * 1000,
};

// auth.service.ts:145
cookieBase (CSRF) = {
  httpOnly: false,       // JS cần đọc để gửi X-CSRF-Token header
  sameSite: ...,
  secure: ...,
  path: "/",
  maxAge: sessionTtlSeconds * 1000,
};
```

| Attribute            | Dev                 | Production | Lý do                                                 |
| -------------------- | ------------------- | ---------- | ----------------------------------------------------- |
| `httpOnly` (session) | true                | true       | Chống XSS đánh cắp session                            |
| `httpOnly` (csrf)    | false               | false      | Double-submit cần JS đọc                              |
| `sameSite`           | `lax`               | `none`     | Dev: same-origin; Prod: cross-site (web ≠ API domain) |
| `secure`             | khi `sameSite=none` | true       | HTTPS bắt buộc cho cross-site cookie                  |

### 7.3. Session storage

```typescript
// Tạo token
createToken() → randomBytes(32).toString("base64url")  // 43 chars

// Hash trước khi lưu DB
hashToken(token) → HMAC-SHA256(token, AUTH_TOKEN_PEPPER) → hex (64 chars)

// Cookie (gửi về server)
Set-Cookie: __Host-user=<raw-token>; httpOnly; secure; ...
```

DB chỉ lưu `tokenHash`. Server hash lại token từ cookie để lookup.

### 7.4. Session lifecycle

```
register/login
  → UserSession.create()
      ├→ Active (normal use)
      │    ├→ expiresAt (30d user / 12h admin) → purgeExpired() delete
      │    └→ logout → revokedAt = now() → retain 7 days → purgeExpired()
      └→ change password
           → revoke ALL sessions for this user
           → create NEW session (current device stays logged in)
      └→ reset password
           → revoke ALL sessions (all devices logged out)
```

Source: `auth.service.ts:215` — `purgeExpired()` chạy `OnModuleInit` + setInterval 24h.

### 7.5. Session cleanup (background purge)

```typescript
// auth.service.ts:204-233
onModuleInit() {
  void this.purgeExpired();                                     // immediate on boot
  this.purgeTimer = setInterval(() => void this.purgeExpired(), PURGE_INTERVAL_MS); // 24h
}

async purgeExpired() {
  // 1. Xoá session hết hạn hoặc revoked > 7 ngày
  userSession.deleteMany({ OR: [
    { expiresAt: { lt: now } },
    { revokedAt: { lt: revokedCutoff } }  // 7 ngày audit retention
  ]});
  // 2. Tương tự cho adminSession
  // 3. Xoá auth token hết hạn hoặc đã dùng
  userAuthToken.deleteMany({ OR: [
    { expiresAt: { lt: now } },
    { usedAt: { not: null } }
  ]});
}
```

## 8. CSRF Protection

### 8.1. Double-submit cookie pattern

```
Client                              Server
  │                                   │
  │  GET /api/user/csrf               │
  │──────────────────────────────────►│
  │  ← Set-Cookie: __Host-u-csrf=... │
  │  ← { "token": "..." }            │
  │                                   │
  │  POST /api/user/profile (PATCH)   │
  │  Cookie: __Host-u-csrf=abc123     │
  │  X-CSRF-Token: abc123             │
  │──────────────────────────────────►│
  │  assertCsrf():                    │
  │    cookie["__Host-u-csrf"]        │
  │      === "abc123"                 │
  │    header["x-csrf-token"]         │
  │      === "abc123"                  │
  │  → OK                             │
```

### 8.2. Origin check

```typescript
// auth.service.ts:886
private assertRequestOrigin(request: RequestLike) {
  const origin = readHeader("origin") ?? originFromReferer(readHeader("referer"));
  if (!origin) {
    if (isProduction()) throw ForbiddenException("Invalid request origin.");
    return;  // dev: bỏ qua (Postman, curl testing)
  }
  if (!allowedOrigins().has(origin)) {
    throw ForbiddenException("Invalid request origin.");
  }
}
```

**allowedOrigins()** (`auth.service.ts:99`):

- `AUTH_ALLOWED_ORIGINS` env (comma-separated)
- Fallback: `CORS_ORIGIN` env (legacy)
- Dev: auto-thêm `http://localhost:3001`, `http://localhost:3002`

## 9. Rate limiting

### 9.1. Implementation

In-process `Map<string, { count: number; resetAt: number }>` — không Redis, reset khi app restart.

```typescript
// auth.service.ts:934
private assertRateLimit(key: string, limit: number, windowMs: number) {
  const bucketKey = `${key}:${limit}:${windowMs}`;
  const bucket = this.attempts.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    this.attempts.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) {
    throw HttpException(429, { retryAfter });
  }
  bucket.count += 1;
}
```

### 9.2. Rate limit rules

| Action                | Key pattern                   | Limit | Window | Window (seconds) |
| --------------------- | ----------------------------- | ----- | ------ | ---------------- |
| Register (IP)         | `user:register:{ip}`          | 10    | 15 min | 900              |
| Register (account)    | `user:register:acct:{email}`  | 5     | 1 hour | 3600             |
| Login (IP)            | `user:login:{ip}`             | 20    | 15 min | 900              |
| Login (account)       | `user:login:acct:{email}`     | 10    | 15 min | 900              |
| Forgot (IP)           | `user:forgot:{ip}`            | 5     | 1 hour | 3600             |
| Forgot (account)      | `user:forgot:acct:{email}`    | 5     | 1 hour | 3600             |
| Reset (IP)            | `user:reset:{ip}`             | 5     | 1 hour | 3600             |
| Admin login (IP)      | `admin:login:{ip}`            | 20    | 15 min | 900              |
| Admin login (account) | `admin:login:acct:{username}` | 10    | 15 min | 900              |

**Lưu ý**: `ip` lấy từ `request.ip` (sau `trust proxy`), fallback `x-forwarded-for`. Rate limit không phân biệt user/admin endpoint khác — bucket key chứa prefix `user:` / `admin:`.

## 10. CORS configuration

```typescript
// main.ts
const allowedOrigins = parseOrigins(); // AUTH_ALLOWED_ORIGINS / CORS_ORIGIN
app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
});
```

- Origin list: env variable (prod) + `localhost:3001`, `localhost:3002` (dev)
- `credentials: true` — cho phép gửi cookie cross-origin
- `X-CSRF-Token` trong allowed headers — client phải gửi header này

## 11. Production safety checks

```typescript
// main.ts
function assertProductionSecrets() {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.AUTH_TOKEN_PEPPER?.trim()) {
    throw new Error(
      "AUTH_TOKEN_PEPPER must be set in production " +
        "(a long random secret). Refusing to boot with the dev default."
    );
  }
}
```

App **refuse to boot** trong production nếu thiếu pepper. Dev fallback: `"keylish-dev-token-pepper"`.

## 12. IP & Privacy

### 12.1. IP hash

```typescript
// auth.service.ts:929
private ipHash(request: RequestLike) {
  const ip = request.ip ?? readHeader("x-forwarded-for") ?? null;
  return ip ? hashWithPepper(ip) : null;
  // HMAC-SHA256(ip, pepper) → không reversible
}
```

- IP không bao giờ lưu raw
- Chỉ lưu hash trong `UserSession.ipHash` / `AdminSession.ipHash`
- `request.ip` dùng được nhờ `app.set("trust proxy", 1)` ở `main.ts`

### 12.2. No PII logging

**BẮT BUỘC**: không log:

- Password (raw/hash)
- Session token (raw)
- Reset token
- Email (gắn định danh không cần thiết)

Ngoại lệ có chủ đích: `MailService` log reset link (chỉ dev, khi thiếu Resend config). Link chứa token — không log trong prod.

## 13. Password change & Token rotation

```typescript
// auth.service.ts:542
await this.database.client.$transaction(async (tx) => {
  // 1. Update password hash
  await tx.userIdentity.update({ where: { id }, data: { passwordHash: newHash } });
  // 2. Revoke ALL existing sessions (logout other devices)
  await tx.userSession.updateMany({
    where: { userId: session.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  // 3. Create NEW session (current device stays logged in)
  await tx.userSession.create({ data: { userId, tokenHash, ... } });
});
```

**Tác dụng**: Device change password vẫn giữ session — các device khác bị logout.

## 14. Reset password — One-time token

```typescript
// Tạo
const token = this.createToken();  // random 32-byte
await tx.userAuthToken.create({
  data: {
    tokenHash: hashWithPepper(token),
    purpose: "password-reset",
    expiresAt: now + 2 * 60 * 60 * 1000,  // 2 hours
  },
});
// Kiểm tra khi dùng
if (found.usedAt || found.expiresAt < now()) → reject
// Sau khi dùng
await tx.userAuthToken.update({ where: { id }, data: { usedAt: now() } });
```

**Bảo mật**:

- Token không lưu raw (HMAC-SHA256 + pepper)
- One-time (`usedAt` check)
- TTL 2h
- Reset → revoke ALL sessions
- Rate limit: 5/IP/h + 5/account/h

## 15. Database-level security

| Biện pháp                 | Áp dụng                                                                      | File          |
| ------------------------- | ---------------------------------------------------------------------------- | ------------- |
| Password hash (Argon2id)  | `UserIdentity.passwordHash`, `AdminIdentity.passwordHash`                    | Prisma schema |
| Token hash (HMAC-SHA256)  | `UserSession.tokenHash`, `AdminSession.tokenHash`, `UserAuthToken.tokenHash` | Prisma schema |
| Soft-delete user          | `User.deletedAt`, `User.status = DELETED`                                    | Prisma schema |
| Cascade delete (security) | Delete User → cascade UserIdentity, UserSession, UserAuthToken               | migration     |
| Non-sequential PK         | `cuid()` — không leaker số lượng records                                     | Prisma schema |
| CEFR level enum           | `CefrLevel` — chỉ A1..C2                                                     | Prisma schema |
| User status enum          | `UserStatus` — ACTIVE/DISABLED/DELETED                                       | Prisma schema |
| Auth provider enum        | `AuthProvider` — chỉ PASSWORD (hiện tại)                                     | Prisma schema |

## 16. Input validation (Zod — all schemas)

| Khu vực       | Zod schema(s)                                                                                                                                             | File source                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Auth (user)   | `UserRegisterSchema`, `UserLoginSchema`, `PasswordChangeSchema`, `ForgotPasswordSchema`, `ResetPasswordSchema`, `UpdateProfileSchema`, `CsrfHeaderSchema` | `src/auth/auth.dto.ts`              |
| Auth (admin)  | `AdminLoginSchema`, `UpdateAdminPasswordSchema`, `UpdateUserStatusSchema`                                                                                 | `src/auth/auth.dto.ts`              |
| Public vocab  | `VocabQuerySchema` (CefrLevelSchema, csvList, coerce)                                                                                                     | `packages/shared/src/vocab.ts`      |
| Admin vocab   | `AdminVocabListSchema`, `WordCreateSchema`, `WordUpdateSchema`                                                                                            | `src/vocab/vocab.service.ts`        |
| Admin topics  | `AdminTopicListSchema`, `TopicCreateSchema`, `TopicUpdateSchema`                                                                                          | `src/topics/topics.service.ts`      |
| Admin users   | Inline schema                                                                                                                                             | `src/admin/admin.service.ts:57`     |
| Admin traffic | `days`: clamped [1, 90]                                                                                                                                   | `src/traffic/traffic.service.ts:49` |

Tất cả validation đều dùng `safeParse` → throw `BadRequestException` với Zod error message.

## 17. E2E test coverage — Security

`src/app.e2e.spec.ts`:

| Test case                                | What it verifies                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Rejects unsafe requests without CSRF     | POST `/api/user/login` không CSRF → 403                                          |
| Hides admin routes with 404              | `ADMIN_API_ENABLED=false` → POST `/api/admin/login` → 404                        |
| Passes admin gate when enabled           | `ADMIN_API_ENABLED=true` → GET `/api/admin/dashboard/summary` → 401 (no session) |
| Records page view from allowed origin    | POST `/api/v1/track` với `Origin: http://localhost:3001` → 204                   |
| Ignores page view from disallowed origin | POST `/api/v1/track` với `Origin: https://evil.example.com` → không upsert       |
| Rejects invalid vocabulary filters       | GET `/api/v1/vocab?levels=NOPE` → 400                                            |

**Unit test coverage** (`src/auth/auth.service.spec.ts`):

| Test case                | What it verifies                                                     |
| ------------------------ | -------------------------------------------------------------------- |
| Argon2id hash/verify     | Hash không chứa plaintext, verify đúng/sai                           |
| Token hash deterministic | `hashToken(token)` 64 hex chars, deterministic                       |
| CSRF reject              | Cookie ≠ header → ForbiddenException                                 |
| CSRF accept              | Cookie === header → pass                                             |
| Cookie isolation         | User token trên admin route → 401; admin token trên user route → 401 |
| Active session auth      | User + admin session valid → `authenticateUser/Admin` resolves       |

## 18. Security checklist (as-built)

| #   | Biện pháp                         | Trạng thái | Source file                       |
| --- | --------------------------------- | ---------- | --------------------------------- |
| 1   | Argon2id password hash            | DONE       | `auth.service.ts:235`             |
| 2   | Configurable Argon2 cost          | DONE       | env `AUTH_ARGON2_*`               |
| 3   | Session token HMAC + pepper       | DONE       | `auth.service.ts:84`              |
| 4   | Cookie httpOnly (session)         | DONE       | `auth.service.ts:155`             |
| 5   | Cookie SameSite                   | DONE       | Dev=lax, Prod=none                |
| 6   | Cookie Secure                     | DONE       | Prod + SameSite=None              |
| 7   | CSRF double-submit                | DONE       | `auth.guard.ts:47`                |
| 8   | Origin/Referer check              | DONE       | `auth.service.ts:886`             |
| 9   | Rate limiting                     | DONE       | `auth.service.ts:934` (in-memory) |
| 10  | Timing attack protection          | DONE       | `auth.service.ts:269`             |
| 11  | No PII in logs (by convention)    | DONE       | review required                   |
| 12  | IP hashed (not raw)               | DONE       | `auth.service.ts:929`             |
| 13  | Admin API gated (404 prod)        | DONE       | `admin-gate.guard.ts`             |
| 14  | Reset token one-time              | DONE       | `auth.service.ts:667`             |
| 15  | Reset token 2h TTL                | DONE       | `auth.service.ts:625`             |
| 16  | PEPPER bắt buộc prod              | DONE       | `main.ts:11`                      |
| 17  | Password min 12 chars             | DONE       | `auth.dto.ts:5`                   |
| 18  | Password max 128 chars            | DONE       | `auth.dto.ts:5`                   |
| 19  | Login anti-enumeration            | DONE       | `auth.service.ts:269` (timing)    |
| 20  | Admin login anti-email            | DONE       | `auth.service.ts:425`             |
| 21  | Forgot-password no-leak           | DONE       | luôn `{ ok: true }`               |
| 22  | Session background purge          | DONE       | `auth.service.ts:215`             |
| 23  | Token rotation on password change | DONE       | `auth.service.ts:542`             |
| 24  | Module-level guard (AdminGuard)   | DONE       | controller `@UseGuards`           |
| 25  | Global admin gate (APP_GUARD)     | DONE       | `app.module.ts`                   |
| 26  | CORS whitelist                    | DONE       | `main.ts`                         |
| 27  | Zod validation all inputs         | DONE       | schemas in services               |
| 28  | trust proxy setting               | DONE       | `main.ts` for real IP             |
| 29  | Prisma parameterized queries      | DONE       | ORM built-in                      |
| 30  | Soft-delete user (not hard)       | DONE       | `User.deletedAt`                  |
| 31  | Cascade delete on user delete     | DONE       | migration SQL                     |
| 32  | Non-sequential PK (cuid)          | DONE       | Prisma schema                     |
| 33  | CSRF skip safe methods            | DONE       | `auth.service.ts:335`             |
| 34  | Cookie `__Host-` prefix (prod)    | DONE       | `auth.service.ts:50`              |
| 35  | Session touch interval (10 min)   | DONE       | `auth.service.ts:847`             |

## 19. RISK & OPEN QUESTION

| ID  | Mô tả                                                                                               | Mức    | Hướng xử lý                                                       |
| --- | --------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| —   | Rate limit in-memory: mất khi restart server. Cân nhắc Redis hoặc DB-backed cho production scale.   | Medium | V2: Redis-backed rate limit                                       |
| —   | CSRF token không đổi sau mỗi request — không có rotation (có thể đổi sau login hoặc mỗi request).   | Low    | Rotation sau login là đủ (hiện tại CSRF mới được tạo ở mỗi login) |
| —   | Mail log reset link dev: `mail.service.ts` log token ra console thiếu Resend config. Chỉ trong dev. | Low    | Chấp nhận — không log trong prod                                  |
| —   | Không có custom exception filter — HTTP 500 trả stack trace ở dev mode (NestJS default).            | Medium | Thêm exception filter để ẩn stack trace trong production response |
| —   | Register `ConflictException` tiết lộ email đã tồn tại — không thể tránh với thiết kế hiện tại.      | Low    | Chấp nhận — không thể vừa unique vừa giấu                         |
| —   | `__Host-` prefix chỉ dùng cho prod cookies — không kiểm tra tính hợp lệ của prefix ở runtime.       | Low    | Chấp nhận — NestJS cookie parser hoạt động bình thường            |

## 20. Trace FR

| FR                | Endpoint          | Security measure                                                                 |
| ----------------- | ----------------- | -------------------------------------------------------------------------------- |
| FR-AUT-01         | Register          | Argon2id hash, rate limit, CSRF                                                  |
| FR-AUT-02         | Login             | Timing equalizer, rate limit, CSRF                                               |
| FR-AUT-04         | Logout            | Session revoke                                                                   |
| FR-AUT-05         | Profile           | UserGuard (session cookie)                                                       |
| FR-AUT-06         | Change password   | Token rotation, CSRF                                                             |
| FR-AUT-07         | Forgot password   | No-leak response, rate limit                                                     |
| FR-AUT-08         | Reset password    | One-time token, TTL 2h, CSRF                                                     |
| FR-AUT-10         | CSRF token        | Double-submit + origin check                                                     |
| FR-TRF-01/02/03   | Traffic           | Origin allowlist                                                                 |
| FR-ADM-03         | Dashboard         | AdminGuard + AdminGateGuard                                                      |
| FR-ADM-04         | Users CRUD        | AdminGuard + AdminGateGuard                                                      |
| FR-ADM-05         | Vocab/Topics CRUD | AdminGuard + AdminGateGuard                                                      |
| FR-ADM-06         | Analytics         | AdminGuard + AdminGateGuard                                                      |
| FR-PVOC-01..07/09 | User vocab        | UserGuard, CsrfGuard cho write, service lọc theo `session.userId`, ownership 404 |

## 21. (V2.1 DONE as-built) Bảo mật kho từ vựng cá nhân

Căn cứ NFR-SEC-05, BR-11, ADR-019. Code hiện có ở `apps/api/src/uservocab/*`.

| Biện pháp        | Yêu cầu                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| Xác thực         | Mọi endpoint `/api/user/vocab*` qua **`UserGuard`** (cookie session) + **CSRF** cho thao tác ghi.                 |
| Cô lập theo user | Truy vấn **luôn** lọc `where: { userId: session.userId }`; **KHÔNG** nhận `userId` từ client (BR-11, NFR-SEC-05). |
| Quyền sở hữu     | PATCH/DELETE `:id` phải kiểm `entry.userId === session.userId`; nếu không → `404` (không tiết lộ tồn tại).        |
| Validation       | Input qua Zod (`@keylish/shared`); giới hạn độ dài như Word admin (en ≤120, vi ≤240, example ≤500).               |
| Cascade          | User xóa → entries theo `onDelete: Cascade`; Word xóa → `SetNull` (entry còn, mất tham chiếu).                    |
| Không PII mới    | Kho cá nhân chứa từ vựng, không thêm PII nhạy cảm; không log nội dung entry.                                      |
