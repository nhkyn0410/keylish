# 08 — Kế hoạch Kiểm thử và Tiêu chí Chấp nhận (Test Plan & Acceptance)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường      | Giá trị                                 |
| ----------- | --------------------------------------- |
| Tên         | Kế hoạch Kiểm thử và Tiêu chí Chấp nhận |
| Mã tài liệu | `08-test`                               |
| Dự án       | KeyLish                                 |
| Phiên bản   | 0.1.3                                   |
| Trạng thái  | Draft                                   |
| Người viết  | AI Agent (soạn thảo SDLC)               |
| Người duyệt | Nguyễn Hồng Khanh                       |
| Ngày tạo    | 2026-06-15                              |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật | Nội dung                                                                                 |
| --------- | ---------- | -------------- | ---------------------------------------------------------------------------------------- |
| 0.1.0     | 2026-06-15 | AI Agent       | Bản Draft đầu — as-built test state + mandatory test plan.                               |
| 0.1.1     | 2026-06-15 | AI Agent       | Sửa G-2/G-3 (10 e2e test, `passWithNoTests`); gom RISK engine-test về R-7 (G-4).         |
| 0.1.2     | 2026-06-20 | AI Agent       | Sync test hiện tại: public vocab search/offset e2e và unit test V2.1 cho tạo từ cá nhân. |
| 0.1.3     | 2026-06-20 | AI Agent       | Thêm test list kho cá nhân theo search/level/topic.                                      |

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

| Lệnh                              | Mô tả                        |
| --------------------------------- | ---------------------------- |
| `pnpm test`                       | Turbo test toàn bộ workspace |
| `pnpm --filter @keylish/api test` | Test API                     |
| `pnpm lint`                       | ESLint                       |
| `pnpm typecheck`                  | TypeScript strict check      |
| `pnpm check`                      | lint + typecheck             |

### 2.3. Hiện trạng (as-built)

| Workspace         | Test files                                                                                                             | Coverage |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| `apps/api`        | `app.e2e.spec.ts` (12 test cases) + `auth.service.spec.ts` (7 test cases) + `uservocab.service.spec.ts` (4 test cases) | Cơ bản   |
| `apps/user-web`   | Không có test                                                                                                          | 0%       |
| `packages/db`     | Không có test                                                                                                          | 0%       |
| `packages/shared` | Không có test                                                                                                          | 0%       |

**RISK R-7**: Coverage hiện thấp, `--passWithNoTests` cho phép pass dù không có test.

## 3. Vùng kiểm thử bắt buộc (MANDATORY)

Theo PHẦN 0, KeyLish không có tiền & không multi-tenant → tập trung vào 4 vùng mandatory, cộng thêm vùng V2.1 đang làm:

### 3.1. Auth: Hash password (Argon2), session token, reset-token reuse/expiry

| Test case | Mô tả                                               | Hiện có                     |
| --------- | --------------------------------------------------- | --------------------------- |
| T-ATH-01  | `hashPassword` + `verifyPassword` Argon2id đúng/sai | DONE (auth.service.spec.ts) |
| T-ATH-02  | `hashToken` không lưu plaintext, deterministic      | DONE                        |
| T-ATH-03  | `assertCsrf` từ chối khi mismatch                   | DONE                        |
| T-ATH-04  | `assertCsrf` chấp nhận khi match                    | DONE                        |
| T-ATH-05  | User cookie không auth admin endpoint               | DONE                        |
| T-ATH-06  | Admin cookie không auth user endpoint               | DONE                        |
| T-ATH-07  | E2E: CSRF bắt buộc cho POST unsafe                  | DONE (app.e2e.spec.ts)      |
| T-ATH-08  | Auth session active user với cookie đúng            | DONE                        |
| T-ATH-09  | Reset token one-time: usedAt check                  | TODO                        |
| T-ATH-10  | Reset token expired: expiresAt check                | TODO                        |
| T-ATH-11  | Rate limiting đúng window                           | TODO                        |
| T-ATH-12  | Timing attack: dummy verify equal time              | TODO                        |

### 3.2. Toàn vẹn dữ liệu từ vựng: `@@unique([en, level])`, CEFR enum

| Test case | Mô tả                                    | Hiện có                |
| --------- | ---------------------------------------- | ---------------------- |
| T-VOC-01  | Tạo Word với (en, level) trùng → lỗi     | TODO                   |
| T-VOC-02  | CEFR enum chỉ chấp nhận A1–C2            | TODO                   |
| T-VOC-03  | Level nullable được phép                 | TODO                   |
| T-VOC-04  | API vocab trả đúng schema (Zod)          | DONE (app.e2e — vocab) |
| T-VOC-05  | API vocab lọc levels/topics đúng         | DONE                   |
| T-VOC-06  | API vocab/count trả số đúng              | DONE                   |
| T-VOC-07  | API topics trả đúng cấu trúc             | DONE                   |
| T-VOC-08  | API vocab reject invalid level (="NOPE") | DONE                   |
| T-VOC-09  | API vocab tìm kiếm theo `search` đúng    | DONE                   |
| T-VOC-10  | API vocab phân trang `offset` đúng       | DONE                   |

### 3.3. Engine gõ char-by-char + IME safety (vùng dễ lỗi nhất)

| Test case | Mô tả                                          | Hiện có |
| --------- | ---------------------------------------------- | ------- |
| T-IME-01  | `computeCells` đúng/sai/chưa-gõ/con-trỏ        | TODO    |
| T-IME-02  | `clean()` chuẩn hóa [a-z'-]                    | TODO    |
| T-IME-03  | IME composition: onChange bỏ qua khi composing | TODO    |
| T-IME-04  | IME compositionend: chỉ áp khi kết thúc        | TODO    |
| T-IME-05  | Enter bị chặn khi isComposing                  | TODO    |
| T-IME-06  | RepeatMode "none": bỏ qua từ sai               | TODO    |
| T-IME-07  | RepeatMode "once": requeue 1 lần               | TODO    |
| T-IME-08  | RepeatMode "until": requeue đến khi đúng       | TODO    |
| T-IME-09  | SessionResult tính WPM/accuracy đúng           | TODO    |
| T-IME-10  | wrongWords không trùng                         | TODO    |

### 3.4. Traffic counter idempotent (theo giờ UTC)

| Test case | Mô tả                                       | Hiện có        |
| --------- | ------------------------------------------- | -------------- |
| T-TRF-01  | Track từ origin hợp lệ → upsert             | DONE (app.e2e) |
| T-TRF-02  | Track từ origin không hợp lệ → không upsert | DONE           |
| T-TRF-03  | Track luôn 204 dù success/fail              | DONE           |
| T-TRF-04  | TrafficAnalytics trả đúng range             | TODO           |
| T-TRF-05  | Upsert increment đúng (2 lần → count=2)     | TODO           |

### 3.5. Kho từ vựng cá nhân V2.1

| Test case | Mô tả                                                                           | Hiện có                            |
| --------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| T-PVOC-01 | Tạo từ khớp chính xác sau `normalizeEn` → liên kết `Word`, không tạo custom     | DONE (`uservocab.service.spec.ts`) |
| T-PVOC-02 | Tạo biến thể (`running`) → gợi ý lemma (`run`), không tự tạo custom             | DONE                               |
| T-PVOC-03 | Từ không có trong kho hệ thống → tạo custom với `normalizedEn` + topic tùy chọn | DONE                               |
| T-PVOC-04 | List kho cá nhân lọc theo search/level/topic                                    | DONE                               |
| T-PVOC-05 | Trùng `(userId, wordId)` hoặc `(userId, normalizedEn)` → 409                    | TODO                               |
| T-PVOC-06 | PATCH/DELETE kiểm ownership, trả 404 nếu không thuộc user                       | TODO                               |
| T-PVOC-07 | Luyện gõ theo kho cá nhân (FR-PVOC-08)                                          | TODO                               |

## 4. E2E API test hiện tại (`app.e2e.spec.ts`)

12 test cases đang chạy:

| #   | Test                                         | Status |
| --- | -------------------------------------------- | ------ |
| 1   | Health route                                 | DONE   |
| 2   | V1 topic summaries                           | DONE   |
| 3   | Filtered V1 vocabulary                       | DONE   |
| 4   | Searched V1 vocabulary                       | DONE   |
| 5   | Paged V1 vocabulary                          | DONE   |
| 6   | V1 vocabulary counts                         | DONE   |
| 7   | Reject unsafe auth without CSRF              | DONE   |
| 8   | Hide admin routes when disabled              | DONE   |
| 9   | Admin routes pass gate (401 without session) | DONE   |
| 10  | Record page view from allowed origin         | DONE   |
| 11  | Ignore page views from disallowed origin     | DONE   |
| 12  | Reject invalid vocabulary filters (400)      | DONE   |

## 5. Unit test hiện tại

11 test cases đang chạy:

| #   | Test                                                                 | Status |
| --- | -------------------------------------------------------------------- | ------ |
| 1   | `auth.service`: Argon2id hash and verify                             | DONE   |
| 2   | `auth.service`: Hash session tokens (no plaintext)                   | DONE   |
| 3   | `auth.service`: Reject unsafe without matching CSRF                  | DONE   |
| 4   | `auth.service`: Accept unsafe with matching CSRF                     | DONE   |
| 5   | `auth.service`: User cookie not auth admin                           | DONE   |
| 6   | `auth.service`: Admin cookie not auth user                           | DONE   |
| 7   | `auth.service`: Authenticate active user/admin with own cookies      | DONE   |
| 8   | `uservocab.service`: exact-match normalized create links system word | DONE   |
| 9   | `uservocab.service`: variant create suggests lemma                   | DONE   |
| 10  | `uservocab.service`: no-match create stores custom entry with topic  | DONE   |
| 11  | `uservocab.service`: list filters by search/level/topic              | DONE   |

## 6. Tiêu chí chấp nhận (Acceptance Criteria)

### 6.1. Theo UC

| UC    | Tiêu chí                                         | Test trace              |
| ----- | ------------------------------------------------ | ----------------------- |
| UC-01 | Chọn topic/CEFR → gõ char-by-char → tổng kết     | T-IME-01..10            |
| UC-02 | Đăng ký email + password → session cookie        | T-ATH-01, T-ATH-07      |
| UC-03 | Đăng nhập → session cookie                       | T-ATH-08                |
| UC-04 | Forgot → mail → reset → login                    | T-ATH-09, T-ATH-10      |
| UC-05 | Admin CRUD vocab/topic/user + public vocab query | T-VOC-04..10            |
| UC-06 | Traffic tracking 204 + aggregate                 | T-TRF-01..05            |
| UC-07 | Quản lý kho cá nhân: pick/tạo/dedup/lọc/sửa/xóa  | T-PVOC-01..06           |
| UC-08 | Luyện gõ từ kho cá nhân                          | T-PVOC-07, T-IME-01..10 |

### 6.2. Quality gates

1. `pnpm lint` — 0 errors
2. `pnpm typecheck` — 0 errors
3. `pnpm test` — tất cả test pass
4. MANDATORY test cases (T-ATH-_ / T-VOC-_ / T-IME-_ / T-TRF-_ / T-PVOC-\*) — tối thiểu 70% coverage

## 7. RISK / Task

| Mã  | Mô tả                                                                                                                                                                                                                | Mức |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| R-7 | Coverage thấp (`--passWithNoTests` cho phép 0 test pass). Gồm: engine gõ (vùng dễ lỗi nhất) chưa có unit test; user-web/db/shared chưa có test; V2.1 mới có unit test cho create/list, chưa có ownership/e2e/typing. | Cao |

→ RISK ID chuẩn ở `context/PROJECT-STATE.md` §2. Task bổ sung test (T-03/T-04/T-05) ở `11-tasks.md`.
