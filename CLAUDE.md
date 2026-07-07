# CLAUDE.md — KeyLish

Hướng dẫn cho Claude khi làm việc trên KeyLish — cả **tài liệu** lẫn **code**.
DOC_LANG = Tiếng Việt · CODE_ID = English · APPROVER = **Nguyễn Hồng Khanh** (người duy nhất chốt `Approved`).

## Dự án

KeyLish — web học từ vựng tiếng Anh qua hành động **gõ phím** (char-by-char, an toàn IME tiếng Việt).
Local-first: dữ liệu từ vựng lấy theo 3 tầng **API → cache IndexedDB → seed offline**. Có auth người học (cookie session tự xây), bề mặt admin nội bộ (local-only), traffic analytics. V2.1 kho từ vựng cá nhân đã partial, còn thiếu FR-PVOC-08.

## Monorepo (pnpm 10 + Turborepo 2.9)

| Workspace         | Vai trò                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| `apps/api`        | NestJS 11 — auth, vocab, admin, traffic, mail, health                         |
| `apps/user-web`   | Next.js 16 + React 19 — giao diện luyện gõ (local-first)                      |
| `apps/admin-web`  | Next.js + Ant Design — admin panel (PARTIAL local-only)                       |
| `packages/db`     | Prisma 7 — schema, client, migrations                                         |
| `packages/shared` | Zod 4 — schema/type dùng chung                                                |
| `scripts/`        | pipeline dataset (`build-dataset.mjs`, `build-vocab.mjs`, `vocab-shared.mjs`) |

## Lệnh hay dùng

```bash
pnpm install
pnpm docker:up && pnpm db:generate && pnpm db:migrate   # DB local
pnpm dev:api        # 3000   ·   pnpm dev:user-web  # 3001   ·   pnpm dev:admin-web # 3002
pnpm check          # lint + typecheck (chạy trước commit)
pnpm test           # Vitest + Supertest
pnpm db:studio      # Prisma Studio
```

## Hai loại công việc

### A. Tài liệu (bộ SDLC ở `doc/`)

- **Cửa vào docs**: `doc/README.md`.
- **Điều hướng cho agent**: `doc/AGENT.md` (đọc gì khi nào).
- **Trạng thái sống + RISK/OQ/DECISION**: `doc/context/PROJECT-STATE.md` — **SINGLE SOURCE OF TRUTH**.
- **Tên entity/module/state**: `doc/context/DOMAIN-MAP.md` + `GLOSSARY.md`.
- **SSOT theo mối quan tâm, KHÔNG trùng lặp**: yêu cầu→`01-srs` · quyết định công nghệ→`10-adr` · tên→DOMAIN-MAP/GLOSSARY · trạng thái/RISK/OQ→PROJECT-STATE.
- Mỗi tài liệu mở đầu bằng §1.1 Metadata + §1.2 Lịch sử. Vòng đời trạng thái **Draft → In Review → Approved** (xem `00-coding-standard` §13; chỉ APPROVER chốt Approved).
- Sửa tài liệu → **bump §1.2 + cập nhật PROJECT-STATE**. KHÔNG tạo bản song song, KHÔNG dán lại toàn bộ file trong chat.
- MODE B (as-built): chỉ viết điều **suy ra được từ code**; còn lại đánh `TBD`/`ASSUMPTION`/`OPEN QUESTION`/`RISK`. RISK ID tập trung ở PROJECT-STATE §2 (đừng đặt ID cục bộ trong từng file).

### B. Code

- Theo **`AGENTS.md`** (boundary, style, test, lệnh) + `doc/SDLC/00-coding-standard.md`.
- Quy trình phát triển tính năng (Zero → Release, 8 phase có gate): `00-coding-standard` **§12**.

## Ranh giới (áp dụng cả doc lẫn code)

- **Zod** là nguồn validation duy nhất; controller **mỏng**; **KHÔNG** gọi vendor SDK trong tầng domain; **KHÔNG** log token/password/OTP/PII (IP lưu hash).
- Truy cập DB **chỉ** qua `DatabaseService` (Prisma). Đổi schema → **luôn** kèm migration + cập nhật `04-database`.
- **KHÔNG commit thẳng `master`** — dùng nhánh `feature/*`.
- Không mở scope mới ngoài task đã được duyệt; trước khi làm tiếp bắt đầu từ `doc/context/PROJECT-STATE.md` §0–§1 và `doc/SDLC/11-tasks.md`.
- **Task gate bắt buộc**: đọc `doc/SDLC/11-tasks.md`; cập nhật docs liên quan trước khi code; chỉ sửa source khi `Approval = APPROVED` và `Doc gate = READY` (hoặc `N/A` có lý do rõ).
- Tính năng V2 (AI/flashcard/quiz/OAuth) đang **deferred** (D-04) — mở OQ + APPROVER duyệt mở rộng phạm vi **trước khi** code.

## Pointers

- Quy ước code chi tiết → **`AGENTS.md`**
- Điều hướng tài liệu → `doc/README.md`, rồi `doc/AGENT.md`
- Quy trình phát triển → `doc/SDLC/00-coding-standard.md` §12
