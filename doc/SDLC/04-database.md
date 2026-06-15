# 04 — Thiết kế Cơ sở Dữ liệu (Database Design)

## 1. Thông tin tài liệu

### 1.1. Metadata

| Trường | Giá trị |
|---|---|
| Tên | Thiết kế Cơ sở Dữ liệu (Database Design) |
| Mã tài liệu | `04-database` |
| Dự án | KeyLish |
| Phiên bản | 0.2.1 |
| Trạng thái | Draft |
| Người viết | AI Agent (soạn thảo SDLC) |
| Người duyệt | Nguyễn Hồng Khanh |
| Ngày tạo | 2026-06-15 |
| Chuẩn áp dụng | ISO/IEC/IEEE 15289:2019 |

### 1.2. Lịch sử thay đổi

| Phiên bản | Ngày | Người cập nhật | Nội dung |
|---|---|---|---|
| 0.1.0 | 2026-06-15 | AI Agent | Bản Draft đầu — từ Prisma schema + vocab-pipeline. |
| 0.2.0 | 2026-06-15 | AI Agent | Bổ sung ERD chi tiết, phân tích index, migration history, seed pipeline, query pattern, cascade rules, data volume estimate, lifecycle. |
| 0.2.1 | 2026-06-15 | AI Agent | Chuẩn hóa format metadata (§1.1/§1.2); sửa F-5: phân biệt seed offline (112 từ / 8 topic) vs full DB (~14 topic); sửa §6.4 (`doi-song` thay `hoc-thuat` bị trùng); sửa cross-ref §6.4. |

## 2. Công nghệ

| Thành phần | Giá trị | Ghi chú |
|---|---|---|
| ORM | Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`) | Tầng truy vấn chính thức |
| Database | PostgreSQL 16 (`postgres:16-alpine` Docker dev / Supabase prod) | Chỉ Postgres |
| Driver | `pg` (native pool) | Pool size mặc định |
| Migration | Prisma Migrate (`prisma migrate dev` / `prisma migrate deploy`) | Dùng `prisma generate` sau migrate |
| Connection pool | `pg.Pool` do `packages/db/src/index.ts` khởi tạo | Pool size = `pg` default (10) |
| String PK | `cuid()` — 25 ký tự, chữ thường + số | Không UUID v4 vì cuid ngắn hơn, không sequential |

## 3. Tổng quan — 10 Model + 3 Enum

### 3.1. Enum

| Enum | Giá trị | Dùng bởi | Ghi chú |
|---|---|---|---|
| `CefrLevel` | `A1` `A2` `B1` `B2` `C1` `C2` | `Word.level` | Khung tham chiếu châu Âu 6 bậc |
| `UserStatus` | `ACTIVE` `DISABLED` `DELETED` | `User.status` | `DELETED` = soft-delete |
| `AuthProvider` | `PASSWORD` | `UserIdentity.provider`, `AdminIdentity.provider` | Chỉ 1 provider — mở rộng cho OAuth V2 |

### 3.2. ERD chi tiết

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTH DOMAIN (User)                              │
│                                                                         │
│  ┌──────────────┐       ┌────────────────────┐                         │
│  │     User     │ 1    *│   UserIdentity     │                         │
│  ├──────────────┤───────├────────────────────┤                         │
│  │ id (PK,cuid) │       │ id (PK,cuid)       │                         │
│  │ email (U)    │       │ userId (FK)        │── CASCADE               │
│  │ emailNorm (U)│       │ provider (PASSWORD) │                         │
│  │ displayName? │       │ providerId (=email) │                         │
│  │ avatarUrl?   │       │ passwordHash       │                         │
│  │ status       │       │ @@unique(prov,provId)│                       │
│  │ deletedAt?   │       └────────────────────┘                         │
│  └──────┬───────┘                                                      │
│         │                                                              │
│         │ 1                                                            │
│         ├──────────────────────────────────────────────┐               │
│         │                                              │               │
│         ▼                                              ▼               │
│  ┌──────────────┐                              ┌──────────────┐        │
│  │ UserSession  │*                             │UserAuthToken │*       │
│  ├──────────────┤                              ├──────────────┤        │
│  │ id (PK,cuid) │                              │ id (PK,cuid) │        │
│  │ userId (FK)  │── CASCADE                    │ userId (FK)  │── CAS  │
│  │ tokenHash (U)│                              │ purpose      │        │
│  │ userAgent?   │                              │ tokenHash (U)│        │
│  │ ipHash?      │                              │ expiresAt    │        │
│  │ expiresAt    │                              │ usedAt?      │        │
│  │ revokedAt?   │                              │ idx(userId,  │        │
│  │ idx(expires) │                              │    purpose)  │        │
│  │ idx(revoked) │                              └──────────────┘        │
│  └──────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTH DOMAIN (Admin)                             │
│                                                                         │
│  ┌──────────────┐       ┌────────────────────┐                         │
│  │    Admin     │ 1    *│   AdminIdentity    │                         │
│  ├──────────────┤───────├────────────────────┤                         │
│  │ id (PK,cuid) │       │ id (PK,cuid)       │                         │
│  │ username (U) │       │ adminId (FK)       │── CASCADE               │
│  │ usernameNorm │       │ provider (PASSWORD) │                         │
│  │ passChanged? │       │ providerId         │                         │
│  └──────┬───────┘       │ passwordHash       │                         │
│         │               │ @@unique(prov,provId)│                       │
│         │ 1             └────────────────────┘                         │
│         ▼                                                              │
│  ┌──────────────┐                                                      │
│  │ AdminSession │*                                                     │
│  ├──────────────┤                                                      │
│  │ id (PK,cuid) │                                                      │
│  │ adminId (FK) │── CASCADE                                            │
│  │ tokenHash (U)│                                                      │
│  │ userAgent?   │                                                      │
│  │ ipHash?      │                                                      │
│  │ expiresAt    │                                                      │
│  │ revokedAt?   │                                                      │
│  │ idx(expires) │                                                      │
│  │ idx(revoked) │                                                      │
│  └──────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       VOCABULARY DOMAIN                                 │
│                                                                         │
│  ┌──────────────┐       ┌────────────────────┐                         │
│  │    Topic     │ 1    *│      Word          │                         │
│  ├──────────────┤───────├────────────────────┤                         │
│  │ id (PK,cuid) │       │ id (PK,cuid)       │                         │
│  │ slug (U)     │       │ en                 │                         │
│  │ title        │       │ vi                 │                         │
│  └──────────────┘       │ level? (CefrLevel) │── idx(level)            │
│                         │ frequency          │── idx(freq)             │
│                         │ pos?               │                         │
│                         │ ipa?               │                         │
│                         │ example?           │                         │
│                         │ topicId (FK)??     │── SET NULL              │
│                         │ source             │── idx(topicId)          │
│                         │ @@unique(en,level) │                         │
│                         └────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          TRAFFIC DOMAIN                                 │
│                                                                         │
│  ┌────────────────────┐                                                 │
│  │   TrafficHourly    │                                                 │
│  ├────────────────────┤                                                 │
│  │ hour (PK,DateTime) │── trunc('hour', ts)                             │
│  │ count              │── upsert: ++1 mỗi request                       │
│  │ updatedAt          │                                                 │
│  └────────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3. Cardinality & Cascade

| Source | Target | Loại | FK column | ON DELETE | ON UPDATE | Ý nghĩa |
|---|---|---|---|---|---|---|
| `Word` | `Topic` | N:1 (optional) | `topicId` | `SET NULL` | `CASCADE` | Xoá topic → từ mất topic, không mất từ |
| `UserIdentity` | `User` | N:1 | `userId` | `CASCADE` | `CASCADE` | Xoá user → xoá identity |
| `AdminIdentity` | `Admin` | N:1 | `adminId` | `CASCADE` | `CASCADE` | Xoá admin → xoá identity |
| `UserSession` | `User` | N:1 | `userId` | `CASCADE` | `CASCADE` | Xoá user → xoá session |
| `AdminSession` | `Admin` | N:1 | `adminId` | `CASCADE` | `CASCADE` | Xoá admin → xoá session |
| `UserAuthToken` | `User` | N:1 | `userId` | `CASCADE` | `CASCADE` | Xoá user → xoá token |

## 4. Mô tả chi tiết từng model

### 4.1. Topic

| Cột | Kiểu | Ràng buộc | Min | Max | Ghi chú |
|---|---|---|---|---|---|
| `id` | `String` | PK @default(cuid()) | 25 | 25 | cuid() |
| `slug` | `String` | UNIQUE | 4 | ~30 | URL-friendly, dùng làm route param |
| `title` | `String` | NOT NULL | 5 | ~30 | Tiếng Việt, hiển thị UI |

**Dữ liệu điển hình**: Seed offline (`seed-vocabulary.json`) = **112 từ / 8 topic curated**. Full DB sau `build-dataset` + `seed` = tối đa **~14 topic** (8 curated + 6 extended, xem §6.4).
**Không có index phụ** ngoài PK + unique(slug).

### 4.2. Word

| Cột | Kiểu | Ràng buộc | Min | Max | Ghi chú |
|---|---|---|---|---|---|
| `id` | `String` | PK @default(cuid()) | 25 | 25 | cuid() |
| `en` | `String` | NOT NULL | 1 | ~30 | `^[a-z][a-z'-]{0,29}$` |
| `vi` | `String` | NOT NULL | 1 | 90 | Tối đa `MAX_VI_PARTS=3` nghĩa |
| `level` | `CefrLevel?` | NULLABLE | — | — | NULL chỉ khi từ curated ép level |
| `frequency` | `Int` | @default(0) | 0 | 2.147B | Kẹp `Int4` (seed.get('min') clamp) |
| `pos` | `String?` | NULLABLE | — | ~20 | VD: "danh từ", "động từ" |
| `ipa` | `String?` | NULLABLE | — | 40 | VD: "/ˈhɛloʊ/" |
| `example` | `String?` | NULLABLE | 10 | 140 | Một câu, không xuống dòng |
| `topicId` | `String?` | FK → Topic (SET NULL) | 25 | 25 | null = từ không chủ đề |
| `source` | `String` | @default | — | ~30 | Phân biệt curated vs. auto |
| `updatedAt` | `DateTime` | @updatedAt | — | — | Tự động cập nhật |

**Index**:
| Index | Type | Columns | Mục đích |
|---|---|---|---|
| PK | B-tree | `id` | Truy xuất theo ID |
| `@@unique([en, level])` | B-tree | `en`, `level` (composite) | Một từ chỉ 1 bản ghi / level |
| `@@index([level])` | B-tree | `level` | Lọc nhanh theo CEFR (filter không unique) |
| `@@index([topicId])` | B-tree | `topicId` | JOIN với Topic |
| `@@index([frequency])` | B-tree | `frequency` | Sort theo frequency (từ thông dụng nhất lên đầu) |

**Query pattern & index sử dụng**:

| Query | SQL (minh họa) | Index dùng |
|---|---|---|
| Lấy từ theo level | `SELECT * FROM "Word" WHERE "level" = 'A1'` | `Word_level_idx` |
| Lấy từ theo topic | `SELECT * FROM "Word" WHERE "topicId" = $1` | `Word_topicId_idx` |
| Lấy từ sắp xếp độ phổ biến | `SELECT * FROM "Word" ORDER BY "frequency" DESC` | `Word_frequency_idx` |
| Lấy từ duy nhất (en + level) | `SELECT * FROM "Word" WHERE "en"='hello' AND "level"='A1'` | `Word_en_level_key` |
| Đếm từ theo level | `SELECT "level", COUNT(*) FROM "Word" GROUP BY "level"` | Full scan (không có index covering) |
| Random từ trong level | `SELECT * FROM "Word" WHERE "level"='A1' ORDER BY RANDOM() LIMIT 10` | `Word_level_idx` (filter) + sort |

### 4.3. User

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `String` | PK @default(cuid()) | cuid |
| `email` | `String` | UNIQUE | Email gốc |
| `emailNormalized` | `String` | UNIQUE | `lower(trim(email))` — unique của normalization |
| `displayName` | `String?` | NULLABLE | Tên hiển thị |
| `avatarUrl` | `String?` | NULLABLE | URL avatar |
| `status` | `UserStatus` | @default(ACTIVE) | ACTIVE / DISABLED / DELETED |
| `deletedAt` | `DateTime?` | NULLABLE | Soft-delete timestamp |

**Quan hệ**: `identities`, `sessions`, `tokens` (1-n).
**Dữ liệu điển hình**: ~100 user (giai đoạn MVP).

### 4.4. UserIdentity

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `String` | PK @default(cuid()) | |
| `userId` | `String` | FK → User (CASCADE) | |
| `provider` | `AuthProvider` | @default(PASSWORD) | Chỉ PASSWORD |
| `providerId` | `String` | = emailNormalized | Dùng để lookup identity |
| `passwordHash` | `String` | NOT NULL | Argon2id hash |

**Unique**: `@@unique([provider, providerId])` — mỗi identity chỉ 1 record.
**Index**: `@@index([userId])` — JOIN từ User.

### 4.5. UserSession

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `String` | PK @default(cuid()) | |
| `userId` | `String` | FK → User (CASCADE) | |
| `tokenHash` | `String` | UNIQUE | `HMAC-SHA256(token, pepper)` — không lưu token plaintext |
| `userAgent` | `String?` | NULLABLE | UA string, chỉ logging |
| `ipHash` | `String?` | NULLABLE | `HMAC-SHA256(ip, pepper)` — không lưu IP thô |
| `expiresAt` | `DateTime` | NOT NULL | TTL = 30 ngày (user) / 12 giờ (admin) |
| `revokedAt` | `DateTime?` | NULLABLE | Set khi logout |

**Index**: `userId`, `expiresAt` (cleanup job), `revokedAt` (filter revoked).
**Token rotation**: Mỗi refresh tạo session mới, revoke session cũ. `tokenHash` unique đảm bảo không trùng.

### 4.6. UserAuthToken

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `String` | PK @default(cuid()) | |
| `userId` | `String` | FK → User (CASCADE) | |
| `purpose` | `String` | NOT NULL | VD: `"password-reset"` |
| `tokenHash` | `String` | UNIQUE | One-time token hash |
| `expiresAt` | `DateTime` | NOT NULL | 2 giờ cho reset |
| `usedAt` | `DateTime?` | NULLABLE | Mark khi dùng rồi |

**Index**: `@@index([userId, purpose])` — tìm kiếm các token của user theo purpose.
Token là one-time: `usedAt != null` = đã dùng, không validate lại.

### 4.7. Admin (tương tự User)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `String` | PK @default(cuid()) | |
| `username` | `String` | UNIQUE | Username thô |
| `usernameNormalized` | `String` | UNIQUE | `lower(username)` |
| `passwordChangedAt` | `DateTime?` | NULLABLE | Audit — buộc re-login nếu admin change password |

**Không có soft-delete** — Admin hiếm, xoá hẳn hoặc disable ở tầng ứng dụng.

### 4.8. AdminIdentity, AdminSession

Cấu trúc giống hệt UserIdentity / UserSession nhưng dành cho Admin.
TTL session mặc định: **12 giờ** (ngắn hơn user 30 ngày).

### 4.9. TrafficHourly

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `hour` | `DateTime` | PK | `date_trunc('hour', now())` — unique hour |
| `count` | `Int` | @default(0) | Upsert: `++1` |
| `updatedAt` | `DateTime` | @updatedAt | |

**Thiết kế**: Ghi dồn (aggregate-on-write) — không lưu raw event.
24 rows/ngày × 365 = ~8,760 rows/năm — bảng vĩnh viễn nhỏ.
Không cần TTL/cleanup.

## 5. Migration History

| # | Migration | Thời gian | Nội dung |
|---|---|---|---|
| 1 | `20260610135124_keylish` | 2026-06-10 | Schema gốc: Topic + Word (vocabulary), toàn bộ bảng auth (User, Admin, UserIdentity, AdminIdentity, UserSession, AdminSession, UserAuthToken) |
| 2 | `20260614000100_v2_auth` | 2026-06-14 | V2 auth: Thêm enum UserStatus, AuthProvider; thêm cột `User.deletedAt`, `Admin.passwordChangedAt`; restructure identity/session |
| 3 | `20260614010000_drop_session_csrf_secret` | 2026-06-14 | Xoá `csrfSecretHash` khỏi `UserSession` + `AdminSession` — CSRF chuyển sang stateless (double-submit cookie + Origin check) |
| 4 | `20260615120000_traffic_hourly` | 2026-06-15 | Thêm `TrafficHourly` — aggregate-on-write page-view counters |

**Lưu ý**: Mỗi migration là tăng dần, không có migration rollback hay squash.

## 6. Seed Pipeline (vocab-pipeline)

> File gốc: `doc/vocab-pipeline.md` — tài liệu chi tiết về nguồn dữ liệu và pipeline.

### 6.1. Luồng dữ liệu

```
┌───────────────────┐     ┌───────────────────┐
│  Maximax67 CSV    │     │  kaikki JSONL.gz  │
│  ~172k từ + CEFR  │     │  ~multi-GB stream │
│  + freq + POS     │     │  EN→VI + IPA + ex │
└────────┬──────────┘     └────────┬───────────┘
         │                         │
         ▼                         ▼
    ┌─────────────────────────────────────┐
    │       scripts/build-dataset.mjs     │
    │                                     │
    │  1. Stream kaikki, lọc entry có VI  │
    │  2. JOIN Maximax67 → CEFR+freq+POS  │
    │  3. Gán chủ đề (TOPIC_RULES voting) │
    │  4. Dùng 112 từ curated làm core    │
    │  5. Output: .data-tmp/dataset.json  │
    └────────────────┬────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────┐
    │    apps/api/scripts/seed.ts        │
    │                                    │
    │  1. XOÁ SẠCH Word + Topic          │
    │  2. INSERT topics                  │
    │  3. batch INSERT words (1000/batch)│
    │  4. skipDuplicates: true           │
    │  - Nếu ko có dataset.json →        │
    │    fallback: 112 từ curated        │
    └────────────────┬───────────────────┘
                     │
                     ▼
              PostgreSQL DB
```

### 6.2. Nguồn dữ liệu

| Nguồn | License | Cung cấp |
|---|---|---|
| [Maximax67/Words-CEFR-Dataset](https://github.com/Maximax67/Words-CEFR-Dataset) (CSV) | MIT | ~172k từ EN + CEFR level + frequency + POS |
| [kaikki.org — English Wiktionary](https://kaikki.org/dictionary/English/) (JSONL.gz) | CC BY-SA + GFDL | Nghĩa EN→VI + IPA + ví dụ |

### 6.3. 112 từ curated (seed fallback)

Định nghĩa tại `scripts/vocab-shared.mjs:125` (`export const VI`):

| Chủ đề | Số từ curated | Ví dụ |
|---|---|---|
| Giao tiếp | 14 | hello, goodbye, please, sorry, friend, talk, listen, question, answer, name, meet, language, thank, help |
| Du lịch | 14 | travel, airport, ticket, hotel, map, beach, mountain, city, passport, luggage, journey, river, country, road |
| Công sở | 14 | office, meeting, manager, email, report, project, colleague, salary, desk, busy, work, money, plan, sign |
| Học thuật | 14 | student, teacher, lesson, study, library, exam, knowledge, research, subject, example, dictionary, science, book, read |
| Ẩm thực | 14 | apple, bread, water, rice, coffee, vegetable, chicken, delicious, breakfast, restaurant, sugar, hungry, fish, milk |
| Công nghệ | 14 | computer, phone, internet, software, keyboard, screen, password, file, download, device, battery, message, data, screenshot |
| Sức khỏe | 14 | doctor, medicine, healthy, hospital, sick, exercise, sleep, pain, fever, nurse, tired, body, eat, drink |
| Mua sắm | 14 | shop, price, buy, sell, cheap, expensive, customer, market, discount, clothes, wallet, pay, size, bag |
| **Tổng** | **112** | |

### 6.4. ~14 topic của full DB (8 curated + 6 extended)

> Áp dụng cho **full DB** (sau `build-dataset` + `seed` vào Postgres). **Seed offline** đóng gói trong web (`seed-vocabulary.json`) chỉ có **8 topic curated** / 112 từ.

| # | Slug | Title | Loại | Nguồn |
|---|---|---|---|---|
| 1 | `giao-tiep` | Giao tiếp | Curated | 112 curated |
| 2 | `du-lich` | Du lịch | Curated | 112 curated |
| 3 | `cong-so` | Công sở | Curated | 112 curated |
| 4 | `hoc-thuat` | Học thuật | Curated | 112 curated |
| 5 | `am-thuc` | Ẩm thực | Curated | 112 curated |
| 6 | `cong-nghe` | Công nghệ | Curated | 112 curated |
| 7 | `suc-khoe` | Sức khỏe | Curated | 112 curated |
| 8 | `mua-sam` | Mua sắm | Curated | 112 curated |
| 9 | `the-thao-tro-choi` | Thể thao & Trò chơi | Extended | kaikki topic label |
| 10 | `nghe-thuat-giai-tri` | Nghệ thuật & Giải trí | Extended | kaikki topic label |
| 11 | `phap-luat-nha-nuoc` | Pháp luật & Nhà nước | Extended | kaikki topic label |
| 12 | `ton-giao-tin-nguong` | Tôn giáo & Tín ngưỡng | Extended | kaikki topic label |
| 13 | `khoa-hoc-ky-thuat` | Khoa học & Kỹ thuật | Extended | kaikki topic label |
| 14 | `doi-song` | Đời sống | Extended | kaikki topic label |

> **Note**: Chủ đề extended chỉ được tạo nếu có ≥10 từ được gán (threshold trong build-dataset.mjs `MIN_TOPIC_WORDS = 10`).

### 6.5. Gán chủ đề từ (topic assignment)

Thuật toán `topicFromVotes()` tại `build-dataset.mjs:201`:
1. Mỗi nghĩa (sense) của từ trong kaikki chứa 0+ topic labels (vd. `["computing", "sciences"]`)
2. Mỗi label được map sang 1 trong 14 slug theo `TOPIC_RULES` (thứ tự ưu tiên: cụ thể trước, ô dù sau)
3. Mỗi sense bỏ 1 phiếu cho slug tìm được
4. **Đa số tuyệt đối**: slug thắng phải chiếm ≥ 2/3 tổng phiếu (`winnerVotes * 3 >= votes.length * 2`)
5. Nếu không thoả → topic = null (không gán chủ đề)
6. **Ngoại lệ**: 112 từ curated luôn được gán chủ đề cố định, không qua voting
7. Từ function word có frequency > 1 tỷ (`TOPIC_FREQ_CUTOFF`) cũng bỏ qua gán chủ đề

### 6.6. Seed số liệu ước lượng

| Kịch bản | Số topic | Số từ | Ghi chú |
|---|---|---|---|
| Full dataset (kaikki + Maximax67) | ~14 | ~80k–120k | Phụ thuộc chất lượng kaikki scan |
| Fallback (112 curated) | 8 | 112 | Dùng khi không có kaikki file |
| Batch size | — | 1.000 | `BATCH_SIZE` trong seed.ts |

## 7. Data Volume Estimates

| Bảng | Ước lượng rows (MVP) | Ước lượng rows (1 năm) | Tốc độ tăng |
|---|---|---|---|
| `Topic` | 14 | 14 | Không đổi |
| `Word` | 80k–120k | 80k–120k | Chỉ đổi khi có pipeline mới |
| `User` | ~100 | ~1k | Linear với user đăng ký |
| `UserIdentity` | ~100 | ~1k | 1:1 với user |
| `UserSession` | ~200 | ~5k | ~5 session/user active |
| `UserAuthToken` | ~50/tháng | ~600 | Reset token |
| `Admin` | 1–3 | 1–5 | Rất ít |
| `AdminIdentity` | 1–3 | 1–5 | 1:1 |
| `AdminSession` | 1–5 | 1–10 | ~1 session/admin |
| `TrafficHourly` | ~720 (30 ngày) | ~8.760 | 24 rows/ngày |

## 8. X. Cross-cutting Concerns

### 8.1. Security

| Biện pháp | Áp dụng tại |
|---|---|
| Password hash Argon2id | `UserIdentity.passwordHash`, `AdminIdentity.passwordHash` |
| Token hash HMAC-SHA256 | `UserSession.tokenHash`, `UserAuthToken.tokenHash` |
| IP hash HMAC-SHA256 | `UserSession.ipHash`, `AdminSession.ipHash` — không lưu IP thô |
| PK cuid (non-sequential) | Tránh leaker số lượng bản ghi |
| Soft-delete user | `User.deletedAt`, `User.status = DELETED` |

### 8.2. Data Lifecycle

```
User:
  register → User + UserIdentity created → status=ACTIVE
  → logout → UserSession.revokedAt = now()
  → forgot/reset → UserAuthToken created → usedAt = now()
  → disable → status=DISABLED
  → delete → status=DELETED, deletedAt = now() (soft)

Word/Topic:
  seed → bulk insert → read-only (không update/delete qua API)
  → re-seed → delete all + re-insert (idempotent)

TrafficHourly:
  upsert: hour=now() → count++ (no DELETE, no TTL)
```

### 8.3. Index Maintenance

Không có index đặc biệt (partial, GIN, GiST). Tất cả index B-tree.
`TrafficHourly` PK = `hour` (DateTime) — UPSERT an toàn, không conflict.
Không cần VACUUM đặc biệt ngoài autovacuum mặc định.

### 8.4. Connection Pooling

```typescript
// packages/db/src/index.ts
import { Pool } from "pg";
const pool = new Pool({ connectionString });  // pool size default = 10
const adapter = new PrismaPg(pool);
const client = new PrismaClient({ adapter });
return { client, pool };
```

Pool được `@prisma/adapter-pg` quản lý, binding với Prisma client lifecycle.
Khi seed xong hoặc app shutdown: `await client.$disconnect(); await pool.end();`.

### 8.5. RISK & OQ

| ID | Mô tả | Loại |
|---|---|---|
| R-5 | Dùng `cuid()` cho PK — không chống được collision nếu migrate lên shard | RISK (thấp) |
| — | `TrafficHourly` dùng `hour` làm PK (DateTime) — upsert an toàn | — |
| — | `UserAuthToken` không có composite unique cho (userId, purpose, tokenHash) — không cần vì hash đã unique | — |
| — | Index rate-limit in-memory, không có bảng rate-limit trong DB | — |
| — | Không có index covering cho query `GROUP BY level` — scan toàn bảng (chấp nhận với dataset ~100k) | — |

## 9. BR Trace

| BR | Mô tả | Thể hiện trong DB |
|---|---|---|
| BR-01 | Mỗi từ chỉ xuất hiện 1 lần ở mỗi level | `@@unique([en, level])` trên Word |
| BR-02 | Email không trùng | `User.emailNormalized @unique` |
| BR-02 | Username admin không trùng | `Admin.usernameNormalized @unique` |

## 10. Tham chiếu

- `doc/vocab-pipeline.md` — Pipeline dữ liệu từ vựng (file gốc, giữ nguyên)
- `packages/db/prisma/schema.prisma` — Schema chính thức (Prisma)
- `scripts/build-dataset.mjs` — Build dataset từ kaikki + Maximax67
- `scripts/vocab-shared.mjs` — 112 từ curated, helper mapping
- `apps/api/scripts/seed.ts` — Seed script consume dataset.json
- `packages/db/src/index.ts` — Prisma client factory
- `01-user-flow` — User flow mô tả register/login/logout/reset
- `02-hld` — Kiến trúc tổng thể
- `03-lld` — Chi tiết triển khai auth
