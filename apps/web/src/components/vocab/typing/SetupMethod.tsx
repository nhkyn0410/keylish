"use client";

import { useEffect, useState } from "react";
import type { CefrLevel, TopicDTO } from "@keylish/shared";
import { fetchVocabCount } from "@/infra/vocab/vocabApi";
import { isSetupTourDone, startSetupTour } from "@/lib/tour";
import { Icon } from "./primitives";

export type Method = "M2" | "M1";
export interface VocabSelection {
  levels: CefrLevel[];
  topics: string[]; // topic slugs — khớp filter `topics` của API
  size: number; // số từ muốn luyện trong phiên
}

export interface VocabLoadState {
  loading: boolean;
  source: "api" | "cache" | "seed";
  error?: string;
}

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SESSION_SIZES = [20, 50, 100];

function Chip({
  label,
  on,
  onToggle,
  level,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  level?: boolean;
}) {
  return (
    <button
      type="button"
      className={"k-chip" + (level ? " k-chip--level" : "")}
      data-on={on ? "1" : "0"}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}

function StepNum({ n, color }: { n: string; color: string }) {
  return (
    <div
      className="k-b k-sh-sm"
      style={{
        width: 40,
        height: 40,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        fontWeight: 900,
        fontSize: 22,
      }}
    >
      {n}
    </div>
  );
}

function MethodRow({
  icon,
  title,
  sub,
  tag,
  tagColor,
  selected,
  locked,
  onSelect,
}: {
  icon: "swap" | "volume";
  title: string;
  sub: string;
  tag?: string;
  tagColor?: string;
  selected?: boolean;
  locked?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onSelect}
      className={"k-card" + (locked ? "" : " k-card--hover")}
      style={{
        textAlign: "left",
        font: "inherit",
        cursor: locked ? "default" : "pointer",
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "relative",
        background: selected
          ? "var(--neo-yellow-soft)"
          : locked
            ? "#F1EFE6"
            : "var(--neo-white)",
        boxShadow: locked ? "none" : undefined,
        opacity: locked ? 0.85 : 1,
      }}
    >
      {tag && (
        <div
          className={"k-badge " + tagColor + " r-3"}
          style={{ position: "absolute", top: -13, right: 16 }}
        >
          {tag}
        </div>
      )}
      <div
        className="k-b2 k-sh-sm"
        style={{
          width: 52,
          height: 52,
          background: selected
            ? "var(--neo-yellow)"
            : locked
              ? "#fff"
              : "var(--neo-violet)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        <Icon
          name={icon}
          size={28}
          stroke={3}
          style={{ opacity: locked ? 0.5 : 1 }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 19, lineHeight: 1.1 }}>
          {title}
        </div>
        <div
          style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, marginTop: 2 }}
        >
          {sub}
        </div>
      </div>
      {selected ? (
        <div className="k-badge k-badge--green" style={{ flex: "0 0 auto" }}>
          <Icon name="check" size={14} stroke={4} /> Đang chọn
        </div>
      ) : locked ? (
        <Icon
          name="lock"
          size={20}
          stroke={2.5}
          style={{ opacity: 0.5, flex: "0 0 auto" }}
        />
      ) : (
        <div className="k-badge k-badge--white" style={{ flex: "0 0 auto" }}>
          Chọn
        </div>
      )}
    </button>
  );
}

export function SetupMethod({
  topics: topicList,
  loadState,
  onStart,
}: {
  topics: TopicDTO[];
  loadState: VocabLoadState;
  onStart: (m: Method, selection: VocabSelection) => void;
}) {
  const [levels, setLevels] = useState<Record<string, boolean>>({
    A1: true,
    A2: true,
  });
  // Key = topic slug. Mặc định KHÔNG chọn gì = luyện tất cả chủ đề (kể cả từ
  // chưa phân loại) — chọn chủ đề chỉ là thu hẹp tùy chọn.
  const [topics, setTopics] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState<Method>("M2");
  const [size, setSize] = useState(20);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  // Tour hướng dẫn tự chạy đúng một lần (F-013); xem lại bằng nút "?".
  useEffect(() => {
    if (isSetupTourDone()) return;
    const timer = window.setTimeout(() => startSetupTour(), 600);
    return () => window.clearTimeout(timer);
  }, []);

  const selLevels = LEVELS.filter((l) => levels[l]);
  const selTopics = topicList.filter((t) => topics[t.slug]);
  const selSlugs = selTopics.map((t) => t.slug);
  const allTopics = selSlugs.length === 0;
  const levelsKey = selLevels.join(",");
  const topicsKey = selSlugs.join(",");

  // Số từ thật khớp bộ lọc, lấy từ DB (debounce khi đổi cấp độ/chủ đề).
  useEffect(() => {
    let live = true;
    setMatchCount(null);
    const timer = window.setTimeout(() => {
      const levelList = levelsKey
        ? (levelsKey.split(",") as CefrLevel[])
        : undefined;
      const topicArr = topicsKey ? topicsKey.split(",") : undefined;
      fetchVocabCount({ levels: levelList, topics: topicArr }).then((n) => {
        if (live) setMatchCount(n);
      });
    }, 300);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [levelsKey, topicsKey]);

  const sessionWords = matchCount == null ? size : Math.min(size, matchCount);
  const canStart = matchCount != null && matchCount > 0;
  const toggle = (
    set: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string,
  ) => set((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="k-screen">
      <div style={{ flex: "0 0 auto", paddingTop: 24, paddingBottom: 14 }}>
        <div
          className="k-wrap"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <h1 className="k-display" style={{ fontSize: 46, lineHeight: 1 }}>
            Thiết lập phiên luyện
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: "0 0 auto",
            }}
          >
            <div
              className="k-badge k-badge--white"
              style={{ boxShadow: "none" }}
            >
              {loadState.loading
                ? "Đang nạp"
                : loadState.source === "api"
                  ? "API"
                  : loadState.source === "cache"
                    ? "Cache"
                    : "Seed"}
            </div>
            <button
              type="button"
              className="k-btn k-btn--sm k-btn--ghost k-b2"
              aria-label="Xem hướng dẫn"
              title="Xem hướng dẫn"
              onClick={() => startSetupTour()}
            >
              ?
            </button>
          </div>
        </div>
      </div>

      <div
        style={{ flex: 1, minHeight: 0, paddingBottom: 18, overflow: "auto" }}
      >
        <div className="k-wrap" style={{ display: "flex", gap: 26 }}>
          {/* LEFT — Nguồn */}
          <div
            style={{
              flex: "1.12 1 0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StepNum n="1" color="var(--neo-yellow)" />
              <div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>Nguồn từ</div>
              </div>
            </div>

            <div id="tour-levels" className="k-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div className="k-badge">Cấp độ</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {LEVELS.map((l) => (
                  <Chip
                    key={l}
                    label={l}
                    level
                    on={!!levels[l]}
                    onToggle={() => toggle(setLevels, l)}
                  />
                ))}
              </div>
            </div>

            <div id="tour-topics" className="k-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div className="k-badge k-badge--violet">Chủ đề</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Chip
                  label="Tất cả"
                  on={allTopics}
                  onToggle={() => setTopics({})}
                />
                {topicList.map((t) => (
                  <Chip
                    key={t.slug}
                    label={t.title}
                    on={!!topics[t.slug]}
                    onToggle={() => toggle(setTopics, t.slug)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Phương pháp */}
          <div
            id="tour-methods"
            style={{
              flex: "0.95 1 0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StepNum n="2" color="var(--neo-violet)" />
              <div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>Phương pháp</div>
              </div>
            </div>

            <MethodRow
              icon="swap"
              title="Nghĩa VI → Gõ EN"
              sub="M2 · char-by-char"
              tag="Ưu tiên"
              tagColor="k-badge--green"
              selected={method === "M2"}
              onSelect={() => setMethod("M2")}
            />
            <MethodRow
              icon="volume"
              title="Nghe → Gõ"
              sub="M1 · TTS giọng trình duyệt"
              tag=""
              tagColor="k-badge--violet"
              selected={method === "M1"}
              onSelect={() => setMethod("M1")}
            />

            <div id="tour-size" className="k-card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div className="k-badge k-badge--green">Số từ</div>
                <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>
                  Mỗi phiên luyện
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {SESSION_SIZES.map((s) => (
                  <Chip
                    key={s}
                    label={String(s)}
                    level
                    on={size === s}
                    onToggle={() => setSize(s)}
                  />
                ))}
              </div>
              {matchCount != null && matchCount < size && matchCount > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: 0.6,
                    marginTop: 10,
                  }}
                >
                  Bộ lọc chỉ có {matchCount} từ — phiên này luyện {matchCount}{" "}
                  từ.
                </div>
              )}
            </div>

            <div
              className="k-b2"
              style={{
                padding: "14px 16px",
                background: "#F1EFE6",
                boxShadow: "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon
                name="lock"
                size={18}
                stroke={2.5}
                style={{ opacity: 0.5, flex: "0 0 auto" }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>
                +5 phương pháp khác sẽ có trong tương lai
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* bottom action bar */}
      <div
        style={{
          flex: "0 0 auto",
          borderTop: "4px solid #000",
          background: "var(--neo-white)",
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <div
          className="k-wrap"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="k-stat-num" style={{ fontSize: 44 }}>
                {matchCount == null ? "…" : matchCount}
              </span>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 16,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                từ khớp
              </span>
            </div>
            <div style={{ width: 4, height: 40, background: "#000" }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                className="k-badge k-badge--green"
                style={{ boxShadow: "none" }}
              >
                {method === "M2" ? "M2 · Nghĩa VI → Gõ EN" : "M1 · Nghe → Gõ"}
              </span>
              <span
                className="k-badge k-badge--white"
                style={{ boxShadow: "none" }}
              >
                {selLevels.join(", ") || "—"}
              </span>
              {allTopics ? (
                <span
                  className="k-badge k-badge--white"
                  style={{ boxShadow: "none" }}
                >
                  Tất cả chủ đề
                </span>
              ) : (
                selTopics.slice(0, 3).map((t) => (
                  <span
                    key={t.slug}
                    className="k-badge k-badge--white"
                    style={{ boxShadow: "none" }}
                  >
                    {t.title}
                  </span>
                ))
              )}
              {loadState.error && (
                <span
                  className="k-badge k-badge--red"
                  style={{ boxShadow: "none" }}
                >
                  Fallback
                </span>
              )}
            </div>
          </div>
          <button
            id="tour-start"
            type="button"
            className="k-btn k-btn--primary k-btn--lg"
            style={{ flex: "0 0 auto" }}
            disabled={!canStart}
            onClick={() =>
              onStart(method, { levels: selLevels, topics: selSlugs, size })
            }
          >
            Luyện {sessionWords} từ <Icon name="arrow" size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
