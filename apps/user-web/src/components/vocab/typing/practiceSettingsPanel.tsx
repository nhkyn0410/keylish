"use client";

/* Drawer tuỳ chọn luyện tập — dùng chung cho màn Thiết lập (SetupMethod) và
   in-play (TypingScreen, đợt 2 / D-14). Khoá toàn bộ khi Kiểm tra. */

import type { ReactNode } from "react";
import { Icon } from "./primitives";
import { PRACTICE_SETTING_DEFS, TEST_SETTINGS, type PracticeSettings } from "./practiceSettings";

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
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Drawer cài đặt — dùng ở Setup và in-play. Khoá khi Kiểm tra. */
export function PracticeSettingsPanel({
  settings,
  locked,
  onSelect,
  onReset,
  onClose,
  title = "Tuỳ chọn",
  note,
}: {
  settings: PracticeSettings;
  locked: boolean;
  onSelect: (key: keyof PracticeSettings, value: string) => void;
  onReset: () => void;
  onClose: () => void;
  title?: string;
  note?: ReactNode;
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
              <div style={{ fontWeight: 900, fontSize: 19, lineHeight: 1 }}>{title}</div>
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

        {locked ? (
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
        ) : note ? (
          <div
            style={{
              flex: "0 0 auto",
              margin: "14px 16px 0",
              padding: "11px 13px",
              background: "var(--neo-white)",
              border: "3px solid #000",
              boxShadow: "var(--sh-sm)",
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1.35,
            }}
          >
            {note}
          </div>
        ) : null}

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
