"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Icon, ProgressStrip, Star, StatPill } from "./primitives";
import { useTypingSession, type SessionResult, type VocabWord } from "./useTypingSession";
import {
  DEFAULT_PRACTICE_SETTINGS,
  type PracticeSettings,
  type RepeatMode,
} from "./practiceSettings";
import { PracticeSettingsPanel } from "./practiceSettingsPanel";

function firstMismatch(target: string, typed: string) {
  let i = 0;
  while (i < target.length && typed[i] === target[i]) i++;
  return i;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ExampleChip({
  en,
  example,
  width,
  cloze = false,
}: {
  en: string;
  example: string;
  width: string;
  cloze?: boolean;
}) {
  const parts = example.split(new RegExp(`(${escapeRegExp(en)})`, "i"));
  return (
    <div
      className="k-b2"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        width,
        maxWidth: "100%",
        background: "var(--neo-violet)",
        boxShadow: "var(--sh-sm)",
        padding: "20px 18px",
        textTransform: "none",
      }}
    >
      <span
        style={{
          flex: "0 0 auto",
          fontWeight: 900,
          opacity: 0.6,
          fontSize: 11,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          paddingTop: 3,
        }}
      >
        Ví dụ
      </span>
      <p
        style={{
          minWidth: 0,
          flex: 1,
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {parts.map((p, i) =>
          p.toLowerCase() === en.toLowerCase() ? (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: cloze ? "transparent" : "var(--neo-white)",
                padding: "3px 8px",
                border: "2px solid #000",
                boxSizing: "border-box",
                fontWeight: 900,
                lineHeight: 1.1,
                minWidth: cloze ? `${Math.max(en.length, 3) * 0.62}em` : undefined,
                color: cloze ? "transparent" : undefined,
                verticalAlign: "middle",
              }}
              aria-label={cloze ? "từ cần điền" : undefined}
            >
              {cloze ? " " : p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </p>
    </div>
  );
}

/** Phản hồi tối giản (feedback="mark"): chỉ báo sai, KHÔNG lộ đáp án. */
function WrongMark({
  onContinue,
  willRepeat,
  autoAdvanceMs,
}: {
  onContinue: () => void;
  willRepeat?: RepeatMode;
  autoAdvanceMs?: number;
}) {
  return (
    <div
      className="k-b"
      style={{
        background: "var(--neo-red-soft)",
        boxShadow: "var(--sh-sm)",
        padding: "16px 20px",
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="x" size={20} stroke={4} style={{ color: "var(--neo-red)" }} />
        <span style={{ fontWeight: 900, fontSize: 18 }}>Chưa đúng</span>
        {willRepeat === "once" && (
          <span style={{ opacity: 0.55, fontWeight: 700, fontSize: 13 }}>
            · từ này sẽ lặp lại ở cuối vòng
          </span>
        )}
        {willRepeat === "until" && (
          <span style={{ opacity: 0.55, fontWeight: 700, fontSize: 13 }}>· gõ đúng để qua</span>
        )}
      </div>
      {autoAdvanceMs != null ? (
        <span style={{ opacity: 0.55, fontWeight: 700, fontSize: 13 }}>
          Tự chuyển sau {Math.round(autoAdvanceMs / 1000)} giây
        </span>
      ) : (
        <button type="button" className="k-btn k-btn--primary k-btn--sm" onClick={onContinue}>
          Tiếp tục <Icon name="arrow" size={16} />
        </button>
      )}
    </div>
  );
}

function CorrectMark({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="k-b"
      style={{
        background: "var(--neo-green-soft)",
        boxShadow: "var(--sh-sm)",
        padding: "16px 20px",
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="check" size={20} stroke={4} style={{ color: "var(--neo-green)" }} />
        <span style={{ fontWeight: 900, fontSize: 18, color: "#149040" }}>Đúng</span>
      </div>
      <button type="button" className="k-btn k-btn--primary k-btn--sm" onClick={onContinue}>
        Tiếp tục <Icon name="arrow" size={16} />
      </button>
    </div>
  );
}

function Correction({
  target,
  typed,
  onContinue,
  willRepeat,
  showAnswer = true,
}: {
  target: string;
  typed: string;
  onContinue: () => void;
  willRepeat?: RepeatMode;
  showAnswer?: boolean; // true = lộ cả từ (reveal); false = chỉ ký tự lỗi (char)
}) {
  const mis = firstMismatch(target, typed);
  const wrongCh = typed[mis] ?? "—";
  const rightCh = target[mis] ?? "";
  return (
    <div
      className="k-b"
      style={{
        background: "var(--neo-red-soft)",
        boxShadow: "var(--sh-sm)",
        padding: "16px 20px",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".1em",
              opacity: 0.6,
            }}
          >
            {showAnswer ? "Đáp án đúng" : "Chưa đúng"}
          </span>
          {showAnswer && (
            <span style={{ fontWeight: 900, fontSize: 26 }}>
              {target.slice(0, mis)}
              <span
                style={{
                  background: "var(--neo-green)",
                  padding: "0 4px",
                  border: "2px solid #000",
                }}
              >
                {rightCh}
              </span>
              {target.slice(mis + 1)}
            </span>
          )}
        </div>
        <button type="button" className="k-btn k-btn--primary k-btn--sm" onClick={onContinue}>
          Tiếp tục <Icon name="arrow" size={16} />
        </button>
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 700,
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: "var(--neo-red)",
            textDecorationLine: "line-through",
            textDecorationThickness: 3,
            fontWeight: 800,
          }}
        >
          {wrongCh}
        </span>
        <Icon name="arrow" size={14} />
        <span style={{ color: "#149040", fontWeight: 900 }}>{rightCh}</span>
        {willRepeat === "once" && (
          <span style={{ opacity: 0.55 }}>· từ này sẽ lặp lại ở cuối vòng</span>
        )}
        {willRepeat === "until" && <span style={{ opacity: 0.55 }}>· gõ đúng để qua</span>}
      </div>
    </div>
  );
}

export function TypingScreen({
  words,
  contextLabel,
  onComplete,
  onExit,
  settings = DEFAULT_PRACTICE_SETTINGS,
  drill = "practice",
  onForwardChange,
  onStructuralChange,
}: {
  words: VocabWord[];
  contextLabel: string;
  onComplete: (r: SessionResult) => void;
  onExit: () => void;
  settings?: PracticeSettings;
  drill?: "practice" | "test";
  onForwardChange?: (next: PracticeSettings) => void; // forward-only: áp ngay
  onStructuralChange?: (next: PracticeSettings) => void; // repeat: luyện lại cùng bộ
}) {
  const isTestMode = drill === "test";
  const { hint, example: exampleMode, feedback, live } = settings;
  const hideLength = hint === "off" || hint === "first";
  const {
    word,
    target,
    index,
    originalTotal,
    typed,
    status,
    stats,
    inputRef,
    inputHandlers,
    focusInput,
    continueNext,
    setPaused,
  } = useTypingSession(
    words,
    {
      reveal: false,
      repeat: settings.repeat,
      wrongAdvanceMs: isTestMode ? 3000 : undefined,
      trimToTarget: !hideLength,
    },
    onComplete
  );

  const [panelOpen, setPanelOpen] = useState(false);
  useEffect(() => {
    setPaused(panelOpen); // tạm dừng đồng hồ khi mở drawer tuỳ chọn (D-14)
  }, [panelOpen, setPaused]);

  if (!word) return null;

  const repeatMode = settings.repeat !== "none" ? settings.repeat : undefined;
  const strictCheck = isTestMode;
  const showLiveCorrection = live !== "off";

  // D-14: Luyện tập cho chỉnh giữa phiên. forward-only áp ngay; `repeat` = luyện lại cùng bộ.
  function applySetting(key: keyof PracticeSettings, value: string) {
    if (isTestMode) return;
    if (key === "repeat" && value !== settings.repeat) {
      if (window.confirm("Đổi cách lặp sẽ luyện lại từ đầu (cùng bộ từ). Tiếp tục?")) {
        setPanelOpen(false);
        onStructuralChange?.({ ...settings, repeat: value as RepeatMode });
      }
      return;
    }
    onForwardChange?.({ ...settings, [key]: value } as PracticeSettings);
  }
  function resetSettings() {
    if (isTestMode) return;
    if (DEFAULT_PRACTICE_SETTINGS.repeat !== settings.repeat) {
      if (window.confirm("Đặt lại mặc định sẽ luyện lại từ đầu (cùng bộ từ). Tiếp tục?")) {
        setPanelOpen(false);
        onStructuralChange?.(DEFAULT_PRACTICE_SETTINGS);
      }
      return;
    }
    onForwardChange?.(DEFAULT_PRACTICE_SETTINGS);
  }

  const practiceCardWidth = "min(100%, 720px)";
  const answerBoxWidth = hideLength
    ? Math.min(620, Math.max(320, typed.length * 34 + 120))
    : Math.min(620, Math.max(320, target.length * 34 + 120));
  const answerFontSize = hideLength ? 58 : target.length > 16 ? 36 : target.length > 11 ? 44 : 58;
  const answerBackground =
    status === "wrong"
      ? "var(--neo-red-soft)"
      : status === "correct"
        ? "var(--neo-green-soft)"
        : "var(--neo-white)";
  const targetChars =
    hideLength && typed.length > target.length
      ? Array.from({ length: typed.length }, (_, i) => target[i] ?? "")
      : Array.from(target);

  return (
    <div className="k-screen" style={{ position: "relative" }}>
      <AppHeader>
        {!isTestMode && (
          <>
            <StatPill
              icon="flame"
              value={String(stats.streak)}
              label="streak"
              bg="var(--neo-yellow)"
            />
            <StatPill icon="target" value={stats.accuracyPct + "%"} label="đúng" />
          </>
        )}
        <StatPill icon="clock" value={stats.elapsedStr} />
        <button
          type="button"
          className="k-btn k-btn--sm k-btn--ghost k-b2"
          onClick={() => setPanelOpen(true)}
          aria-label="Tuỳ chọn"
          title="Tuỳ chọn"
        >
          <Icon name="gear" size={16} stroke={2.6} />
        </button>
        <button type="button" className="k-btn k-btn--sm k-btn--ghost k-b2" onClick={onExit}>
          Thoát
        </button>
      </AppHeader>
      <ProgressStrip idx={index + 1} total={originalTotal} ctx={contextLabel} />

      <div
        onClick={focusInput}
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "safe center",
          padding: "32px 24px",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <Star
          size={48}
          fill="var(--neo-yellow)"
          spin
          style={{ position: "absolute", bottom: 26, left: 38, opacity: 0.8 }}
        />

        {/* Meaning prompt */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <span
            className="k-badge"
            style={{
              boxShadow: "var(--sh-sm)",
              fontSize: 11,
              padding: "6px 10px",
            }}
          >
            Nghĩa
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "rgba(0,0,0,.68)",
              lineHeight: 1.1,
            }}
          >
            {word.vi}
          </span>
        </div>

        {/* EN hero on a pedestal */}
        <div
          className="k-card k-focus"
          style={{
            padding: "34px 48px 28px",
            boxShadow: "var(--sh-2xl)",
            position: "relative",
            textAlign: "center",
            width: practiceCardWidth,
          }}
        >
          <div
            className="k-badge k-badge--green"
            style={{
              position: "absolute",
              top: -15,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            Từ tiếng Anh
          </div>
          <div
            style={{
              width: answerBoxWidth,
              maxWidth: "100%",
              height: 92,
              border: "4px solid var(--neo-ink)",
              background: answerBackground,
              boxShadow: "var(--sh-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              padding: "12px 24px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(0,0,0,.28)",
                fontFamily: "var(--font)",
                fontSize: answerFontSize,
                fontWeight: 900,
                lineHeight: 1,
                pointerEvents: "none",
                textTransform: "lowercase",
                whiteSpace: "nowrap",
              }}
            >
              {targetChars.map((ch, i) => {
                const typedCh = typed[i];
                const isTyped = i < typed.length;
                const isBad = showLiveCorrection && isTyped && typedCh !== ch;
                const showCursor = status === "typing" && i === typed.length;
                const hidden = !isTyped && (hint === "off" || (hint === "first" && i > 0));

                if (hidden && !showCursor) return null;

                return (
                  <span key={`${ch}-${i}`} style={{ display: "inline-flex", alignItems: "center" }}>
                    {showCursor && (
                      <span
                        style={{
                          alignSelf: "center",
                          background: "var(--neo-ink)",
                          display: "inline-block",
                          height: "0.78em",
                          marginInline: 3,
                          width: 4,
                        }}
                      />
                    )}
                    {!hidden && (
                      <span
                        style={{
                          color: isTyped
                            ? isBad
                              ? "var(--neo-red)"
                              : "var(--neo-ink)"
                            : hint === "full" || (hint === "first" && i === 0)
                              ? "rgba(0,0,0,.28)"
                              : "transparent",
                          display: "inline-block",
                          textDecorationLine: isBad ? "line-through" : "none",
                          textDecorationThickness: 4,
                          borderBottom:
                            !isTyped && hint === "underline"
                              ? "4px solid rgba(0,0,0,.4)"
                              : undefined,
                        }}
                      >
                        {isTyped ? typedCh : ch}
                      </span>
                    )}
                  </span>
                );
              })}
              {status === "typing" && typed.length === targetChars.length && (
                <span
                  style={{
                    alignSelf: "center",
                    background: "var(--neo-ink)",
                    display: "inline-block",
                    height: "0.78em",
                    marginInline: 3,
                    width: 4,
                  }}
                />
              )}
            </div>
            <input
              ref={inputRef}
              value={typed}
              maxLength={hideLength ? 34 : target.length}
              autoFocus
              aria-label="Gõ từ tiếng Anh"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={status !== "typing"}
              {...inputHandlers}
              style={{
                background: "transparent",
                border: 0,
                caretColor: "transparent",
                color: "transparent",
                fontSize: 16,
                height: "100%",
                inset: 0,
                outline: "none",
                padding: 0,
                position: "absolute",
                width: "100%",
              }}
            />
          </div>
          {word.ipa && !strictCheck && (
            <div
              style={{
                marginTop: 28,
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: ".02em",
              }}
            >
              {word.ipa}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 22,
            width: practiceCardWidth,
            maxWidth: "100%",
            minHeight: 96,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          {status === "correct" ? (
            <CorrectMark onContinue={continueNext} />
          ) : status === "wrong" ? (
            feedback === "mark" ? (
              <WrongMark
                onContinue={continueNext}
                willRepeat={repeatMode}
                autoAdvanceMs={isTestMode ? 3000 : undefined}
              />
            ) : (
              <Correction
                target={target}
                typed={typed}
                onContinue={continueNext}
                willRepeat={repeatMode}
                showAnswer={feedback === "reveal"}
              />
            )
          ) : exampleMode !== "off" && word.example ? (
            <ExampleChip
              en={word.en}
              example={word.example}
              width={practiceCardWidth}
              cloze={exampleMode === "cloze"}
            />
          ) : null}
        </div>
      </div>

      {panelOpen && (
        <PracticeSettingsPanel
          settings={settings}
          locked={isTestMode}
          onSelect={applySetting}
          onReset={resetSettings}
          onClose={() => setPanelOpen(false)}
          title="Tuỳ chọn · đang luyện"
          note={
            <>
              Đổi <strong>lặp lại</strong> = luyện lại từ đầu (cùng bộ từ). Tuỳ chọn khác áp dụng
              ngay từ từ kế tiếp.
            </>
          }
        />
      )}
    </div>
  );
}
