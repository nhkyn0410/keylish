## 8. Design System — Neo-brutalism cho KeyLish ✅

> Đây là design system bắt buộc khi dựng/redesign UI KeyLish. Khi viết code: **centralize token**, ưu tiên component tái sử dụng & composable, tránh style một-lần (one-off), khớp stack hiện có (Next.js App Router + Tailwind + TS), giải thích ngắn lý do thiết kế, và **thể hiện cá tính neo-brutalism — không tạo UI generic**.

### 8.0. Tinh thần & 3 điều chỉnh cho KeyLish

**Neo-brutalism DNA (giữ nguyên):** viền đen dày (`border-4` mặc định — _không có viền là không tồn tại_), hard shadow offset 45° **zero blur**, hiệu ứng "sticker" (xoay nhẹ, chồng lớp), organized chaos, raw/Web-1.0, maximal, tương tác **mechanical** (nhấn xuống như công tắc).

**3 điều chỉnh đặc thù KeyLish:**

1. **Focus Zone tĩnh lặng** — khu vực đọc đoạn nguồn & gõ bản dịch phải dễ đọc, **không xoay, không texture sau chữ**, leading thoáng (xem 8.5). Người học ngồi lâu, không thể để "visual noise" gây mỏi.
2. **Motif "KEYCAP"** — tận dụng hiệu ứng push-down: nút chính & đáp án quiz tạo hình **phím bàn phím nhấn xuống**. Đây là điểm gắn thẩm mỹ với thương hiệu KeyLish (app gõ phím).
3. **Chrome loud, content calm** — vỏ (nav/nút/badge/card) mạnh mẽ; nội dung học (đoạn văn, bảng từ, quiz) ưu tiên rõ ràng.

### 8.1. Tokens — Màu sắc

**Bảng màu nền (base palette):**
| Token | Hex | Vai trò |
|---|---|---|
| `neo-bg` | `#FFFDF5` | Nền cream (canvas, ruột card, panel tương phản) |
| `neo-ink` | `#000000` | Đen thuần: TẤT CẢ text, viền, shadow. **Không dùng xám.** |
| `neo-yellow` | `#FFD93D` | Vàng vivid |
| `neo-violet` | `#C4B5FD` | Violet mềm |
| `neo-red` | `#FF6B6B` | Đỏ hot |
| `neo-green` | `#6BCB77` | **Xanh (mới thêm cho KeyLish)** |
| `neo-white` | `#FFFFFF` | Panel tương phản, text trên nền đen |

**Token ngữ nghĩa (semantic — BẮT BUỘC dùng đúng nghĩa):**
| Semantic | = màu | Dùng cho |
|---|---|---|
| `primary` (CTA) | **Vàng** | Nút hành động chính (Gửi câu, Kiểm tra, Bắt đầu), trạng thái được chọn |
| `success` / correct | **Xanh** | Câu/từ **đúng**, từ **đã thuộc**, hoàn thành |
| `error` / incorrect | **Đỏ** | Câu/từ **sai**, lỗi, hành động xóa (destructive) |
| `info` / secondary / focus | **Violet** | Nút phụ, panel thông tin, **nền focus của input**, color-blocking section |

> ⚠️ **Đỏ KHÔNG còn là màu CTA** (tránh đụng nghĩa "sai"). CTA chính = Vàng.
> ⚠️ **Không bao giờ dùng MÀU đơn độc để báo đúng/sai.** Luôn kèm **icon + hình dạng/nhãn** (✓/✗, gạch dưới/gạch ngang) để an toàn cho người mù màu (xem 8.4, 8.9).

**Quy tắc:** không dùng xám subtle (#333/#666); tương phản cao bắt buộc (WCAG AA); section xen kẽ cream/violet/vàng/đen tạo nhịp thị giác. Text đen trên vàng/xanh/violet/cream đều đạt AA; text trắng chỉ dùng trên nền đen.

### 8.2. Tokens — Typography

- **Font duy nhất: `Be Vietnam Pro`** (Google Fonts) — hỗ trợ **đầy đủ dấu tiếng Việt** + Latin, có weight nặng. Thay cho Space Grotesk (dấu tiếng Việt yếu).
  `https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;900&display=swap`
- **Weights:** **Black 900** (`font-black`) cho heading; **Bold 700** (`font-bold`) cho body/label/nút; **Medium 500** dùng dè dặt. Tránh weight nhẹ.
- **Scale:** Display `text-7xl→text-9xl`; H2 `text-5xl→text-7xl`; H3 `text-3xl→text-5xl`; Body lớn `text-xl→text-2xl`; Body `text-base→text-lg`; Nhãn `text-sm`.
- **Kỹ thuật:** text-stroke (`-webkit-text-stroke: 2px black; color: transparent`) cho heading rỗng cỡ lớn; **UPPERCASE** cho heading/nhãn/nút; tracking `tracking-tighter` (headline) / `tracking-widest` (nhãn); leading `leading-none`/`leading-[0.9]` cho display.
- **🔑 Ngoại lệ readability (Focus Zone):** **đoạn nguồn cần đọc, bản dịch người học gõ, và bản tham chiếu KHÔNG viết UPPERCASE, KHÔNG text-stroke, KHÔNG tracking chặt.** Dùng `font-bold`, cỡ `text-lg→text-2xl`, `leading-relaxed`, căn trái. Mục tiêu: đọc trôi chảy.

### 8.3. Tokens — Borders, Radius, Shadows, Patterns

- **Radius:** mặc định `rounded-none` (góc sắc). Chỉ `rounded-full` cho pill badge / sticker tròn. **Không** `rounded-md/lg/xl`.
- **Borders:** `border-4` mặc định (đen). `border-2` cho separator/ghost; `border-8` cho divider lớn/hero. Luôn `border-black`.
- **Hard shadows (zero blur, offset bottom-right):** `shadow-[4px_4px_0px_0px_#000]` (S) · `8px` (M) · `12px` (L) · `16px` (XL). Trên nền đen dùng shadow trắng `shadow-[8px_8px_0px_0px_#fff]`.
- **Patterns/textures:** halftone dots / grid / noise SVG để tạo độ dày thị giác. **🔑 Quy tắc KeyLish:** texture chỉ dùng ở **chrome/khoảng trang trí**, **KHÔNG đặt sau** đoạn văn cần đọc, ô gõ, bảng từ vựng hay danh sách dữ liệu.

### 8.4. Component primitives (neo-brutalism)

**Button (Keycap):** chữ nhật góc sắc, `h-12→h-14`, `border-4 border-black`, `font-bold uppercase tracking-wide`, hard shadow `shadow-[4px_4px_0px_0px_#000]`. Màu theo semantic: primary=`bg-neo-yellow`, secondary/info=`bg-neo-violet`, destructive=`bg-neo-red`, outline=`bg-white`. **Push effect:** `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none` `transition-all duration-100` — cảm giác **nhấn phím**.

**Card / Container:** `bg-white border-4 border-black rounded-none` + shadow `8px→12px`. **Lift on hover:** `hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] duration-200`. Header có thể `bg-neo-violet border-b-4 border-black`.

**Input / Textarea:** `border-4 border-black rounded-none bg-white font-bold text-lg`, `placeholder:text-black/40`. **Focus = đổi nền Violet** (không dùng ring mềm): `focus-visible:bg-neo-violet focus-visible:shadow-[4px_4px_0px_0px_#000] focus-visible:outline-none`. (Ô gõ bản dịch áp dụng Focus Zone — xem 8.5.)

**Navigation:** logo trong hộp `border-4 border-black bg-neo-yellow` chữ in hoa; link bold uppercase, hover thêm viền + nền + shadow; mobile = hamburger hộp viền, drawer xếp nút có viền.

**Badge:** pill (`rounded-full`) hoặc vuông (`border-4`), nền màu + viền + shadow, `font-black text-sm uppercase tracking-widest`; có thể đặt absolute lệch góc & xoay (`rotate-3`).

**Icon:** `lucide-react`, `stroke-[3px]`/`stroke-[4px]`, đặt trong hộp viền khi cần nhấn. Motif: `<Star/>`, `<ArrowRight/>`, hình khối trang trí.

### 8.4-bis. Component đặc thù KeyLish (quan trọng)

- **SourcePane (đoạn nguồn):** card Focus Zone — nền cream/trắng, viền dày, **KHÔNG xoay/texture/uppercase**, text `text-xl leading-relaxed`. Nhãn chiều dịch (EN→VI) là badge nhỏ ở góc.
- **TranslationInput:** textarea neo cỡ lớn (`min-h-40`), Focus Zone (focus nền violet rất nhạt hoặc chỉ viền + shadow để không chói khi gõ lâu). Nút **"GỬI CÂU"** = keycap primary (vàng).
- **DiffView (chấm mềm):** từ **trùng** = chip nền `neo-green` + ✓; từ **chưa khớp** = chip nền `neo-red` + ✗ (gạch). **Phân biệt bằng icon + màu**, không chỉ màu. Phần chưa khớp có thể gạch chân kiểu marker.
- **SimilarityScore:** số lớn `font-black` trong hộp viền dày + shadow, màu nền theo ngưỡng (cao=xanh, trung bình=vàng, thấp=đỏ) **kèm nhãn %** (không chỉ màu).
- **ReferenceReveal:** panel violet đóng/mở (toggle keycap), bên trong là Focus Zone hiển thị bản tham chiếu dễ đọc.
- **AiFeedbackPanel:** card viền; điểm + nhận xét tiếng Việt; danh sách lỗi là các hàng có viền, mỗi lỗi gắn **badge phân loại** (ngữ pháp/từ vựng/cấu trúc/ngữ cảnh). Khi chưa có key: hiển thị trạng thái rõ + nút mở Cấu hình AI.
- **Gõ từ vựng (char-by-char):** mỗi ký tự một trạng thái — **đúng** = `neo-green` (nền/gạch dưới), **sai** = `neo-red` + gạch ngang, **chưa gõ** = `text-black/40`, **con trỏ hiện tại** = khối đen đặc nhấp nháy. Từ sai (chế độ kiểm tra) hiện badge "SAI — gõ lại" và quay về cuối vòng.
- **Flashcard:** card viền dày + shadow; **lật kiểu "snap"** (đổi mặt nhanh `duration-200`, tránh xoay 3D mượt). Tem "ĐÃ THUỘC" = sticker `neo-green` xoay nhẹ; nút TTS = keycap icon loa.
- **Quiz:** mỗi đáp án = keycap button; khi chấm: đúng = viền/nền `neo-green` + ✓, sai = `neo-red` + ✗; màn kết quả = panel số lớn + danh sách câu sai (hàng viền).
- **Vocabulary list:** hàng có viền, toggle "đã thuộc" = stamp xanh; filter chủ đề = pill viền chọn được (selected = nền vàng).
- **Stats/Summary:** các panel số lớn viền dày, color-blocking (số câu, tốc độ gõ TB, điểm TB, tổng lỗi).
- **BYOK Settings:** input neo (key che `••••`), chọn provider = nhóm nút segmented viền; lưu cục bộ; cảnh báo HTTPS khi cần.

### 8.5. Focus Zone — ngoại lệ readability (BẮT BUỘC)

Áp dụng cho: SourcePane, TranslationInput, ReferenceReveal, vùng nội dung đọc dài.

- KHÔNG xoay (`rotate-*`), KHÔNG texture/pattern sau chữ, KHÔNG uppercase, KHÔNG text-stroke.
- `font-bold`, cỡ `text-lg→text-2xl`, `leading-relaxed`, căn trái, độ rộng dòng dễ đọc (`max-w-prose`).
- Vẫn giữ viền + shadow của khung (chrome) — chỉ **nội dung bên trong** mới tĩnh lặng.

### 8.6. Motion

- Nhanh & mechanical: nút `duration-100`; card/hover `duration-200`. Easing `ease-out`/`ease-linear`, **tránh** `ease-in-out` chậm.
- Hiệu ứng: nút push-down; card lift; badge xoay thêm khi hover; spin chậm/pulse/bounce cho phần trang trí.
- **🔑 Vùng gõ/đọc:** hạn chế animation (không bounce/spin) để không phân tán khi luyện. Tôn trọng `prefers-reduced-motion: reduce` (tắt spin/bounce/pulse).

### 8.7. Layout

- `container mx-auto max-w-7xl/6xl`; spacing dày (`gap-6→gap-12`, section `py-16→py-32`).
- Sticker effect (`rotate-1`, `-rotate-2`, `rotate-3`) + overlap (absolute) + asymmetry (60/40, 70/30): **chỉ cho chrome/trang trí**. **Form, bảng dữ liệu, vùng đọc/gõ giữ căn thẳng**, không xoay.
- Marquee/visual-chaos: dùng tiết chế cho banner/section divider, **không** chèn vào luồng học.

### 8.8. Anti-patterns

Cấm: blur/backdrop-blur, shadow có blur, gradient mềm, `rounded-md/lg/xl`, xám subtle, animation `ease-in-out` chậm. **Riêng KeyLish:** không xoay/texture nội dung đọc; **không báo đúng/sai chỉ bằng màu**; không UPPERCASE đoạn văn nguồn dài.

### 8.9. Accessibility

- Tương phản WCAG AA (đen trên cream/vàng/xanh/violet OK; trắng chỉ trên đen). Đảm bảo dấu tiếng Việt hiển thị đúng (Be Vietnam Pro).
- **Đúng/sai = màu + icon + hình dạng/nhãn** (mù màu vẫn phân biệt được).
- Focus rõ: `focus-visible` đổi nền violet (input) hoặc `ring-2 ring-black ring-offset-2` (nút/link).
- Reduced motion; điều hướng bàn phím đầy đủ; HTML ngữ nghĩa (`<button>`, `<nav>`, `<main>`); `aria-label` cho nút chỉ-icon; `aria-live` cho điểm/nhận xét; touch target ≥ `h-12`.

---
