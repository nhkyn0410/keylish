# Kho từ vựng — build từ 2 nguồn miễn phí

```
Maximax67 CSV (MIT) ───┐
                       ├── scripts/build-dataset.mjs ──> .data-tmp/dataset.json ──> apps/api seed.ts ──> Postgres (local/Neon)
kaikki JSONL (CC BY-SA)┘
```

Ngoài ra `scripts/build-vocab.mjs` build **seed offline 112 từ** cho web (fallback khi không có API) — độc lập với pipeline trên.

## Bước 1 — Tải 2 nguồn (một lần)

```powershell
mkdir .data-tmp -Force

# Nguồn 1: Maximax67 — 3 file CSV (~13 MB)
curl.exe -L -o .data-tmp/words.csv    https://raw.githubusercontent.com/Maximax67/Words-CEFR-Dataset/main/csv/words.csv
curl.exe -L -o .data-tmp/word_pos.csv https://raw.githubusercontent.com/Maximax67/Words-CEFR-Dataset/main/csv/word_pos.csv
curl.exe -L -o .data-tmp/pos_tags.csv https://raw.githubusercontent.com/Maximax67/Words-CEFR-Dataset/main/csv/pos_tags.csv

# Nguồn 2: kaikki English Wiktionary — DÙNG BẢN NÉN .gz (~470 MB thay vì ~3 GB)
curl.exe -L -C - --retry 15 --retry-delay 5 --retry-all-errors `
  -o .data-tmp/kaikki-english.jsonl.gz `
  "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz"
```

Ghi chú:

- **Luôn ưu tiên bản `.jsonl.gz`** — script đọc thẳng file nén, không cần giải nén. Bản thô `.jsonl` ~3 GB tải lâu và dễ đứt giữa chừng.
- Nếu download đứt: chạy lại đúng lệnh trên — `-C -` tự resume từ chỗ đứt, `--retry` tự thử lại.
- `.data-tmp/` đã gitignored, dữ liệu thô không vào repo.

## Bước 2 — Build dataset

```powershell
pnpm --filter @keylish/api build-dataset
# hoặc: node scripts/build-dataset.mjs [đường-dẫn-file-kaikki]
```

- Stream từng dòng kaikki (không nạp cả file vào RAM) → lọc entry có bản dịch tiếng Việt (`code: "vi"`, gồm cả translations cấp entry lẫn cấp sense) → lấy nghĩa VI + IPA + ví dụ.
- Join với Maximax67 để gắn **CEFR level + frequency + POS**. Chỉ giữ từ có **đủ nghĩa VI + level**.
- **Chủ đề**: 112 từ lõi giữ chủ đề biên soạn tay; phần còn lại được tự gán từ nhãn lĩnh vực kaikki (`senses[].topics`) qua bảng map `TOPIC_RULES` trong `build-dataset.mjs` (nhãn cụ thể ưu tiên trước nhãn ô dù) — ra **14 chủ đề**, phủ ~52% kho từ; từ không có nhãn thì `topic = null` (vẫn luyện được qua chế độ "Tất cả chủ đề" trên web).
- Kết quả: `.data-tmp/dataset.json` (kèm `_meta` thống kê + license). Không có file kaikki thì script vẫn chạy ở chế độ curated-only (112 từ) kèm cảnh báo.

## Bước 3 — Seed vào Postgres

> ⚠️ Seed **XÓA SẠCH dữ liệu cũ** (toàn bộ Word + Topic) rồi mới nạp dữ liệu mới.

```powershell
# Local: docker compose up -d  (DATABASE_URL mặc định đã trỏ localhost)
# Neon:
#   $env:DATABASE_URL = "<pooled connection string>"
#   $env:DIRECT_URL   = "<direct connection string>"

pnpm db:migrate                     # local lần đầu (tạo migration); với Neon dùng: pnpm db:deploy
pnpm --filter @keylish/api seed
```

- Seed đọc `.data-tmp/dataset.json`; nếu chưa build dataset thì fallback sang seed 112 từ của web (kèm cảnh báo).
- Topic được lưu với `slug` chuẩn hóa (vd. "Giao tiếp" → `giao-tiep`) — khớp với filter `topics` của API.
- Nạp theo batch 1000 từ, chạy lại bao nhiêu lần cũng được (lần nào cũng clear trước).

Kiểm tra sau khi seed:

```powershell
curl.exe http://localhost:3001/api/v1/topics
curl.exe "http://localhost:3001/api/v1/vocab?levels=A1&limit=5"
```

## Bước 4 — Cập nhật seed offline cho web (tùy chọn)

```powershell
node scripts/build-vocab.mjs   # 112 từ → apps/user-web/src/data/seed/seed-vocabulary.json
```

## Cập nhật dữ liệu về sau

| Việc                                  | Cách làm                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| Wiktionary có dump mới                | Tải lại file `.gz` (Bước 1) → build-dataset → seed                                       |
| Sửa nghĩa VI / thêm chủ đề cho từ lõi | Sửa `VI` trong `scripts/vocab-shared.mjs` → build-dataset → seed (+ build-vocab cho web) |
| Seed lên Neon production              | Set env `DATABASE_URL`/`DIRECT_URL` trỏ Neon rồi chạy y hệt Bước 3                       |

## License dữ liệu

- **Maximax67/Words-CEFR-Dataset** (level/frequency/POS): MIT — giữ notice.
- **kaikki.org / English Wiktionary** (nghĩa VI, IPA, ví dụ): **CC BY-SA + GFDL** — dữ liệu phái sinh trong DB và API response giữ nguyên license, attribution ghi ở README (mục Ghi công) và `_meta` của `dataset.json`.
- Nghĩa VI + chủ đề biên soạn tay cho 112 từ lõi: thuộc dự án.
