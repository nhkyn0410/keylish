# GLOSSARY — Thuật ngữ dự án KeyLish

> Mọi thuật ngữ entity/state/domain. Tên giữ nguyên theo Prisma model, code, hoặc quy ước.

## Entity (Prisma model)

| Thuật ngữ | Mô tả |
|---|---|
| `Topic` | Chủ đề từ vựng (vd "Giao tiếp", "Du lịch"). Có `slug` duy nhất. |
| `Word` | Một từ tiếng Anh kèm nghĩa VI, level CEFR, IPA, ví dụ. Duy nhất theo `(en, level)`. |
| `User` | Người học có tài khoản (email + mật khẩu). |
| `Admin` | Quản trị viên nội dung (username + mật khẩu). |
| `UserIdentity` | Thông tin xác thực của User theo provider (hiện chỉ PASSWORD). |
| `AdminIdentity` | Thông tin xác thực của Admin. |
| `UserSession` | Phiên đăng nhập user (cookie token hash, có hạn, có thể thu hồi). |
| `AdminSession` | Phiên đăng nhập admin. |
| `UserAuthToken` | Token tác vụ đặc biệt (vd reset password). Có `purpose` + `usedAt`. |
| `TrafficHourly` | Lượt xem trang gộp theo giờ UTC (1 dòng/giờ). |

## State / Enum

| Thuật ngữ | Mô tả |
|---|---|
| `CefrLevel` | Khung tham chiếu châu Âu A1→C2. `Word.level` nullable. |
| `UserStatus` | Trạng thái tài khoản user: `ACTIVE`, `DISABLED`, `DELETED`. |
| `AuthProvider` | Nhà cung cấp xác thực: hiện chỉ `PASSWORD`. OAuth ⬜. |
| `SessionStatus` | Trạng thái từ trong phiên gõ: `typing` (đang gõ), `wrong` (sai), `correct` (đúng). |
| `RepeatMode` | Cách xử lý từ sai: `none` (bỏ qua), `once` (1 lần cuối vòng), `until` (đến khi đúng). |
| `VocabSource` | Nguồn dữ liệu từ vựng: `api` (NestJS), `cache` (IndexedDB), `seed` (offline). |

## Domain thuật ngữ

| Thuật ngữ | Mô tả |
|---|---|
| **KeyLish** | Tên dự án — ghép "Key" (phím) + "English" (tiếng Anh). |
| **CEFR** | Common European Framework of Reference for Languages — A1 (cơ bản) đến C2 (thông thạo). |
| **IME** | Input Method Editor — bộ gõ, đặc biệt là bộ gõ tiếng Việt. Engine gõ phải an toàn với IME (chờ `compositionend`). |
| **TTS** | Text-To-Speech — giọng đọc trình duyệt (Web Speech API). |
| **CSRF** | Cross-Site Request Forgery — phòng bằng double-submit cookie + kiểm tra Origin. |
| **char-by-char** | Cơ chế chấm từng ký tự khi gõ, không chờ gõ xong cả từ. |
| **Focus Zone** | Vùng đọc/gõ tĩnh lặng (không xoay, không noise) — design system ngoại lệ. |
| **Neo-brutalism** | Phong cách thiết kế: viền đen dày, hard shadow, keycap push effect. |
| **local-first** | Ưu tiên dữ liệu local (IndexedDB, seed offline), API là optional. |
| **aggregate-on-write** | Gộp dữ liệu ngay khi ghi (traffic: 1 dòng/giờ), không lưu raw events. |
| **pepper** | Bí mật dùng HMAC-SHA256 trước khi hash token session/reset. Khác salt (salt do argon2 tự sinh). |
| **Cold start** | Render free tier ngủ sau ~15p không request; lần request đầu chậm. |

## Tên khác / Đồng nghĩa tránh nhầm

| Tên chính thức | Không dùng |
|---|---|
| `user-web` | frontend, web, client (mơ hồ) |
| `api` | backend, server (có thể gây nhầm với Next.js server) |
| `admin-web` | admin panel, admin UI (chính xác: admin-web) |
| `@keylish/shared` | schemas, types |
| `@keylish/db` | database layer, prisma package |
