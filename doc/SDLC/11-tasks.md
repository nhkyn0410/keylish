# 11 — Phân chia Công việc Hoàn thiện (Task Breakdown)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Phân chia Công việc Hoàn thiện |
| Mã tài liệu | `11-tasks` |
| Dự án | KeyLish |
| Phiên bản | 0.1.1 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu — các task sau bootstrap SDLC. |
| 0.1.1 | 2026-06-15 | AI Agent | Sửa F-3: trace T-02 (R-6→R-1/Swagger), bỏ tham chiếu treo R-7b ở T-03. |

## 2. Quy ước

- Mỗi task có Definition of Done (DoD)
- Priority: **Cao** (blocker) · **Trung** · **Thấp**
- Trace về FR/UC/RISK/OQ

## 3. Task list

### T-01: Sửa README khớp as-built

| Trường | Giá trị |
|---|---|
| Priority | **Cao** |
| Trace | R-1, R-2, R-4, R-8, D-02 |
| DoD | README: API mô tả đúng (có auth/admin/traffic); DB ghi Supabase; bỏ trỏ file không tồn tại; sửa local-first mô tả |
| Phụ thuộc | 05-api, 09-deployment đã viết |

### T-02: Cập nhật OpenAPI Description

| Trường | Giá trị |
|---|---|
| Priority | Trung |
| Trace | R-1, Swagger description (mô tả "read-only" lỗi thời) |
| DoD | `main.ts` `DocumentBuilder.setDescription` cập nhật mô tả không còn "read-only" |
| Phụ thuộc | — |

### T-03: Bổ sung unit test cho engine gõ (vùng MANDATORY)

| Trường | Giá trị |
|---|---|
| Priority | **Cao** |
| Trace | T-IME-01..10, R-7 |
| DoD | Tối thiểu 6/10 test case trong `useTypingSession` pass: `computeCells`, `clean()`, IME composition, RepeatMode "none/once/until" |
| Ghi chú | Cần tách `computeCells` và `clean()` thành pure functions trước khi test |

### T-04: Bổ sung unit test cho auth (vùng MANDATORY)

| Trường | Giá trị |
|---|---|
| Priority | Trung |
| Trace | T-ATH-09..12 |
| DoD | Test reset token one-time + expired + rate-limit + timing attack |
| Phụ thuộc | — |

### T-05: Bổ sung test cho traffic idempotent

| Trường | Giá trị |
|---|---|
| Priority | Thấp |
| Trace | T-TRF-04..05 |
| DoD | Test increment đúng, range analytics |

### T-06: Tách engine gõ từ components/ → domain/ + unit-test

| Trường | Giá trị |
|---|---|
| Priority | Trung |
| Trace | OQ-04, D-05, R-5 |
| DoD | `computeCells`, `clean()`, `finalize()` tách thành pure functions trong `domain/vocab-typing/`. `useTypingSession` gọi từ domain. Unit test viết cho domain |
| Ghi chú | Không phá vỡ UI hiện tại |

### T-07: Kết nối admin-web với @keylish/shared

| Trường | Giá trị |
|---|---|
| Priority | Trung |
| Trace | FR-ADM-07, R-7 admin-web |
| DoD | admin-web dùng `VocabQuerySchema`, `WordDTOSchema` từ shared; không định nghĩa lại type |
| Phụ thuộc | — |

### T-08: Rate limit persistence

| Trường | Giá trị |
|---|---|
| Priority | Thấp |
| Trace | RISK rate-limit in-memory |
| DoD | Rate limit dùng DB-backed (hoặc Redis nếu có) thay vì Map in-memory |
| Ghi chú | V1 scale nhỏ chưa cần; nên làm trước khi public |

### T-09: Pre-commit hook (lint + typecheck)

| Trường | Giá trị |
|---|---|
| Priority | Thấp |
| Trace | `00-coding-standard` §5.3 |
| DoD | Husky/lint-staged chạy ESLint + Prettier trước commit |
| Ghi chú | Không block, chỉ warning |

### T-10: Thiết lập CI pipeline

| Trường | Giá trị |
|---|---|
| Priority | Trung |
| Trace | R-7 |
| DoD | GitHub Actions: `pnpm install → pnpm check → pnpm test` trên push/PR |
| Ghi chú | Render + Vercel deploy tự động đã có |

## 4. Dependency graph

```
T-01 (sửa README)
  └── phụ thuộc: 05-api, 09-deployment ✅

T-03 (engine test)
  └── phụ thuộc: T-06 (tách domain) — có thể làm song song nếu test pure functions trước

T-06 (tách domain)
  ├── hỗ trợ: T-03
  └── phụ thuộc: không phá vỡ UI

T-04 + T-05 (auth/traffic test)
  └── độc lập

T-07 (admin-web shared)
  └── độc lập (cần shared schema)

T-08 (rate limit)
  └── độc lập

T-09 + T-10 (CI)
  └── độc lập (nên làm sớm)
```

## 5. Priority tổng

| Ưu tiên | Task | Lý do |
|---|---|---|
| **Cao** | T-01 (sửa README) | Sai lệch thông tin public |
| **Cao** | T-03 (engine test) | Vùng dễ lỗi nhất, chưa có test |
| Trung | T-06 (tách domain) | Hỗ trợ T-03, giảm tech-debt |
| Trung | T-04 (auth test) | Bảo mật cần test |
| Trung | T-07 (admin-web) | Hoàn thiện admin |
| Trung | T-10 (CI) | Quality gate |
| Thấp | T-05 (traffic test) | Ít rủi ro |
| Thấp | T-02 (Swagger desc) | Mỹ phẩm |
| Thấp | T-08 (rate limit) | Scale |
| Thấp | T-09 (pre-commit) | Convenience |
