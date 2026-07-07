# KeyLish Docs — Bản đồ tài liệu

> File này là cửa vào đầu tiên để đọc tài liệu KeyLish mà không bị lạc trong toàn bộ SDLC.

## Đọc nhanh trong 10 phút

1. `context/PROJECT-STATE.md` — trạng thái sống: current snapshot, việc còn mở, risk/OQ.
2. `../README.md` — cách chạy repo, stack, bề mặt tính năng hiện có.
3. `SDLC/11-tasks.md` — backlog còn lại nếu muốn tiếp tục.
4. `SDLC/01-srs.md` §4.8 và `SDLC/06-ui-ux.md` §4.6 — phần V2.1 đang dở: kho cá nhân + luyện gõ theo nguồn cá nhân.

## Single Source Of Truth

| Chủ đề                               | File chính                 | Ghi chú                                      |
| ------------------------------------ | -------------------------- | -------------------------------------------- |
| Trạng thái dự án, risk, OQ, decision | `context/PROJECT-STATE.md` | Đọc trước mọi tài liệu khác                  |
| Yêu cầu chức năng/nghiệp vụ          | `SDLC/01-srs.md`           | Chỉ ghi as-built hoặc planned có nhãn rõ     |
| Kiến trúc tổng quan                  | `SDLC/02-hld.md`           | Monorepo, request flow, local-first          |
| Thiết kế chi tiết module             | `SDLC/03-lld.md`           | API service, engine gõ, module flow          |
| Database, Prisma, migration, seed    | `SDLC/04-database.md`      | Đổi schema phải cập nhật file này            |
| API contract                         | `SDLC/05-api.md`           | Route map, guard, request/response           |
| UI/UX, flow, design system           | `SDLC/06-ui-ux.md`         | Có phân biệt as-built và planned             |
| Security/auth/session/CSRF           | `SDLC/07-security.md`      | Không log PII/token/password                 |
| Test plan và acceptance              | `SDLC/08-test.md`          | Vùng mandatory và coverage gap               |
| Deployment/env                       | `SDLC/09-deployment.md`    | Local Docker DB, prod Supabase/Render/Vercel |
| ADR                                  | `SDLC/10-adr.md`           | Quyết định kiến trúc, lý do                  |
| Backlog                              | `SDLC/11-tasks.md`         | Việc còn lại khi làm tiếp                    |
| Release/changelog                    | `SDLC/12-release.md`       | Ghi nhận phát hành                           |
| Module/entity/state map              | `context/DOMAIN-MAP.md`    | Tra tên chuẩn                                |
| Thuật ngữ                            | `context/GLOSSARY.md`      | Tra nghĩa thuật ngữ                          |

## Quy ước trạng thái

| Nhãn    | Nghĩa                                  |
| ------- | -------------------------------------- |
| DONE    | Đã có trong code hoặc tài liệu đã xong |
| PARTIAL | Đang làm / khung đã có / partial       |
| TODO    | Chưa làm                               |

Không dùng emoji/icon làm trạng thái trong tài liệu. Khi cần thể hiện tiến độ, dùng đúng các nhãn chữ ở bảng này.

## Khi bắt đầu làm việc

1. Chạy `git status --short --branch` để xem worktree còn dở.
2. Đọc `context/PROJECT-STATE.md` §0–§4.
3. Chạy `pnpm install`, `pnpm docker:up`, `pnpm db:generate`, `pnpm db:migrate`.
4. Chạy `pnpm check` và `pnpm test` để lấy baseline mới.
5. Chọn task tiếp theo trong `SDLC/11-tasks.md`; chỉ sửa source khi task có `Approval = APPROVED` và `Doc gate = READY`.

## Rule trước khi code

- Bắt buộc đọc `SDLC/11-tasks.md` trước khi sửa source code.
- Task phải có `Approval = APPROVED`.
- Docs liên quan phải được cập nhật trước và có `Doc gate = READY`.
- Nếu `Doc gate = N/A`, phải có lý do rõ trong bảng task.
- Nếu chưa đủ gate, chỉ được phân tích, mở OQ/RISK, hoặc cập nhật tài liệu; không sửa source code.

## Nguyên tắc khi sửa docs

- Không tạo bản song song như `*-new.md`, `*-final.md`; sửa đúng file SSOT.
- Mỗi thay đổi SDLC cần bump metadata/lịch sử trong chính file đó và cập nhật `context/PROJECT-STATE.md`.
- Nội dung không chắc từ code thì ghi `ASSUMPTION`, `OPEN QUESTION`, hoặc `RISK`.
- Risk/OQ dùng ID ở `context/PROJECT-STATE.md`; không tự đặt registry riêng trong từng file.
