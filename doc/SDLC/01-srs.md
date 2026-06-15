# 01 — Đặc tả Yêu cầu Phần mềm (SRS)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường        | Giá trị                                                        |
| ------------- | -------------------------------------------------------------- |
| Tên           | Đặc tả Yêu cầu Phần mềm (Software Requirements Specification)  |
| Mã tài liệu   | `01-srs`                                                       |
| Dự án         | KeyLish                                                        |
| Phiên bản     | 0.1.0                                                          |
| Trạng thái    | Draft                                                          |
| Người viết    | AI Agent (soạn thảo SDLC), Nguyễn Hồng Khanh                   |
| Người duyệt   | Nguyễn Hồng Khanh                                              |
| Ngày tạo      | 2026-06-15                                                     |
| Chuẩn áp dụng | ISO/IEC/IEEE 29148:2018 (yêu cầu) · 15289:2019 (loại tài liệu) |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật | Nội dung                                              |
| --------- | ---------- | -------------- | ----------------------------------------------------- |
| 0.1.0     | 2026-06-15 | AI Agent       | Bản Draft đầu — SRS as-built suy ra từ code (MODE B). |

### 1.3. Mục đích

Đặc tả **yêu cầu phần mềm as-built** của KeyLish V1: hệ thống học từ vựng tiếng Anh qua hành động gõ phím. Yêu cầu được suy ra từ code hiện có và phải **kiểm tra được** (có actor + kết quả quan sát được). Đây là tài liệu **nguồn duy nhất cho yêu cầu** (PHẦN 6 — single source of truth); quyết định công nghệ → `10-adr`, thiết kế chi tiết → `02`–`07`.

### 1.4. Phạm vi

- **Trong phạm vi (✅ as-built):** luyện gõ từ vựng char-by-char; chọn topic + cấp độ CEFR + mode; lặp từ sai; tổng kết phiên; lấy từ vựng local-first (API/cache/seed); auth người học (đăng ký/đăng nhập/phiên/đổi & quên & đặt lại mật khẩu); auth + API admin; traffic analytics; gửi mail reset.
- **Khung (🚧):** `apps/admin-web` (giao diện admin V2 — pages có sẵn, chưa nối `@keylish/shared`).
- **Ngoài phạm vi (⬜ — chỉ ghi OPEN QUESTION, không đặc tả chi tiết):** AI feedback + BYOK; flashcard/quiz mode; OAuth (enum `AuthProvider` mới có `PASSWORD`).

### 1.5. Định nghĩa & viết tắt

Thuật ngữ entity/state/domain → `context/GLOSSARY.md`; tên module/folder → `context/DOMAIN-MAP.md`. Một số dùng ngay: **CEFR** (khung tham chiếu ngôn ngữ A1–C2); **IME** (bộ gõ, vd gõ tiếng Việt); **TTS** (text-to-speech trình duyệt); **CSRF**; **TTL** (thời hạn sống của phiên/token).

### 1.6. Tham chiếu

- Code: `CODEBASE_ROOT = C:\Code\KeyLish`.
- Tài liệu liên quan: `00-coding-standard`, `04-database`, `05-api`, `06-ui-ux`, `07-security`; nguồn gốc: [doc/design.md](../design.md), [doc/vocab-pipeline.md](../vocab-pipeline.md).

### 1.7. Quy ước yêu cầu

- Mã: **FR-** (chức năng), **BR-** (nghiệp vụ), **NFR-** (phi chức năng), **UC-** (use case). Mã ổn định, không tái sử dụng.
- Từ khóa mức độ (theo 29148): **BẮT BUỘC** (shall) · **NÊN** (should) · **CÓ THỂ** (may).
- Mỗi yêu cầu gắn **Trạng thái**: ✅ Đã có · 🚧 Đang làm · ⬜ Chưa làm, kèm **Nguồn** (file code) để kiểm chứng.
- Nội dung không suy ra được từ code → đánh dấu **TBD / ASSUMPTION / OPEN QUESTION**, không suy diễn.

## 2. Mô tả tổng thể

### 2.1. Bối cảnh sản phẩm

KeyLish là ứng dụng web **local-first**: người học chọn chủ đề + cấp độ + mode rồi luyện gõ từng từ tiếng Anh. Từ vựng lấy từ API (NestJS + PostgreSQL) nhưng vẫn chạy được khi mất API nhờ cache IndexedDB và seed offline. Backend còn cung cấp auth người học, bề mặt admin nội bộ, và bộ đếm lượt truy cập.

### 2.2. Actor

| Actor                 | Mô tả                                                                                                             | Trạng thái         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Người học (User)**  | Có tài khoản (email + mật khẩu); luyện gõ, quản hồ sơ, đổi/đặt lại mật khẩu.                                      | ✅                 |
| **Khách (Guest)**     | Không tài khoản; vẫn luyện gõ được nhờ local-first (API/cache/seed).                                              | ✅                 |
| **Admin**             | Đăng nhập username/mật khẩu; quản người dùng, từ vựng, xem analytics. Bề mặt **local-only** (404 ở prod khi tắt). | ✅ (API) / 🚧 (UI) |
| **Hệ thống (System)** | Tiến trình nền: dọn phiên/token hết hạn; bộ đếm traffic; pipeline dataset.                                        | ✅                 |

### 2.3. Ràng buộc & môi trường vận hành

- Trình duyệt hiện đại có IndexedDB, `navigator.sendBeacon`, Web Speech (TTS). Local-first vẫn hoạt động khi không cấu hình API.
- Triển khai: user-web → Vercel; api → Render (free, ngủ sau ~15p idle → có prewarm); PostgreSQL → Supabase; admin-web local-only. Chi tiết `09-deploy`.
- Ràng buộc bảo mật prod: `AUTH_TOKEN_PEPPER` bắt buộc; cookie `__Host-*` + `SameSite=None; Secure`; admin tắt mặc định.

### 2.4. Giả định & phụ thuộc

- ASSUMPTION: người dùng dùng một trình duyệt có JavaScript bật; TTS phụ thuộc giọng đọc trình duyệt (không đảm bảo mọi thiết bị).
- Phụ thuộc dữ liệu: kho từ vựng build từ Words-CEFR-Dataset (MIT) + kaikki/Wiktionary (CC BY-SA + GFDL) — `04-database`/`vocab-pipeline.md`.

## 3. State enum theo entity (BẮT BUỘC theo PHẦN 0)

Lấy từ [schema.prisma](../../packages/db/prisma/schema.prisma) và code; tên giữ nguyên theo Prisma.

| Entity / khái niệm           | Enum / tập trạng thái                | Giá trị                                                | Nguồn               |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------ | ------------------- |
| `Word.level`                 | `CefrLevel`                          | `A1 A2 B1 B2 C1 C2` (nullable)                         | schema.prisma       |
| `User.status`                | `UserStatus`                         | `ACTIVE DISABLED DELETED`                              | schema.prisma       |
| Identity provider            | `AuthProvider`                       | `PASSWORD` (chỉ 1 — OAuth ⬜)                          | schema.prisma       |
| `UserSession`/`AdminSession` | (suy ra)                             | active · revoked (`revokedAt`) · expired (`expiresAt`) | auth.service.ts     |
| `UserAuthToken`              | (suy ra, `purpose="password-reset"`) | valid · used (`usedAt`) · expired                      | auth.service.ts     |
| Phiên luyện gõ (client)      | `SessionStatus`                      | `typing · wrong · correct`                             | useTypingSession.ts |
| Xử lý từ sai                 | `RepeatMode`                         | `none · once · until`                                  | useTypingSession.ts |
| Nguồn dữ liệu vocab (client) | `VocabSource`                        | `api · cache · seed`                                   | vocabApi.ts         |

## 4. Yêu cầu chức năng (FR)

> Mỗi FR: actor + hành vi quan sát được. Nguồn = file code chứng minh.

### 4.1. Luyện gõ từ vựng (Practice)

| Mã        | Yêu cầu                                                                                                                                                             | Trạng thái | Nguồn                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| FR-PRC-01 | Hệ thống **BẮT BUỘC** cho Người học/Khách chọn **chủ đề** và một hay nhiều **cấp độ CEFR** trước khi bắt đầu phiên.                                                 | ✅         | TypingFlow.tsx, SetupMethod.tsx                             |
| FR-PRC-02 | Hệ thống **BẮT BUỘC** hỗ trợ ít nhất 2 mode: **nghĩa VI → gõ EN** (mặc định) và **nghe TTS → gõ EN**.                                                               | ✅         | TypingScreen.tsx, ListenScreen.tsx                          |
| FR-PRC-03 | Engine **BẮT BUỘC** chấm **char-by-char**: mỗi ký tự đích có trạng thái đúng/sai/chưa-gõ/con-trỏ-hiện-tại.                                                          | ✅         | `computeCells` — useTypingSession.ts                        |
| FR-PRC-04 | Engine **BẮT BUỘC** an toàn với **IME tiếng Việt**: không chấm khi đang soạn (composition), chỉ áp giá trị khi `compositionend`; Enter bị bỏ qua khi `isComposing`. | ✅         | `onCompositionStart/End`, `onKeyDown` — useTypingSession.ts |
| FR-PRC-05 | Engine **BẮT BUỘC** chuẩn hóa input về `[a-z'-]` (thường hóa, loại ký tự khác) trước khi so khớp target.                                                            | ✅         | `clean()` — useTypingSession.ts                             |
| FR-PRC-06 | Khi gõ **sai**, hệ thống **BẮT BUỘC** xử lý theo `RepeatMode`: `none` bỏ qua; `once` đẩy lại cuối vòng một lần; `until` đẩy lại mỗi lần sai tới khi đúng.           | ✅         | `finalize()` — useTypingSession.ts                          |
| FR-PRC-07 | Từ gõ sai **BẮT BUỘC** được ghi nhận (không trùng) để tổng kết và cho phép sửa lại trong phiên.                                                                     | ✅         | `wrongWords` — useTypingSession.ts                          |
| FR-PRC-08 | Kết thúc phiên, hệ thống **BẮT BUỘC** hiển thị **tổng kết**: số đúng/sai, độ chính xác (%), WPM, thời lượng, danh sách từ sai.                                      | ✅         | `finishSession`, Summary.tsx                                |
| FR-PRC-09 | Hệ thống **CÓ THỂ** lộ ký tự đích (reveal) tùy mode (mode mặc định M1 không lộ).                                                                                    | ✅         | `reveal` config — useTypingSession.ts                       |

### 4.2. Lấy từ vựng & chủ đề (Vocab/Topic — local-first)

| Mã        | Yêu cầu                                                                                                                                | Trạng thái | Nguồn                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------- |
| FR-VOC-01 | Hệ thống **BẮT BUỘC** lấy từ vựng theo 3 tầng **API → cache IndexedDB → seed offline**, và cho biết nguồn (`api`/`cache`/`seed`).      | ✅         | `fetchVocab` — vocabApi.ts            |
| FR-VOC-02 | API công khai **BẮT BUỘC** trả danh sách từ lọc theo `levels`, `topics`, `limit` (1–100, mặc định 20), `random`.                       | ✅         | vocab.controller.ts, VocabQuerySchema |
| FR-VOC-03 | API công khai **BẮT BUỘC** trả **số lượng** từ khớp bộ lọc (`/vocab/count`).                                                           | ✅         | vocab.controller.ts                   |
| FR-VOC-04 | API công khai **BẮT BUỘC** trả danh sách **chủ đề** kèm số từ mỗi chủ đề.                                                              | ✅         | topics.controller.ts                  |
| FR-VOC-05 | Khi không cấu hình `NEXT_PUBLIC_API_URL` hoặc API lỗi, hệ thống **BẮT BUỘC** vẫn cho luyện gõ bằng cache/seed (không chặn người dùng). | ✅         | vocabApi.ts                           |
| FR-VOC-06 | Hệ thống **NÊN** prewarm API (`/api/health`) để giảm cold start Render.                                                                | ✅         | `warmApi`, ApiWarmer.tsx              |

### 4.3. Xác thực Người học (Auth — User)

Quy tắc validation từ [auth.dto.ts](../../apps/api/src/auth/auth.dto.ts): email ≤ 320 ký tự (chuẩn hóa thường + trim); mật khẩu 12–128 ký tự; displayName 1–120.

| Mã        | Yêu cầu                                                                                                                                                     | Trạng thái | Nguồn                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------- |
| FR-AUT-01 | Người học **BẮT BUỘC** đăng ký bằng email + mật khẩu (≥12 ký tự); email **BẮT BUỘC** duy nhất (chuẩn hóa). Đăng ký thành công tạo phiên đăng nhập ngay.     | ✅         | `registerUser` — auth.service.ts      |
| FR-AUT-02 | Người học **BẮT BUỘC** đăng nhập bằng email + mật khẩu; sai thông tin trả lỗi **không tiết lộ** tài khoản tồn tại hay không.                                | ✅         | `loginUser`/`loginByEmail`            |
| FR-AUT-03 | Hệ thống **BẮT BUỘC** quản phiên bằng **cookie session** (token ngẫu nhiên, lưu DB dạng hash); TTL mặc định **30 ngày** (cấu hình `USER_SESSION_TTL_DAYS`). | ✅         | auth.service.ts                       |
| FR-AUT-04 | Người học **BẮT BUỘC** đăng xuất phiên hiện tại và **đăng xuất tất cả thiết bị** (logout-all).                                                              | ✅         | `logoutUser`, `logoutAllUserSessions` |
| FR-AUT-05 | Người học **BẮT BUỘC** xem & cập nhật hồ sơ (displayName, avatarUrl).                                                                                       | ✅         | `getUserProfile`, `updateUserProfile` |
| FR-AUT-06 | Người học **BẮT BUỘC** đổi mật khẩu; đổi thành công **thu hồi mọi phiên khác** rồi cấp phiên mới cho thiết bị hiện tại.                                     | ✅         | `changeUserPassword`                  |
| FR-AUT-07 | Người học **BẮT BUỘC** yêu cầu **quên mật khẩu**: hệ thống gửi mail chứa link đặt lại; phản hồi **đồng nhất** dù email có tồn tại hay không.                | ✅         | `forgotPassword`, mail.service.ts     |
| FR-AUT-08 | Người học **BẮT BUỘC** đặt lại mật khẩu bằng token; token **dùng một lần**, **hết hạn 2 giờ**; đặt lại thành công thu hồi mọi phiên.                        | ✅         | `resetPassword`                       |
| FR-AUT-09 | Hệ thống **BẮT BUỘC** chặn lạm dụng bằng **rate-limit** theo IP và theo tài khoản cho register/login/forgot/reset.                                          | ✅         | `assertRateLimit` — auth.service.ts   |
| FR-AUT-10 | Mọi thao tác ghi (POST/PATCH/...) **BẮT BUỘC** qua **CSRF double-submit** + kiểm tra Origin/Referer.                                                        | ✅         | `assertCsrf`, CsrfGuard               |

### 4.4. Quản trị (Admin)

| Mã        | Yêu cầu                                                                                                                      | Trạng thái | Nguồn                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| FR-ADM-01 | Admin **BẮT BUỘC** đăng nhập bằng **username** (không phải email) + mật khẩu; phiên TTL mặc định **12 giờ**.                 | ✅         | `loginAdmin`                                                     |
| FR-ADM-02 | Toàn bộ route admin **BẮT BUỘC** trả **404** khi `ADMIN_API_ENABLED` tắt; mặc định **OFF ở production**.                     | ✅         | admin-gate.guard.ts                                              |
| FR-ADM-03 | Admin **BẮT BUỘC** xem **dashboard summary** (số liệu tổng quan).                                                            | ✅         | admin.controller.ts                                              |
| FR-ADM-04 | Admin **BẮT BUỘC** liệt kê / xem chi tiết / cập nhật **người dùng** (gồm đổi `UserStatus`).                                  | ✅         | admin.controller.ts, admin.service.ts                            |
| FR-ADM-05 | Admin **BẮT BUỘC** quản **từ vựng** đầy đủ CRUD (liệt kê có phân trang/tìm kiếm, tạo, sửa, xóa).                             | ✅         | AdminVocabController — vocab.controller.ts                       |
| FR-ADM-06 | Admin **BẮT BUỘC** xem **analytics traffic** theo khoảng ngày (1–90, mặc định 30).                                           | ✅         | AdminTrafficController                                           |
| FR-ADM-07 | Giao diện admin-web **BẮT BUỘC** cung cấp các trang dashboard (overview, users, vocab, topics, analytics) nối với API admin. | 🚧         | apps/admin-web/src/app/dashboard/\* (chưa nối `@keylish/shared`) |

### 4.5. Traffic analytics

| Mã        | Yêu cầu                                                                                                                                   | Trạng thái | Nguồn                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------- |
| FR-TRF-01 | Web user **BẮT BUỘC** ghi nhận **một lượt / phiên trình duyệt** (cờ `sessionStorage`) qua `navigator.sendBeacon` tới `/api/v1/track`.     | ✅         | TrafficBeacon.tsx     |
| FR-TRF-02 | Hệ thống **BẮT BUỘC** đếm **aggregate-on-write theo giờ UTC** (mỗi giờ 1 dòng `TrafficHourly`), chỉ tính khi Origin nằm trong allow-list. | ✅         | traffic.service.ts    |
| FR-TRF-03 | Endpoint track **BẮT BUỘC** luôn trả **204**, không tiết lộ lượt có được đếm hay không.                                                   | ✅         | traffic.controller.ts |

### 4.6. Mail

| Mã        | Yêu cầu                                                                                                                                                                                            | Trạng thái | Nguồn           |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- |
| FR-MAL-01 | Hệ thống **BẮT BUỘC** gửi email đặt lại mật khẩu qua Resend khi đủ cấu hình (`RESEND_API_KEY` + `AUTH_RESET_EMAIL_FROM`); thiếu cấu hình thì **log link (chỉ dev)** và vẫn trả phản hồi đồng nhất. | ✅         | mail.service.ts |

### 4.7. Hệ thống nền (System)

| Mã        | Yêu cầu                                                                                                 | Trạng thái | Nguồn                                      |
| --------- | ------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------ |
| FR-SYS-01 | Hệ thống **BẮT BUỘC** dọn định kỳ phiên hết hạn/thu hồi (giữ 7 ngày để audit) và token đã dùng/hết hạn. | ✅         | `purgeExpired` — auth.service.ts           |
| FR-SYS-02 | Pipeline dataset **BẮT BUỘC** build kho từ từ 2 nguồn mở rồi seed vào Postgres.                         | ✅         | scripts/build-dataset.mjs, scripts/seed.ts |

## 5. Yêu cầu nghiệp vụ (BR)

| Mã    | Quy tắc                                                                                                                 | Nguồn                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| BR-01 | Một từ là duy nhất theo cặp `(en, level)` — `@@unique([en, level])`.                                                    | schema.prisma                         |
| BR-02 | Email/username người dùng & admin **duy nhất** sau chuẩn hóa (`emailNormalized`/`usernameNormalized`).                  | schema.prisma, auth.service.ts        |
| BR-03 | Không tiết lộ sự tồn tại tài khoản: login/forgot phản hồi đồng nhất; login dùng **dummy verify** để cân bằng thời gian. | `absorbDummyVerify` — auth.service.ts |
| BR-04 | Reset token: **một mục đích** (`password-reset`), **dùng một lần** (`usedAt`), hết hạn 2 giờ.                           | auth.service.ts                       |
| BR-05 | Đổi/đặt lại mật khẩu **thu hồi các phiên** đang mở (bảo vệ khi lộ mật khẩu cũ).                                         | auth.service.ts                       |
| BR-06 | Admin **đóng mặc định** ở production (an toàn khi quên cấu hình env).                                                   | admin-gate.guard.ts                   |
| BR-07 | Traffic chỉ đếm khi **Origin hợp lệ**; giữ bảng nhỏ (≤24 dòng/ngày) bằng aggregate-on-write.                            | traffic.service.ts                    |
| BR-08 | IP người dùng **không lưu thô** — chỉ lưu `ipHash`.                                                                     | auth.service.ts                       |

## 6. Yêu cầu phi chức năng (NFR)

| Mã         | Yêu cầu                                                                                                                                                                  | Trạng thái                         | Nguồn                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------ |
| NFR-PER-01 | Hệ thống **NÊN** chịu được cold start Render (free ngủ sau ~15p) bằng prewarm + chờ-API-thức khi nạp từ vựng.                                                            | ✅                                 | `warmApi`, `loadTopicsAwait`               |
| NFR-PER-02 | Bộ đếm traffic **BẮT BUỘC** giữ chi phí lưu trữ không đổi theo lưu lượng (1 dòng/giờ).                                                                                   | ✅                                 | traffic.service.ts                         |
| NFR-SEC-01 | Mật khẩu **BẮT BUỘC** băm bằng **argon2id** (tham số cấu hình được: memory 19456 KiB, iterations 2, parallelism 1 mặc định).                                             | ✅                                 | `hashPassword` — auth.service.ts           |
| NFR-SEC-02 | Token phiên/reset **BẮT BUỘC** lưu dạng **HMAC-SHA256 + pepper**, không lưu token thô; `AUTH_TOKEN_PEPPER` bắt buộc ở prod.                                              | ✅                                 | auth.service.ts, main.ts                   |
| NFR-SEC-03 | Cookie phiên **BẮT BUỘC** `httpOnly`; ở prod dùng tiền tố `__Host-` + `SameSite=None; Secure`; cookie CSRF không httpOnly (double-submit).                               | ✅                                 | auth.service.ts                            |
| NFR-SEC-04 | CORS **BẮT BUỘC** giới hạn theo allow-list origin + `credentials: true`.                                                                                                 | ✅                                 | main.ts                                    |
| NFR-ACC-01 | UI **BẮT BUỘC** đạt tương phản **WCAG AA**; báo đúng/sai bằng **màu + icon + nhãn** (an toàn cho người mù màu); tôn trọng `prefers-reduced-motion`; touch target ≥ h-12. | ✅                                 | design.md §8.9 → `06-ui-ux`                |
| NFR-USA-01 | Giao diện & email **BẮT BUỘC** tiếng Việt; font **Be Vietnam Pro** hỗ trợ đầy đủ dấu.                                                                                    | ✅                                 | design.md §8.2                             |
| NFR-MNT-01 | Validation + type **NÊN** dùng chung Zod (`@keylish/shared`) để tránh lệch hợp đồng giữa API và web.                                                                     | ✅ (api/user-web) / 🚧 (admin-web) | packages/shared, `00-coding-standard` §6.1 |

## 7. Use Case (UC)

> Định dạng rút gọn: Actor · Tiền điều kiện · Luồng chính · Ngoại lệ · Hậu điều kiện · Trace.

### UC-01 — Luyện gõ một phiên (✅)

- **Actor:** Người học / Khách. **Tiền điều kiện:** mở trang luyện gõ.
- **Luồng chính:** chọn chủ đề + cấp độ CEFR + mode → hệ thống nạp từ (API/cache/seed) → gõ char-by-char từng từ → đúng thì sang từ kế, sai thì báo + xử lý theo RepeatMode → kết thúc hiện tổng kết.
- **Ngoại lệ:** API ngủ/lỗi → dùng cache/seed; đang gõ IME → chưa chấm tới khi `compositionend`.
- **Hậu điều kiện:** hiển thị WPM/độ chính xác/từ sai. (Không lưu lịch sử phiên — xem OQ-05.)
- **Trace:** FR-PRC-01..09, FR-VOC-01/05.

### UC-02 — Đăng ký tài khoản (✅)

- **Actor:** Khách. **Tiền điều kiện:** chưa có tài khoản với email đó.
- **Luồng chính:** nhập email + mật khẩu (≥12) (+ displayName) → hệ thống băm mật khẩu, tạo User + identity + phiên → đăng nhập ngay.
- **Ngoại lệ:** email trùng → `409 Conflict`; vượt rate-limit → `429`.
- **Hậu điều kiện:** có phiên đăng nhập (cookie). **Trace:** FR-AUT-01/09/10, BR-02.

### UC-03 — Đăng nhập (✅)

- **Actor:** Người học. **Luồng chính:** nhập email + mật khẩu → xác minh argon2 → tạo phiên.
- **Ngoại lệ:** sai/không tồn tại → `401` thông điệp đồng nhất (dummy verify cân bằng thời gian). **Trace:** FR-AUT-02, BR-03.

### UC-04 — Quên & đặt lại mật khẩu (✅)

- **Actor:** Người học. **Luồng chính:** nhập email → hệ thống tạo reset-token (hết hạn 2h) + gửi mail → người dùng mở link `/reset-password?token=...` → nhập mật khẩu mới → token đánh dấu đã dùng, thu hồi mọi phiên.
- **Ngoại lệ:** email không tồn tại → phản hồi đồng nhất, không gửi; token sai/hết hạn/đã dùng → `401`. **Trace:** FR-AUT-07/08, FR-MAL-01, BR-04/05.

### UC-05 — Admin quản từ vựng (✅ API / 🚧 UI)

- **Actor:** Admin. **Tiền điều kiện:** `ADMIN_API_ENABLED` bật + đã đăng nhập admin.
- **Luồng chính:** liệt kê/tìm kiếm từ (phân trang) → tạo/sửa/xóa từ (kèm CSRF).
- **Ngoại lệ:** admin tắt → `404`; thiếu/sai CSRF → `403`; dữ liệu sai schema → `400`. **Trace:** FR-ADM-02/05, FR-AUT-10.

### UC-06 — Ghi nhận lượt truy cập (✅)

- **Actor:** Hệ thống (kích bởi web user). **Luồng chính:** lần đầu mỗi phiên trình duyệt → `sendBeacon` `/api/v1/track` → đếm vào dòng giờ UTC nếu Origin hợp lệ.
- **Ngoại lệ:** Origin không hợp lệ → không đếm (vẫn trả 204). **Trace:** FR-TRF-01/02/03, BR-07.

## 8. ASSUMPTION / OPEN QUESTION / TBD

- **OQ-05 (ngoài phạm vi V1):** lịch sử/tiến độ phiên luyện gõ có cần **lưu lâu dài** (server hoặc IndexedDB) không? Hiện chỉ tính trong phiên, không persist. README mô tả "dữ liệu phiên lưu IndexedDB" → **lệch nhẹ** (IndexedDB chỉ cache response vocab). Ai quyết: APPROVER.
- **OQ-06 (⬜):** AI feedback + BYOK — đã có khung UI (design.md §8.4-bis, route `app/api/ai/.gitkeep`) nhưng **chưa có logic**. Chỉ ghi nhận, không đặc tả.
- **OQ-07 (⬜):** flashcard/quiz mode — có thư mục `domain/flashcard`, `domain/quiz` rỗng. Chưa đặc tả.
- **OQ-08 (⬜):** OAuth — `AuthProvider` chỉ `PASSWORD`. Mở rộng provider chưa đặc tả.
- TBD: tiêu chí chấp nhận định lượng (vd ngưỡng WPM, thời gian phản hồi API mục tiêu) — đề xuất ở `08-test`.

## 9. Truy vết (tóm tắt)

| Nhóm FR | Module code                                                | UC liên quan        |
| ------- | ---------------------------------------------------------- | ------------------- |
| FR-PRC  | user-web `components/vocab/typing/*`                       | UC-01               |
| FR-VOC  | api `vocab`,`topics` · user-web `infra/vocab`              | UC-01               |
| FR-AUT  | api `auth`                                                 | UC-02, UC-03, UC-04 |
| FR-ADM  | api `admin`,`vocab(admin)`,`traffic(admin)` · admin-web 🚧 | UC-05               |
| FR-TRF  | api `traffic` · user-web `TrafficBeacon`                   | UC-06               |
| FR-MAL  | api `mail`                                                 | UC-04               |
| FR-SYS  | api `auth.purgeExpired` · `scripts/*`                      | —                   |

Ma trận truy vết FR ↔ endpoint ↔ test sẽ hoàn thiện ở `05-api` và `08-test`.
