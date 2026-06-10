// Build the FULL KeyLish vocabulary dataset from two free sources:
//   1. Maximax67/Words-CEFR-Dataset (MIT)      — CEFR level, frequency, POS
//   2. kaikki.org English Wiktionary (CC BY-SA) — EN→VI meanings, IPA, examples
//
// Reads .data-tmp/kaikki-english.jsonl[.gz] as a stream (the file is multi-GB;
// nothing is fully loaded into RAM) and joins each entry against Maximax67.
// Words must have BOTH a Vietnamese meaning and a CEFR level to be kept;
// the 112 curated core words always win (meaning + topic) and are always kept.
//
// Output: .data-tmp/dataset.json — consumed by `pnpm --filter @keylish/api seed`.
//
// Usage:  node scripts/build-dataset.mjs [path/to/kaikki.jsonl(.gz)]
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { TOPICS, VI, kaikkiPosToVn, levelFromValue, loadMaximax, pennToVn, slugify } from "./vocab-shared.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, ".data-tmp");
const OUT = path.join(DATA, "dataset.json");

const MAX_VI_PARTS = 3;
const MAX_VI_LENGTH = 90;
const MAX_EXAMPLE_LENGTH = 140;
const WORD_RE = /^[a-z][a-z'-]{0,29}$/;

function findKaikkiFile() {
  const arg = process.argv[2];
  if (arg) {
    const full = path.resolve(arg);
    if (!fs.existsSync(full)) throw new Error(`Không tìm thấy file kaikki: ${full}`);
    return full;
  }
  for (const name of ["kaikki-english.jsonl.gz", "kaikki-english.jsonl"]) {
    const full = path.join(DATA, name);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function viTranslationsOf(entry) {
  const out = [];
  const collect = (translations) => {
    if (!Array.isArray(translations)) return;
    for (const t of translations) {
      if ((t?.code === "vi" || t?.lang === "Vietnamese") && typeof t.word === "string") {
        const w = t.word.trim();
        if (w && !w.includes("\n")) out.push(w);
      }
    }
  };
  collect(entry.translations);
  if (Array.isArray(entry.senses)) for (const s of entry.senses) collect(s?.translations);
  return out;
}

function firstIpa(entry) {
  if (!Array.isArray(entry.sounds)) return undefined;
  for (const s of entry.sounds) {
    if (typeof s?.ipa === "string" && s.ipa.length <= 40) return s.ipa;
  }
  return undefined;
}

function firstExample(entry) {
  if (!Array.isArray(entry.senses)) return undefined;
  for (const s of entry.senses) {
    if (!Array.isArray(s?.examples)) continue;
    for (const ex of s.examples) {
      const text = typeof ex?.text === "string" ? ex.text.trim() : "";
      if (text.length >= 10 && text.length <= MAX_EXAMPLE_LENGTH && !text.includes("\n")) return text;
    }
  }
  return undefined;
}

function pickVi(candidates) {
  const seen = new Set();
  const cleaned = [];
  for (const c of candidates) {
    const key = c.normalize("NFC").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(c.normalize("NFC"));
  }
  cleaned.sort((a, b) => a.length - b.length);
  const parts = [];
  let total = 0;
  for (const c of cleaned) {
    if (parts.length >= MAX_VI_PARTS) break;
    if (total + c.length + 2 > MAX_VI_LENGTH && parts.length > 0) break;
    parts.push(c);
    total += c.length + 2;
  }
  return parts.join(", ");
}

async function streamKaikki(file, agg) {
  const raw = fs.createReadStream(file);
  const input = file.endsWith(".gz") ? raw.pipe(zlib.createGunzip()) : raw;
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  let lines = 0;
  let kept = 0;
  for await (const line of rl) {
    lines += 1;
    if (lines % 200000 === 0) process.stdout.write(`  ...đã quét ${lines.toLocaleString()} dòng, ${agg.size.toLocaleString()} từ có nghĩa VI\r`);
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue; // dòng hỏng / file cắt cụt — bỏ qua
    }
    const word = typeof entry.word === "string" ? entry.word.toLowerCase() : "";
    if (!WORD_RE.test(word)) continue;
    const vis = viTranslationsOf(entry);
    const cur = agg.get(word);
    if (!vis.length && !cur) continue;
    const next = cur ?? { vis: [], ipa: undefined, example: undefined, pos: undefined };
    next.vis.push(...vis);
    next.ipa = next.ipa ?? firstIpa(entry);
    next.example = next.example ?? firstExample(entry);
    next.pos = next.pos ?? kaikkiPosToVn(entry.pos);
    if (!cur && next.vis.length) {
      agg.set(word, next);
      kept += 1;
    }
  }
  process.stdout.write("\n");
  return { lines, kept };
}

async function main() {
  const started = Date.now();
  const { posTags, idByWord, bestByWordId } = loadMaximax(DATA);
  const curated = new Map(VI.map(([en, vi, topic]) => [en.toLowerCase(), { vi, topic }]));

  const kaikkiFile = findKaikkiFile();
  const agg = new Map();
  let scan = { lines: 0, kept: 0 };
  if (kaikkiFile) {
    console.log(`Quét kaikki: ${path.relative(ROOT, kaikkiFile)}`);
    scan = await streamKaikki(kaikkiFile, agg);
    console.log(`  ${scan.lines.toLocaleString()} dòng → ${agg.size.toLocaleString()} từ có bản dịch VI`);
  } else {
    console.warn("⚠ Không thấy .data-tmp/kaikki-english.jsonl[.gz] — chỉ build từ danh sách curated (112 từ).");
    console.warn("  Tải file theo doc/vocab-pipeline.md (Bước 1) để có kho đầy đủ.");
  }

  const words = [];
  const levelCount = {};
  for (const [en, data] of agg) {
    const cur = curated.get(en);
    const id = idByWord[en];
    const m = id ? bestByWordId[id] : null;
    const level = m ? levelFromValue(m.level) : undefined;
    if (!cur && !level) continue; // không có level CEFR → bỏ (trừ từ curated)
    const vi = cur?.vi ?? pickVi(data.vis);
    if (!vi) continue;
    const lv = level ?? "A2";
    words.push({
      en,
      vi,
      level: lv,
      frequency: m ? m.freq : 0,
      pos: (m ? pennToVn(posTags[m.posId]) : undefined) ?? data.pos,
      ipa: data.ipa,
      example: data.example,
      topic: cur ? slugify(cur.topic) : undefined,
      source: cur ? "curated+maximax67" : "wiktionary+maximax67",
    });
    levelCount[lv] = (levelCount[lv] ?? 0) + 1;
  }

  // Từ curated chưa gặp trong kaikki (hoặc không có kaikki) vẫn phải có mặt.
  const have = new Set(words.map((w) => w.en));
  for (const [en, { vi, topic }] of curated) {
    if (have.has(en)) continue;
    const id = idByWord[en];
    const m = id ? bestByWordId[id] : null;
    const lv = (m && levelFromValue(m.level)) || "A2";
    words.push({
      en, vi,
      level: lv,
      frequency: m ? m.freq : 0,
      pos: m ? pennToVn(posTags[m.posId]) : undefined,
      topic: slugify(topic),
      source: "curated+maximax67",
    });
    levelCount[lv] = (levelCount[lv] ?? 0) + 1;
  }

  words.sort((a, b) => b.frequency - a.frequency || a.en.localeCompare(b.en));

  fs.writeFileSync(OUT, JSON.stringify({
    _meta: {
      sources: {
        "Maximax67/Words-CEFR-Dataset": "MIT — CEFR level, frequency, POS",
        "kaikki.org English Wiktionary (Wiktextract)": "CC BY-SA + GFDL — EN→VI meanings, IPA, examples",
      },
      license: "Derived data from Wiktionary remains CC BY-SA + GFDL. Curated Vietnamese content: project-owned.",
      kaikkiFile: kaikkiFile ? path.basename(kaikkiFile) : null,
      scannedLines: scan.lines,
      count: words.length,
      byLevel: levelCount,
      generatedAt: new Date().toISOString(),
    },
    topics: TOPICS,
    words,
  }), "utf8");

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Wrote ${words.length.toLocaleString()} words -> ${path.relative(ROOT, OUT)} (${secs}s)`);
  console.log("Theo cấp độ:", Object.entries(levelCount).sort().map(([k, v]) => `${k}=${v}`).join("  "));
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
