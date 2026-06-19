"use client";

import { useEffect, useState } from "react";
import type { CefrLevel, TopicDTO } from "@keylish/shared";
import { fetchVocabCount, type VocabSource } from "@/infra/vocab/vocabApi";
import { isSetupTourDone, startSetupTour } from "@/lib/tour";
import { Icon } from "./primitives";
import {
  DEFAULT_PRACTICE_SETTINGS,
  PRACTICE_SETTING_DEFS,
  TEST_SETTINGS,
  type Drill,
  type PracticeSettings,
} from "./practiceSettings";

export type Method = "M2" | "M1";
export interface VocabSelection {
  levels: CefrLevel[];
  topics: string[]; // topic slugs — khớp filter `topics` của API
  size: number; // số từ muốn luyện trong phiên
}

export interface VocabLoadState {
  loading: boolean;
  source: VocabSource;
  error?: string;
}

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SESSION_SIZES = [20, 50];

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
        background: selected ? "var(--neo-yellow-soft)" : locked ? "#F1EFE6" : "var(--neo-white)",
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
          background: selected ? "var(--neo-yellow)" : locked ? "#fff" : "var(--neo-violet)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        <Icon name={icon} size={28} stroke={3} style={{ opacity: locked ? 0.5 : 1 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 19, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, marginTop: 2 }}>{sub}</div>
      </div>
      {selected ? (
        <div className="k-badge k-badge--green" style={{ flex: "0 0 auto" }}>
          <Icon name="check" size={14} stroke={4} /> Đang chọn
        </div>
      ) : locked ? (
        <Icon name="lock" size={20} stroke={2.5} style={{ opacity: 0.5, flex: "0 0 auto" }} />
      ) : (
        <div className="k-badge k-badge--white" style={{ flex: "0 0 auto" }}>
          Chọn
        </div>
      )}
    </button>
  );
}

/** Lựa chọn chế độ phiên — Luyện tập (mở tuỳ chọn) hoặc Kiểm tra (khoá). */
function ModeOption({
  icon,
  title,
  color,
  selected,
  onSelect,
}: {
  icon: "book" | "target";
  title: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={"k-card" + (selected ? "" : " k-card--hover")}
      style={{
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        padding: "14px 15px",
        display: "flex",
        alignItems: "center",
        gap: 13,
        flex: "1 1 0",
        minWidth: 0,
        position: "relative",
        background: selected ? color : "var(--neo-white)",
      }}
    >
      <div
        className="k-b2 k-sh-sm"
        style={{
          width: 44,
          height: 44,
          background: selected ? "var(--neo-white)" : "#F1EFE6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        <Icon name={icon} size={24} stroke={3} />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontWeight: 900,
          fontSize: 17,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {selected ? (
        <div className="k-badge k-badge--green" style={{ flex: "0 0 auto" }}>
          <Icon name="check" size={13} stroke={4} />
        </div>
      ) : (
        <div className="k-badge k-badge--white" style={{ flex: "0 0 auto", boxShadow: "none" }}>
          Chọn
        </div>
      )}
    </button>
  );
}

/** Một dòng cấu hình trong drawer Tuỳ chọn luyện tập. */
function SettingRow({
  def,
  value,
  locked,
  onSelect,
}: {
  def: (typeof PRACTICE_SETTING_DEFS)[number];
  value: string;
  locked: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div
      className="k-card"
      style={{
        padding: "14px 16px",
        background: locked ? "#F1EFE6" : "var(--neo-white)",
        boxShadow: locked ? "none" : "var(--sh-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
        <div
          className="k-b2"
          style={{
            width: 30,
            height: 30,
            background: locked ? "#E4E1D5" : "var(--neo-yellow)",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
          }}
        >
          <Icon name={def.icon} size={17} stroke={2.6} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.1 }}>{def.label}</div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.55 }}>{def.desc}</div>
        </div>
        {locked && (
          <span className="k-badge k-badge--violet" style={{ boxShadow: "none", flex: "0 0 auto" }}>
            <Icon name="lock" size={11} stroke={3} /> Khoá
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {def.options.map((opt) => {
          const on = opt.value === value;
          return (
            <button
              type="button"
              key={opt.value}
              disabled={locked}
              onClick={() => onSelect(opt.value)}
              className="k-b2"
              style={{
                font: "inherit",
                padding: "6px 11px",
                fontSize: 12.5,
                fontWeight: 800,
                letterSpacing: 0,
                textTransform: "none",
                cursor: locked ? "not-allowed" : "pointer",
                background: on
                  ? locked
                    ? "var(--neo-violet)"
                    : "var(--neo-green)"
                  : "var(--neo-white)",
                boxShadow: on ? "var(--sh-sm)" : "none",
                opacity: locked && !on ? 0.4 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {/* {on && <Icon name="check" size={12} stroke={4} />} */}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Drawer cài đặt — mở từ nút ở màn Setup. Khoá khi Kiểm tra. */
function PracticeSettingsPanel({
  settings,
  locked,
  onSelect,
  onReset,
  onClose,
}: {
  settings: PracticeSettings;
  locked: boolean;
  onSelect: (key: keyof PracticeSettings, value: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const effective = locked ? TEST_SETTINGS : settings;
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.34)", zIndex: 5 }}
      />
      <aside
        className="k-card"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 460,
          maxWidth: "92%",
          zIndex: 6,
          background: "var(--neo-bg)",
          borderRadius: 0,
          borderTop: 0,
          borderRight: 0,
          borderBottom: 0,
          borderLeft: "4px solid #000",
          boxShadow: "-10px 0 0 rgba(0,0,0,.12)",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            padding: "18px 20px",
            borderBottom: "4px solid #000",
            background: "var(--neo-yellow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              className="k-b2 k-sh-sm"
              style={{
                width: 38,
                height: 38,
                background: "var(--neo-white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="gear" size={22} stroke={2.4} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 19, lineHeight: 1 }}>Tuỳ chọn</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="k-btn k-btn--sm k-btn--ghost k-b2"
            aria-label="Đóng"
            style={{ flex: "0 0 auto" }}
          >
            <Icon name="x" size={16} stroke={3} />
          </button>
        </div>

        {locked && (
          <div
            style={{
              flex: "0 0 auto",
              margin: "14px 16px 0",
              padding: "11px 13px",
              background: "var(--neo-violet)",
              border: "3px solid #000",
              boxShadow: "var(--sh-sm)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Icon name="lock" size={18} stroke={2.6} style={{ flex: "0 0 auto" }} />
            <span style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.3 }}>
              Chế độ Kiểm tra khoá các tuỳ chọn để chấm điểm công bằng.
            </span>
          </div>
        )}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {PRACTICE_SETTING_DEFS.map((def) => (
            <SettingRow
              key={def.key}
              def={def}
              value={effective[def.key]}
              locked={locked}
              onSelect={(v) => onSelect(def.key, v)}
            />
          ))}
        </div>

        <div
          style={{
            flex: "0 0 auto",
            padding: "14px 16px",
            borderTop: "4px solid #000",
            background: "var(--neo-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onReset}
            disabled={locked}
            className="k-btn k-btn--sm k-btn--ghost k-b2"
          >
            Đặt lại mặc định
          </button>
          <button type="button" onClick={onClose} className="k-btn k-btn--sm k-btn--primary">
            Xong
          </button>
        </div>
      </aside>
    </>
  );
}

export function SetupMethod({
  topics: topicList,
  loadState,
  onStart,
}: {
  topics: TopicDTO[];
  loadState: VocabLoadState;
  onStart: (
    m: Method,
    selection: VocabSelection,
    session: { drill: Drill; settings: PracticeSettings }
  ) => void;
}) {
  const [levels, setLevels] = useState<Record<string, boolean>>({
    A1: true,
    A2: true,
  });
  // Key = topic slug. Mặc định KHÔNG chọn gì = luyện tất cả chủ đề (kể cả từ
  // chưa phân loại) — chọn chủ đề chỉ là thu hẹp tùy chọn.
  const [topics, setTopics] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState<Method>("M2");
  const [preset, setPreset] = useState(20); // mốc số từ đang chọn (20/50)
  const [customText, setCustomText] = useState(""); // ô "Khác" — nhập số tự do
  const [drill, setDrill] = useState<Drill>("practice");
  const [settings, setSettings] = useState<PracticeSettings>(DEFAULT_PRACTICE_SETTINGS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const isTest = drill === "test";

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
      const levelList = levelsKey ? (levelsKey.split(",") as CefrLevel[]) : undefined;
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

  // Số từ: mốc 20/50, hoặc số tự do gõ vào ô "Khác" (custom thắng khi hợp lệ).
  const customNum = parseInt(customText, 10);
  const custom = customText.trim() !== "" && Number.isFinite(customNum) && customNum > 0;
  const size = custom ? customNum : preset;
  const sessionWords = matchCount == null ? size : Math.min(size, matchCount);
  const canStart = matchCount != null && matchCount > 0;
  const toggle = (
    set: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    key: string
  ) => set((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="k-screen" style={{ position: "relative" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
            <div className="k-badge k-badge--white" style={{ boxShadow: "none" }}>
              {loadState.loading
                ? "Đang nạp"
                : loadState.source === "api"
                  ? "API"
                  : loadState.source === "local"
                    ? "Local"
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

      <div style={{ flex: 1, minHeight: 0, paddingBottom: 18, overflow: "auto" }}>
        <div className="k-wrap" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 26 }}>
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
                <div style={{ fontWeight: 900, fontSize: 22 }}>Nguồn từ</div>
              </div>

              <div id="tour-levels" className="k-card" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div className="k-badge k-badge--violet">Chủ đề</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Chip label="Tất cả" on={allTopics} onToggle={() => setTopics({})} />
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
              style={{
                flex: "0.95 1 0",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minWidth: 0,
              }}
            >
              <div
                id="tour-methods"
                style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <StepNum n="2" color="var(--neo-violet)" />
                  <div style={{ fontWeight: 900, fontSize: 22 }}>Phương pháp</div>
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

          {/* Bước 3 — Số từ & chế độ (một hàng: Số từ · Luyện tập · Kiểm tra · Tuỳ chọn) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StepNum n="3" color="var(--neo-green)" />
              <div style={{ fontWeight: 900, fontSize: 22 }}>Số từ &amp; chế độ</div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "stretch", flexWrap: "wrap" }}>
              {/* Khung Số từ — mốc 20/50 + ô "Khác" (placeholder) */}
              <div
                id="tour-size"
                className="k-card"
                style={{
                  flex: "1.6 1 0",
                  minWidth: 240,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span className="k-badge k-badge--green" style={{ boxShadow: "none" }}>
                  Số từ
                </span>
                {SESSION_SIZES.map((s) => (
                  <Chip
                    key={s}
                    label={String(s)}
                    on={!custom && preset === s}
                    onToggle={() => {
                      setPreset(s);
                      setCustomText("");
                    }}
                  />
                ))}
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="Khác"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  aria-label="Số từ khác"
                  style={{
                    width: 76,
                    padding: "9px 10px",
                    border: "3px solid var(--neo-ink)",
                    boxShadow: custom ? "var(--sh-sm)" : "none",
                    background: custom ? "var(--neo-yellow)" : "var(--neo-white)",
                    fontFamily: "var(--font)",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Luyện tập / Kiểm tra */}
              <ModeOption
                icon="book"
                title="Luyện tập"
                color="var(--neo-yellow-soft)"
                selected={!isTest}
                onSelect={() => setDrill("practice")}
              />
              <ModeOption
                icon="target"
                title="Kiểm tra"
                color="var(--neo-violet)"
                selected={isTest}
                onSelect={() => setDrill("test")}
              />

              {/* Tuỳ chọn (mở drawer cài đặt) */}
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="k-card k-card--hover"
                title="Tuỳ chọn luyện tập"
                style={{
                  flex: "0 0 auto",
                  font: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--neo-white)",
                }}
              >
                <div
                  className="k-b2 k-sh-sm"
                  style={{
                    width: 34,
                    height: 34,
                    background: "var(--neo-yellow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                  }}
                >
                  <Icon name="gear" size={20} stroke={2.4} />
                </div>
                <div
                  style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.05, whiteSpace: "nowrap" }}
                >
                  Tuỳ chọn
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* bottom action bar — Số từ đặt cố định ở đây nên không bị đẩy khi cột Phương pháp dài thêm */}
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
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
            {loadState.error && (
              <span className="k-badge k-badge--red" style={{ boxShadow: "none" }}>
                Fallback
              </span>
            )}
          </div>
          <button
            id="tour-start"
            type="button"
            className="k-btn k-btn--primary k-btn--lg"
            style={{ flex: "0 0 auto" }}
            disabled={!canStart}
            onClick={() =>
              onStart(method, { levels: selLevels, topics: selSlugs, size }, { drill, settings })
            }
          >
            {isTest ? "Bắt đầu kiểm tra" : `Luyện ${sessionWords} từ`}{" "}
            <Icon name="arrow" size={22} />
          </button>
        </div>
      </div>

      {panelOpen && (
        <PracticeSettingsPanel
          settings={settings}
          locked={isTest}
          onSelect={(key, value) =>
            setSettings((s) => ({ ...s, [key]: value }) as PracticeSettings)
          }
          onReset={() => setSettings(DEFAULT_PRACTICE_SETTINGS)}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}
