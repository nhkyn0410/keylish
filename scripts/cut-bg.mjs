// Tách nền phẳng của ảnh mascot thành trong suốt bằng flood-fill từ 4 mép.
// Chỉ xóa vùng nền NỐI với mép (viền đen của robot chặn nên thân màu kem bên
// trong KHÔNG bị xóa). Cạnh được feather nhẹ để giảm halo.
//
// Usage: node scripts/cut-bg.mjs <input.png> <output.png> [threshold=60]
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const [, , inArg, outArg, thArg] = process.argv;
if (!inArg || !outArg) {
  console.error("Usage: node scripts/cut-bg.mjs <input.png> <output.png> [threshold]");
  process.exit(1);
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inPath = path.resolve(ROOT, inArg);
const outPath = path.resolve(ROOT, outArg);
const THRESHOLD = Number(thArg ?? 60); // khoảng cách màu để coi là "nền"
const FEATHER = THRESHOLD * 1.8; // vùng chuyển → alpha mờ dần

const { data, info } = await sharp(inPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Màu nền tham chiếu = trung bình 4 góc.
const corners = [0, W - 1, (H - 1) * W, H * W - 1];
let br = 0,
  bg = 0,
  bb = 0;
for (const px of corners) {
  br += data[px * C];
  bg += data[px * C + 1];
  bb += data[px * C + 2];
}
br /= 4;
bg /= 4;
bb /= 4;

const dist = (i) => {
  const dr = data[i * C] - br,
    dg = data[i * C + 1] - bg,
    db = data[i * C + 2] - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

// BFS từ mọi pixel ở mép.
const visited = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) {
  stack.push(x);
  stack.push((H - 1) * W + x);
}
for (let y = 0; y < H; y++) {
  stack.push(y * W);
  stack.push(y * W + W - 1);
}

let cut = 0,
  feathered = 0;
while (stack.length) {
  const i = stack.pop();
  if (visited[i]) continue;
  visited[i] = 1;
  const d = dist(i);
  if (d < THRESHOLD) {
    data[i * C + 3] = 0; // trong suốt hẳn
    cut++;
  } else if (d < FEATHER) {
    // cạnh chuyển: alpha mờ dần (giảm halo trắng quanh viền đen)
    data[i * C + 3] = Math.round(((d - THRESHOLD) / (FEATHER - THRESHOLD)) * 255);
    feathered++;
    continue; // không lan tiếp qua vùng cạnh
  } else {
    continue; // chạm vào hình → dừng
  }
  const x = i % W,
    y = (i / W) | 0;
  if (x > 0) stack.push(i - 1);
  if (x < W - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - W);
  if (y < H - 1) stack.push(i + W);
}

await sharp(data, { raw: { width: W, height: H, channels: C } })
  .png()
  .toFile(outPath);
console.log(
  `Nền ref rgb(${br | 0},${bg | 0},${bb | 0}) · xóa ${cut.toLocaleString()} px, feather ${feathered.toLocaleString()} px`
);
console.log(`-> ${path.relative(ROOT, outPath)}`);
