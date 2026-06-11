"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CefrLevel, TopicDTO } from "@keylish/shared";
import { topicSlug } from "@/infra/vocab/vocabApi";
import { isSetupTourDone, startSetupTour } from "@/lib/tour";
import { Icon, Logo } from "./primitives";
import type { VocabWord } from "./useTypingSession";

export type Method = "M2" | "M1";
export interface VocabSelection {
  levels: CefrLevel[];
  topics: string[]; // topic slugs — khớp filter `topics` của API
}

export interface VocabLoadState {
  loading: boolean;
  source: "api" | "cache" | "seed";
  error?: string;
}

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function isCefrLevel(value: VocabWord["level"]): value is CefrLevel {
  return typeof value === "string" && (LEVELS as string[]).includes(value);
}

function Chip({ label, on, onToggle, level }: { label: string; on: boolean; onToggle: () => void; level?: boolean }) {
  return (
    <button type="button" className={"k-chip" + (level ? " k-chip--level" : "")} data-on={on ? "1" : "0"} onClick={onToggle}>
      {label}
    </button>
  );
}

function StepNum({ n, color }: { n: string; color: string }) {
  return (
    <div className="k-b k-sh-sm" style={{ width: 40, height: 40, background: color, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", fontWeight: 900, fontSize: 22 }}>
      {n}
    </div>
  );
}

function MethodRow({
  icon, title, sub, tag, tagColor, selected, locked, onSelect,
}: {
  icon: "swap" | "volume"; title: string; sub: string; tag?: string; tagColor?: string; selected?: boolean; locked?: boolean; onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onSelect}
      className={"k-card" + (locked ? "" : " k-card--hover")}
      style={{
        textAlign: "left", font: "inherit", cursor: locked ? "default" : "pointer",
        padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, position: "relative",
        background: selected ? "var(--neo-yellow-soft)" : locked ? "#F1EFE6" : "var(--neo-white)",
        boxShadow: locked ? "none" : undefined, opacity: locked ? 0.85 : 1,
      }}
    >
      {tag && <div className={"k-badge " + tagColor + " r-3"} style={{ position: "absolute", top: -13, right: 16 }}>{tag}</div>}
      <div className="k-b2 k-sh-sm" style={{ width: 52, height: 52, background: selected ? "var(--neo-yellow)" : locked ? "#fff" : "var(--neo-violet)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={28} stroke={3} style={{ opacity: locked ? 0.5 : 1 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 19, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, marginTop: 2 }}>{sub}</div>
      </div>
      {selected ? (
        <div className="k-badge k-badge--green" style={{ flex: "0 0 auto" }}><Icon name="check" size={14} stroke={4} /> Đang chọn</div>
      ) : locked ? (
        <Icon name="lock" size={20} stroke={2.5} style={{ opacity: 0.5, flex: "0 0 auto" }} />
      ) : (
        <div className="k-badge k-badge--white" style={{ flex: "0 0 auto" }}>Chọn</div>
      )}
    </button>
  );
}

export function SetupMethod({
  words, topics: topicList, loadState, onStart,
}: {
  words: VocabWord[];
  topics: TopicDTO[];
  loadState: VocabLoadState;
  onStart: (m: Method, filtered: VocabWord[], selection: VocabSelection) => void;
}) {
  const [levels, setLevels] = useState<Record<string, boolean>>({ A1: true, A2: true });
  // Key = topic slug. Mặc định KHÔNG chọn gì = luyện tất cả chủ đề (kể cả từ
  // chưa phân loại) — chọn chủ đề chỉ là thu hẹp tùy chọn.
  const [topics, setTopics] = useState<Record<string, boolean>>({});
  const [onlyUnlearned, setOnlyUnlearned] = useState(true);
  const [method, setMethod] = useState<Method>("M2");

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
  const filtered = words.filter(
    (w) =>
      (selLevels.length === 0 || (isCefrLevel(w.level) && selLevels.includes(w.level))) &&
      (allTopics || (w.topic != null && selSlugs.includes(topicSlug(w.topic)))),
  );
  const toggle = (set: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string) =>
    set((s) => ({ ...s, [key]: !s[key] }));

  // Container căn giữa, giới hạn bề ngang + padding 2 bên (đồng bộ max-w-7xl của site).
  const inner: React.CSSProperties = {
    width: "100%", maxWidth: 1280, marginLeft: "auto", marginRight: "auto",
    paddingLeft: 40, paddingRight: 40, boxSizing: "border-box",
  };

  return (
    <div className="k-screen">
      <header style={{ flex: "0 0 auto", height: 76, background: "var(--neo-bg)", borderBottom: "4px solid #000", display: "flex", alignItems: "center" }}>
        <div style={{ ...inner, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" aria-label="Về trang chủ" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
            <Logo />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="k-badge k-badge--white" style={{ boxShadow: "none" }}>
              {loadState.loading ? "Đang nạp" : loadState.source === "api" ? "API" : loadState.source === "cache" ? "Cache" : "Seed"}
            </div>
            <button type="button" className="k-btn k-btn--sm k-btn--ghost k-b2" aria-label="Xem hướng dẫn" title="Xem hướng dẫn" onClick={() => startSetupTour()}>?</button>
            <Link href="/" className="k-btn k-btn--sm k-btn--ghost k-b2">Thoát</Link>
          </div>
        </div>
      </header>

      <div style={{ flex: "0 0 auto", paddingTop: 24, paddingBottom: 14 }}>
        <div style={{ ...inner, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div className="k-h-eyebrow" style={{ color: "#7a6a00", marginBottom: 6 }}>KeyLish · Gõ từ vựng đa mode</div>
            <h1 className="k-display" style={{ fontSize: 46, lineHeight: 1 }}>Thiết lập phiên luyện</h1>
          </div>
          <p style={{ fontWeight: 600, fontSize: 15, color: "rgba(0,0,0,.7)", maxWidth: 360, textAlign: "right", marginBottom: 4 }}>
            Chọn nguồn từ và phương pháp trong cùng một màn — không cần qua hai bước.
          </p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, paddingBottom: 18, overflow: "auto" }}>
        <div style={{ ...inner, display: "flex", gap: 26 }}>
        {/* LEFT — Nguồn */}
        <div style={{ flex: "1.12 1 0", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StepNum n="1" color="var(--neo-yellow)" />
            <div>
              <div style={{ fontWeight: 900, fontSize: 22 }}>Nguồn từ</div>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.55 }}>Lọc kho từ (F-005) theo cấp độ &amp; chủ đề</div>
            </div>
          </div>

          <div id="tour-levels" className="k-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div className="k-badge">Cấp độ</div>
              <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>Khung CEFR</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {LEVELS.map((l) => <Chip key={l} label={l} level on={!!levels[l]} onToggle={() => toggle(setLevels, l)} />)}
            </div>
          </div>

          <div id="tour-topics" className="k-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div className="k-badge k-badge--violet">Chủ đề</div>
              <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>Mặc định luyện tất cả — chọn để thu hẹp</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Chip label="Tất cả" on={allTopics} onToggle={() => setTopics({})} />
              {topicList.map((t) => <Chip key={t.slug} label={t.title} on={!!topics[t.slug]} onToggle={() => toggle(setTopics, t.slug)} />)}
            </div>
          </div>

          <div className="k-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--neo-green-soft)" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Chỉ luyện từ chưa thuộc</div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.65, marginTop: 2 }}>Bỏ qua các từ đã đánh dấu thuộc</div>
            </div>
            <button type="button" className="k-switch" data-on={onlyUnlearned ? "1" : "0"} aria-label="Chỉ luyện từ chưa thuộc" onClick={() => setOnlyUnlearned((v) => !v)} />
          </div>
        </div>

        {/* RIGHT — Phương pháp */}
        <div id="tour-methods" style={{ flex: "0.95 1 0", display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StepNum n="2" color="var(--neo-violet)" />
            <div>
              <div style={{ fontWeight: 900, fontSize: 22 }}>Phương pháp</div>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.55 }}>Mỗi cách luyện một kỹ năng khác nhau</div>
            </div>
          </div>

          <MethodRow icon="swap" title="Nghĩa VI → Gõ EN" sub="M2 · char-by-char" tag="Ưu tiên" tagColor="k-badge--green" selected={method === "M2"} onSelect={() => setMethod("M2")} />
          <MethodRow icon="volume" title="Nghe → Gõ" sub="M1 · TTS giọng trình duyệt" tag="v1" tagColor="k-badge--violet" selected={method === "M1"} onSelect={() => setMethod("M1")} />

          <div className="k-b2" style={{ padding: "14px 16px", background: "#F1EFE6", boxShadow: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="lock" size={18} stroke={2.5} style={{ opacity: 0.5, flex: "0 0 auto" }} />
            <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>+5 phương pháp khác (M3–M6, M10) mở sau v1</span>
          </div>
        </div>
        </div>
      </div>

      {/* bottom action bar */}
      <div style={{ flex: "0 0 auto", borderTop: "4px solid #000", background: "var(--neo-white)", paddingTop: 16, paddingBottom: 16 }}>
        <div style={{ ...inner, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="k-stat-num" style={{ fontSize: 44 }}>{filtered.length}</span>
            <span style={{ fontWeight: 900, fontSize: 16, textTransform: "uppercase", letterSpacing: ".05em" }}>từ</span>
          </div>
          <div style={{ width: 4, height: 40, background: "#000" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="k-badge k-badge--green" style={{ boxShadow: "none" }}>{method === "M2" ? "M2 · Nghĩa VI → Gõ EN" : "M1 · Nghe → Gõ"}</span>
            <span className="k-badge k-badge--white" style={{ boxShadow: "none" }}>{selLevels.join(", ") || "—"}</span>
            {allTopics
              ? <span className="k-badge k-badge--white" style={{ boxShadow: "none" }}>Tất cả chủ đề</span>
              : selTopics.slice(0, 3).map((t) => <span key={t.slug} className="k-badge k-badge--white" style={{ boxShadow: "none" }}>{t.title}</span>)}
            {loadState.error && <span className="k-badge k-badge--red" style={{ boxShadow: "none" }}>Fallback</span>}
          </div>
        </div>
        <button id="tour-start" type="button" className="k-btn k-btn--primary k-btn--lg" style={{ flex: "0 0 auto" }} disabled={filtered.length === 0} onClick={() => onStart(method, filtered, { levels: selLevels, topics: selSlugs })}>
          Bắt đầu luyện <Icon name="arrow" size={22} />
        </button>
        </div>
      </div>
    </div>
  );
}
