/* Lemmatization Mức 1 (D-11) — luật đuôi + map bất quy tắc.
   CHỈ dùng để *gợi ý* dạng gốc khi dedup kho cá nhân (FR-PVOC-05).
   Không phải nguồn chân lý — sai sót đuôi hiếm chấp nhận được.
   Mức 2 (bảng WordForm từ kaikki) để dành (OQ-12). */

/** Chuẩn hóa từ EN: thường hóa, trim, chỉ giữ [a-z'-]. Khớp `clean()` của engine gõ. */
export function normalizeEn(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z'-]/g, "");
}

/** Bất quy tắc phổ biến (form → lemma). Danh sách rút gọn, mở rộng khi cần. */
const IRREGULAR: Record<string, string> = {
  // be / have / do
  is: "be", are: "be", am: "be", was: "be", were: "be", been: "be", being: "be",
  has: "have", had: "have", having: "have",
  does: "do", did: "do", done: "do", doing: "do",
  // động từ thường gặp
  went: "go", gone: "go", going: "go",
  said: "say", made: "make", got: "get", gotten: "get",
  took: "take", taken: "take", taking: "take",
  came: "come", coming: "come",
  saw: "see", seen: "see", seeing: "see",
  knew: "know", known: "know",
  gave: "give", given: "give", giving: "give",
  found: "find", thought: "think", told: "tell",
  became: "become", left: "leave", felt: "feel",
  brought: "bring", bought: "buy", taught: "teach",
  caught: "catch", built: "build", sent: "send",
  spent: "spend", met: "meet", paid: "pay",
  ran: "run", running: "run", ate: "eat", eaten: "eat", eating: "eat",
  wrote: "write", written: "write", spoke: "speak", spoken: "speak",
  drove: "drive", driven: "drive", broke: "break", broken: "break",
  // danh từ số nhiều bất quy tắc
  children: "child", people: "person", men: "man", women: "woman",
  feet: "foot", teeth: "tooth", mice: "mouse", geese: "goose",
  lives: "life", knives: "knife", leaves: "leaf", wolves: "wolf",
  // so sánh / so sánh nhất
  better: "good", best: "good", worse: "bad", worst: "bad",
  more: "much", most: "much",
};

/** Bỏ phụ âm đôi cuối (runn → run, bigg → big) sau khi cắt đuôi. */
function undouble(w: string): string | null {
  if (w.length > 3 && /([bcdfgklmnprst])\1$/.test(w)) return w.slice(0, -1);
  return null;
}

/** Cắt đuôi theo luật chính tả thường gặp → trả các ứng viên gốc. */
function ruleStems(w: string): string[] {
  const out: string[] = [];
  const push = (s: string) => {
    if (s.length >= 2) out.push(s);
    const u = undouble(s);
    if (u) out.push(u);
  };
  if (w.endsWith("ies") && w.length > 4) push(w.slice(0, -3) + "y"); // studies→study
  if (w.endsWith("ied") && w.length > 4) push(w.slice(0, -3) + "y"); // studied→study
  if (w.endsWith("ied") && w.length > 4) push(w.slice(0, -1)); // tied→tie
  if (w.endsWith("es") && w.length > 3) {
    push(w.slice(0, -2)); // boxes→box
    push(w.slice(0, -1)); // names→name (esp. -e)
  }
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) push(w.slice(0, -1)); // cats→cat
  if (w.endsWith("ing") && w.length > 5) {
    push(w.slice(0, -3)); // walking→walk, running→runn→run
    push(w.slice(0, -3) + "e"); // making→make
  }
  if (w.endsWith("ed") && w.length > 4) {
    push(w.slice(0, -2)); // walked→walk, planned→plann→plan
    push(w.slice(0, -1)); // liked→like
  }
  if (w.endsWith("est") && w.length > 5) push(w.slice(0, -3)); // fastest→fast
  if (w.endsWith("er") && w.length > 4) push(w.slice(0, -2)); // faster→fast
  return out;
}

/**
 * Trả danh sách dạng gốc *ứng viên* (gồm chính từ đã chuẩn hóa), không trùng,
 * theo thứ tự ưu tiên. Caller (API) đối chiếu với kho hệ thống để *gợi ý*.
 */
export function lemmaCandidates(input: string): string[] {
  const w = normalizeEn(input);
  if (!w) return [];
  const cands = new Set<string>([w]);
  if (IRREGULAR[w]) cands.add(IRREGULAR[w]);
  for (const s of ruleStems(w)) cands.add(s);
  return [...cands];
}
