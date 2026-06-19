"use client";

/* VocabLibrarySplit — Kho từ vựng, layout "C · Split (danh sách + chi tiết)".
   Tái tạo từ thiết kế Claude Design (library.jsx · LibSplit) bằng neo.css +
   Icon có sẵn của user-web. Dữ liệu thật từ kho hệ thống (fetchVocab).
   Hành động "Thêm vào kho cá nhân" hiện là stub UI cho V2.1 (FR-PVOC) —
   sẽ nối API khi backend kho cá nhân hoàn thiện. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { CefrLevel, TopicDTO, WordDTO } from "@keylish/shared";
import { Icon } from "@/components/vocab/typing/primitives";
import { fetchTopics, fetchVocab } from "@/infra/vocab/vocabApi";
import { ApiError, getErrorMessage, pickSystemWord } from "@/infra/user/userApi";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const HARD_SHADOW = "3px 3px 0 0 #000";
const PAGE_SIZE = 100;

function keyOf(w: WordDTO) {
  return w.id ?? `${w.en}:${w.level ?? ""}`;
}

export function SearchGlyph({
  size = 20,
  stroke = 3,
  style,
}: {
  size?: number;
  stroke?: number;
  style?: CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5L21 21" />
      </g>
    </svg>
  );
}

export function LvBadge({ lv }: { lv: WordDTO["level"] }) {
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

export function speak(en: string) {
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
  const [topics, setTopics] = useState<TopicDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeLevels, setActiveLevels] = useState<Set<string>>(new Set());
  const [activeTopics, setActiveTopics] = useState<Set<string>>(new Set());
  const [selKey, setSelKey] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let active = true;
    fetchTopics().then((res) => {
      if (active) setTopics(res.topics);
    });
    return () => {
      active = false;
    };
  }, []);

  const levelList = useMemo(
    () => LEVELS.filter((level) => activeLevels.has(level)),
    [activeLevels]
  );
  const topicList = useMemo(() => Array.from(activeTopics).sort(), [activeTopics]);
  const search = query.trim();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHasMore(false);
    const timer = window.setTimeout(() => {
      const filter = {
        levels: levelList.length ? levelList : undefined,
        topics: topicList.length ? topicList : undefined,
        search: search || undefined,
      };

      fetchVocab({ ...filter, limit: PAGE_SIZE, offset: 0, random: false })
        .then((res) => {
          if (!active) return;
          setWords(res.words);
          setHasMore(res.words.length === PAGE_SIZE);
          setSelKey((current) => {
            if (!current) return null;
            const nextKeys = new Set(res.words.map(keyOf));
            return nextKeys.has(current) ? current : null;
          });
        })
        .catch(() => {
          if (!active) return;
          setWords([]);
          setHasMore(false);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [levelList, search, topicList]);

  const filtered = words;

  const sel = filtered.find((w) => keyOf(w) === selKey) ?? filtered[0] ?? null;

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const filter = {
      levels: levelList.length ? levelList : undefined,
      topics: topicList.length ? topicList : undefined,
      search: search || undefined,
    };

    setLoadingMore(true);
    try {
      const res = await fetchVocab({
        ...filter,
        limit: PAGE_SIZE,
        offset: words.length,
        random: false,
      });
      setWords((current) => {
        const seen = new Set(current.map(keyOf));
        const next = res.words.filter((word) => !seen.has(keyOf(word)));
        return [...current, ...next];
      });
      setHasMore(res.words.length === PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  async function addToPersonal(w: WordDTO) {
    setNotice(null);
    if (!w.id) {
      setNotice("Từ này chưa thể thêm.");
      return;
    }
    try {
      await pickSystemWord(w.id); // FR-PVOC-02: lưu tham chiếu
      setPicked((prev) => new Set(prev).add(keyOf(w)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setPicked((prev) => new Set(prev).add(keyOf(w))); // đã có trong kho
      } else if (err instanceof ApiError && err.status === 401) {
        setNotice("Đăng nhập để lưu từ vào kho của bạn.");
      } else {
        setNotice(getErrorMessage(err));
      }
    }
  }

  return (
    <div className="k-screen k-b" style={{ height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* LEFT — rail lọc */}
        <div
          style={{
            flex: "0 0 310px",
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
                  const on = activeTopics.has(t.slug);
                  return (
                    <button
                      key={t.slug}
                      className="k-chip"
                      data-on={on ? "1" : "0"}
                      onClick={() => toggle(activeTopics, setActiveTopics, t.slug)}
                      style={{
                        padding: "6px 11px",
                        fontSize: 12.5,
                        boxShadow: HARD_SHADOW,
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{t.title}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ opacity: 0.55 }}>{t.count}</span>
                        {on ? <Icon name="check" size={13} stroke={4} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="k-btn k-btn--sm k-btn--primary"
              onClick={() => router.push("/typing")}
              disabled={!sel}
              style={{ width: "100%" }}
            >
              Luyện bộ này <Icon name="arrow" size={16} />
            </button>
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
          {loading && filtered.length === 0 ? (
            <div className="k-card" style={{ padding: 18, fontWeight: 700, opacity: 0.7 }}>
              Đang nạp từ vựng…
            </div>
          ) : null}

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
                <span style={{ fontWeight: 900, fontSize: 16, width: 124, flex: "0 0 auto" }}>
                  {w.en}
                </span>
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
                  <Icon
                    name="check"
                    size={16}
                    stroke={4}
                    style={{ color: "#16873f", flex: "0 0 auto" }}
                  />
                ) : (
                  <span style={{ width: 16, flex: "0 0 auto" }} />
                )}
                <Icon
                  name="chevright"
                  size={16}
                  stroke={3}
                  style={{ opacity: on ? 1 : 0.35, flex: "0 0 auto" }}
                />
              </button>
            );
          })}

          {filtered.length > 0 && hasMore ? (
            <button
              className="k-btn k-btn--sm"
              onClick={loadMore}
              disabled={loadingMore}
              style={{ alignSelf: "center", marginTop: 4 }}
            >
              {loadingMore ? "Đang tải…" : "Tải thêm"}
            </button>
          ) : null}
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
          <div
            className="k-halftone"
            style={{ position: "absolute", inset: 0, opacity: 0.12, pointerEvents: "none" }}
          />

          {sel ? (
            <>
              <div
                className="k-card"
                style={{ padding: "20px 20px 16px", position: "relative", zIndex: 1 }}
              >
                <div
                  className="k-badge k-badge--white rn-2"
                  style={{ position: "absolute", top: -13, left: 14 }}
                >
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
                  <div style={{ fontWeight: 500, fontSize: 15, opacity: 0.65, marginTop: 4 }}>
                    {sel.ipa}
                  </div>
                ) : null}
                <div style={{ height: 3, background: "#000", margin: "12px 0" }} />
                <div style={{ fontWeight: 800, fontSize: 19 }}>{sel.vi}</div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <LvBadge lv={sel.level} />
                  {sel.topic ? (
                    <span
                      className="k-badge k-badge--white"
                      style={{ boxShadow: "none", fontSize: 10 }}
                    >
                      {sel.topic}
                    </span>
                  ) : null}
                </div>
              </div>

              {sel.example ? (
                <div
                  className="k-card"
                  style={{
                    padding: "14px 16px",
                    position: "relative",
                    zIndex: 1,
                    background: "var(--neo-yellow-soft)",
                  }}
                >
                  <div className="k-h-eyebrow" style={{ fontSize: 11, marginBottom: 6 }}>
                    Ví dụ
                  </div>
                  <div
                    className="k-focus"
                    style={{
                      fontWeight: 600,
                      fontSize: 15.5,
                      lineHeight: 1.5,
                      fontStyle: "italic",
                    }}
                  >
                    “{sel.example}”
                  </div>
                </div>
              ) : null}

              <div
                className="k-card"
                style={{ padding: "14px 16px", position: "relative", zIndex: 1 }}
              >
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
                {notice ? (
                  <div
                    style={{ fontSize: 11, fontWeight: 800, color: "var(--neo-red)", marginTop: 8 }}
                  >
                    {notice}
                  </div>
                ) : null}
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
            <div
              className="k-card"
              style={{ padding: 18, position: "relative", zIndex: 1, fontWeight: 700 }}
            >
              {loading ? "Đang nạp từ vựng…" : "Chọn một từ ở danh sách để xem chi tiết."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
