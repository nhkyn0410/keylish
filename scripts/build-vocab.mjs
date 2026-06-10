// Build KeyLish seed vocabulary.
// Metadata (CEFR level, frequency, POS) from Maximax67/Words-CEFR-Dataset (MIT),
// downloaded CSVs cached in .data-tmp/. Vietnamese meanings + app topics are
// curated for the common core (below). The long tail can be filled later by
// ingesting a kaikki/Wiktionary EN→VI dump (run on a machine with bandwidth).
//
// Usage:  node scripts/build-vocab.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, ".data-tmp");
const OUT_DIR = path.join(ROOT, "apps", "web", "src", "data", "seed");
const OUT = path.join(OUT_DIR, "seed-vocabulary.json");

const LEVEL_MAP = { "1": "A1", "2": "A2", "3": "B1", "4": "B2", "5": "C1", "6": "C2" };

function pennToVn(tag) {
  if (!tag) return undefined;
  if (tag.startsWith("NN")) return "danh từ";
  if (tag.startsWith("VB") || tag === "MD") return "động từ";
  if (tag.startsWith("JJ")) return "tính từ";
  if (tag.startsWith("RB")) return "trạng từ";
  if (tag === "IN" || tag === "TO") return "giới từ";
  if (tag === "PRP" || tag === "PRP$" || tag === "WP") return "đại từ";
  if (tag === "UH") return "thán từ";
  if (tag === "CC") return "liên từ";
  if (tag === "CD") return "số từ";
  return undefined;
}

function parseCsvLine(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let j = i + 1, v = "";
      while (j < line.length && line[j] !== '"') { v += line[j]; j++; }
      out.push(v); i = j + 1; if (line[i] === ",") i++;
    } else if (line[i] === ",") { out.push(""); i++; }
    else { let j = i, v = ""; while (j < line.length && line[j] !== ",") { v += line[j]; j++; } out.push(v); i = j; if (line[i] === ",") i++; }
  }
  return out;
}

function readCsv(file) {
  const text = fs.readFileSync(path.join(DATA, file), "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  return lines.slice(1).map(parseCsvLine);
}

// [en, vi, topic] — curated VI + app topic; metadata comes from Maximax67.
const VI = [
  // Giao tiếp
  ["hello", "xin chào", "Giao tiếp"], ["goodbye", "tạm biệt", "Giao tiếp"], ["please", "làm ơn", "Giao tiếp"],
  ["sorry", "xin lỗi", "Giao tiếp"], ["friend", "bạn bè", "Giao tiếp"], ["talk", "nói chuyện", "Giao tiếp"],
  ["listen", "lắng nghe", "Giao tiếp"], ["question", "câu hỏi", "Giao tiếp"], ["answer", "câu trả lời", "Giao tiếp"],
  ["name", "tên", "Giao tiếp"], ["meet", "gặp gỡ", "Giao tiếp"], ["language", "ngôn ngữ", "Giao tiếp"],
  ["thank", "cảm ơn", "Giao tiếp"], ["help", "giúp đỡ", "Giao tiếp"],
  // Du lịch
  ["travel", "du lịch", "Du lịch"], ["airport", "sân bay", "Du lịch"], ["ticket", "vé", "Du lịch"],
  ["hotel", "khách sạn", "Du lịch"], ["map", "bản đồ", "Du lịch"], ["beach", "bãi biển", "Du lịch"],
  ["mountain", "ngọn núi", "Du lịch"], ["city", "thành phố", "Du lịch"], ["passport", "hộ chiếu", "Du lịch"],
  ["luggage", "hành lý", "Du lịch"], ["journey", "chuyến đi", "Du lịch"], ["river", "dòng sông", "Du lịch"],
  ["country", "quốc gia", "Du lịch"], ["road", "con đường", "Du lịch"],
  // Công sở
  ["office", "văn phòng", "Công sở"], ["meeting", "cuộc họp", "Công sở"], ["manager", "quản lý", "Công sở"],
  ["email", "thư điện tử", "Công sở"], ["report", "báo cáo", "Công sở"], ["project", "dự án", "Công sở"],
  ["colleague", "đồng nghiệp", "Công sở"], ["salary", "tiền lương", "Công sở"], ["desk", "bàn làm việc", "Công sở"],
  ["busy", "bận rộn", "Công sở"], ["work", "công việc", "Công sở"], ["money", "tiền", "Công sở"],
  ["plan", "kế hoạch", "Công sở"], ["sign", "ký tên", "Công sở"],
  // Học thuật
  ["student", "học sinh", "Học thuật"], ["teacher", "giáo viên", "Học thuật"], ["lesson", "bài học", "Học thuật"],
  ["study", "học", "Học thuật"], ["library", "thư viện", "Học thuật"], ["exam", "kỳ thi", "Học thuật"],
  ["knowledge", "kiến thức", "Học thuật"], ["research", "nghiên cứu", "Học thuật"], ["subject", "môn học", "Học thuật"],
  ["example", "ví dụ", "Học thuật"], ["dictionary", "từ điển", "Học thuật"], ["science", "khoa học", "Học thuật"],
  ["book", "quyển sách", "Học thuật"], ["read", "đọc", "Học thuật"],
  // Ẩm thực
  ["apple", "quả táo", "Ẩm thực"], ["bread", "bánh mì", "Ẩm thực"], ["water", "nước", "Ẩm thực"],
  ["rice", "cơm", "Ẩm thực"], ["coffee", "cà phê", "Ẩm thực"], ["vegetable", "rau củ", "Ẩm thực"],
  ["chicken", "thịt gà", "Ẩm thực"], ["delicious", "ngon", "Ẩm thực"], ["breakfast", "bữa sáng", "Ẩm thực"],
  ["restaurant", "nhà hàng", "Ẩm thực"], ["sugar", "đường", "Ẩm thực"], ["hungry", "đói", "Ẩm thực"],
  ["fish", "cá", "Ẩm thực"], ["milk", "sữa", "Ẩm thực"],
  // Công nghệ
  ["computer", "máy tính", "Công nghệ"], ["phone", "điện thoại", "Công nghệ"], ["internet", "mạng internet", "Công nghệ"],
  ["software", "phần mềm", "Công nghệ"], ["keyboard", "bàn phím", "Công nghệ"], ["screen", "màn hình", "Công nghệ"],
  ["password", "mật khẩu", "Công nghệ"], ["file", "tệp tin", "Công nghệ"], ["download", "tải xuống", "Công nghệ"],
  ["device", "thiết bị", "Công nghệ"], ["battery", "pin", "Công nghệ"], ["message", "tin nhắn", "Công nghệ"],
  ["data", "dữ liệu", "Công nghệ"], ["screenshot", "ảnh chụp màn hình", "Công nghệ"],
  // Sức khỏe
  ["doctor", "bác sĩ", "Sức khỏe"], ["medicine", "thuốc", "Sức khỏe"], ["healthy", "khỏe mạnh", "Sức khỏe"],
  ["hospital", "bệnh viện", "Sức khỏe"], ["sick", "ốm", "Sức khỏe"], ["exercise", "tập thể dục", "Sức khỏe"],
  ["sleep", "ngủ", "Sức khỏe"], ["pain", "cơn đau", "Sức khỏe"], ["fever", "sốt", "Sức khỏe"],
  ["nurse", "y tá", "Sức khỏe"], ["tired", "mệt mỏi", "Sức khỏe"], ["body", "cơ thể", "Sức khỏe"],
  ["eat", "ăn", "Sức khỏe"], ["drink", "uống", "Sức khỏe"],
  // Mua sắm
  ["shop", "cửa hàng", "Mua sắm"], ["price", "giá", "Mua sắm"], ["buy", "mua", "Mua sắm"],
  ["sell", "bán", "Mua sắm"], ["cheap", "rẻ", "Mua sắm"], ["expensive", "đắt", "Mua sắm"],
  ["customer", "khách hàng", "Mua sắm"], ["market", "chợ", "Mua sắm"], ["discount", "giảm giá", "Mua sắm"],
  ["clothes", "quần áo", "Mua sắm"], ["wallet", "ví", "Mua sắm"], ["pay", "trả tiền", "Mua sắm"],
  ["size", "kích cỡ", "Mua sắm"], ["bag", "túi xách", "Mua sắm"],
];

const posTags = {};
for (const r of readCsv("pos_tags.csv")) posTags[r[0]] = r[1];

const idByWord = {};
for (const r of readCsv("words.csv")) {
  const w = (r[1] || "").toLowerCase();
  if (w && !(w in idByWord)) idByWord[w] = r[0];
}

const bestByWordId = {};
for (const r of readCsv("word_pos.csv")) {
  const wid = r[1], freq = parseInt(r[4] || "0", 10);
  const cur = bestByWordId[wid];
  if (!cur || freq > cur.freq) bestByWordId[wid] = { posId: r[2], freq, level: r[5] };
}

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
    level: m ? LEVEL_MAP[m.level] || "A2" : "A2",
    frequency: m ? m.freq : 0,
  });
}
words.sort((a, b) => b.frequency - a.frequency);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({
  _meta: {
    source: "Metadata (CEFR level, frequency, POS): Maximax67/Words-CEFR-Dataset (MIT). Vietnamese meanings + topics: curated for KeyLish v1.",
    license: "Maximax67 metadata: MIT. Curated Vietnamese content: project-owned.",
    upgrade: "Pipeline can ingest a kaikki/Wiktionary EN→VI dump (run on a machine with bandwidth) to cover the long tail.",
    count: words.length,
    generatedAt: new Date().toISOString(),
  },
  words,
}, null, 2), "utf8");

console.log(`Wrote ${words.length} words -> ${path.relative(ROOT, OUT)}`);
console.log("Missing in Maximax67:", missing.join(", ") || "(none)");
for (const w of ["the", "go", "computer", "hospital", "apple"]) {
  const id = idByWord[w]; const m = id ? bestByWordId[id] : null;
  console.log(`  sanity ${w}: level=${m ? LEVEL_MAP[m.level] : "?"} freq=${m ? m.freq : "?"} pos=${m ? pennToVn(posTags[m.posId]) : "?"}`);
}
