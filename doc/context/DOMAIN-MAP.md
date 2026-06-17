# DOMAIN-MAP — Bản đồ module, folder, entity

> **Tên duy nhất cho mỗi actor/module/entity/state**. Tài liệu khác dùng đúng tên này.

## 1. Module API (`apps/api/src/`)

| Module | Folder code | Controllers | Services | Vai trò |
|---|---|---|---|---|
| `auth` | `auth/` | `AuthController` | `AuthService` | Auth người học + admin (register/login/logout/reset/session/csrf) |
| `admin` | `admin/` | `AdminController` | `AdminService` | Dashboard summary, quản user (list/detail/update status) |
| `vocab` | `vocab/` | `VocabController`, `AdminVocabController` | `VocabService` | Đọc từ vựng công khai + CRUD admin |
| `topics` | `topics/` | `TopicsController`, `AdminTopicsController` | `TopicsService` | Đọc chủ đề công khai + CRUD admin |
| `traffic` | `traffic/` | `TrafficController`, `AdminTrafficController` | `TrafficService` | Đếm lượt truy cập aggregate-on-write |
| `health` | `health/` | `HealthController` | — | Health check (`/api/health`) |
| `mail` | `mail/` | — | `MailService` | Gửi email reset password qua Resend REST |
| `database` | `database/` | — | `DatabaseService` | Prisma client wrapper (shutdown handling) |

## 2. Module user-web (`apps/user-web/src/`)

| Layer | Folder | Nội dung |
|---|---|---|
| App (pages) | `app/` | Next.js App Router pages (`(site)/`, `(auth)/`, `(practice)/`) |
| Components | `components/vocab/typing/` | Engine luyện gõ (hooks + UI) |
|  | `components/layout/` | AppShell, Header, Sidebar, Tour, ApiWarmer |
|  | `components/auth/` | AuthFrame, UserSessionActions |
|  | `components/ui/` | NeoCard, NeoButton, NeoBadge |
|  | `components/TrafficBeacon.tsx` | Traffic beacon (1 lần/phiên) |
| Infra | `infra/vocab/` | `vocabApi.ts` — fetch + IndexedDB cache + seed |
|  | `infra/user/` | `userApi.ts` — user API calls |
| Data | `data/seed/` | Seed offline 112 từ |
| Lib | `lib/` | Tour setup |

## 3. Module admin-web (`apps/admin-web/src/`)

| Folder | Nội dung | Trạng thái |
|---|---|---|
| `app/` | Next.js App Router pages | 🚧 khung |
| `components/` | UI components | 🚧 khung |
| `infra/` | API calls | 🚧 khung |

## 4. Packages

| Package | Folder | Nội dung |
|---|---|---|
| `@keylish/db` | `packages/db/` | Prisma schema, client generator, migrations |
| `@keylish/shared` | `packages/shared/` | Zod 4 schemas/types (`vocab.ts`) |

## 5. Scripts gốc (`scripts/`)

| Script | Vai trò |
|---|---|
| `build-dataset.mjs` | Build dataset từ 2 nguồn (kaikki + Maximax67) → `.data-tmp/dataset.json` |
| `build-vocab.mjs` | Build seed offline 112 từ → `apps/user-web/src/data/seed/seed-vocabulary.json` |
| `vocab-shared.mjs` | Dữ liệu 112 từ lõi biên soạn tay |

## 6. Entity map (Prisma → module)

| Entity | Module chính | Ghi chú |
|---|---|---|
| `Topic` | vocab, topics | CRUD admin; đọc public |
| `Word` | vocab, topics | CRUD admin; đọc public; `@@unique([en,level])` |
| `User` | auth, admin | Auth user; admin quản status |
| `Admin` | auth, admin | Auth admin |
| `UserIdentity` | auth | Password hash theo provider |
| `AdminIdentity` | auth | Password hash theo provider |
| `UserSession` | auth | Phiên user (cookie token hash) |
| `AdminSession` | auth | Phiên admin |
| `UserAuthToken` | auth | Reset token (purpose "password-reset") |
| `TrafficHourly` | traffic | Aggregate-on-write, 1 row/giờ |

## 7. State enum map

| Enum / state | Entity / context | Giá trị |
|---|---|---|
| `CefrLevel` | `Word.level` | `A1 A2 B1 B2 C1 C2` |
| `UserStatus` | `User.status` | `ACTIVE DISABLED DELETED` |
| `AuthProvider` | `UserIdentity.provider`, `AdminIdentity.provider` | `PASSWORD` |
| `SessionStatus` | user-web typing engine | `typing wrong correct` |
| `RepeatMode` | user-web typing engine | `none once until` |
| `VocabSource` | user-web vocabApi | `api cache seed` |
