# PROJECT-STATE — Trạng thái sống của bộ tài liệu KeyLish

> File LIVE, giữ LEAN. Nguồn duy nhất cho: trạng thái tài liệu · OPEN QUESTION/RISK đang mở · cửa sổ lịch sử ~5 mục. Cập nhật mỗi khi viết/sửa tài liệu.
> Cập nhật lần cuối: 2026-06-19 (v0.2.10).

## 1. Trạng thái tài liệu SDLC

| Mã  | Tài liệu                 | Trạng thái | Phiên bản | Ghi chú                                                                                |
| --- | ------------------------ | ---------- | --------- | -------------------------------------------------------------------------------------- |
| 00  | Coding Standard          | Draft      | 0.2.1     | Chờ review · +§12 Quy trình, +§13 Quy định trạng thái tài liệu                         |
| 01  | SRS                      | Draft      | 0.2.1     | Chờ review · V2.1 phân bổ vào mục sẵn có (§4.8 FR-PVOC, §7 UC-07/08, §5/§6/§3); gỡ §10 |
| 02  | HLD                      | Draft      | 0.2.1     | deep-review fix (G-4/G-5)                                                              |
| 03  | LLD                      | Draft      | 0.2.1     | deep-review fix (G-4)                                                                  |
| 04  | Database Design          | Draft      | 0.2.2     | +§10 model `UserVocabEntry` (V2.1)                                                     |
| 05  | API Specification        | Draft      | 0.2.2     | +§13 API kho cá nhân (V2.1)                                                            |
| 06  | UI/UX + Design System    | Draft      | 0.1.2     | +§7 UI kho cá nhân (Split — đã build)                                                  |
| 07  | Security & Permission    | Draft      | 0.2.2     | +§21 bảo mật kho cá nhân (V2.1)                                                        |
| 08  | Test Plan & Acceptance   | Draft      | 0.1.1     | G-2/G-3 (10 e2e test); G-4 RISK                                                        |
| 09  | Deployment & Operation   | Draft      | 0.1.1     | tách local/dev Docker DB với production Supabase; thêm DB guard + live admin env riêng |
| 10  | ADR                      | Draft      | 0.2.3     | +ADR-019 (kho cá nhân — tham chiếu); 19 ADR                                            |
| 11  | Task Breakdown           | Draft      | 0.1.1     | fix F-3 (trace T-02/T-03)                                                              |
| 12  | Release Notes            | Draft      | 0.1.1     | G-5 (số chủ đề)                                                                        |
| —   | AGENT.md                 | ✅ Done    | —         | trỏ 00 §12                                                                             |
| —   | context/DOMAIN-MAP.md    | ✅ Done    | —         |                                                                                        |
| —   | context/GLOSSARY.md      | ✅ Done    | —         |                                                                                        |
| —   | context/PROJECT-STATE.md | ✅ Live    | —         | file này                                                                               |

Quy ước status: Draft → (review) → Approved. **Chỉ APPROVER (Nguyễn Hồng Khanh)** được chốt Approved.

## 2. RISK / lệch đang mở (registry chuẩn — single source)

> Mọi doc tham chiếu RISK theo ID ở đây. Không tự đặt ID cục bộ trong từng file.

| Mã   | Mô tả                                                                                                                                                      | Mức              | Hướng xử lý                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------ |
| R-1  | README mô tả API "read-only" — thực tế có auth/admin CRUD/traffic.                                                                                         | Trung bình       | Sửa README (D-02) + task T-01.                                     |
| R-2  | README trỏ `doc/deploy.md`, `doc/v2.1.1`; guard trỏ `doc/v2.1.1-admin-local.md` — không tồn tại.                                                           | Thấp             | `09` thay deploy.md; sửa README (D-02).                            |
| R-3  | `design.md` chỉ đánh số `## 8.x`, thiếu mục 1–7.                                                                                                           | Thấp             | Đã chuẩn hóa lại khi nhập `06`.                                    |
| R-4  | README ghi DB "(Neon)" vs "(Supabase)".                                                                                                                    | Thấp             | SDLC dùng Supabase (prod); sửa README (D-02).                      |
| R-5  | Layering user-web phần lớn scaffold rỗng; logic gõ ở `components/`.                                                                                        | Trung bình       | Task refactor T-06 (D-05).                                         |
| R-6  | Versioning không đồng nhất (auth/admin không `/v1`).                                                                                                       | Thấp (chấp nhận) | D-07: giữ as-built, version khi public.                            |
| R-7  | Coverage test thấp (`--passWithNoTests`) — gồm engine gõ (vùng dễ lỗi) + user-web/db/shared chưa test.                                                     | Cao              | Vùng MANDATORY `08`; task T-03/T-04/T-05.                          |
| R-8  | README ghi "dữ liệu phiên lưu IndexedDB" — thực tế chỉ cache vocab response.                                                                               | Thấp             | Làm rõ `01` (D-03); sửa README (D-02).                             |
| R-9  | `auth.service.ts` ~963 dòng đảm nhiều trách nhiệm (SRP).                                                                                                   | Thấp             | Refactor tùy chọn (chưa có task bắt buộc).                         |
| R-10 | Chưa có hook pre-commit lint/typecheck.                                                                                                                    | Thấp             | Task T-09.                                                         |
| R-11 | `admin-web` chưa nối `@keylish/shared` — nguy cơ lệch contract.                                                                                            | Trung bình       | Task T-07.                                                         |
| R-12 | `seed.ts` fallback trỏ `apps/web/...` (sai) thay vì `apps/user-web/...`.                                                                                   | Thấp             | ✅ **Đã sửa** trong phiên (G-6, 2026-06-15).                       |
| R-13 | Rate-limit in-memory (mất khi restart).                                                                                                                    | Thấp             | Task T-08.                                                         |
| R-14 | Free tier 0.5 GB: kho cá nhân **không** phải nút thắt (~0.1 MB/user; ~3–4k user ở 200 từ). Lever thật là kích thước kho hệ thống (Mức-2 WordForm +~35 MB). | Thấp             | Theo dõi khi seed full catalog; trim catalog nếu chật (`09`/`04`). |

## 3. OPEN QUESTION đang mở

| Mã    | Mô tả                                                                        | Ảnh hưởng              | Ai quyết |
| ----- | ---------------------------------------------------------------------------- | ---------------------- | -------- |
| OQ-11 | (V2.1) Cơ chế "đề cử" từ custom phổ biến lên kho hệ thống (admin duyệt)?     | Phạm vi admin/data     | APPROVER |
| OQ-12 | (V2.1) Nâng lemmatization lên Mức 2 (`WordForm` từ kaikki, +~35 MB) khi nào? | Độ chính xác / storage | APPROVER |

## 4. DECISION đã chốt

| Mã   | Quyết định                                                                                                                                                                                                 | Ngày       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| D-01 | Di chuyển nội dung design.md/vocab-pipeline.md vào SDLC (OQ-01); giữ file gốc trỏ tới.                                                                                                                     | 2026-06-15 |
| D-02 | Được phép sửa README để khớp as-built (R-1/2/4/8); thực hiện **sau khi** có `05`/`09`.                                                                                                                     | 2026-06-15 |
| D-03 | V1 **không** lưu lịch sử/tiến độ phiên luyện gõ → ngoài phạm vi V1; sửa README (R-8).                                                                                                                      | 2026-06-15 |
| D-04 | AI feedback+BYOK, flashcard/quiz, OAuth ngoài PASSWORD → deferred V2.                                                                                                                                      | 2026-06-15 |
| D-05 | Giữ layering as-built; ghi task refactor "tách logic engine → `domain/vocab-typing`" (T-06).                                                                                                               | 2026-06-15 |
| D-06 | (OQ-10) admin-web **local-only, không deploy**; prod giữ `ADMIN_API_ENABLED=false`.                                                                                                                        | 2026-06-15 |
| D-07 | (OQ-09) Auth/admin **giữ không version** ở V1; chuẩn hóa `/api/v1/` khi API public.                                                                                                                        | 2026-06-15 |
| D-08 | (V2.1) Kho cá nhân = **mô hình tham chiếu + custom**: `UserVocabEntry` trỏ `Word` hệ thống (`wordId`) hoặc lưu custom (`customEn/Vi/...`); **không copy** nguyên từ. `Word` giữ là kho hệ thống ownerless. | 2026-06-15 |
| D-09 | (V2.1) Dedup khi add: khớp chính xác `en` → **tự liên kết + báo**; khớp biến thể → **gợi ý** từ gốc (KHÔNG tự gộp); không khớp → custom. Unique `(userId, wordId)` + `(userId, normalizedEn)`.             | 2026-06-15 |
| D-10 | (V2.1) Phạm vi = kho hệ thống + cá nhân + pick + tự tạo. **AI custom hoãn V2.2** (vẫn thuộc D-04); schema chừa `source` ∈ `system`/`custom`/`ai`.                                                          | 2026-06-15 |
| D-11 | (V2.1) Lemmatization **Mức 1** (luật đuôi + ~200 bất quy tắc) ở `@keylish/shared`, chỉ dùng cho _gợi ý_. Mức 2 (bảng `WordForm` từ kaikki) để dành — mở OQ khi cần độ chính xác cao.                       | 2026-06-15 |

## 5. Lịch sử (cửa sổ trượt ~5 mục)

| Ngày       | Việc                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-19 | Tách quy trình local/dev khỏi production DB: local mặc định dùng Docker Postgres; production env trên dashboard; thêm guard chặn remote DB khi dev/migrate/seed; bổ sung live admin local-only qua env riêng.                                                                                                                                                                                                                             |
| 2026-06-15 | Sửa Sidebar "Kho từ vựng" → `/kho-tu-vung` (route thật, bỏ dang-phat-trien); thêm `FeedbackButton` (nút góc phải-dưới → panel dock góc, không backdrop, kèm mascot; lưu localStorage + mailto nếu có `NEXT_PUBLIC_FEEDBACK_EMAIL`). Verify bằng preview (typecheck + screenshot).                                                                                                                                                         |
| 2026-06-15 | **Phase ④ V2.1 (UI kho cá nhân)**: build `MyVocabSplit` (xem/tìm/xóa kho cá nhân) + form "Tạo từ mới" (dedup → linked/created + dialog gợi ý biến thể FR-PVOC-05) + tabs "Kho hệ thống / Kho của tôi"; API client `fetchUserVocab`/`createUserVocab`/`deleteUserVocab`. typecheck pass; lint sạch (file mới).                                                                                                                             |
| 2026-06-15 | **Phase ④ V2.1 (code backend)**: schema `UserVocabEntry` + enum + migration `20260616090000_add_user_vocab_entry`; lemmatize Mức 1 + Zod DTO ở `@keylish/shared`; module API `uservocab` (list/pick/create+dedup/update/delete, cô lập userId); wire nút "Thêm vào kho" của UI Split. **Verify**: prisma generate + shared build + typecheck (api & user-web) + 17 api test **pass**. Còn lại: apply migration lên DB chạy, test Phase ⑤. |
| 2026-06-15 | **Phase ③ V2.1**: thiết kế 5 doc — ADR-019 (`10`), model `UserVocabEntry` (`04` §10), API kho cá nhân (`05` §13), UI Split (`06` §7), bảo mật cô lập (`07` §21).                                                                                                                                                                                                                                                                          |
| 2026-06-15 | Tạo `CLAUDE.md` + `AGENTS.md` (root); hoàn thiện `01` (gộp V2.1 vào mục sẵn có, gỡ §10); **build UI C·Split** kho từ vựng (`/kho-tu-vung`, `VocabLibrarySplit`) từ bundle Claude Design — typecheck pass. **Phase ③ docs (ADR-019/04/05/06/07) còn lại.**                                                                                                                                                                                 |
| 2026-06-15 | **Phase ② V2.1**: viết yêu cầu vào `01-srs` §10 (FR-PVOC-01..10, BR-09..11, NFR-PER-03/SEC-05, UC-07/08); mở OQ-11/OQ-12; cập nhật §8 OQ đã chốt.                                                                                                                                                                                                                                                                                         |
| 2026-06-15 | **Phase ① V2.1** (kho từ vựng hệ thống + cá nhân): chốt D-08 (mô hình tham chiếu), D-09 (dedup + gợi ý biến thể), D-10 (phạm vi, AI hoãn V2.2), D-11 (lemmatization Mức 1).                                                                                                                                                                                                                                                               |
| 2026-06-15 | Deep-review 02/03/06/08/09/10/12 đối chiếu code: xác nhận độ trung thực cao (line counts, practiceSettings, TrafficBeacon, e2e, seed batch khớp).                                                                                                                                                                                                                                                                                         |
| 2026-06-15 | Sửa G-1 (code-evidence 10-adr), G-2/G-3 (08 test count + typo), G-5 (~52% → ASSUMPTION ở 02/12), G-7 (nhãn ⬜ ở 06).                                                                                                                                                                                                                                                                                                                      |
| 2026-06-15 | G-4: gom RISK ID về registry chuẩn (R-9..R-13); 02/03/08 dùng ID nhất quán.                                                                                                                                                                                                                                                                                                                                                               |
| 2026-06-15 | G-6: **sửa code** `seed.ts` (apps/web → apps/user-web) — R-12 đóng.                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-06-15 | Chốt D-06 (OQ-10) + D-07 (OQ-09) → đóng toàn bộ OQ.                                                                                                                                                                                                                                                                                                                                                                                       |
