# 06 — Thiết kế UI/UX và Design System

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Thiết kế UI/UX và Design System |
| Mã tài liệu | `06-ui-ux` |
| Dự án | KeyLish |
| Phiên bản | 0.1.2 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu — nhập từ `doc/design.md` (giữ file gốc). |
| 0.1.1 | 2026-06-15 | AI Agent | G-7: gắn nhãn ⬜ cho component thiết kế chưa build (§2.5/§2.6). |
| 0.1.2 | 2026-06-15 | AI Agent | Phase ③ V2.1: thêm §7 UI kho cá nhân (layout C·Split — đã build `VocabLibrarySplit`). |

### 1.3. Tham chiếu

- `doc/design.md` — nguồn gốc (giữ file gốc)
- `01-srs.md` — UC-01 luyện gõ
- `03-lld.md` — engine typing flow

## 2. Design System: Neo-brutalism

> Nội dung phần này được nhập nguyên từ `doc/design.md` (MỤC 8). File gốc giữ làm nguồn.

### 2.0. Tinh thần & 3 điều chỉnh KeyLish

**Neo-brutalism DNA:** viền đen dày (`border-4`), hard shadow offset 45° zero blur, "sticker" effect, mechanical interaction (push-down như công tắc).

**3 điều chỉnh:**
1. **Focus Zone tĩnh lặng**: khu vực đọc & gõ không xoay, không texture, leading thoáng
2. **Motif "KEYCAP"**: nút tạo hình phím bàn phím nhấn xuống
3. **Chrome loud, content calm**: vỏ mạnh mẽ, nội dung học rõ ràng

### 2.1. Tokens — Màu sắc

| Token | Hex | Vai trò |
|---|---|---|
| `neo-bg` | `#FFFDF5` | Nền cream |
| `neo-ink` | `#000000` | Text, viền, shadow (không xám) |
| `neo-yellow` | `#FFD93D` | Primary CTA |
| `neo-violet` | `#C4B5FD` | Info/secondary/focus |
| `neo-red` | `#FF6B6B` | Error/destructive |
| `neo-green` | `#6BCB77` | Success/correct |
| `neo-white` | `#FFFFFF` | Panel tương phản |

⚠️ Không dùng màu đơn độc báo đúng/sai — luôn kèm icon + hình dạng.
⚠️ Đỏ không còn là CTA (CTA chính = vàng).

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

### 2.5. KeyLish-specific Components

| Component | Mô tả | Trạng thái |
|---|---|---|
| **Char-by-char Cell** | Đúng=xanh, sai=đỏ+gạch, chưa gõ=mờ, con trỏ=đen | ✅ (typing) |
| **Stats/Summary** | Panel số lớn viền dày color-blocking | ✅ |
| **SourcePane** | Focus Zone — hiển thị nghĩa nguồn (trong TypingScreen) | ✅ |
| **TranslationInput** | Textarea neo lớn, nút "GỬI CÂU" — tính năng dịch | ⬜ (deferred V2, D-04) |
| **DiffView** | Chip xanh ✓ / đỏ ✗ — tính năng dịch/AI | ⬜ (deferred V2, D-04) |
| **ReferenceReveal** | Panel bản tham chiếu | ⬜ (deferred V2, D-04) |
| **AiFeedbackPanel** | Điểm + nhận xét AI | ⬜ (deferred V2, D-04) |
| **Flashcard** | Card viền, lật snap, sticker "ĐÃ THUỘC" | ⬜ (V2) |
| **Quiz** | Keycap đáp án, chấm màu + icon | ⬜ (V2) |

> Component as-built thực tế (neo primitives) liệt kê ở §5. Các mục ⬜ là tầm nhìn design-system từ `design.md`, **chưa build**.

### 2.6. Focus Zone (BẮT BUỘC)

Áp dụng: SourcePane (✅) và — khi build tính năng dịch (⬜ V2) — TranslationInput, ReferenceReveal.
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
- Đúng/sai = màu + icon + hình dạng
- Focus rõ: violet nền / ring-2 black
- Touch target ≥ h-12

## 3. Luồng UI (User Flow)

### 3.1. UC-01: Luyện gõ

```
Trang chủ (/)
  → Chọn "Bắt đầu luyện"
  → TypingFlow:
    1. SetupMethod.tsx — chọn topic pills + CEFR + mode (M1/M2)
    2. Load vocab (fetchVocab — loading state)
    3. TypingScreen.tsx / ListenScreen.tsx:
       - ProgressStrip (từ X / Y, thanh tiến trình)
       - SourcePane (nghĩa VI / TTS)
       - Input cell row (char-by-char)
       - StatPill (WPM, accuracy, streak)
       - KeyboardMini (gợi ý phím tiếp theo)
    4. Summary.tsx:
       - Panel số lớn: correct, wrong, WPM, accuracy
       - Danh sách từ sai (WordCell)
       - Nút "Luyện lại" / "Về trang chủ"
```

### 3.2. UC-02/03: Đăng ký / Đăng nhập

```
Trang chủ → "Đăng nhập" / "Đăng ký"
  → AuthFrame:
    - Form input neo (email, password, displayName)
    - Submit keycap primary
    - Lỗi validation inline (Zod client-side)
    - Success → redirect về trang chủ (có session)
```

### 3.3. UC-04: Quên / Đặt lại mật khẩu

```
Trang chủ → "Quên mật khẩu" → nhập email → submit
  → Thông báo "Kiểm tra email" (dù email có tồn tại hay không)
  → Link mail → /reset-password?token=...
  → Form nhập mật khẩu mới → submit → redirect login
```

### 3.4. State: Loading / Error / Empty

| State | UI behavior |
|---|---|
| Loading | loader/spinner trong khung viền; từ seed hiện ngay nếu có |
| Error | Thông báo trong card; fallback cache/seed tự động |
| Empty (không từ) | Card "Không có từ vựng cho bộ lọc này" + đề xuất thay đổi |
| Permission (401) | Redirect login; giữ nguyên trang hiện tại khi guest |

## 4. Màn hình hiện tại (as-built)

| Route | Component | Trạng thái |
|---|---|---|
| `/` | Home page + Welcome Tour | ✅ |
| `/typing` | TypingFlow → Setup → Typing/Listen → Summary | ✅ |
| `/login` | AuthFrame (login) | ✅ |
| `/register` | AuthFrame (register) | ✅ |
| `/forgot-password` | Forgot form | ✅ |
| `/reset-password` | Reset form | ✅ |
| `/settings/account` | Account settings | ✅ |
| `/dang-phat-trien` | "Đang phát triển" page | ✅ |
| `/dang-phat-trien/[feature]` | Feature-specific "coming soon" | ✅ |
| Admin dashboard 🚧 | Ant Design pages | 🚧 |

## 5. Neo-brutalism Implementation (as-built)

| File | Component |
|---|---|
| `components/ui/NeoCard.tsx` | Card primitive |
| `components/ui/NeoButton.tsx` | Button primitive |
| `components/ui/NeoBadge.tsx` | Badge primitive |
| `components/vocab/typing/primitives.tsx` | Cell, Icon, StatPill, ProgressStrip, KeyboardMini, Star |

## 6. RISK

- `design.md` chỉ đánh số `## 8.x`, thiếu mục 1–7. File gốc được giữ nguyên — tài liệu này đã sắp xếp lại.
- Một số component neo (NeoCard, NeoButton, NeoBadge) còn ở dạng primitive — chưa có design token centralized trong CSS variables đầy đủ.

## 7. (V2.1) Kho từ vựng cá nhân — UI

> Layout **"C · Split — danh sách + chi tiết"**, nhập từ bundle Claude Design (`library.jsx · LibSplit`). Đã có **bản dựng** (✅ UI; nối API kho cá nhân ⬜).

### 7.1. Layout Split (đã build)

- File: [`VocabLibrarySplit.tsx`](../../apps/user-web/src/components/vocab/library/VocabLibrarySplit.tsx), route `/kho-tu-vung`.
- 3 cột: **rail lọc** (search + cấp độ + chủ đề) · **danh sách** (chọn từ; từ chọn nền vàng + dịch lên 2px) · **panel chi tiết** (nền violet + halftone: từ + IPA + nút TTS, divider, nghĩa VI, badge cấp/chủ đề, card ví dụ vàng-nhạt, card "Kho cá nhân", nút "Luyện từ này").
- Tái dùng design tokens `app/neo.css` (đã port sẵn từ chính bundle) + `Icon` (primitives). Dữ liệu thật từ `fetchVocab`; phát âm qua Web Speech (TTS).

### 7.2. State (loading / empty / permission)

- Loading: eyebrow "đang nạp…"; panel chi tiết "Đang nạp từ vựng…".
- Empty: card "Không có từ nào khớp bộ lọc".
- Pick (FR-PVOC-02): nút "Thêm vào kho của tôi" → xong đổi badge xanh "Đã trong kho". Gợi ý **biến thể** (FR-PVOC-05) sẽ là dialog chọn (⬜ chờ API).
- Permission: thao tác "Thêm" yêu cầu đăng nhập (FR-PVOC-09) — nối khi có API.

### 7.3. A11y

Theo chuẩn neo §2.9: báo trạng thái bằng **màu + icon** (✓), nút chỉ-icon có `aria-label` (vd nút phát âm), tương phản AA, tôn trọng `prefers-reduced-motion` (đã trong `neo.css`).
