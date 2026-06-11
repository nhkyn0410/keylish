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

// Gán chủ đề từ nhãn lĩnh vực của kaikki (senses[].topics). Duyệt theo thứ tự,
// rule khớp đầu tiên thắng — nhãn cụ thể đứng trước nhãn ô dù (sciences,
// lifestyle là tag cha được wiktextract gắn kèm rất nhiều nghĩa).
// 7 slug đầu trùng với chủ đề curated; 6 chủ đề sau là mở rộng theo dữ liệu.
const TOPIC_RULES = [
  ["cong-nghe", "Công nghệ", ["computing", "internet", "software", "electronics", "telecommunications", "electrical-engineering", "broadcasting"]],
  ["suc-khoe", "Sức khỏe", ["medicine", "anatomy", "pathology", "healthcare", "pharmacology", "psychiatry", "surgery", "dentistry", "disease"]],
  ["am-thuc", "Ẩm thực", ["food", "cooking", "cuisine", "baking", "beverages", "brewing"]],
  ["du-lich", "Du lịch", ["transport", "travel", "tourism", "nautical", "aeronautics", "aviation", "aerospace", "automotive", "rail-transport", "geography"]],
  ["cong-so", "Công sở", ["business", "finance", "economics", "management", "marketing", "accounting", "employment"]],
  ["mua-sam", "Mua sắm", ["commerce", "retail", "clothing", "textiles", "fashion"]],
  ["the-thao-tro-choi", "Thể thao & Trò chơi", ["sports", "ball-games", "card-games", "board-games", "games", "video-games", "cricket", "baseball", "golf", "football", "soccer", "hockey", "rugby", "basketball", "tennis", "athletics", "swimming", "martial-arts", "chess", "fishing", "hunting", "gambling"]],
  ["nghe-thuat-giai-tri", "Nghệ thuật & Giải trí", ["music", "film", "theater", "television", "arts", "entertainment", "media", "publishing", "photography"]],
  ["phap-luat-nha-nuoc", "Pháp luật & Nhà nước", ["law", "government", "politics", "military", "war", "police", "diplomacy"]],
  ["ton-giao-tin-nguong", "Tôn giáo & Tín ngưỡng", ["religion", "christianity", "islam", "judaism", "buddhism", "theology", "mysticism", "mythology"]],
  ["khoa-hoc-ky-thuat", "Khoa học & Kỹ thuật", ["biology", "physics", "chemistry", "astronomy", "geology", "botany", "zoology", "mathematics", "engineering", "manufacturing", "construction", "agriculture", "meteorology", "ecology"]],
  ["hoc-thuat", "Học thuật", ["linguistics", "grammar", "philosophy", "education", "rhetoric", "literature", "history"]],
  ["doi-song", "Đời sống", ["family", "home", "furniture", "gardening"]],
];
// LƯU Ý: không đưa nhãn ô dù (sciences, natural-sciences, physical-sciences,
// human-sciences, social-sciences, lifestyle, hobbies) vào rule — wiktextract
// gắn chúng kèm MỌI nhãn cụ thể trên cùng một nghĩa nên chúng phá bầu chọn.

// Từ chức năng siêu phổ biến (the, of, one...) không thuộc chủ đề nào.
const TOPIC_FREQ_CUTOFF = 1_000_000_000;

// Mỗi NGHĨA chỉ bỏ đúng 1 phiếu: nhãn của nghĩa được map sang nhóm khớp đầu
// tiên theo thứ tự TOPIC_RULES (nhóm cụ thể như Công nghệ xếp trước Khoa học,
// vì wiktextract gắn kèm nhãn cha engineering/mathematics lên nghĩa computing).
function voteOfSense(tags) {
  for (const [slug, , ruleTags] of TOPIC_RULES) {
    if (ruleTags.some((t) => tags.includes(t))) return slug;
  }
  return undefined;
}

// Bầu đa số giữa các nghĩa: nhóm thắng phải chiếm ≥ 2/3 số phiếu — từ đa
// nghĩa trải đều nhiều lĩnh vực thì để null thay vì gán bừa.
function topicFromVotes(votes) {
  if (!votes || votes.length === 0) return undefined;
  const tally = {};
  for (const v of votes) tally[v] = (tally[v] ?? 0) + 1;
  let winner;
  let winnerVotes = 0;
  for (const [slug, n] of Object.entries(tally)) {
    if (n > winnerVotes) {
      winner = slug;
      winnerVotes = n;
    }
  }
  if (winnerVotes * 3 >= votes.length * 2) return winner;
  return undefined;
}

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

function senseVotesOf(entry) {
  const votes = [];
  if (!Array.isArray(entry.senses)) return votes;
  for (const s of entry.senses) {
    if (!Array.isArray(s?.topics)) continue;
    const tags = s.topics.filter((t) => typeof t === "string").map((t) => t.toLowerCase());
    const vote = voteOfSense(tags);
    if (vote) votes.push(vote);
  }
  return votes;
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
    const next = cur ?? { vis: [], ipa: undefined, example: undefined, pos: undefined, votes: [] };
    next.vis.push(...vis);
    next.ipa = next.ipa ?? firstIpa(entry);
    next.example = next.example ?? firstExample(entry);
    next.pos = next.pos ?? kaikkiPosToVn(entry.pos);
    next.votes.push(...senseVotesOf(entry));
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
  const topicCount = {};
  for (const [en, data] of agg) {
    const cur = curated.get(en);
    const id = idByWord[en];
    const m = id ? bestByWordId[id] : null;
    const level = m ? levelFromValue(m.level) : undefined;
    if (!cur && !level) continue; // không có level CEFR → bỏ (trừ từ curated)
    const vi = cur?.vi ?? pickVi(data.vis);
    if (!vi) continue;
    const lv = level ?? "A2";
    const topic = cur
      ? slugify(cur.topic)
      : m && m.freq > TOPIC_FREQ_CUTOFF
        ? undefined
        : topicFromVotes(data.votes);
    words.push({
      en,
      vi,
      level: lv,
      frequency: m ? m.freq : 0,
      pos: (m ? pennToVn(posTags[m.posId]) : undefined) ?? data.pos,
      ipa: data.ipa,
      example: data.example,
      topic,
      source: cur ? "curated+maximax67" : "wiktionary+maximax67",
    });
    levelCount[lv] = (levelCount[lv] ?? 0) + 1;
    topicCount[topic ?? "(không chủ đề)"] = (topicCount[topic ?? "(không chủ đề)"] ?? 0) + 1;
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

  // Danh sách topic = 8 chủ đề curated + chủ đề mở rộng có đủ từ (≥10).
  const MIN_TOPIC_WORDS = 10;
  const topicsBySlug = new Map(TOPICS.map((t) => [t.slug, t.title]));
  for (const [slug, title] of TOPIC_RULES) {
    if (!topicsBySlug.has(slug) && (topicCount[slug] ?? 0) >= MIN_TOPIC_WORDS) topicsBySlug.set(slug, title);
  }
  for (const w of words) {
    if (w.topic && !topicsBySlug.has(w.topic)) {
      topicCount[w.topic] -= 1;
      topicCount["(không chủ đề)"] = (topicCount["(không chủ đề)"] ?? 0) + 1;
      w.topic = undefined;
    }
  }
  const topics = [...topicsBySlug.entries()].map(([slug, title]) => ({ slug, title }));

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
      byTopic: topicCount,
      generatedAt: new Date().toISOString(),
    },
    topics,
    words,
  }), "utf8");

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Wrote ${words.length.toLocaleString()} words -> ${path.relative(ROOT, OUT)} (${secs}s)`);
  console.log("Theo cấp độ:", Object.entries(levelCount).sort().map(([k, v]) => `${k}=${v}`).join("  "));
  console.log("Theo chủ đề:");
  for (const [k, v] of Object.entries(topicCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v.toLocaleString()}`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
