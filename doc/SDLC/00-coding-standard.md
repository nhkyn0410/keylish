# 00 — Quy chuẩn lập trình viên (Coding Standard)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường      | Giá trị                                      |
| ----------- | -------------------------------------------- |
| Tên         | Quy chuẩn lập trình viên (Coding Standard)   |
| Mã tài liệu | `00-coding-standard`                         |
| Dự án       | KeyLish                                      |
| Phiên bản   | 0.2.2                                        |
| Trạng thái  | In Review                                    |
| Người viết  | AI Agent (soạn thảo SDLC), Nguyễn Hồng Khanh |
| Người duyệt | Nguyễn Hồng Khanh                            |
| Ngày tạo    | 2026-06-15                                   |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật              | Nội dung                                                                                               |
| --------- | ---------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| 0.1.0     | 2026-06-15 | AI Agent                    | Bản Draft đầu tiên — tài liệu hóa as-built từ code.                                                    |
| 0.2.0     | 2026-06-15 | AI Agent                    | Thêm §12 Quy trình phát triển tính năng (Zero→Release).                                                |
| 0.2.1     | 2026-06-15 | AI Agent, Nguyễn Hồng Khanh | Thêm §13 Quy định trạng thái tài liệu (vòng đời Draft → In Review → Approved → Superseded/Deprecated). |
| 0.2.2     | 2026-06-22 | AI Agent                    | Thêm hard gate docs-first + approval-before-code: task phải APPROVED và Doc gate READY trước khi code. |

### 1.3. Mục đích & phạm vi

Tài liệu này mô tả **quy chuẩn kỹ thuật as-built** của monorepo KeyLish: stack, cấu trúc workspace, code style, và các **ranh giới kiến trúc (boundary)** phải tôn trọng khi phát triển. Nội dung được rút trực tiếp từ code (MODE B — reverse-engineer), không phải đề xuất lý tưởng hóa.

- Lý do **vì sao** chọn từng công nghệ → xem `10-adr` (sẽ viết). Tài liệu này chỉ mô tả **hiện trạng** và quy ước.
- Thuật ngữ chuẩn hóa (entity, state, module) → xem `context/GLOSSARY.md` và `context/DOMAIN-MAP.md`.
- Nhãn hiện trạng dùng trong toàn bộ SDLC: `DONE` = đã có (as-built); `PARTIAL` = đang làm / khung; `TODO` = chưa làm. Không dùng icon/emoji làm trạng thái.

## 2. Stack công nghệ (as-built)

Phiên bản đọc từ `package.json` các workspace (dấu `^` giữ nguyên như khai báo).

| Lớp                | Công nghệ                                 | Phiên bản (khai báo)                         | Nguồn                                                      | Trạng thái |
| ------------------ | ----------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- | ---------- |
| Monorepo           | pnpm                                      | `10.27.0` (`packageManager`)                 | [package.json](../../package.json)                         | DONE       |
| Build orchestrator | Turborepo                                 | `^2.9.17`                                    | [turbo.json](../../turbo.json)                             | DONE       |
| Ngôn ngữ           | TypeScript                                | `^6.0.3`                                     | [package.json](../../package.json)                         | DONE       |
| Runtime            | Node.js                                   | 20+ (dev), `22.16.0` (prod Render)           | README · [render.yaml](../../render.yaml)                  | DONE       |
| Backend            | NestJS + Express                          | `^11.1.9`                                    | [apps/api/package.json](../../apps/api/package.json)       | DONE       |
| Validation         | Zod                                       | `^4.1.13`                                    | [apps/api/package.json](../../apps/api/package.json)       | DONE       |
| OpenAPI            | `@nestjs/swagger` + `nestjs-zod`          | `^11.2.3` / `^5.0.1`                         | [apps/api/package.json](../../apps/api/package.json)       | DONE       |
| Mật khẩu           | `argon2`                                  | `^0.44.0`                                    | [apps/api/package.json](../../apps/api/package.json)       | DONE       |
| Mail               | Resend (REST qua `fetch`, không SDK)      | —                                            | [mail.service.ts](../../apps/api/src/mail/mail.service.ts) | DONE       |
| Web user           | Next.js (App Router) + React              | Next 16 / React 19                           | [apps/user-web](../../apps/user-web)                       | DONE       |
| Web user — UI      | Tailwind CSS 4 · lucide-react · driver.js | —                                            | [apps/user-web](../../apps/user-web)                       | DONE       |
| Web admin          | Next.js + React + Ant Design              | Next 16 / AntD 6                             | [apps/admin-web](../../apps/admin-web)                     | PARTIAL    |
| ORM                | Prisma (driver adapter `pg`)              | Prisma 7                                     | [packages/db](../../packages/db)                           | DONE       |
| CSDL               | PostgreSQL                                | Docker `postgres:16` (dev) · Supabase (prod) | README · [render.yaml](../../render.yaml)                  | DONE       |
| Shared             | Zod schemas/types                         | `@keylish/shared`                            | [packages/shared/src](../../packages/shared/src)           | DONE       |
| Test               | Vitest + Supertest                        | Vitest `^4.0.15`                             | [apps/api/package.json](../../apps/api/package.json)       | DONE       |
| Lint/format        | ESLint + Prettier                         | ESLint `^10.4.1` / Prettier `^3.8.4`         | [package.json](../../package.json)                         | DONE       |
| Tooling            | tsup · tsx · sharp                        | —                                            | [package.json](../../package.json)                         | DONE       |

> RISK (R-4): README ghi CSDL "(Neon)" ở bảng stack nhưng "(Supabase)" ở bảng deploy; `render.yaml`/PHẦN 0 xác nhận **Supabase** cho prod. SDLC dùng **Supabase (prod) / postgres:16 Docker (dev)**. Ghi nhận tại `context/PROJECT-STATE.md`.

## 3. Cấu trúc monorepo (5 workspace)

`pnpm-workspace.yaml` khai báo `apps/*` + `packages/*` → **5 workspace**:

| Workspace         | Package              | Vai trò                                                                    | Trạng thái |
| ----------------- | -------------------- | -------------------------------------------------------------------------- | ---------- |
| `apps/api`        | `@keylish/api`       | NestJS API (vocab read, auth, admin, traffic, mail, health) + scripts seed | DONE       |
| `apps/user-web`   | `@keylish/user-web`  | Web học từ vựng (luyện gõ)                                                 | DONE       |
| `apps/admin-web`  | `@keylish/admin-web` | Admin panel (V2)                                                           | PARTIAL    |
| `packages/db`     | `@keylish/db`        | Prisma schema, client, migrations                                          | DONE       |
| `packages/shared` | `@keylish/shared`    | Zod schema/type dùng chung                                                 | DONE       |

- Pipeline dataset (`scripts/build-dataset.mjs`, `build-vocab.mjs`, `vocab-shared.mjs`) nằm ở **`scripts/` gốc repo**, gọi qua `pnpm --filter @keylish/api build-dataset` ([apps/api/package.json](../../apps/api/package.json)). Chi tiết → `04-database`.
- Quy ước package: tên `@keylish/*`; phụ thuộc nội bộ qua `workspace:*`.
- Build graph: `turbo.json` định nghĩa `build`/`dev`/`lint`/`typecheck`/`test`; `typecheck`/`test`/`build` phụ thuộc `^build` (build upstream trước).

## 4. TypeScript & quy ước ngôn ngữ

Cấu hình gốc: [tsconfig.base.json](../../tsconfig.base.json).

- `strict: true` — **BẮT BUỘC**. Không tắt strict ở workspace con.
- `target`/`lib`: `ES2022`; `moduleResolution: "Bundler"`; `esModuleInterop`, `resolveJsonModule` bật.
- `forceConsistentCasingInFileNames: true` — đường dẫn import phân biệt hoa/thường (an toàn khi build trên Linux/Render).
- **CODE_ID_LANG = English**: mọi định danh (biến, hàm, type, file, route, env) viết tiếng Anh. **DOC_LANG = Tiếng Việt**: tài liệu + chuỗi hiển thị người dùng (UI, email) tiếng Việt — ví dụ subject email reset "Đặt lại mật khẩu KeyLish" ([mail.service.ts](../../apps/api/src/mail/mail.service.ts)).
- Comment trong code CÓ THỂ tiếng Việt (giải thích nghiệp vụ) — đã thấy trong codebase; giữ nhất quán theo file đang sửa.

## 5. Code style (ESLint + Prettier)

### 5.1. ESLint — flat config

[eslint.config.mjs](../../eslint.config.mjs): `@eslint/js` recommended + `typescript-eslint` recommended.

- Rule tùy biến: `@typescript-eslint/no-unused-vars` mức **error**, bỏ qua biến/đối số/biến lỗi bắt đầu bằng `_` (`argsIgnorePattern: "^_"`, …). → Dùng tiền tố `_` cho tham số chủ ý không dùng (ví dụ `issueCookieSet(_domain)` trong [auth.service.ts](../../apps/api/src/auth/auth.service.ts)).
- Bỏ qua lint: `**/dist/**`, `**/.next/**`, `**/coverage/**`, `**/*.d.ts`, `pnpm-lock.yaml`, …

### 5.2. Prettier

[.prettierrc.json](../../.prettierrc.json):

| Tùy chọn        | Giá trị                 |
| --------------- | ----------------------- |
| `printWidth`    | `100`                   |
| `semi`          | `true`                  |
| `singleQuote`   | `false` (dùng nháy kép) |
| `trailingComma` | `"es5"`                 |
| `endOfLine`     | `"auto"`                |

### 5.3. Lệnh kiểm tra (script gốc)

- `pnpm lint` · `pnpm typecheck` · `pnpm check` (= lint + typecheck) · `pnpm format` / `pnpm format:check` · `pnpm test`.
- **NÊN** chạy `pnpm check` trước khi commit. (Chưa có hook enforce → xem RISK ở `08-test`/`11-tasks`.)

## 6. Ranh giới kiến trúc KeyLish (boundary — BẮT BUỘC)

Đây là các ràng buộc thiết kế as-built; vi phạm = tech-debt, ghi RISK.

### 6.1. Zod là nguồn validation

- Mọi input ngoài (query/body) **BẮT BUỘC** kiểm bằng Zod schema trước khi dùng. Schema dùng chung đặt ở `@keylish/shared` ([vocab.ts](../../packages/shared/src/vocab.ts)); schema riêng module đặt cạnh service/DTO ([auth.dto.ts](../../apps/api/src/auth/auth.dto.ts), schema trong [vocab.service.ts](../../apps/api/src/vocab/vocab.service.ts)).
- Pattern as-built: controller nhận `unknown`/`Record<string, unknown>` → service gọi `schema.safeParse()` → ném `BadRequestException` khi lỗi. Validation **không** dựa vào kiểu TypeScript ở runtime.
- OpenAPI: mô tả qua decorator `@nestjs/swagger` (`@ApiQuery`, `@ApiOkResponse`, …), **tái dùng** `CefrLevelSchema.options` cho enum ([vocab.controller.ts](../../apps/api/src/vocab/vocab.controller.ts)). ASSUMPTION: OpenAPI hiện **một phần thủ công**, chưa sinh tự động hoàn toàn từ Zod (dù `nestjs-zod` có trong dependency).

### 6.2. Controller mỏng

- Controller chỉ điều phối (định tuyến, guard, set/clear cookie, gọi service). Logic nghiệp vụ + truy vấn DB nằm ở service. Dẫn chứng: [auth.controller.ts](../../apps/api/src/auth/auth.controller.ts) ủy thác toàn bộ cho `AuthService`.

### 6.3. Không gọi vendor SDK trong tầng nghiệp vụ

- Mail gửi qua **REST `fetch`** tới Resend, **không** dùng SDK ([mail.service.ts](../../apps/api/src/mail/mail.service.ts)).
- Truy cập DB **chỉ** qua `DatabaseService` (Prisma client bọc trong `@keylish/db`), không khởi tạo Prisma rải rác.
- Thư viện hạ tầng thuần (argon2, crypto) được phép dùng trong service auth.

### 6.4. KHÔNG log token / password / OTP / PII

- **BẮT BUỘC** không ghi log mật khẩu, token phiên, reset-token, email thô gắn định danh.
- IP được **hash** (`ipHash` = HMAC-SHA256 + pepper) trước khi lưu, không lưu IP thô ([auth.service.ts](../../apps/api/src/auth/auth.service.ts)).
- RISK (chấp nhận, dev-only): khi chưa cấu hình `RESEND_API_KEY`/`AUTH_RESET_EMAIL_FROM`, mailer **log link reset ra console** để test local ([mail.service.ts](../../apps/api/src/mail/mail.service.ts)). Không được bật ở môi trường có người dùng thật. Ghi nhận ở `07-security`.

### 6.5. Ranh giới local-first (user-web)

- Lấy từ vựng theo **3 tầng**: API → cache **IndexedDB** (cơ hội) → **seed offline**, trả kèm `source: "api" | "cache" | "seed"` ([vocabApi.ts](../../apps/user-web/src/infra/vocab/vocabApi.ts)).
- Tách lớp dự kiến: `domain/` (logic thuần), `infra/` (I/O: API, IndexedDB), `server/` (server-only). **Hiện trạng**: phần lớn `domain/*`, `server/`, `data/repositories`, `infra/db` còn là `.gitkeep` rỗng; logic luyện gõ đang nằm ở `components/vocab/typing/` ([useTypingSession.ts](../../apps/user-web/src/components/vocab/typing/useTypingSession.ts)). → RISK R-5 (xem `02-hld`/`03-lld`): mô tả as-built, **không** tuyên bố layering đã hoàn chỉnh.

### 6.6. Tách bề mặt Admin

- Admin là **công cụ nội bộ local-only**. Mọi route `/api/admin/*` bị **404** khi `ADMIN_API_ENABLED` không bật; mặc định **OFF ở production** ([admin-gate.guard.ts](../../apps/api/src/admin/admin-gate.guard.ts)).
- `apps/admin-web` PARTIAL: chưa nối `@keylish/shared`, không deploy. Khi hoàn thiện **NÊN** dùng chung schema `@keylish/*`, không định nghĩa lại type.

## 7. Quy ước định tuyến & môi trường

- Prefix toàn cục `api` + versioning kiểu URI ([main.ts](../../apps/api/src/main.ts)). Read công khai + track: `/api/v1/*`; auth/admin: **không version** (`/api/user/*`, `/api/admin/*`); health: `/api/health`; docs: `/api/docs`. → RISK R-6 (versioning không đồng nhất) ghi ở `05-api`.
- Env tách theo nhiệm vụ, mỗi file một việc (xem README §Cấu hình môi trường và `09-deploy`). Kết nối DB **chỉ** khai ở `packages/db/.env`. Bí mật prod đặt trên dashboard (Render/Vercel), **không** commit `.env`.
- `AUTH_TOKEN_PEPPER` **BẮT BUỘC** ở production — app từ chối boot nếu thiếu ([main.ts](../../apps/api/src/main.ts)).

## 8. Git & commit (quan sát được)

- ASSUMPTION: lịch sử git dùng Conventional Commits (vd `feat(typing): …`, `fix(env): …`). **NÊN** giữ quy ước này. Chưa có cấu hình commit-lint/hook enforce → đề xuất ở `11-tasks` (không tự thêm trong đợt tài liệu này).

## 9. Testing (tóm tắt — chi tiết ở 08)

- Đơn vị: Vitest; e2e API: Supertest ([app.e2e.spec.ts](../../apps/api/src/app.e2e.spec.ts)). Script test API dùng `--passWithNoTests`.
- RISK: coverage hiện thấp (cho phép pass khi không có test). Vùng test **BẮT BUỘC** (auth, toàn vẹn từ vựng, engine gõ + IME, traffic idempotent) liệt kê ở `08-test`.

## 10. ASSUMPTION / OPEN QUESTION

- ASSUMPTION: comment tiếng Việt trong code là chủ ý (giữ theo file).
- ASSUMPTION: OpenAPI hiện mô tả thủ công qua swagger decorator (§6.1).
- OPEN QUESTION (OQ-04): có chuẩn hóa lại layering `domain/infra/server` của user-web (đưa engine gõ từ `components/` về `domain/`) không? → ai quyết: APPROVER; theo dõi ở `context/PROJECT-STATE.md`.

## 11. Truy vết (traceability)

Quy chuẩn này áp dụng cho mọi thiết kế ở `02-hld` → `09-deploy`. Quyết định công nghệ tương ứng được ghi ở `10-adr`. Mọi thay đổi quy ước = ĐỀ XUẤT, chỉ APPROVER chốt (cập nhật §1.2 + `PROJECT-STATE`).

## 12. Quy trình phát triển tính năng (Zero → Release)

> Pipeline chuẩn cho **mọi tính năng mới** của KeyLish. Mỗi phase có **cổng (gate)** phải đạt trước khi sang phase kế — đây là phần giúp người mới không bỏ sót bước. Chi tiết từng loại nằm ở file SDLC tương ứng.

### 12.0. Hard gate trước khi code

Trước khi sửa source code, task **BẮT BUỘC** đạt đủ các điều kiện sau:

1. Có task ID trong `11-tasks.md` hoặc có xác nhận rõ của APPROVER trong cuộc trao đổi hiện tại.
2. Task có `Approval = APPROVED`.
3. Tài liệu liên quan đã cập nhật theo impact matrix ở `11-tasks.md` §4.
4. Task có `Doc gate = READY`, trừ cleanup nhỏ được ghi rõ `Doc gate = N/A`.
5. Phạm vi code trace được về FR/UC/RISK/OQ/ADR hoặc lý do maintenance.

Nếu thiếu bất kỳ điều kiện nào, agent **chỉ được** phân tích, mở OQ/RISK, hoặc cập nhật tài liệu; **không được sửa source code**. Nếu trong lúc code phát hiện implementation lệch tài liệu đã duyệt, phải dừng mở rộng code và cập nhật lại docs/task gate trước.

```
①Ý tưởng → ②Yêu cầu → ③Thiết kế → ④Code → ⑤Test → ⑥Review/Merge → ⑦Deploy → ⑧Release
   OQ        01-SRS     02–07+10    branch   08      PR+APPROVER      Vercel/Render  12+STATE
```

| Phase          | Việc làm                                                                                                                                | Doc/Artifact                  | Gate để qua                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------- |
| ① Ý tưởng      | 2–3 câu: tính năng gì, cho actor nào, vì sao. Phạm vi chưa rõ → mở `OQ-xx`.                                                             | `PROJECT-STATE`               | APPROVER đồng ý → OQ thành DECISION |
| ② Yêu cầu      | Thêm `FR-xxx` testable (actor + kết quả), UC nếu cần; gắn nhãn TODO.                                                                    | `01-srs`                      | FR rõ, kiểm tra được                |
| ③ Thiết kế     | Mỗi quyết định công nghệ mới → 1 ADR. DB đổi → `04` + Prisma migration; API → `05`; UI → `06`; bảo mật → `07`.                          | `02/03/04/05/06/07/10`        | Thiết kế trace về FR; có ADR        |
| ④ Code         | Chỉ bắt đầu khi `Approval = APPROVED` và `Doc gate = READY`; nhánh `feature/...`; theo boundary §6; không mở scope ngoài docs đã duyệt. | source + migration            | `pnpm build` chạy; không lệch scope |
| ⑤ Test         | Test vùng MANDATORY liên quan (engine/auth/traffic/toàn vẹn dữ liệu); `pnpm check && pnpm test`.                                        | `08-test`                     | Xanh + tiêu chí UC đạt              |
| ⑥ Review/Merge | Mở PR; tự review theo boundary §6; CI nếu có (task T-10).                                                                               | PR                            | APPROVER duyệt → nhãn PARTIAL→DONE  |
| ⑦ Deploy       | Merge `master` → Vercel (user-web) + Render (api) tự deploy; migration chạy qua `db:deploy`.                                            | `render.yaml`, `09`           | `GET /api/health` OK + smoke test   |
| ⑧ Release      | Changelog ở `12`; cập nhật status doc + bump §1.2; thu gọn `PROJECT-STATE`.                                                             | `12-release`, `PROJECT-STATE` | Trạng thái LIVE khớp thực tế        |

**Checklist nhanh mỗi tính năng:** phạm vi chốt (OQ→DECISION) · task `APPROVED` + `Doc gate = READY` · FR vào `01` · ADR cho quyết định công nghệ mới · cập nhật DB/API/UI/security doc + migration trước code · nhánh `feature/*` theo boundary · test MANDATORY + `pnpm check && pnpm test` xanh · PR + APPROVER + nhãn DONE · `/api/health` OK sau deploy · ghi `12` + cập nhật `PROJECT-STATE`.

**Điểm người mới hay quên:** (1) không code task chưa `APPROVED`; (2) docs liên quan phải READY trước source code; (3) không commit thẳng `master`; (4) đổi schema **luôn** kèm migration + cập nhật `04`; (5) mọi input ngoài **phải** qua Zod (§6.1); (6) không log token/password/PII (§6.4); (7) tính năng V2 (AI/flashcard/quiz/OAuth) đang **deferred** (DECISION D-04) — muốn làm phải mở OQ + APPROVER duyệt mở rộng phạm vi **trước**.

## 13. Quy định trạng thái tài liệu (Document Status Lifecycle)

> Quy ước nội bộ (tailoring) áp dụng cho **mọi tài liệu SDLC**, theo thông lệ kiểm soát tài liệu của ISO/IEC/IEEE 15289 — **không** phải tuyên bố đạt chứng nhận ISO. Trạng thái **hiện tại** của từng file: xem [`context/PROJECT-STATE.md`](../context/PROJECT-STATE.md) §1 (nguồn sống).

**Vòng đời:**

```
Draft ──► In Review ──► Approved ──► Superseded / Deprecated
  ▲            │             │
  └────────────┴─────────────┘   sửa nội dung → quay lại Draft/In Review (bump §1.2 + review lại)
```

| Trạng thái     | Ý nghĩa                                            | Ai được đặt                          | Hệ quả                                                         |
| -------------- | -------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| **Draft**      | Bản nháp, đang soạn/sửa; nội dung có thể thay đổi. | Người viết                           | Chưa là cơ sở cam kết; sửa tự do, mỗi lần bump §1.2.           |
| **In Review**  | Đã soạn xong, đang chờ APPROVER rà soát.           | Người viết (khi sẵn sàng)            | Chỉ sửa theo phản hồi review; tránh thay đổi lớn.              |
| **Approved**   | APPROVER xác nhận khớp as-built & đạt chuẩn.       | **Chỉ APPROVER (Nguyễn Hồng Khanh)** | Bản chuẩn để tham chiếu; muốn sửa → tăng version + review lại. |
| **Superseded** | Bị tài liệu/phiên bản mới thay thế.                | APPROVER                             | Trỏ tới bản thay thế; giữ lại để truy vết.                     |
| **Deprecated** | Ngừng hiệu lực, chưa có bản thay thế.              | APPROVER                             | Không dùng cho thiết kế mới.                                   |

**Quy tắc:**

- Tài liệu mới khởi tạo ở **Draft**. Chỉ **APPROVER** được chuyển sang **Approved** (PHẦN 4 + ADR-017).
- Thay đổi sau khi **Approved** **BẮT BUỘC** tăng phiên bản (§1.2) và đưa về **In Review**.
- Mã tài liệu `NN-slug` ổn định, không đổi qua các trạng thái.
- **Lưu ý phân biệt:** bảng này là trạng thái **tài liệu**. Riêng **ADR** dùng tập trạng thái cho _quyết định_: `Proposed` · `Accepted` · `Deprecated` · `Superseded` — định nghĩa ở [`10-adr`](10-adr.md) §2; còn **STATE ENUM của dữ liệu** (UserStatus, CefrLevel…) ở `01-srs` §3.
