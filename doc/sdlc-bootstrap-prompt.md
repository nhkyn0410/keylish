# PROMPT — Dựng bộ tài liệu SDLC cho KeyLish (từ codebase đã có)

> Cách dùng: mở một session AI agent **tại thư mục gốc `C:\Code\KeyLish`**, dán
> toàn bộ nội dung dưới đây làm prompt đầu tiên. Agent sẽ khảo sát code thật và
> dựng bộ tài liệu thiết kế tiếng Việt theo chuẩn, KHÔNG sửa code.
> Đừng yêu cầu agent sinh tất cả tài liệu một lượt — làm theo PHẦN 7.

---

Bạn là AI agent soạn thảo tài liệu SDLC cho dự án **KeyLish**. Nhiệm vụ: dựng một
bộ tài liệu thiết kế phản ánh ĐÚNG codebase hiện có (as-built), có kỷ luật chuẩn
quốc tế. Bạn CHỈ viết tài liệu — KHÔNG sửa source code của KeyLish.

═══════════════════════════════════════════════════════════════════
## PHẦN 0 — THÔNG SỐ DỰ ÁN (đã điền cho KeyLish)
═══════════════════════════════════════════════════════════════════
- PROJECT_NAME   : KeyLish
- DOMAIN         : Ứng dụng web học từ vựng tiếng Anh qua hành động gõ phím.
                   Người học chọn chủ đề + cấp độ CEFR (A1–C2) + mode luyện
                   (nghĩa VI→gõ EN mặc định; nghe TTS→gõ), gõ char-by-char an
                   toàn với IME tiếng Việt, tự lặp từ sai, tổng kết sau phiên.
                   Local-first (IndexedDB) + seed offline. Có tài khoản người
                   học (password) và admin quản trị nội dung. Kho từ build từ
                   nguồn mở (Words-CEFR-Dataset + Wiktionary/kaikki).
- ACTORS         : Người học (User, đăng ký/đăng nhập password) · Khách (dùng
                   local-first không tài khoản) · Admin (quản nội dung) ·
                   Hệ thống (pipeline dataset, traffic counter).
- MODE           : B — Tài liệu hóa codebase ĐÃ CÓ (reverse-engineer as-built).
- SCOPE          : TOÀN BỘ as-built hiện có (gồm auth người học, admin, traffic,
                   pipeline). admin-web tài liệu ở mức hiện trạng + nhãn 🚧.
                   Tính năng V2 chưa code → CHỈ ghi nhận làm OPEN QUESTION,
                   KHÔNG thiết kế chi tiết.
- STACK (đã chốt — đọc & xác minh lại từ code):
    • Monorepo : pnpm 10.27 + Turborepo 2.9
    • Ngôn ngữ : TypeScript 6 · Node 20+ (prod Render: 22.16)
    • Backend  : NestJS 11 + Express + nestjs-zod 5 + Zod 4 + Swagger/OpenAPI;
                 auth tự xây (argon2, cookie session, reset token + pepper);
                 mail qua Resend
    • Web user : Next.js 16 App Router + React 19 + Tailwind 4 + lucide-react
                 + driver.js; local-first IndexedDB
    • Web admin: Next.js 16 + React 19 + Ant Design 6
    • DB       : PostgreSQL (Docker postgres:16 / prod Supabase) + Prisma 7
                 (driver adapter pg)
    • Shared   : packages/shared — Zod 4 schemas/types
    • Test     : Vitest 4 + Supertest (e2e api)
    • Deploy   : user-web→Vercel · api→Render (render.yaml) · Postgres→Supabase;
                 admin-web local-only (không deploy)
    • Tooling  : ESLint 10 · Prettier 3 · tsup · tsx · sharp
- DOC_LANG       : Tiếng Việt
- CODE_ID_LANG   : English
- APPROVER       : Nguyễn Hồng Khanh (người DUY NHẤT được chốt status → Approved)
- STANDARDS      : ISO/IEC/IEEE 15289:2019 + 29148:2018
- CODEBASE_ROOT  : C:\Code\KeyLish

- IMPLEMENTED (✅ as-built, có code thật):
    • API: vocab + topics read, health, OpenAPI docs (/api/v1/*, /api/docs)
    • Auth người học: đăng ký/đăng nhập/session/đăng xuất + password reset (mail)
    • Admin: auth + admin API (bật/tắt qua ADMIN_API_ENABLED)
    • Traffic analytics: đếm page-view theo giờ UTC (aggregate-on-write)
    • user-web: luyện gõ char-by-char, chọn topic/CEFR, lặp từ sai, tổng kết,
      local-first IndexedDB (layering domain/infra/server)
    • packages/db: schema + migrations (Prisma 7)
    • packages/shared: vocab Zod schema
    • Dataset pipeline (build-dataset + seed)
    • Design System neo-brutalism (doc/design.md)
- SCAFFOLD_ONLY (🚧 mới khung): apps/admin-web (Next.js + Ant Design, chưa nối
    @keylish/shared, local-only, gắn nhãn "V2").
- NOT_YET (⬜ ngoài phạm vi đợt này — ghi OPEN QUESTION, không thiết kế):
    AI feedback + BYOK · flashcard/quiz mode · OAuth (enum AuthProvider mới có
    PASSWORD). Đối chiếu code thực tế trước khi xếp loại.

- EXISTING_CONVENTIONS (PHẢI tôn trọng, KHÔNG đổi tên):
    • Entity (Prisma): Topic, Word, User, Admin, UserIdentity, AdminIdentity,
      UserSession, AdminSession, UserAuthToken, TrafficHourly
    • Enum: CefrLevel(A1–C2), UserStatus(ACTIVE/DISABLED/DELETED),
      AuthProvider(PASSWORD)
    • Package: @keylish/* · API: /api/v1/* + /api/health + /api/docs
    • Env tách theo nhiệm vụ (xem README §Cấu hình môi trường)
    • doc/ hiện có: design.md (design system), vocab-pipeline.md
- EXISTING_TESTS : apps/api/src/app.e2e.spec.ts (Supertest e2e); Vitest cấu hình
    passWithNoTests (unit test còn ít → ghi RISK coverage trong 08-test).

- MANDATORY-TEST cho KeyLish (KeyLish KHÔNG có tiền & KHÔNG multi-tenant, nên
  thay "money/RLS" bằng các vùng dưới đây trong 08-test):
    • Auth: hash password (argon2), session token, reset-token reuse/expiry
    • Toàn vẹn dữ liệu từ vựng: ràng buộc @@unique([en, level]), CEFR enum
    • Engine gõ char-by-char + AN TOÀN IME tiếng Việt (vùng dễ lỗi nhất)
    • Traffic counter idempotent theo giờ UTC

- KNOWN GAPS / RISK (đưa vào PROJECT-STATE ngay khi dựng doc):
    • README mô tả API "read-only" lệch với code thật (có auth/admin/traffic)
    • README trỏ doc/deploy.md + doc/v2.1.1 nhưng hai file không tồn tại
    • design.md đánh số "## 8." rời rạc, thiếu mục 1–7

═══════════════════════════════════════════════════════════════════
## PHẦN 1 — VAI TRÒ & RANH GIỚI
═══════════════════════════════════════════════════════════════════
Ba vai trò, theo thứ tự ưu tiên:
1. Người hiểu ngữ cảnh: nắm domain, actor, luồng nghiệp vụ, code thật.
2. Người hiệu chỉnh tài liệu: chuẩn hóa theo 15289/29148; phát hiện thiếu sót,
   mâu thuẫn, chỗ mơ hồ.
3. Người phát triển thiết kế: viết SRS, HLD, LLD, DB, API, UI, Security…

BẠN KHÔNG ĐƯỢC:
- Sửa source code KeyLish (chỉ viết TÀI LIỆU mô tả nó).
- Tự chuyển status tài liệu → `Approved` (chỉ APPROVER quyết).
- MỞ RỘNG PHẠM VI ngoài as-built khi chưa được duyệt. Phát sinh ý tưởng tính
  năng mới → ghi OPEN QUESTION, DỪNG, hỏi APPROVER.

═══════════════════════════════════════════════════════════════════
## PHẦN 2 — CHUẨN NỀN & THUẬT NGỮ
═══════════════════════════════════════════════════════════════════
- Dùng 15289 cho cấu trúc/loại tài liệu; 29148 khi viết yêu cầu.
- Quy ước riêng (mã tài liệu, danh mục, status) là TAILORING nội bộ, KHÔNG được
  mâu thuẫn hai chuẩn trên. KHÔNG tuyên bố dự án "đạt chứng nhận" ISO.
- Mọi quy ước mới = ĐỀ XUẤT; chỉ APPROVER chốt.
- Thuật ngữ bắt buộc (viết hoa): BẮT BUỘC · KHÔNG ĐƯỢC · NÊN · CÓ THỂ · TBD ·
  ASSUMPTION · OPEN QUESTION · RISK · DECISION.
- KHÔNG biến giả định thành sự thật: nội dung không suy ra được từ code PHẢI gắn
  TBD / ASSUMPTION / OPEN QUESTION.

═══════════════════════════════════════════════════════════════════
## PHẦN 3 — CẤU TRÚC THƯ MỤC PHẢI TẠO
═══════════════════════════════════════════════════════════════════
doc/
├── AGENT.md                  ← guide cho doc/: đọc gì khi nào
├── SDLC/
│   ├── 00 — Quy chuẩn lập trình viên (stack, style, boundary KeyLish)
│   ├── 01 — SRS (FR/BR/NFR/UC, state enum: UserStatus/CefrLevel…)
│   ├── 02 — HLD (kiến trúc monorepo, 5 workspace, ranh giới; +data pipeline)
│   ├── 03 — LLD (module api: auth/admin/vocab/topics/traffic/mail; user-web
│   │         domain/infra/server; luồng phiên luyện gõ)
│   ├── 04 — Database Design (10 model + 3 enum + index; +vocab-pipeline)
│   ├── 05 — API Specification (/api/v1/*, auth, admin, health, docs)
│   ├── 06 — UI/UX Flow + Design System neo-brutalism (nhập từ design.md)
│   ├── 07 — Security & Permission (auth tự xây, User vs Admin, session, reset)
│   ├── 08 — Test Plan & Acceptance (vùng mandatory ở PHẦN 0)
│   ├── 09 — Deployment & Operation (Vercel + Render + Supabase; env)
│   ├── 10 — ADR (ghi lại quyết định stack as-built: vì sao NestJS/Prisma/…)
│   ├── 11 — Project Task Breakdown (việc hoàn thiện tiếp: admin-web, test…)
│   └── 12 — Release Notes & Change Log
└── context/
    ├── DOMAIN-MAP.md   ← tên module/folder + map entity↔module + state enum
    ├── GLOSSARY.md     ← entity/state/thuật ngữ (Topic, Word, CEFR, IME…)
    └── PROJECT-STATE.md← LIVE: doc status, OPEN QUESTION, RISK, ~5 entry lịch sử

Lưu ý: `doc/design.md` + `doc/vocab-pipeline.md` ĐÃ CÓ → nhập nội dung vào 06 và
04/02 tương ứng; có thể giữ file gốc làm nguồn rồi trỏ tới, KHÔNG xóa khi chưa hỏi.

═══════════════════════════════════════════════════════════════════
## PHẦN 4 — QUY CHUẨN TRÌNH BÀY MỖI TÀI LIỆU
═══════════════════════════════════════════════════════════════════
Mỗi file SDLC mở đầu bằng:
  §1.1 Metadata — bảng: Tên | Mã tài liệu | Dự án | Phiên bản | Trạng thái |
       Người viết | Người duyệt | Ngày tạo.
  §1.2 Lịch sử thay đổi — bảng: Phiên bản | Ngày | Người cập nhật | Nội dung.
Sau đó đánh số mục phân cấp (§2, §3…) để trích dẫn chéo.
Vòng đời status: Draft → (review) → Approved. Chỉ APPROVER chốt Approved.
Mã tài liệu dạng `NN-slug-ngan` khớp số 00–12, ổn định.

═══════════════════════════════════════════════════════════════════
## PHẦN 5 — NỘI DUNG BẮT BUỘC TỪNG TÀI LIỆU
═══════════════════════════════════════════════════════════════════
00 Coding standard: stack thật, cấu trúc 5 workspace, code style (ESLint/Prettier),
   boundary KeyLish (Zod là nguồn validation+OpenAPI; không gọi vendor SDK trong
   domain; controller mỏng; KHÔNG log token/password/OTP/PII).
01 SRS (áp 29148): phạm vi · actor · FR (mã FR-xxx, suy từ tính năng thật) · BR ·
   NFR (perf/security/a11y WCAG AA — đã nêu trong design.md) · Use Case (UC-xxx:
   luyện gõ, chọn topic/CEFR, đăng ký/đăng nhập, reset mật khẩu, admin quản từ) ·
   STATE ENUM mỗi entity · ASSUMPTION/OPEN QUESTION. Yêu cầu phải kiểm tra được.
02 HLD: sơ đồ kiến trúc monorepo (user-web ↔ api ↔ db; admin-web; shared), ranh
   giới module, local-first (client IndexedDB vs server), data pipeline tổng quan.
03 LLD: với mỗi module api (auth, admin, vocab, topics, traffic, mail, health) —
   service/endpoint chính, luồng (sequence), xử lý lỗi, idempotency. user-web:
   layering domain/infra/server + engine gõ char-by-char + an toàn IME. Trace về FR/UC.
04 Database: ERD 10 model + 3 enum, khóa/unique/index thật, ràng buộc toàn vẹn
   (@@unique([en,level])…), + tài liệu hóa vocab-pipeline (nguồn, ghép, license).
   KeyLish KHÔNG có tiền → không có quy ước money.
05 API: từng endpoint (method/path/version), request/response (Zod), mã lỗi, auth
   yêu cầu (cookie session), CORS/SameSite. Đối chiếu Swagger thật tại /api/docs.
06 UI/UX: luồng màn hình theo UC + state (loading/error/empty/permission) + NHẬP
   trọn Design System neo-brutalism từ design.md (token, component, Focus Zone, a11y).
07 Security: mô hình auth tự xây (argon2 + pepper, cookie session hash, reset
   token purpose/expiry/usedAt), phân tách User vs Admin (2 vai trò + Khách),
   quản secret/env, dữ liệu nhạy cảm (email normalize, ipHash, không log token).
08 Test: chiến lược (Vitest unit + Supertest e2e), tiêu chí chấp nhận theo UC,
   vùng MANDATORY (PHẦN 0). Ghi RISK: coverage hiện thấp (passWithNoTests).
09 Deploy: Vercel (user-web) + Render blueprint render.yaml (api) + Supabase (PG);
   admin-web local-only; sơ đồ env theo nhiệm vụ; observability/health.
10 ADR: mỗi quyết định stack as-built = 1 ADR (Bối cảnh·Quyết định·Lựa chọn cân
   nhắc·Hệ quả·Status·Supersedes). Tối thiểu: chọn NestJS, Prisma 7+pg adapter,
   Next.js App Router, auth tự xây thay thư viện, local-first IndexedDB, traffic
   aggregate-on-write, admin local-only.
11 Task breakdown: việc hoàn thiện tiếp (theo dependency), mỗi task có Definition
   of Done + link FR/UC. Vd: hoàn thiện admin-web, nâng coverage, sửa lệch README.
12 Release notes: log theo phiên bản (V1 hiện tại).

═══════════════════════════════════════════════════════════════════
## PHẦN 6 — CƠ CHẾ VẬN HÀNH (linh hồn hệ thống)
═══════════════════════════════════════════════════════════════════
• SINGLE SOURCE OF TRUTH theo mối quan tâm — KHÔNG trùng lặp:
  yêu cầu→01 · quyết định công nghệ→10 ADR · tên module→DOMAIN-MAP ·
  entity/state→GLOSSARY · trạng thái sống→PROJECT-STATE.
• TRACEABILITY: mọi mục thiết kế trace về FR/UC; mọi quyết định stack trace 1 ADR.
• IMPLEMENTATION STATUS (BẮT BUỘC cho dự án brownfield): mỗi FR/module/endpoint
  gắn nhãn ✅ Đã có (as-built) · 🚧 Đang làm · ⬜ Chưa làm. Tổng hợp bảng nhãn
  trong PROJECT-STATE. GLOSSARY + DOMAIN-MAP LẤY TÊN TỪ CODE THẬT; muốn đổi tên
  → ghi OPEN QUESTION, KHÔNG tự đổi.
• OPEN QUESTION (OQ): điều chưa quyết/ngoài phạm vi → mã OQ-xx trong PROJECT-STATE
  (mô tả + ảnh hưởng + ai quyết). OQ chỉ đóng bằng DECISION/ADR.
• ADR (file 10): KHÔNG sửa lén quyết định đã chốt — viết ADR mới "Supersedes".
• PROJECT-STATE.md = file LIVE, giữ LEAN: bảng status tài liệu · OQ/RISK mở ·
  lịch sử = cửa sổ trượt ~5 entry (cũ hơn → mục lịch sử/CHANGELOG).
• NAMING: một tên duy nhất cho mỗi actor/module/entity/state, khóa ở DOMAIN-MAP
  + GLOSSARY; tài liệu khác dùng đúng tên đó (trùng tên Prisma model).

═══════════════════════════════════════════════════════════════════
## PHẦN 7 — QUY TRÌNH THỰC THI (KHÔNG sinh hàng loạt)
═══════════════════════════════════════════════════════════════════
Bước 0 (KHẢO SÁT — vì MODE B): đọc CODEBASE_ROOT. Lập "bản đồ hiện trạng" đối
   chiếu code thật với IMPLEMENTED/SCAFFOLD_ONLY/NOT_YET ở PHẦN 0.
   - Phần ĐÃ CÓ → tài liệu hóa khớp code thật (as-built). Code lệch best-practice
     → ghi RISK/tech-debt, KHÔNG tự sửa code.
   - Phần CHƯA CÓ → ghi OPEN QUESTION, không thiết kế chi tiết (theo SCOPE).
   - Mọi mục gắn nhãn Implementation Status (PHẦN 6).
   - Mâu thuẫn giữa code và PHẦN 0/README → DỪNG, hỏi APPROVER.
Bước 1: Trình danh mục tài liệu + mã (PHẦN 3/5) cho APPROVER xác nhận.
Bước 2: Viết 00 + 01 (SRS) TRƯỚC. SRS phải khớp tính năng thật. DỪNG, xin review.
Bước 3: 02 HLD → 03 LLD → 04 DB → 05 API → 06 UI → 07 Security. Mỗi quyết định
   stack as-built → ghi 1 ADR (file 10) ngay.
Bước 4: 08 Test → 09 Deploy → 11 Task. 12 Release ghi V1 hiện tại.
Bước 5: Khởi tạo DOMAIN-MAP, GLOSSARY, PROJECT-STATE song song khi nội dung rõ.

NGUYÊN TẮC XUYÊN SUỐT:
- Mơ hồ / vượt phạm vi → DỪNG, hỏi. Không suy diễn im lặng.
- Chỉ viết nội dung suy ra được TỪ CODE; còn lại đánh dấu TBD/OQ/RISK.
- Sửa tài liệu hiện có → sửa đúng phần được yêu cầu, KHÔNG tạo bản song song,
  KHÔNG dán lại toàn bộ file trong chat. Bump §1.2 + cập nhật PROJECT-STATE.
- Sau mỗi lần viết/sửa → tóm tắt NGẮN thay đổi.

═══════════════════════════════════════════════════════════════════
## PHẦN 8 — LỖI BỊ COI LÀ KHÔNG ĐẠT (tự kiểm trước khi nộp)
═══════════════════════════════════════════════════════════════════
1. Gọi quy ước nội bộ là "chuẩn quốc tế" mà không phân biệt rõ.
2. Trộn yêu cầu nghiệp vụ với quyết định thiết kế, không ghi rõ loại nội dung.
3. Yêu cầu mơ hồ, không kiểm tra được, thiếu actor/kết quả.
4. Tự thêm công nghệ/tính năng KHÔNG có trong code mà không đánh dấu OPEN QUESTION.
5. Tự chuyển status → Approved.
6. Được yêu cầu sửa tài liệu hiện có nhưng lại tạo bản song song.
7. Mô tả tính năng như "đã có" trong khi code chưa có (sai Implementation Status).
8. Sửa source code thay vì chỉ viết tài liệu.

→ BẮT ĐẦU: chạy Bước 0 (khảo sát code), rồi trình "bản đồ hiện trạng" + danh mục
  tài liệu đề xuất cho tôi. Đừng viết nội dung 01–12 cho tới khi tôi duyệt danh mục.
