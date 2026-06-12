"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { Icon, ProgressStrip, Star, StatPill } from "./primitives";
import {
  useTypingSession,
  type SessionResult,
  type VocabWord,
} from "./useTypingSession";

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
}: {
  en: string;
  example: string;
  width: string;
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
        padding: "14px 18px",
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
        }}
      >
        {parts.map((p, i) =>
          p.toLowerCase() === en.toLowerCase() ? (
            <span
              key={i}
              style={{
                display: "inline-block",
                background: "var(--neo-white)",
                padding: "0 6px",
                border: "2px solid #000",
                fontWeight: 900,
                lineHeight: 1.25,
              }}
            >
              {p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    </div>
  );
}

function Correction({
  target,
  typed,
  onContinue,
}: {
  target: string;
  typed: string;
  onContinue: () => void;
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
            Đáp án đúng
          </span>
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
        </div>
        <button
          type="button"
          className="k-btn k-btn--primary k-btn--sm"
          onClick={onContinue}
        >
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
            textDecoration: "line-through",
            textDecorationThickness: 3,
            fontWeight: 800,
          }}
        >
          {wrongCh}
        </span>
        <Icon name="arrow" size={14} />
        <span style={{ color: "#149040", fontWeight: 900 }}>{rightCh}</span>
        <span style={{ opacity: 0.55 }}>
          · từ này sẽ lặp lại ở cuối vòng (M9)
        </span>
      </div>
    </div>
  );
}

export function TypingScreen({
  words,
  contextLabel,
  onComplete,
  onExit,
}: {
  words: VocabWord[];
  contextLabel: string;
  onComplete: (r: SessionResult) => void;
  onExit: () => void;
}) {
  const {
    word,
    target,
    index,
    total,
    typed,
    status,
    stats,
    inputRef,
    inputHandlers,
    focusInput,
    continueNext,
  } = useTypingSession(words, true, onComplete);

  if (!word) return null;

  const practiceCardWidth = "min(100%, 720px)";
  const answerBoxWidth = Math.min(620, Math.max(320, target.length * 34 + 120));
  const answerFontSize = target.length > 16 ? 36 : target.length > 11 ? 44 : 58;
  const answerBackground =
    status === "wrong" ? "var(--neo-red-soft)" : "var(--neo-white)";
  const targetChars = Array.from(target);

  return (
    <div className="k-screen">
      <AppHeader>
        <StatPill
          icon="flame"
          value={String(stats.streak)}
          label="streak"
          bg="var(--neo-yellow)"
        />
        <StatPill icon="target" value={stats.accuracyPct + "%"} label="đúng" />
        <StatPill icon="clock" value={stats.elapsedStr} />
        <button
          type="button"
          className="k-btn k-btn--sm k-btn--ghost k-b2"
          onClick={onExit}
        >
          Thoát
        </button>
      </AppHeader>
      <ProgressStrip idx={index + 1} total={total} ctx={contextLabel} />

      <div
        onClick={focusInput}
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "clamp(56px, 12vh, 104px) 24px 24px",
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
                const isBad = isTyped && typedCh !== ch;
                const showCursor = status !== "wrong" && i === typed.length;

                return (
                  <span
                    key={`${ch}-${i}`}
                    style={{ display: "inline-flex", alignItems: "center" }}
                  >
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
                    <span
                      style={{
                        color: isTyped
                          ? isBad
                            ? "var(--neo-red)"
                            : "var(--neo-ink)"
                          : "rgba(0,0,0,.28)",
                        display: "inline-block",
                        textDecoration: isBad ? "line-through" : "none",
                        textDecorationThickness: 4,
                      }}
                    >
                      {isTyped ? typedCh : ch}
                    </span>
                  </span>
                );
              })}
              {status !== "wrong" && typed.length === targetChars.length && (
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
              maxLength={target.length}
              autoFocus
              aria-label="Gõ từ tiếng Anh"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              readOnly={status === "wrong"}
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
          {word.ipa && (
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
          {status === "wrong" ? (
            <Correction
              target={target}
              typed={typed}
              onContinue={continueNext}
            />
          ) : word.example ? (
            <ExampleChip
              en={word.en}
              example={word.example}
              width={practiceCardWidth}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
