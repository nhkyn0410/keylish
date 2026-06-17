"use client";

/* VocabLibrarySplit — Kho từ vựng, layout "C · Split (danh sách + chi tiết)".
   Tái tạo từ thiết kế Claude Design (library.jsx · LibSplit) bằng neo.css +
   Icon có sẵn của user-web. Dữ liệu thật từ kho hệ thống (fetchVocab).
   Hành động "Thêm vào kho cá nhân" hiện là stub UI cho V2.1 (FR-PVOC) —
   sẽ nối API khi backend kho cá nhân hoàn thiện. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { WordDTO } from "@keylish/shared";
import { Icon } from "@/components/vocab/typing/primitives";
import { fetchVocab } from "@/infra/vocab/vocabApi";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const HARD_SHADOW = "3px 3px 0 0 #000";

function keyOf(w: WordDTO) {
  return w.id ?? `${w.en}:${w.level ?? ""}`;
}

function SearchGlyph({ size = 20, stroke = 3, style }: { size?: number; stroke?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      <g fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5L21 21" />
      </g>
    </svg>
  );
}

function LvBadge({ lv }: { lv: WordDTO["level"] }) {
  return (
    <span
      className="k-b2"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 36,
        padding: "3px 6px",
        fontWeight: 900,
        fontSize: 12,
        background: "var(--neo-white)",
        boxShadow: "2px 2px 0 0 #000",
      }}
    >
      {lv ?? "—"}
    </span>
  );
}

function speak(en: string) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(en);
    u.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* TTS không khả dụng — bỏ qua */
  }
}

export function VocabLibrarySplit() {
  const router = useRouter();
  const [words, setWords] = useState<WordDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeLevels, setActiveLevels] = useState<Set<string>>(new Set());
  const [activeTopics, setActiveTopics] = useState<Set<string>>(new Set());
  const [selKey, setSelKey] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    fetchVocab({ limit: 60 })
      .then((res) => {
        if (active) setWords(res.words);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const topics = useMemo(
    () => Array.from(new Set(words.map((w) => w.topic).filter(Boolean))) as string[],
    [words]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      const okQ = !q || w.en.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q);
      const okLv = activeLevels.size === 0 || (w.level != null && activeLevels.has(w.level));
      const okTp = activeTopics.size === 0 || (w.topic != null && activeTopics.has(w.topic));
      return okQ && okLv && okTp;
    });
  }, [words, query, activeLevels, activeTopics]);

  const sel = filtered.find((w) => keyOf(w) === selKey) ?? filtered[0] ?? null;

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function addToPersonal(w: WordDTO) {
    // Stub V2.1: hiện chỉ đánh dấu cục bộ. Khi có API kho cá nhân:
    // - khớp chính xác → tự liên kết tham chiếu (FR-PVOC-04)
    // - khớp biến thể → gợi ý từ gốc (FR-PVOC-05)
    setPicked((prev) => new Set(prev).add(keyOf(w)));
  }

  return (
    <div className="k-screen k-b" style={{ height: "min(80vh, 760px)", minHeight: 540 }}>
      {/* Top bar */}
      <div
        style={{
          flex: "0 0 auto",
          height: 58,
          borderBottom: "4px solid #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div className="k-badge k-badge--violet">Kho từ vựng</div>
        <button
          className="k-btn k-btn--sm k-btn--primary"
          onClick={() => router.push("/typing")}
          disabled={!sel}
        >
          Luyện bộ này <Icon name="arrow" size={16} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* LEFT — rail lọc */}
        <div
          style={{
            flex: "0 0 230px",
            borderRight: "4px solid #000",
            padding: "20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            background: "var(--neo-bg)",
            overflow: "auto",
          }}
        >
          <div
            className="k-b k-sh-sm"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: query ? "var(--neo-violet-soft)" : "var(--neo-white)",
            }}
          >
            <SearchGlyph size={18} stroke={3} style={{ flex: "0 0 auto" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm từ…"
              aria-label="Tìm từ"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "var(--font)",
                fontWeight: 700,
                fontSize: 14,
                width: "100%",
                minWidth: 0,
              }}
            />
          </div>

          <div>
            <div className="k-badge" style={{ marginBottom: 10 }}>
              Cấp độ
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  className="k-chip k-chip--level"
                  data-on={activeLevels.has(lv) ? "1" : "0"}
                  onClick={() => toggle(activeLevels, setActiveLevels, lv)}
                  style={{ minWidth: 44, padding: "5px 8px", fontSize: 12, boxShadow: HARD_SHADOW }}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          {topics.length > 0 ? (
            <div>
              <div className="k-badge k-badge--violet" style={{ marginBottom: 10 }}>
                Chủ đề
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {topics.map((t) => {
                  const on = activeTopics.has(t);
                  return (
                    <button
                      key={t}
                      className="k-chip"
                      data-on={on ? "1" : "0"}
                      onClick={() => toggle(activeTopics, setActiveTopics, t)}
                      style={{
                        padding: "6px 11px",
                        fontSize: 12.5,
                        boxShadow: HARD_SHADOW,
                        justifyContent: "space-between",
                      }}
                    >
                      {t} {on ? <Icon name="check" size={13} stroke={4} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: "auto", fontSize: 12, fontWeight: 700, opacity: 0.55, lineHeight: 1.4 }}>
            {filtered.length} từ khớp bộ lọc
            <br />
            {picked.size} trong kho của bạn
          </div>
        </div>

        {/* MIDDLE — danh sách từ */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflow: "auto",
          }}
        >
          <div className="k-h-eyebrow" style={{ color: "#7a6a00" }}>
            Danh sách từ {loading ? "· đang nạp…" : `· ${filtered.length}`}
          </div>

          {!loading && filtered.length === 0 ? (
            <div className="k-card" style={{ padding: 18, fontWeight: 700, opacity: 0.7 }}>
              Không có từ nào khớp bộ lọc. Thử bỏ bớt cấp độ / chủ đề.
            </div>
          ) : null}

          {filtered.map((w) => {
            const k = keyOf(w);
            const on = sel != null && keyOf(sel) === k;
            return (
              <button
                key={k}
                className="k-b2"
                onClick={() => setSelKey(k)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  background: on ? "var(--neo-yellow)" : "var(--neo-white)",
                  boxShadow: on ? "var(--sh-md)" : HARD_SHADOW,
                  transform: on ? "translate(-2px,-2px)" : undefined,
                }}
              >
                <span style={{ fontWeight: 900, fontSize: 16, width: 124, flex: "0 0 auto" }}>{w.en}</span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13.5,
                    opacity: 0.75,
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {w.vi}
                </span>
                <LvBadge lv={w.level} />
                {picked.has(k) ? (
                  <Icon name="check" size={16} stroke={4} style={{ color: "#16873f", flex: "0 0 auto" }} />
                ) : (
                  <span style={{ width: 16, flex: "0 0 auto" }} />
                )}
                <Icon name="chevright" size={16} stroke={3} style={{ opacity: on ? 1 : 0.35, flex: "0 0 auto" }} />
              </button>
            );
          })}
        </div>

        {/* RIGHT — panel chi tiết */}
        <div
          style={{
            flex: "0 0 360px",
            borderLeft: "4px solid #000",
            background: "var(--neo-violet)",
            position: "relative",
            padding: "24px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "auto",
          }}
        >
          <div className="k-halftone" style={{ position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none" }} />

          {sel ? (
            <>
              <div className="k-card" style={{ padding: "20px 20px 16px", position: "relative", zIndex: 1 }}>
                <div className="k-badge k-badge--white rn-2" style={{ position: "absolute", top: -13, left: 14 }}>
                  Chi tiết từ
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 32, lineHeight: 1 }}>{sel.en}</span>
                  <button
                    className="k-b2 k-sh-sm"
                    onClick={() => speak(sel.en)}
                    aria-label={`Phát âm ${sel.en}`}
                    style={{
                      width: 38,
                      height: 38,
                      background: "var(--neo-yellow)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="volume" size={20} stroke={3} />
                  </button>
                </div>
                {sel.ipa ? (
                  <div style={{ fontWeight: 500, fontSize: 15, opacity: 0.65, marginTop: 4 }}>{sel.ipa}</div>
                ) : null}
                <div style={{ height: 3, background: "#000", margin: "12px 0" }} />
                <div style={{ fontWeight: 800, fontSize: 19 }}>{sel.vi}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <LvBadge lv={sel.level} />
                  {sel.topic ? (
                    <span className="k-badge k-badge--white" style={{ boxShadow: "none", fontSize: 10 }}>
                      {sel.topic}
                    </span>
                  ) : null}
                </div>
              </div>

              {sel.example ? (
                <div
                  className="k-card"
                  style={{ padding: "14px 16px", position: "relative", zIndex: 1, background: "var(--neo-yellow-soft)" }}
                >
                  <div className="k-h-eyebrow" style={{ fontSize: 11, marginBottom: 6 }}>
                    Ví dụ
                  </div>
                  <div className="k-focus" style={{ fontWeight: 600, fontSize: 15.5, lineHeight: 1.5, fontStyle: "italic" }}>
                    “{sel.example}”
                  </div>
                </div>
              ) : null}

              <div className="k-card" style={{ padding: "14px 16px", position: "relative", zIndex: 1 }}>
                <div className="k-h-eyebrow" style={{ fontSize: 11, marginBottom: 10 }}>
                  Kho cá nhân
                </div>
                {picked.has(keyOf(sel)) ? (
                  <span className="k-badge k-badge--green" style={{ boxShadow: "none" }}>
                    <Icon name="check" size={13} stroke={4} /> Đã trong kho của bạn
                  </span>
                ) : (
                  <button
                    className="k-btn k-btn--sm"
                    onClick={() => addToPersonal(sel)}
                    style={{ width: "100%" }}
                  >
                    + Thêm vào kho của tôi
                  </button>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.55, marginTop: 8, lineHeight: 1.4 }}>
                  Lưu tham chiếu — không nhân bản (V2.1). Đồng bộ khi đăng nhập.
                </div>
              </div>

              <div style={{ flex: 1 }} />
              <button
                className="k-btn k-btn--primary"
                onClick={() => router.push("/typing")}
                style={{ width: "100%", position: "relative", zIndex: 1 }}
              >
                Luyện từ này <Icon name="arrow" size={20} />
              </button>
            </>
          ) : (
            <div className="k-card" style={{ padding: 18, position: "relative", zIndex: 1, fontWeight: 700 }}>
              {loading ? "Đang nạp từ vựng…" : "Chọn một từ ở danh sách để xem chi tiết."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
