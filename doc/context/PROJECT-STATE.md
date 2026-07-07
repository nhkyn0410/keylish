# PROJECT-STATE — Trạng thái sống của KeyLish

> File LIVE, giữ LEAN. Đây là nguồn duy nhất cho trạng thái dự án, RISK, OPEN QUESTION và DECISION đang có tác động.
> Cập nhật lần cuối: 2026-06-22 (v0.3.7).

## 0. Current Snapshot

| Mục                     | Trạng thái                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Tình trạng dự án        | **ACTIVE** — tài liệu đang mở để tiếp tục phát triển                                               |
| Nhánh làm việc gần nhất | `feature/kho-tu-vung`                                                                              |
| Trạng thái repo         | Có thay đổi chưa commit; chạy `git status --short --branch` trước khi làm tiếp                     |
| Sản phẩm chính          | Web luyện gõ từ vựng tiếng Anh, local-first                                                        |
| V1 đã có                | Luyện gõ char-by-char, IME-safe, vocab public, auth user, admin API, traffic analytics             |
| V2.1 đang dở            | Kho từ vựng cá nhân: API/UI quản lý đã partial; **FR-PVOC-08** đợt 1 (luyện từ kho qua tách route) đã xong; đợt 2 custom options (T-13) chờ |
| Không mở scope          | AI feedback/BYOK, flashcard/quiz, OAuth ngoài password — deferred theo D-04                        |

## 1. Bắt Đầu Từ Đây

1. Đọc `doc/README.md`, file này, rồi `SDLC/11-tasks.md`.
2. Chạy baseline: `pnpm install`, `pnpm docker:up`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm check`, `pnpm test`.
3. Kiểm tra DB local đã có migration `20260620093000_add_user_vocab_custom_topic`.
4. Nếu tiếp tục V2.1: T-11 (FR-PVOC-08 đợt 1 — tách route) đã APPROVED/READY → code được; OQ-14 (đợt 2 custom options) còn chờ.
5. Nếu chỉ ổn định V1, ưu tiên test engine gõ (R-7/T-03) và CI (T-10).

## 2. Trạng Thái Tài Liệu

| Mã  | Tài liệu                | Trạng thái | Phiên bản | Ghi chú                                          |
| --- | ----------------------- | ---------- | --------- | ------------------------------------------------ |
| —   | `README.md`             | DONE       | —         | Refreshed; khớp as-built                         |
| —   | `doc/README.md`         | DONE       | —         | New; cửa vào tài liệu                            |
| 00  | Coding Standard         | In Review  | 0.2.2     | Thêm hard gate docs-first + approval-before-code |
| 01  | SRS                     | Draft      | 0.2.3     | Kho cá nhân partial; FR-PVOC-08 mở               |
| 02  | HLD                     | Draft      | 0.2.1     | As-built architecture                            |
| 03  | LLD                     | Draft      | 0.2.1     | Module/API/engine detail                         |
| 04  | Database Design         | Draft      | 0.2.4     | `UserVocabEntry`, `customTopicId`                |
| 05  | API Specification       | Draft      | 0.2.4     | 38 endpoint, user vocab partial                  |
| 06  | UI/UX + Design System   | Draft      | 0.1.7     | As-built flow + tách route typing (đợt 1, ADR-020) |
| 07  | Security & Permission   | Draft      | 0.2.3     | UserGuard/CSRF/userId isolation                  |
| 08  | Test Plan & Acceptance  | Draft      | 0.1.3     | Test gap còn cao                                 |
| 09  | Deployment & Operation  | Draft      | 0.1.1     | Docker local, Supabase prod                      |
| 10  | ADR                     | Draft      | 0.2.6     | ADR-019; + ADR-020 tách route typing             |
| 11  | Task Register           | Draft      | 0.3.1     | T-11 đợt 1 APPROVED/READY; T-13 (đợt 2) DEFERRED  |
| 12  | Release Notes           | Draft      | 0.1.3     | Ghi nhận docs refresh + ACTIVE state             |
| —   | `context/DOMAIN-MAP.md` | DONE       | —         | Module/entity/state map                          |
| —   | `context/GLOSSARY.md`   | DONE       | —         | Thuật ngữ                                        |

Quy ước status: Draft → In Review → Approved. Chỉ APPROVER (Nguyễn Hồng Khanh) được chốt Approved.

## 3. RISK / Lệch Đang Mở

| Mã   | Mô tả                                                                                                                           | Mức        | Hướng xử lý                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| R-2  | Comment trong `admin-gate.guard.ts` còn trỏ `doc/v2.1.1-admin-local.md` không tồn tại. README đã sửa, code comment chưa sửa.    | Thấp       | Sửa comment hoặc trỏ `09-deployment.md` khi chạm code admin.      |
| R-5  | Layering user-web chưa sạch; logic gõ còn ở `components/vocab/typing/`.                                                         | Trung bình | T-06: tách pure engine sang `domain/vocab-typing/`.               |
| R-7  | Coverage thấp; engine gõ chưa có unit test, V2.1 thiếu ownership/e2e/typing, user-web/db/shared gần như chưa test.              | Cao        | T-03/T-04/T-05; ưu tiên engine gõ.                                |
| R-9  | `auth.service.ts` lớn, nhiều trách nhiệm.                                                                                       | Thấp       | Refactor sau khi có test auth tốt hơn.                            |
| R-10 | Chưa có pre-commit hook lint/typecheck.                                                                                         | Thấp       | T-09.                                                             |
| R-11 | `admin-web` chưa nối `@keylish/shared`, dễ lệch contract.                                                                       | Trung bình | T-07.                                                             |
| R-13 | Rate-limit đang in-memory, mất khi restart.                                                                                     | Thấp       | T-08 trước khi public rộng.                                       |
| R-14 | Free tier DB: kho cá nhân không phải nút thắt; full catalog/WordForm mới là lever chính.                                        | Thấp       | Theo dõi khi seed full catalog hoặc mở OQ-12.                     |
| R-16 | FR-PVOC-08 đợt 1 (tách route, nút "Luyện..." truyền nguồn) đã xong & verify; còn đợt 2 custom options khi vào play.                                      | Trung bình | Đợt 1 xong (DONE-16). Đợt 2 = T-13, chờ APPROVER chốt OQ-14.  |
| R-17 | Worktree còn thay đổi chưa commit từ các phiên trước.                                                                           | Trung bình | Khi làm tiếp, kiểm tra `git status`, đọc diff trước khi sửa tiếp. |
| R-18 | Swagger/OpenAPI description trong `apps/api/src/main.ts` vẫn ghi "read-only vocabulary API" dù API đã có auth/admin/user-vocab. | Thấp       | T-02: cập nhật description khi chạm API docs/code.                |

Rủi ro đã xử lý trong refresh 2026-06-21: README mô tả API read-only, DB Neon/Supabase lệch, link README cũ, local-first/IndexedDB diễn đạt sai.

## 4. OPEN QUESTION Đang Mở

| Mã    | Mô tả                                                                                              | Ảnh hưởng                             | Ai quyết |
| ----- | -------------------------------------------------------------------------------------------------- | ------------------------------------- | -------- |
| OQ-11 | Cơ chế đề cử từ custom phổ biến lên kho hệ thống, có admin duyệt không?                            | Phạm vi admin/data                    | APPROVER |
| OQ-12 | Khi nào nâng lemmatization lên Mức 2 (`WordForm` từ kaikki, +~35 MB)?                              | Độ chính xác/storage                  | APPROVER |
| OQ-14 | Có gắn cờ "đã chỉnh tuỳ chọn giữa phiên" vào result và deep-link `/typing/play` thêm `seed` không? | Thống kê/chia sẻ phiên                | APPROVER |

## 5. DECISION Đã Chốt

| Mã   | Quyết định                                                                                                             | Ngày       |
| ---- | ---------------------------------------------------------------------------------------------------------------------- | ---------- |
| D-01 | Di chuyển nội dung design/vocab-pipeline vào SDLC; giữ file gốc chỉ trỏ tới SSOT khi cần.                              | 2026-06-15 |
| D-02 | README được phép sửa để khớp as-built; thực hiện trong refresh 2026-06-21.                                             | 2026-06-15 |
| D-03 | V1 không lưu lịch sử/tiến độ phiên luyện gõ; chỉ cache vocab response.                                                 | 2026-06-15 |
| D-04 | AI feedback/BYOK, flashcard/quiz, OAuth ngoài password deferred V2.                                                    | 2026-06-15 |
| D-05 | Giữ layering as-built, nhưng có task tách engine gõ sang domain.                                                       | 2026-06-15 |
| D-06 | `admin-web` local-only; production giữ `ADMIN_API_ENABLED=false`.                                                      | 2026-06-15 |
| D-07 | Auth/admin giữ không version ở V1; chuẩn hóa version khi public/breaking-change kế.                                    | 2026-06-15 |
| D-08 | Kho cá nhân dùng `UserVocabEntry`: tham chiếu `Word` hoặc custom, không copy nguyên từ hệ thống.                       | 2026-06-15 |
| D-09 | Dedup-on-add: exact match tự liên kết; biến thể chỉ gợi ý; unique theo `(userId, wordId)` và `(userId, normalizedEn)`. | 2026-06-15 |
| D-10 | V2.1 scope: kho hệ thống + cá nhân + pick + tự tạo; AI custom hoãn V2.2.                                               | 2026-06-15 |
| D-11 | Lemmatization Mức 1 đặt ở `@keylish/shared`; Mức 2 để dành theo OQ-12.                                                 | 2026-06-15 |
| D-12 | Local/dev DB mặc định là Docker Postgres; production DB trên dashboard; live admin cần env riêng có chủ ý.             | 2026-06-19 |
| D-13 | (V2.1) Tách route luyện gõ `/typing/setup` + `/typing/play` qua session-spec (path=hoạt động, query=nguồn) để mở FR-PVOC-08 — ADR-020. Custom-options lifecycle (pre-commit/in-play matrix/seed) HOÃN sang OQ-14/T-13. | 2026-06-22 |

## 6. Lịch Sử Gần Nhất

| Ngày       | Việc                                                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-22 | **Code FR-PVOC-08 đợt 1 (T-11 → DONE-16)**: tách `/typing` → `/typing/setup` (`SetupFlow`) + `/typing/play` (`PlayFlow`) qua session-spec (`practiceSpec.ts`); play tự nạp kho hệ thống/cá nhân (resolving→ready→play→summary); nút "Luyện bộ này/từ này/kho này" điều hướng `/typing/play?source=…`; xoá `TypingFlow.tsx`. Verify: `pnpm check` 7/7 + preview (redirect, setup 200, play ReadyCard→engine, library→play), 0 console error. Custom options = đợt 2 (T-13). |
| 2026-06-22 | Chốt **đợt 1 tách route** luyện gõ: APPROVER duyệt `/typing/setup` + `/typing/play` qua session-spec; viết **ADR-020** (Accepted), cập nhật `06` §4.6 (chia 2 đợt + lifecycle play tối giản, v0.1.7), `10` v0.2.6, `11` (T-11 → APPROVED/READY, thêm **T-13** đợt 2 DEFERRED, DONE-15). Đóng **OQ-13 → D-13**; **OQ-14** (đợt 2 custom options) còn mở. Docs-only, chưa code.                                                                                            |
| 2026-06-22 | Viết lại `11-tasks` v0.3.0 thành task register: bỏ ma trận/quy trình dài, giữ gate ngắn, thêm bảng chi tiết task đã thực hiện và backlog còn mở.                                    |
| 2026-06-22 | Chuyển `PROJECT-STATE` sang ACTIVE; README/doc entrypoint đổi sang checklist bắt đầu làm việc.                                                                                      |
| 2026-06-22 | Cập nhật `00-coding-standard` v0.2.2 + `AGENTS.md`/`CLAUDE.md`/`doc/README.md`: rule bắt buộc docs-first, chỉ code khi `Approval = APPROVED` và `Doc gate = READY`.                 |
| 2026-06-22 | Viết lại `11-tasks` v0.2.0: thêm rule bắt buộc cập nhật docs liên quan trước code, không code task chưa APPROVED, impact matrix, workflow gate và backlog có `Approval`/`Doc gate`. |
| 2026-06-22 | Chuẩn hoá trạng thái tài liệu: bỏ toàn bộ emoji/icon trạng thái, dùng nhãn chữ `DONE` / `PARTIAL` / `TODO`; Prettier toàn bộ Markdown.                                              |
| 2026-06-21 | Docs refresh: thêm `doc/README.md`, viết lại README as-built, thu gọn PROJECT-STATE, cập nhật pointer docs/task/release note.                                                       |
| 2026-06-20 | Thiết kế lại `06-ui-ux` §4: phân tầng as-built vs planned, route `/typing/setup` + `/typing/play`, lifecycle 4 pha, mở OQ-13/OQ-14.                                                 |
| 2026-06-20 | Bổ sung filter cấp độ/chủ đề cho Kho của tôi; thêm `customTopicId` + migration; docs `01/04/05/06/08/10` cập nhật.                                                                  |
| 2026-06-20 | Sync V2.1 theo code partial; kho cá nhân chuyển từ planned sang partial/as-built; thêm unit test create/list.                                                                       |
| 2026-06-19 | Audit V2.1: schema/shared/API/UI/security đã partial; thiếu FR-PVOC-08, UI sửa/override, coverage.                                                                                  |
