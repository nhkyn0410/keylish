// Build KeyLish OFFLINE seed (112 curated words) for the web app.
// Metadata (CEFR level, frequency, POS) from Maximax67/Words-CEFR-Dataset (MIT),
// CSVs cached in .data-tmp/. The FULL dataset (kaikki EN→VI) is built by
// scripts/build-dataset.mjs instead.
//
// Usage:  node scripts/build-vocab.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VI, levelFromValue, loadMaximax, pennToVn } from "./vocab-shared.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, ".data-tmp");
const OUT_DIR = path.join(ROOT, "apps", "web", "src", "data", "seed");
const OUT = path.join(OUT_DIR, "seed-vocabulary.json");

const { posTags, idByWord, bestByWordId } = loadMaximax(DATA);

const words = [];
const missing = [];
for (const [en, vi, topic] of VI) {
  const id = idByWord[en.toLowerCase()];
  const m = id ? bestByWordId[id] : null;
  if (!m) missing.push(en);
  words.push({
    en: en.toLowerCase(),
    vi,
    topic,
    pos: m ? pennToVn(posTags[m.posId]) : undefined,
    level: m ? levelFromValue(m.level) || "A2" : "A2",
    frequency: m ? m.freq : 0,
  });
}
words.sort((a, b) => b.frequency - a.frequency);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  _meta: {
    source: "Metadata (CEFR level, frequency, POS): Maximax67/Words-CEFR-Dataset (MIT). Vietnamese meanings + topics: curated for KeyLish v1.",
    license: "Maximax67 metadata: MIT. Curated Vietnamese content: project-owned.",
    upgrade: "Full dataset (kaikki EN→VI long tail) is built by scripts/build-dataset.mjs and served from the API.",
    count: words.length,
    generatedAt: new Date().toISOString(),
  },
  words,
}, null, 2), "utf8");

console.log(`Wrote ${words.length} words -> ${path.relative(ROOT, OUT)}`);
console.log("Missing in Maximax67:", missing.join(", ") || "(none)");
for (const w of ["the", "go", "computer", "hospital", "apple"]) {
  const id = idByWord[w]; const m = id ? bestByWordId[id] : null;
  console.log(`  sanity ${w}: level=${m ? levelFromValue(m.level) : "?"} freq=${m ? m.freq : "?"} pos=${m ? pennToVn(posTags[m.posId]) : "?"}`);
}
