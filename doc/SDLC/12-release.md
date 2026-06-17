# 12 — Ghi chú Phát hành và Nhật ký Thay đổi (Release Notes & Change Log)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Ghi chú Phát hành và Nhật ký Thay đổi |
| Mã tài liệu | `12-release` |
| Dự án | KeyLish |
| Phiên bản | 0.1.1 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu — log V1.0.0 as-built. |
| 0.1.1 | 2026-06-15 | AI Agent | G-5: làm rõ số chủ đề (full DB ~14 / seed 8), bỏ "~52%" chưa kiểm chứng. |

## 2. V1.0.0 (hiện tại)

**Ngày phát hành**: 2026-06-15 (ước lượng — là phiên bản hiện tại của codebase)

### Tính năng

#### Luyện gõ từ vựng
- Engine gõ char-by-char, an toàn với IME tiếng Việt (compositionstart/end)
- Chọn chủ đề + cấp độ CEFR (A1–C2) + mode luyện (nghĩa VI→gõ EN, nghe TTS→gõ EN)
- Tự động lặp từ sai (none/once/until)
- Tổng kết phiên: WPM, accuracy, danh sách từ sai
- Local-first: 3 tầng API → IndexedDB cache → seed offline (112 từ)
- Prewarm API để giảm cold start Render

#### Auth người học
- Đăng ký (email + password ≥12 ký tự), đăng nhập, đăng xuất
- Cookie session (TTL 30 ngày), CSRF double-submit
- Quên & đặt lại mật khẩu (mail qua Resend, token one-time 2h)
- Đổi mật khẩu (thu hồi các phiên khác)
- Xem & cập nhật hồ sơ

#### Admin
- API admin (dashboard summary, quản user, vocab, topics)
- Admin API gated (mặc định OFF production)
- Admin-web UI (Ant Design, scaffold 🚧)

#### Traffic analytics
- Page-view counting aggregate-on-write (1 dòng/giờ UTC)
- Beacon gửi 1 lần/phiên trình duyệt (sessionStorage)

#### Kho từ vựng
- Pipeline build từ Words-CEFR-Dataset (MIT) + kaikki/Wiktionary (CC BY-SA)
- Full DB: tối đa ~14 chủ đề (tỉ lệ từ có chủ đề tùy dữ liệu — ASSUMPTION). Seed offline: 8 chủ đề / 112 từ.
- Seed offline 112 từ curated

### Kỹ thuật
- Monorepo pnpm 10.27 + Turborepo 2.9
- NestJS 11 + Express (API)
- Next.js 16 App Router + React 19 (user-web)
- Next.js 16 + Ant Design 6 (admin-web 🚧)
- Prisma 7 + PostgreSQL (Docker/Supabase)
- Zod 4 (validation + type)
- Argon2id (password), HMAC-SHA256 + pepper (token)
- Vitest + Supertest (test)
- Render (api) + Vercel (user-web) + Supabase (DB)

### Biết trước / Hạn chế
- Rate limit in-memory (mất khi restart)
- Coverage test thấp (--passWithNoTests)
- Engine gõ chưa tách domain/ → components/
- README lệch với code thật
- Admin-web chưa hoàn thiện (chưa nối @keylish/shared)
- OpenAPI mô tả "read-only" — không chính xác

## 3. V2 (kế hoạch — ⬜ chưa code)

Các tính năng được ghi nhận cho V2, deferred theo D-04:

| Tính năng | Ghi chú |
|---|---|
| AI feedback + BYOK | Khung UI đã có (design.md), route `.gitkeep` |
| Flashcard mode | `domain/flashcard/` rỗng |
| Quiz mode | `domain/quiz/` rỗng |
| OAuth (Google, GitHub) | `AuthProvider` enum mới có `PASSWORD` |
| Lịch sử/tiến độ phiên luyện | Hiện chỉ tính trong phiên |
| Admin-web hoàn thiện | Kết nối shared, deploy? (xem OQ-10) |

## 4. Lịch sử commit đáng chú ý

> Đây là tóm tắt dựa trên git log (không phải changelog đầy đủ). Git log chi tiết: `git log --oneline`.

| Thời gian | Nội dung |
|---|---|
| 2026-06 | Thiết lập monorepo, các module API cốt lõi, auth, user-web engine gõ |
| 2026-05 | Prisma schema, dataset pipeline, seed |
| (trước) | Design system neo-brutalism, project scaffold |
