# 08 — Kế hoạch Kiểm thử và Tiêu chí Chấp nhận (Test Plan & Acceptance)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Kế hoạch Kiểm thử và Tiêu chí Chấp nhận |
| Mã tài liệu | `08-test` |
| Dự án | KeyLish |
| Phiên bản | 0.1.1 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu — as-built test state + mandatory test plan. |
| 0.1.1 | 2026-06-15 | AI Agent | Sửa G-2/G-3 (10 e2e test, `passWithNoTests`); gom RISK engine-test về R-7 (G-4). |

### 1.3. Tham chiếu

- `01-srs` — FR, UC cần test
- `03-lld` — module chi tiết để xác định vùng test

## 2. Chiến lược kiểm thử

### 2.1. Công nghệ

- **Unit test**: Vitest 4 (`^4.0.15` api, `^4.1.8` db/shared)
- **E2E API**: Supertest 7 (`^7.1.4`) với NestJS testing module
- **Config**: `--passWithNoTests` cho phép pass khi không có test
- **Lint/Typecheck**: ESLint 10 + TypeScript strict (chạy trước test)

### 2.2. Lệnh hiện tại

| Lệnh | Mô tả |
|---|---|
| `pnpm test` | Turbo test toàn bộ workspace |
| `pnpm --filter @keylish/api test` | Test API |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript strict check |
| `pnpm check` | lint + typecheck |

### 2.3. Hiện trạng (as-built)

| Workspace | Test files | Coverage |
|---|---|---|
| `apps/api` | `app.e2e.spec.ts` (190 dòng, 10 test cases) + `auth.service.spec.ts` (144 dòng, 7 test cases) | Cơ bản |
| `apps/user-web` | Không có test | 0% |
| `packages/db` | Không có test | 0% |
| `packages/shared` | Không có test | 0% |

**RISK R-7**: Coverage hiện thấp, `--passWithNoTests` cho phép pass dù không có test.

## 3. Vùng kiểm thử bắt buộc (MANDATORY)

Theo PHẦN 0, KeyLish không có tiền & không multi-tenant → tập trung vào 4 vùng:

### 3.1. Auth: Hash password (Argon2), session token, reset-token reuse/expiry

| Test case | Mô tả | Hiện có |
|---|---|---|
| T-ATH-01 | `hashPassword` + `verifyPassword` Argon2id đúng/sai | ✅ (auth.service.spec.ts) |
| T-ATH-02 | `hashToken` không lưu plaintext, deterministic | ✅ |
| T-ATH-03 | `assertCsrf` từ chối khi mismatch | ✅ |
| T-ATH-04 | `assertCsrf` chấp nhận khi match | ✅ |
| T-ATH-05 | User cookie không auth admin endpoint | ✅ |
| T-ATH-06 | Admin cookie không auth user endpoint | ✅ |
| T-ATH-07 | E2E: CSRF bắt buộc cho POST unsafe | ✅ (app.e2e.spec.ts) |
| T-ATH-08 | Auth session active user với cookie đúng | ✅ |
| T-ATH-09 | Reset token one-time: usedAt check | ⬜ |
| T-ATH-10 | Reset token expired: expiresAt check | ⬜ |
| T-ATH-11 | Rate limiting đúng window | ⬜ |
| T-ATH-12 | Timing attack: dummy verify equal time | ⬜ |

### 3.2. Toàn vẹn dữ liệu từ vựng: `@@unique([en, level])`, CEFR enum

| Test case | Mô tả | Hiện có |
|---|---|---|
| T-VOC-01 | Tạo Word với (en, level) trùng → lỗi | ⬜ |
| T-VOC-02 | CEFR enum chỉ chấp nhận A1–C2 | ⬜ |
| T-VOC-03 | Level nullable được phép | ⬜ |
| T-VOC-04 | API vocab trả đúng schema (Zod) | ✅ (app.e2e — vocab) |
| T-VOC-05 | API vocab lọc levels/topics đúng | ✅ |
| T-VOC-06 | API vocab/count trả số đúng | ✅ |
| T-VOC-07 | API topics trả đúng cấu trúc | ✅ |
| T-VOC-08 | API vocab reject invalid level (="NOPE") | ✅ |

### 3.3. Engine gõ char-by-char + IME safety (vùng dễ lỗi nhất)

| Test case | Mô tả | Hiện có |
|---|---|---|
| T-IME-01 | `computeCells` đúng/sai/chưa-gõ/con-trỏ | ⬜ |
| T-IME-02 | `clean()` chuẩn hóa [a-z'-] | ⬜ |
| T-IME-03 | IME composition: onChange bỏ qua khi composing | ⬜ |
| T-IME-04 | IME compositionend: chỉ áp khi kết thúc | ⬜ |
| T-IME-05 | Enter bị chặn khi isComposing | ⬜ |
| T-IME-06 | RepeatMode "none": bỏ qua từ sai | ⬜ |
| T-IME-07 | RepeatMode "once": requeue 1 lần | ⬜ |
| T-IME-08 | RepeatMode "until": requeue đến khi đúng | ⬜ |
| T-IME-09 | SessionResult tính WPM/accuracy đúng | ⬜ |
| T-IME-10 | wrongWords không trùng | ⬜ |

### 3.4. Traffic counter idempotent (theo giờ UTC)

| Test case | Mô tả | Hiện có |
|---|---|---|
| T-TRF-01 | Track từ origin hợp lệ → upsert | ✅ (app.e2e) |
| T-TRF-02 | Track từ origin không hợp lệ → không upsert | ✅ |
| T-TRF-03 | Track luôn 204 dù success/fail | ✅ |
| T-TRF-04 | TrafficAnalytics trả đúng range | ⬜ |
| T-TRF-05 | Upsert increment đúng (2 lần → count=2) | ⬜ |

## 4. E2E API test hiện tại (`app.e2e.spec.ts`)

10 test cases đang chạy:

| # | Test | Status |
|---|---|---|
| 1 | Health route | ✅ |
| 2 | V1 topic summaries | ✅ |
| 3 | Filtered V1 vocabulary | ✅ |
| 4 | V1 vocabulary counts | ✅ |
| 5 | Reject unsafe auth without CSRF | ✅ |
| 6 | Hide admin routes when disabled | ✅ |
| 7 | Admin routes pass gate (401 without session) | ✅ |
| 8 | Record page view from allowed origin | ✅ |
| 9 | Ignore page views from disallowed origin | ✅ |
| 10 | Reject invalid vocabulary filters (400) | ✅ |

## 5. Unit test hiện tại (`auth.service.spec.ts`)

7 test cases:

| # | Test | Status |
|---|---|---|
| 1 | Argon2id hash and verify | ✅ |
| 2 | Hash session tokens (no plaintext) | ✅ |
| 3 | Reject unsafe without matching CSRF | ✅ |
| 4 | Accept unsafe with matching CSRF | ✅ |
| 5 | User cookie not auth admin | ✅ |
| 6 | Admin cookie not auth user | ✅ |
| 7 | Authenticate active user/admin with own cookies | ✅ |

## 6. Tiêu chí chấp nhận (Acceptance Criteria)

### 6.1. Theo UC

| UC | Tiêu chí | Test trace |
|---|---|---|
| UC-01 | Chọn topic/CEFR → gõ char-by-char → tổng kết | T-IME-01..10 |
| UC-02 | Đăng ký email + password → session cookie | T-ATH-01, T-ATH-07 |
| UC-03 | Đăng nhập → session cookie | T-ATH-08 |
| UC-04 | Forgot → mail → reset → login | T-ATH-09, T-ATH-10 |
| UC-05 | Admin CRUD vocab/topic/user | T-VOC-04..08 |
| UC-06 | Traffic tracking 204 + aggregate | T-TRF-01..05 |

### 6.2. Quality gates

1. `pnpm lint` — 0 errors
2. `pnpm typecheck` — 0 errors
3. `pnpm test` — tất cả test pass
4. MANDATORY test cases (T-ATH-* / T-VOC-* / T-IME-* / T-TRF-*) — tối thiểu 70% coverage

## 7. RISK / Task

| Mã | Mô tả | Mức |
|---|---|---|
| R-7 | Coverage thấp (`--passWithNoTests` cho phép 0 test pass). Gồm: engine gõ (vùng dễ lỗi nhất) chưa có unit test; user-web/db/shared chưa có test. | Cao |

→ RISK ID chuẩn ở `context/PROJECT-STATE.md` §2. Task bổ sung test (T-03/T-04/T-05) ở `11-tasks.md`.
