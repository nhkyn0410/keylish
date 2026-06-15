# AGENT.md — Hướng dẫn đọc tài liệu trong `doc/`

> File này dành cho AI agent hoặc người mới tiếp cận bộ tài liệu KeyLish. Không phải tài liệu thiết kế — đây là **bản đồ chỉ đường** (roadmap map).

## Khi nào đọc file nào

| Bạn muốn | Đọc |
|---|---|
| Hiểu nhanh dự án, actor, tính năng V1/V2 | `context/PROJECT-STATE.md` → `01-srs.md` §2 |
| Biết stack, coding convention, ranh giới | `00-coding-standard.md` |
| Quy trình phát triển tính năng (zero→release) | `00-coding-standard.md` §12 |
| Hiểu kiến trúc monorepo, luồng dữ liệu | `02-hld.md` |
| Đi sâu module API, engine gõ | `03-lld.md` |
| Xem ERD, Prisma schema, pipeline từ vựng | `04-database.md` |
| Tra endpoint, request/response, auth yêu cầu | `05-api.md` |
| Xem design system neo-brutalism, UI flow | `06-ui-ux.md` |
| Hiểu auth tự xây, session, CSRF, rate-limit | `07-security.md` |
| Xem test plan, vùng mandatory, coverage | `08-test.md` |
| Xem deploy Vercel/Render/Supabase, env | `09-deployment.md` |
| Tra quyết định stack (vì sao chọn NestJS/Prisma/…) | `10-adr.md` |
| Xem task còn lại, priority, DoD | `11-tasks.md` |
| Xem changelog các phiên bản | `12-release.md` |
| Tra tên entity/module/state chuẩn hóa | `context/DOMAIN-MAP.md` + `context/GLOSSARY.md` |
| Trạng thái LIVE của bộ tài liệu | `context/PROJECT-STATE.md` |

## Nguyên tắc đọc

1. **SINGLE SOURCE OF TRUTH**: mỗi loại thông tin chỉ ở một file. Nếu thấy trùng — kiểm tra PROJECT-STATE > RISK.
2. **Traceability**: mọi FR trace về code; mọi quyết định stack trace 1 ADR (file `10-adr.md`).
3. **Status nhãn**: ✅ Đã có (as-built) · 🚧 Đang làm/khung · ⬜ Chưa làm.
4. **Từ khóa**: BẮT BUỘC (shall) · NÊN (should) · CÓ THỂ (may) — theo ISO 29148.
5. **Code ID = English**, **Doc = Tiếng Việt**.

## Ranh giới

- Codebase thật ở `C:\Code\KeyLish`. Tài liệu này mô tả **as-built** — nếu code lệch tài liệu, cập nhật tài liệu (hoặc ghi RISK).
- Mọi thay đổi tài liệu: bump §1.2 + cập nhật PROJECT-STATE. Chỉ APPROVER (Nguyễn Hồng Khanh) chốt Approved.
