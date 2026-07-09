# 06 — Thiết kế UI/UX và Design System

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường      | Giá trị                         |
| ----------- | ------------------------------- |
| Tên         | Thiết kế UI/UX và Design System |
| Mã tài liệu | `06-ui-ux`                      |
| Dự án       | KeyLish                         |
| Phiên bản   | 0.1.12                          |
| Trạng thái  | Draft                           |
| Người viết  | AI Agent (soạn thảo SDLC)       |
| Người duyệt | Nguyễn Hồng Khanh               |
| Ngày tạo    | 2026-06-15                      |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày       | Người cập nhật | Nội dung                                                                                                                                                                                                                                                |
| --------- | ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0     | 2026-06-15 | AI Agent       | Bản Draft đầu — nhập từ `doc/design.md` (giữ file gốc).                                                                                                                                                                                                 |
| 0.1.1     | 2026-06-15 | AI Agent       | G-7: gắn nhãn TODO cho component thiết kế chưa build (§2.5/§2.6).                                                                                                                                                                                       |
| 0.1.2     | 2026-06-15 | AI Agent       | Phase ③ V2.1: thêm §7 UI kho cá nhân (layout C·Split — đã build `VocabLibrarySplit`).                                                                                                                                                                   |
| 0.1.3     | 2026-06-20 | AI Agent       | Sync UI kho từ vựng: route `/vocabulary`, tabs Kho hệ thống/Kho của tôi, tạo từ mới đã nối API; FR-PVOC-08 còn thiếu.                                                                                                                                   |
| 0.1.4     | 2026-06-20 | AI Agent       | Bổ sung filter cấp độ/chủ đề và topic tùy chọn khi tạo từ mới trong Kho của tôi.                                                                                                                                                                        |
| 0.1.5     | 2026-06-20 | AI Agent       | Sắp xếp lại đề mục: §3 Bản đồ màn hình & điều hướng · §4 Luồng người dùng (viết lại, có sơ đồ trạng thái) · §5 primitives · §6 Anatomy 3 màn (theo luồng xử lý giao diện: thiết lập phiên / kho hệ thống / kho của tôi) · §7 RISK.                      |
| 0.1.6     | 2026-06-20 | AI Agent       | Thiết kế lại §4: phân tầng **as-built** (§4.1–4.5) vs **định hướng** §4.6 — tách route `/typing/setup` + `/typing/play` (session-spec trên query), lifecycle 4 pha, ma trận quyền custom theo pha; mở FR-PVOC-08, chờ ADR-020 + APPROVER (OQ-13/OQ-14). |
| 0.1.7     | 2026-06-22 | AI Agent       | Chốt **đợt 1 tách route** `/typing/setup` + `/typing/play` (ADR-020 Accepted, OQ-13 đóng → D-13); tách **đợt 2 custom-options** thành DEFERRED (OQ-14); §4.6 chia 2 đợt + lifecycle play tối giản.                                                      |
| 0.1.8     | 2026-06-22 | AI Agent       | §6.3: thêm UI **sửa/override** kho cá nhân (`EditWordForm` → PATCH; `toDto` ưu tiên override cho từ tham chiếu) — **FR-PVOC-07** done; sửa nhãn nhầm FR-PVOC-06→07 ở §6.3/§7.                                                                           |
| 0.1.9     | 2026-06-22 | AI Agent       | §4.6 đợt 2: **DEFERRED → APPROVED** (D-14) — cho phép chỉnh giữa phiên **Luyện tập** (Kiểm tra khoá), `result` gắn cờ "đã chỉnh giữa phiên"; `seed` hoãn. Mở **T-13**.                                                                                  |
| 0.1.10    | 2026-06-22 | AI Agent       | §4.6 đợt 2 **ĐÃ CODE** (DONE-18): pre-commit + in-play panel + pause đồng hồ + cờ result; ghi chú hiện thực (chỉ `repeat` là cấu trúc).                                                                                                                 |
| 0.1.11    | 2026-06-22 | AI Agent       | Hiển thị **từ loại (`pos`)**: badge cạnh nghĩa ở màn gõ + panel chi tiết 2 kho (T-15) — trước đó `pos` mang end-to-end nhưng UI bỏ.                                                                                                                     |
| 0.1.12    | 2026-07-09 | AI Agent       | Chuẩn hoá icon user-web: chọn `lucide-react` qua adapter `KeylishIcon`/`Icon`, stroke dày cố định, bỏ icon tự vẽ rải rác (T-16).                                                                                                                        |

### 1.3. Tham chiếu

- `doc/design.md` — nguồn gốc Design System (giữ file gốc)
- `01-srs.md` — UC-01 luyện gõ, UC-07/08 kho từ vựng cá nhân, FR-PVOC-\*
- `03-lld.md` — engine typing char-by-char + IME safety
- `05-api.md` — hợp đồng API `/api/user/vocab`, `/api/v1/vocab`

## 2. Design System: Neo-brutalism

> Nội dung phần này được nhập nguyên từ `doc/design.md` (MỤC 8). File gốc giữ làm nguồn.

### 2.0. Tinh thần & 3 điều chỉnh KeyLish

**Neo-brutalism DNA:** viền đen dày (`border-4`), hard shadow offset 45° zero blur, "sticker" effect, mechanical interaction (push-down như công tắc).

**3 điều chỉnh:**

1. **Focus Zone tĩnh lặng**: khu vực đọc & gõ không xoay, không texture, leading thoáng
2. **Motif "KEYCAP"**: nút tạo hình phím bàn phím nhấn xuống
3. **Chrome loud, content calm**: vỏ mạnh mẽ, nội dung học rõ ràng

### 2.1. Tokens — Màu sắc

| Token        | Hex       | Vai trò                        |
| ------------ | --------- | ------------------------------ |
| `neo-bg`     | `#FFFDF5` | Nền cream                      |
| `neo-ink`    | `#000000` | Text, viền, shadow (không xám) |
| `neo-yellow` | `#FFD93D` | Primary CTA                    |
| `neo-violet` | `#C4B5FD` | Info/secondary/focus           |
| `neo-red`    | `#FF6B6B` | Error/destructive              |
| `neo-green`  | `#6BCB77` | Success/correct                |
| `neo-white`  | `#FFFFFF` | Panel tương phản               |

WARNING: Không dùng màu đơn độc báo đúng/sai — luôn kèm nhãn + hình dạng.
WARNING: Đỏ không còn là CTA (CTA chính = vàng).

### 2.2. Typography

- **Font**: `Be Vietnam Pro` (Google Fonts) — hỗ trợ đầy đủ dấu tiếng Việt
- **Weights**: Black 900 (heading), Bold 700 (body/label), Medium 500 (dè dặt)
- **Scale**: Display `text-7xl→9xl`, H2 `5xl→7xl`, Body `text-base→lg`
- **Kỹ thuật**: text-stroke cho heading rỗng; UPPERCASE cho heading/nhãn/nút
- **Focus Zone ngoại lệ**: không UPPERCASE, không text-stroke, `font-bold text-lg→2xl leading-relaxed`

### 2.3. Borders, Radius, Shadows

- Radius: `rounded-none` (mặc định), `rounded-full` (pill badge)
- Borders: `border-4` (mặc định), `border-2` (ghost), `border-8` (divider)
- Hard shadow: `shadow-[4px_4px_0px_0px_#000]` (S) → 16px (XL)
- Texture: chỉ chrome, không sau nội dung đọc

### 2.4. Component Primitives

**Button (Keycap):** `h-12→14`, `border-4`, uppercase, hard shadow, `active:translate-x-[2px] translate-y-[2px] shadow-none transition-all duration-100`

**Card:** `bg-white border-4 shadow-[8px→12px]`, hover lift `hover:-translate-y-1 shadow-[12px_12px_0px_0px_#000]`

**Input/Textarea:** `border-4 bg-white font-bold`, violet nền khi focus (`focus-visible:bg-neo-violet shadow-[4px_4px_0px_0px_#000]`)

### 2.4.1. Iconography

- Icon hệ thống user-web dùng `lucide-react` qua adapter `KeylishIcon`/`Icon`; không vẽ SVG riêng trong từng component.
- Preset neo: `strokeWidth` khoảng 3, `absoluteStrokeWidth`, `currentColor`; kích thước 18-20 cho nút/sidebar, 24-32 cho minh hoạ nhỏ.
- Nút hành động dùng icon thật (`ArrowRight`, `ChevronRight`, ...), không dùng ký tự mũi tên thay cho icon; ký tự `→` chỉ giữ trong nhãn mô tả luồng như "Nghĩa VI → Gõ EN".
- Logo KeyLish được phép giữ chữ/khung thương hiệu, nhưng glyph key đi qua icon set để đồng bộ nét.

### 2.5. KeyLish-specific Components

| Component             | Mô tả                                                    | Trạng thái               |
| --------------------- | -------------------------------------------------------- | ------------------------ |
| **Char-by-char Cell** | Đúng=xanh, sai=đỏ+gạch, chưa gõ=mờ, con trỏ=đen          | DONE (typing)            |
| **Stats/Summary**     | Panel số lớn viền dày color-blocking                     | DONE                     |
| **SourcePane**        | Focus Zone — hiển thị nghĩa nguồn (trong TypingScreen)   | DONE                     |
| **TranslationInput**  | Textarea neo lớn, nút "GỬI CÂU" — tính năng dịch         | TODO (deferred V2, D-04) |
| **DiffView**          | Chip xanh `CORRECT` / đỏ `INCORRECT` — tính năng dịch/AI | TODO (deferred V2, D-04) |
| **ReferenceReveal**   | Panel bản tham chiếu                                     | TODO (deferred V2, D-04) |
| **AiFeedbackPanel**   | Điểm + nhận xét AI                                       | TODO (deferred V2, D-04) |
| **Flashcard**         | Card viền, lật snap, sticker "ĐÃ THUỘC"                  | TODO (V2)                |
| **Quiz**              | Keycap đáp án, chấm màu + nhãn trạng thái                | TODO (V2)                |

> Component as-built thực tế (neo primitives) liệt kê ở §5. Các mục TODO là tầm nhìn design-system từ `design.md`, **chưa build**.

### 2.6. Focus Zone (BẮT BUỘC)

Áp dụng: SourcePane (DONE) và — khi build tính năng dịch (TODO V2) — TranslationInput, ReferenceReveal.

- Không xoay, không texture, không uppercase, không text-stroke
- `font-bold text-lg→2xl leading-relaxed` căn trái
- Giữ viền + shadow khung — chỉ nội dung bên trong tĩnh lặng

### 2.7. Motion

- Nhanh mechanical: `duration-100` (nút), `duration-200` (card)
- Easing: `ease-out`/`ease-linear`, tránh `ease-in-out`
- Tôn trọng `prefers-reduced-motion`

### 2.8. Anti-patterns

Cấm: blur, shadow mềm, gradient, `rounded-md/lg/xl`, xám subtle. KeyLish: không xoay/texture nội dung đọc, không báo đúng/sai chỉ bằng màu.

### 2.9. Accessibility

- WCAG AA (đen trên cream/vàng/xanh/violet; trắng chỉ trên đen)
- Đúng/sai = màu + nhãn + hình dạng
- Focus rõ: violet nền / ring-2 black
- Touch target ≥ h-12

## 3. Bản đồ màn hình & Điều hướng

### 3.1. Danh mục route (as-built)

App Router chia 3 route group: `(auth)` (luồng xác thực), `(practice)` (luyện gõ toàn màn), `(site)` (bố cục có sidebar qua `AppShell`).

| Route                        | Component                                       | Group        | Trạng thái         |
| ---------------------------- | ----------------------------------------------- | ------------ | ------------------ |
| `/`                          | Home page + Welcome Tour                        | `(site)`     | DONE               |
| `/typing`                    | `TypingFlow` → Setup → Typing/Listen → Summary  | `(practice)` | DONE               |
| `/vocabulary`                | `VocabLibraryTabs` (Kho hệ thống / Kho của tôi) | `(site)`     | DONE (V2.1)        |
| `/login`                     | `AuthFrame` (login)                             | `(auth)`     | DONE               |
| `/register`                  | `AuthFrame` (register)                          | `(auth)`     | DONE               |
| `/forgot-password`           | Forgot form                                     | `(auth)`     | DONE               |
| `/reset-password`            | Reset form                                      | `(auth)`     | DONE               |
| `/settings/account`          | Account settings                                | `(site)`     | DONE               |
| `/dang-phat-trien`           | Trang "Đang phát triển"                         | `(site)`     | DONE               |
| `/dang-phat-trien/[feature]` | "Coming soon" theo tính năng                    | `(site)`     | DONE               |
| Admin dashboard PARTIAL      | Ant Design (apps/admin-web)                     | —            | PARTIAL local-only |

> `(practice)/typing` ở chế độ **play** chạy immersive — ẩn sidebar để giữ Focus Zone (xem §4.1, §6.1).

### 3.2. Sơ đồ điều hướng tổng

Mọi trang `(site)` dùng chung `Sidebar` (port từ design `navbar.jsx`). Liên kết "PARTIAL" dẫn tới `/dang-phat-trien/[feature]`.

```
Sidebar  (Logo → /)
  Trang chủ   /                Khám phá   → /dang-phat-trien/kham-pha PARTIAL
  ── Luyện tập ──
  Luyện từ    /typing          Luyện câu  → /dang-phat-trien/luyen-cau PARTIAL
  ──────────────
  Kho từ vựng /vocabulary      Quản lý bài→ /dang-phat-trien/quan-ly-bai PARTIAL
  ──────────────
  Góp ý       → Google Form (NEXT_PUBLIC_FEEDBACK_FORM_URL · tab mới)
  [đáy] UserSessionActions: Đăng nhập / Đăng ký  —hoặc—  phiên hiện tại
```

## 4. Luồng người dùng (User Flow)

> §4.1–§4.5 = luồng **hiện tại (as-built)**. §4.6 = tách route `setup`/`play`: **đợt 1 (route split) ĐÃ XONG** — ADR-020 · DONE-16; **đợt 2 (custom options) ĐÃ CODE** — D-14 · DONE-18.

### 4.1. UC-01 — Luyện gõ (as-built)

`TypingFlow` ([TypingFlow.tsx](../../apps/user-web/src/components/vocab/typing/TypingFlow.tsx)) điều phối toàn bộ phiên trong **một route `/typing`** qua state máy `step` (hướng tách route ở §4.6):

```
/typing

[warming]  WarmingGate
   warmApi()  +  loadTopicsAwait()          (đánh thức API Render, retry tải chủ đề)
   └─► step = setup                          (lỗi tải chủ đề → vẫn vào setup, dùng seed)
        │
        ▼
[setup]    SetupMethod                       (§6.1)
   onStart(method, {levels, topics, size}, {drill, settings})
        │
        ▼
[loading]  LoadingSession
   fetchVocab({levels, topics, limit:size, random:true})
   └─► pool = words || SEED_VOCABULARY  →  shuffle + slice(size) = words
        │
        ▼
[play]     method === "M2" ? TypingScreen : ListenScreen   (immersive, ẩn sidebar)
   gõ char-by-char (engine §03-lld) → onComplete(result)
        │
        ▼
[summary]  Summary
   ├─ Luyện lại từ sai → words = wrongWords → [play]   (chỉ khi có từ sai)
   ├─ Luyện lại        → cùng pool, shuffle lại → [play]
   └─ Đổi phương pháp  → [setup]
```

> Màn gõ (`TypingScreen`, pha play) hiện **từ loại (`pos`)** ngay cạnh nghĩa VI — badge trắng, ẩn nếu từ không có `pos`.

### 4.2. UC-02/03 — Đăng ký / Đăng nhập

`AuthFrame` (route group `(auth)`). Validation Zod client-side; submit kèm CSRF double-submit.

```
/login  ·  /register
   nhập email + mật khẩu (+ displayName khi đăng ký)
   ├─ lỗi Zod client-side → báo inline, chưa gửi
   │  submit
   ▼
   getUserCsrfToken() → POST /api/user/{login|register}  (header X-CSRF-Token)
   ├─ 200 → set session cookie (HttpOnly) → redirect /
   └─ lỗi (4xx) → thông báo trong card, giữ nguyên form
```

### 4.3. UC-04 — Quên / Đặt lại mật khẩu

```
/forgot-password
   nhập email → POST /api/user/forgot-password (CSRF)
   └─► LUÔN hiện "Kiểm tra email"               (không lộ email có tồn tại hay không — chống dò)
        │  (mail chứa link reset)
        ▼
/reset-password?token=...
   nhập mật khẩu mới → POST /api/user/reset-password {token, password}
   ├─ 200 → redirect /login
   └─ lỗi (token hết hạn / đã dùng) → thông báo trong card
```

### 4.4. UC-07 — Quản lý kho từ vựng

`VocabLibraryTabs` ([VocabLibraryTabs.tsx](../../apps/user-web/src/components/vocab/library/VocabLibraryTabs.tsx)) đổi tab nội bộ; chi tiết từng màn ở §6.2/§6.3.

```
/vocabulary   (state `tab`)
   ┌─ tab "Kho hệ thống" → VocabLibrarySplit (§6.2)   — công khai, không cần đăng nhập
   └─ tab "Kho của tôi"  → MyVocabSplit     (§6.3)   — cần đăng nhập (401 → auth gate)

Dòng chảy dữ liệu giữa 2 kho:
   Kho hệ thống ──[+ Thêm vào kho]──► pickSystemWord(wordId)   ─┐
   Kho của tôi  ──[+ Tạo từ mới]───► createUserVocab(...)      ─┼─► Kho của tôi
                                       (dedup: linked|created|suggest)
   Kho của tôi  ──[Xóa]───────────► deleteUserVocab(id)
```

> Nút **"Luyện bộ này / Luyện từ này"** hiện chỉ `router.push("/typing")` (chưa truyền nguồn) → **FR-PVOC-08**; định hướng mở ở §4.6.

### 4.5. Trạng thái chung: Loading / Error / Empty / Permission

| State            | Hành vi UI                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Loading          | loader/thông báo trong khung viền; từ seed hiện ngay nếu có (typing)                                |
| Error            | Thông báo trong card; tự fallback cache/seed (typing) — không gián đoạn phiên                       |
| Empty            | Card "Không có từ … khớp bộ lọc" + gợi ý bỏ bớt cấp độ/chủ đề                                       |
| Permission (401) | Kho của tôi → **auth gate** (card Đăng nhập); trang luyện & kho hệ thống vẫn dùng được khi là khách |

### 4.6. Tách route `setup` / `play` (ADR-020)

> **Đợt 1 — route split: ĐÃ XONG (DONE-16)** — mở **FR-PVOC-08** (luyện từ kho **không** qua `setup`). **Đợt 2 — custom-options lifecycle: ĐÃ CODE (DONE-18)** — thiết kế bên dưới.

#### Đợt 1 — Tách route + session-spec (ĐÃ DUYỆT)

**Quy tắc IA** — `path = hoạt động · query = nguồn + spec phiên`. Kho từ vựng điều hướng tới `/typing/play?source=…`, **không** tạo route riêng (`/vocabulary/play` là anti-pattern: cùng một state có 2 URL).

```
/typing            entry mỏng: warmApi() → redirect /typing/setup
/typing/setup      SetupMethod  (dựng spec → push play)        [có sidebar]
/typing/play       RESOLVING → READY → LIVE → DONE             [immersive]
```

**Đặc tả phiên (session spec) trên query** — `play` tự nạp từ:

| `source`   | Tham số                                       | `play` nạp bằng                            |
| ---------- | --------------------------------------------- | ------------------------------------------ |
| `system`   | `levels, topics, size, method, drill`         | `fetchVocab({…, random:true})`             |
| `personal` | `levels, topics, search, size, method, drill` | `fetchUserVocab(filter)` → map `VocabWord` |
| `word`     | `wordId`                                      | nạp đúng 1 từ                              |

> URL chỉ chở **run-defining** (`method/drill/size/source-filter`). Tuỳ chọn **forward-only/cosmetic** (localStorage pref) thuộc **đợt 2**.

**Vòng đời `/typing/play` (tối giản — đợt 1)**

```
A. RESOLVING   parse query → fetch (WarmingGate / LoadingSession)
                 ├─ 0 từ           → "Bộ lọc trống — Đổi thiết lập" (link /typing/setup)
                 └─ personal & 401  → redirect /login?next=…
        ▼
B. READY       hiện thẻ phiên (method · drill · N từ · nguồn)
                 [Bắt đầu gõ →]  hoặc phím đầu tiên = CHỐT
        ▼
C. LIVE        engine chạy; settings = spec/pref, đóng băng. retry/review-wrong nội bộ
        ▼  onComplete(result)
D. DONE        Summary (state nội bộ): Luyện lại · Luyện lại từ sai · Về thiết lập · Đổi phương pháp
```

**Cửa vào → đáp**

| Vào từ                              | Spec                                   | Đáp       |
| ----------------------------------- | -------------------------------------- | --------- |
| `/typing/setup` (đã cấu hình)       | đầy đủ                                 | B → C     |
| Kho từ vựng "Luyện bộ này / từ này" | source + filter, method/drill mặc định | A → B → C |
| Deep-link / F5 trên `/typing/play`  | từ URL                                 | A → B → C |
| `retry` / review-wrong              | nội bộ, cùng pool                      | thẳng C   |

#### Đợt 2 — Custom options khi vào play (DONE — D-14 · DONE-18)

> **Đã code (DONE-18):** cho phép chỉnh tuỳ chọn **giữa phiên Luyện tập** (Kiểm tra **vẫn khoá**). Pha **B READY** sửa tự do trước khi gõ; pha **C LIVE** mở ⚙ → **tạm dừng đồng hồ**, sửa theo ma trận dưới; `result` **gắn cờ "đã chỉnh giữa phiên"** → Summary hiện nhãn. `seed` deep-link **hoãn**.
>
> _Hiện thực_: in-play chỉ `repeat` là **cấu trúc** (→ luyện lại cùng bộ, cùng pool); `example:cloze` áp tới như hiển thị (forward-only).

**Ma trận quyền custom (đợt 2)**

| Pha                    | Cấu trúc (`repeat · size · example:cloze`)                                | Forward-only (`hint · feedback · example:show · live`) |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| **B READY**            | Sửa tự do                                                                 | Sửa tự do                                              |
| **C LIVE · Luyện tập** | Chọn → confirm → **run mới** (bump `runId`, reset thống kê, **giữ pool**) | Áp **từ từ kế tiếp** (toast)                           |
| **C LIVE · Kiểm tra**  | `LOCKED`                                                                  | `LOCKED` (`TEST_SETTINGS`)                             |

> **Bất biến**: _một run = một result với settings đóng băng_. Đổi cấu hình **cấu trúc** = một run mới ⇒ mỗi result luôn ứng đúng một rule-set. Sai cấu hình **không phải thoát phiên** — sửa ở pha B (trước) hoặc "Đổi & luyện lại" ở pha D (sau); cả hai là một bump `runId` trên **cùng pool**, không fetch lại.

**Đường nâng cấp** (để ngỏ, **không** làm bây giờ): nếu sau này có phương pháp non-typing dùng chung engine → cân nhắc nâng `/typing/play` → `/practice/play` (`method` vào spec). Hiện "Luyện câu" là feature riêng nên giữ `/typing/*`.

## 5. Hiện thực Neo-brutalism (as-built)

| File                                     | Vai trò                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/NeoCard.tsx`              | Card primitive                                                                                                                                                |
| `components/ui/NeoButton.tsx`            | Button primitive                                                                                                                                              |
| `components/ui/NeoBadge.tsx`             | Badge primitive                                                                                                                                               |
| `components/vocab/typing/primitives.tsx` | `Cell`, `Icon`, `Logo`, `StatPill`, `ProgressStrip`, `KeyboardMini`, `Star`                                                                                   |
| `app/neo.css`                            | Lớp tiện ích neo: `k-screen`, `k-wrap`, `k-card`, `k-b`/`k-b2`, `k-chip`, `k-btn`, `k-badge`, `k-focus`, `k-halftone`, `k-sidebar`; token `--neo-*`, `--sh-*` |

> §6 (anatomy 3 màn) lắp ráp trực tiếp từ các primitive & lớp tiện ích này.

## 6. Ba màn trọng tâm — Anatomy (as-built)

### 6.0. Mẫu chung "C·Split"

Cả Kho hệ thống (§6.2) và Kho của tôi (§6.3) dùng chung layout **C·Split** — 3 cột trong `k-screen k-b` (height 100%):

| Cột           | Kích thước                                                       | Vai trò                                       |
| ------------- | ---------------------------------------------------------------- | --------------------------------------------- |
| **RAIL**      | `0 0 310px`, `border-right`                                      | Tìm + lọc Cấp độ/Chủ đề + hành động đáy       |
| **DANH SÁCH** | `flex`, `overflow:auto`                                          | Các từ + nút **Tải thêm** (phân trang lô 100) |
| **CHI TIẾT**  | `0 0 360px`, `border-left`, nền `--neo-violet`, lớp `k-halftone` | Card chi tiết từ + Ví dụ + hành động          |

Chung: token `app/neo.css`, `Icon` primitives, phát âm `speak()` qua Web Speech (`lang=en-US`, im lặng nếu không hỗ trợ). Khác nhau ở **nguồn dữ liệu**, **badge nguồn** và **hành động ở panel chi tiết**.

### 6.1. Màn thiết lập phiên luyện (`SetupMethod`)

> Bước `setup` trong `TypingFlow` (§4.1). File [SetupMethod.tsx](../../apps/user-web/src/components/vocab/typing/SetupMethod.tsx). Toàn màn: header · vùng cuộn 3 bước · action bar cố định · drawer Tuỳ chọn.

**Luồng xử lý giao diện**

```
[warming] → SetupMethod   (state nội bộ: levels, topics, method, preset/customText, drill, settings)

MOUNT
 ├─ tour F-013 tự chạy 1 lần (isSetupTourDone) — xem lại bằng nút "?"
 └─ effect[ levelsKey, topicsKey ]  debounce 300ms
        └─ fetchVocabCount({levels, topics}) → matchCount   ("N từ khớp" ở action bar)

① NGUỒN TỪ      chips Cấp độ (mặc định A1, A2) · chips Chủ đề ("Tất cả" = rỗng = mọi chủ đề)
② PHƯƠNG PHÁP   M2 "Nghĩa VI → Gõ EN" [Ưu tiên]  /  M1 "Nghe → Gõ" (TTS) · +5 pp khác (khoá)
③ SỐ TỪ & CHẾ ĐỘ
     size = ô "Khác" (>0) ưu tiên, nếu trống → preset 20/50
     Luyện tập  |  Kiểm tra (khoá toàn bộ tuỳ chọn)
     [Tuỳ chọn] → drawer PracticeSettingsPanel  (locked = TEST_SETTINGS khi Kiểm tra)

ACTION BAR
     canStart = matchCount > 0 · sessionWords = min(size, matchCount)
     [ Luyện {N} từ → ] / [ Bắt đầu kiểm tra ] → onStart(...) → [loading] (§4.1)
```

**Trạng thái**

| State         | UI                                                                      |
| ------------- | ----------------------------------------------------------------------- |
| Đang đếm      | matchCount = "…", nút **disabled**                                      |
| Không có từ   | matchCount = 0 → nút **disabled**                                       |
| Nguồn dữ liệu | badge `API / Local / Cache / Seed / Đang nạp` (theo `loadState.source`) |
| Fallback      | `loadState.error` → badge đỏ "Fallback" cạnh số từ khớp                 |
| Kiểm tra      | Drawer hiện banner khoá + dùng `TEST_SETTINGS`, không cho chỉnh         |

### 6.2. Kho từ vựng hệ thống (`VocabLibrarySplit`)

> Route `/vocabulary` · tab **Kho hệ thống**. File [VocabLibrarySplit.tsx](../../apps/user-web/src/components/vocab/library/VocabLibrarySplit.tsx). Theo mẫu **C·Split** (§6.0). Dữ liệu thật, công khai.

**Luồng xử lý giao diện**

```
MOUNT
 ├─ fetchTopics() ───────────────────────► rail: render chips Chủ đề
 └─ effect[ levels, topics, search ]
        │  debounce 250ms · reset offset = 0
        ▼
     fetchVocab({ levels, topics, search, limit:100, offset:0, random:false })
        ├─ ok ──► setWords · hasMore = (len === 100) · giữ selKey nếu còn trong list
        └─ lỗi ─► words = [] · hasMore = false
        ▼
     RENDER danh sách (giữa)

ĐỔI LỌC (cấp độ / chủ đề / ô tìm) ──────► effect chạy lại từ đầu (offset 0)
CHỌN TỪ (click row) ──► setSelKey ──────► RENDER panel Chi tiết (phải)
TẢI THÊM ──► fetchVocab(offset = words.length) ──► nối list, lọc trùng theo keyOf

THÊM VÀO KHO (FR-PVOC-02) ──► pickSystemWord(word.id)
        ├─ 200 ──► đánh trạng thái `PICKED`
        ├─ 409 ──► đánh trạng thái `PICKED` (đã có sẵn — không báo lỗi)
        ├─ 401 ──► notice đỏ "Đăng nhập để lưu…"
        └─ khác ─► notice lỗi

PHÁT ÂM (TTS) ──► speak(en)
```

**Vùng & nguồn dữ liệu**

| Vùng      | Nội dung                                                                                                                                                                                       | Nguồn           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Rail      | Ô tìm (nền violet khi có chữ) · chips **Cấp độ** A1–C2 · chips **Chủ đề** (count + trạng thái chọn, chỉ render khi có topic) · nút **Luyện bộ này** (đáy, disabled khi chưa chọn từ)           | `fetchTopics()` |
| Danh sách | Mỗi từ = 1 nút: EN (124px, w900) · VI (ellipsis) · `LvBadge` · `PICKED` nếu đã pick · chevron. Từ chọn: nền vàng + `sh-md` + nhô `translate(-2,-2)`                                            | `fetchVocab`    |
| Chi tiết  | Card **Chi tiết từ** (EN 32px + nút TTS + IPA + VI + `LvBadge` + **từ loại `pos`** + topic) · card **Ví dụ** (vàng nhạt `k-focus`, ẩn nếu trống) · card **Kho cá nhân** · nút **Luyện từ này** | mục đang chọn   |

**Trạng thái**

| State                | UI                                                             |
| -------------------- | -------------------------------------------------------------- |
| Loading              | _"Đang nạp từ vựng…"_ (danh sách + panel)                      |
| Empty                | _"Không có từ nào khớp bộ lọc. Thử bỏ bớt cấp độ / chủ đề."_   |
| Đã có (409)          | Pick trùng → coi như đã trong kho, đánh trạng thái `PICKED`    |
| Chưa đăng nhập (401) | Notice _"Đăng nhập để lưu từ vào kho của bạn."_ (vẫn xem được) |

**Gap** — nút **Luyện từ này / Luyện bộ này** hiện chỉ `router.push("/typing")`, **chưa truyền nguồn từ đã chọn** → **FR-PVOC-08** (§7).

### 6.3. Kho của tôi (`MyVocabSplit`)

> Route `/vocabulary` · tab **Kho của tôi**. File [MyVocabSplit.tsx](../../apps/user-web/src/components/vocab/library/MyVocabSplit.tsx). Cùng mẫu **C·Split** (§6.0) nhưng cần đăng nhập; thêm modal **Tạo từ mới** với dedup-on-add.

**Luồng xử lý giao diện**

```
MOUNT
 ├─ fetchTopics() ───────────────────────► rail: render chips Chủ đề
 └─ effect[ levels, topics, search, reloadKey ]  debounce 250ms
        └─ fetchUserVocab({ search, levels, topics, page:1, pageSize:100 })
            ├─ ok ──► entries · total · page
            ├─ 401 ─► authError = true → AUTH GATE "Đăng nhập để dùng kho cá nhân"
            └─ lỗi ─► error message (card đỏ)
        ▼
     RENDER danh sách (badge nguồn: "Tự tạo" / "Hệ thống")

CHỌN TỪ ──► panel Chi tiết (badge nguồn + topic)
TẢI THÊM ──► fetchUserVocab(page+1) ──► nối, lọc trùng theo id
XÓA (FR-PVOC-07) ──► deleteUserVocab(id) ──► bỏ khỏi list, total--
SỬA (FR-PVOC-07) ──► modal EditWordForm ──► updateUserVocab(id, { customVi, customExample, note }) ──► thay entry (override hiển thị)

+ TẠO TỪ MỚI ──► modal CreateWordForm ──► createUserVocab({ en, vi, example, level, topic, allowVariant })
     ├─ status "linked"  → trùng từ hệ thống sau normalizeEn → liên kết wordId → đóng + reload
     ├─ status "created" → không trùng → tạo custom (normalizedEn) → đóng + reload
     ├─ status "suggest" → biến thể (lemma) → dialog:
     │      [ Dùng từ gốc ] → pickSystemWord(candidate.id)
     │      [ Giữ "x" riêng ] → submit(allowVariant = true) → tạo custom
     ├─ 401 → "Đăng nhập để lưu vào kho của bạn."
     └─ 409 → "Từ này đã có trong kho của bạn."
```

**Khác biệt so với §6.2**

| Vùng      | Kho của tôi                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Rail      | Ô tìm "Tìm trong kho…" + Cấp độ + Chủ đề + nút **+ Tạo từ mới** + đáy đếm `total / đang hiển thị`                                 |
| Danh sách | Eyebrow "Kho của tôi · N"; mỗi entry có **badge nguồn** Tự tạo (violet) / Hệ thống                                                |
| Chi tiết  | Badge nguồn + **từ loại `pos`** + topic + **ghi chú**; hành động **Xóa** · **Sửa** (override VI/ví dụ/ghi chú) · **Luyện từ này** |
| Modal     | `CreateWordForm` (dedup-on-add) · `EditWordForm` (sửa/override → `PATCH`)                                                         |

**Trạng thái**

| State                | UI                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| Chưa đăng nhập (401) | **Auth gate**: card "Đăng nhập để dùng kho cá nhân" + nút Đăng nhập                                           |
| Loading              | Eyebrow "Kho của tôi · đang nạp…"                                                                             |
| Empty                | _"Không có từ nào khớp bộ lọc. Thêm từ ở **Kho hệ thống**, bấm **Tạo từ mới**, hoặc bỏ bớt cấp độ / chủ đề."_ |
| Error                | Card đỏ thông báo lỗi                                                                                         |

**Đã đóng** — **FR-PVOC-08** (đợt 1): nút "Luyện…" truyền nguồn vào `/typing/play` (§4.6). **FR-PVOC-07**: `EditWordForm` sửa/override (override trên từ tham chiếu hiển thị nhờ `toDto` ưu tiên custom). **Còn lại**: custom-options lifecycle khi vào play = đợt 2 (T-13, §4.6).

## 7. RISK

> RISK ID chuẩn tập trung ở `context/PROJECT-STATE.md` §2 — phần này chỉ ghi quan sát UI cục bộ.

- `design.md` chỉ đánh số `## 8.x`, thiếu mục 1–7. File gốc giữ nguyên — tài liệu này đã sắp xếp lại.
- Một số component neo (`NeoCard`, `NeoButton`, `NeoBadge`) còn ở dạng primitive — chưa có design token centralized đầy đủ trong CSS variables.
- **V2.1 — kho cá nhân**: luyện gõ từ kho (**FR-PVOC-08** đợt 1) và sửa/override entry (**FR-PVOC-07**) đã có UI. Còn custom-options lifecycle khi vào play (đợt 2 — T-13). Xem `08-test` T-PVOC-07 và PROJECT-STATE.
