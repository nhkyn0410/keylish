// Seed Postgres with the KeyLish vocabulary dataset.
//
// Input (ưu tiên theo thứ tự):
//   1. .data-tmp/dataset.json            — full dataset (scripts/build-dataset.mjs)
//   2. apps/user-web/src/data/seed/seed-vocabulary.json — 112 từ curated (fallback)
//
// XÓA SẠCH dữ liệu cũ (Word + Topic) trước khi nạp dữ liệu mới.
//
// Usage:  pnpm --filter @keylish/api seed     (env: DATABASE_URL)
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createPrismaClient } from "@keylish/db";

const ROOT = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(ROOT, ".env") });
dotenv.config({ path: path.join(ROOT, "packages", "db", ".env") });
dotenv.config();

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/keylish";
const BATCH_SIZE = 1000;

interface DatasetWord {
  en: string;
  vi: string;
  level?: string | null;
  frequency?: number;
  pos?: string | null;
  ipa?: string | null;
  example?: string | null;
  topic?: string | null; // slug (dataset.json) hoặc title (web seed fallback)
  source?: string;
}

interface DatasetTopic {
  slug: string;
  title: string;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadDataset(): { topics: DatasetTopic[]; words: DatasetWord[]; from: string } {
  const datasetPath = path.join(ROOT, ".data-tmp", "dataset.json");
  if (fs.existsSync(datasetPath)) {
    const parsed = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
    return {
      topics: parsed.topics ?? [],
      words: parsed.words ?? [],
      from: path.relative(ROOT, datasetPath),
    };
  }

  const fallbackPath = path.join(
    ROOT,
    "apps",
    "user-web",
    "src",
    "data",
    "seed",
    "seed-vocabulary.json"
  );
  if (!fs.existsSync(fallbackPath)) {
    throw new Error(
      "Không tìm thấy .data-tmp/dataset.json lẫn seed của web. Chạy `pnpm --filter @keylish/api build-dataset` trước (xem doc/vocab-pipeline.md)."
    );
  }
  console.warn("⚠ Không thấy .data-tmp/dataset.json — dùng seed 112 từ của web làm fallback.");
  const parsed = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  const words: DatasetWord[] = (parsed.words ?? []).map((w: DatasetWord) => ({
    ...w,
    topic: w.topic ? slugify(w.topic) : undefined,
    source: "curated+maximax67",
  }));
  const titles = Array.from(
    new Set((parsed.words ?? []).map((w: DatasetWord) => w.topic).filter(Boolean))
  ) as string[];
  const topics = titles.map((title) => ({ slug: slugify(title), title }));
  return { topics, words, from: path.relative(ROOT, fallbackPath) };
}

async function main() {
  const started = Date.now();
  const { topics, words, from } = loadDataset();
  console.log(`Nguồn: ${from} — ${topics.length} chủ đề, ${words.length.toLocaleString()} từ`);

  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  console.log(`Database: ${url.replace(/:\/\/[^@]*@/, "://***@")}`);
  const { client, pool } = createPrismaClient(url);

  try {
    console.log("Xóa dữ liệu cũ (Word → Topic)...");
    const deletedWords = await client.word.deleteMany({});
    const deletedTopics = await client.topic.deleteMany({});
    console.log(
      `  đã xóa ${deletedWords.count.toLocaleString()} từ, ${deletedTopics.count} chủ đề`
    );

    await client.topic.createMany({ data: topics.map((t) => ({ slug: t.slug, title: t.title })) });
    const topicRows = await client.topic.findMany({ select: { id: true, slug: true } });
    const idBySlug = new Map(topicRows.map((t) => [t.slug, t.id]));

    let inserted = 0;
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE).map((w) => ({
        en: w.en,
        vi: w.vi,
        level: (w.level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | undefined) ?? null,
        // Maximax67 đếm corpus thô lên tới ~92 tỷ ("the") — kẹp về int4 của Postgres.
        frequency: Math.min(w.frequency ?? 0, 2_147_483_647),
        pos: w.pos ?? null,
        ipa: w.ipa ?? null,
        example: w.example ?? null,
        topicId: w.topic ? (idBySlug.get(w.topic) ?? null) : null,
        source: w.source ?? "wiktionary+maximax67",
      }));
      const res = await client.word.createMany({ data: batch, skipDuplicates: true });
      inserted += res.count;
      process.stdout.write(
        `  đã nạp ${inserted.toLocaleString()} / ${words.length.toLocaleString()} từ\r`
      );
    }
    process.stdout.write("\n");

    const secs = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`✔ Seed xong: ${topics.length} chủ đề, ${inserted.toLocaleString()} từ (${secs}s)`);
  } finally {
    await client.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
