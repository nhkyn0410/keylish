"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Cell, Icon, ProgressStrip, StatPill } from "./primitives";
import { useTypingSession, type SessionResult, type VocabWord } from "./useTypingSession";

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

const hasTTS = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function ListenScreen({
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
    index,
    total,
    originalTotal,
    cells,
    stats,
    status,
    inputRef,
    inputHandlers,
    focusInput,
    continueNext,
  } = useTypingSession(words, { reveal: false, repeat: "once" }, onComplete);
  const [tts, setTts] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setTts(hasTTS()), 0);
    return () => window.clearTimeout(id);
  }, []);

  // auto play on new word (may be blocked until first user gesture)
  useEffect(() => {
    if (word) speak(word.en);
  }, [index, word]);

  if (!word) return null;

  return (
    <div className="k-screen">
      <AppHeader accent="var(--neo-violet)">
        <StatPill icon="flame" value={String(stats.streak)} label="streak" bg="#fff" />
        <StatPill icon="target" value={stats.accuracyPct + "%"} label="đúng" bg="#fff" />
        <button type="button" className="k-btn k-btn--sm k-btn--ghost k-b2" onClick={onExit}>
          Thoát
        </button>
      </AppHeader>
      <ProgressStrip idx={index + 1} total={originalTotal} ctx={contextLabel} bg="var(--neo-yellow)" />

      <div
        onClick={focusInput}
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <input
          ref={inputRef}
          className="k-capture"
          autoFocus
          aria-label="Gõ từ bạn nghe được"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          {...inputHandlers}
        />

        <div
          className="k-card k-focus"
          style={{
            width: 720,
            maxWidth: "100%",
            padding: "36px 44px 30px",
            boxShadow: "var(--sh-2xl)",
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            className="k-badge k-badge--violet"
            style={{ position: "absolute", top: -15, left: 28 }}
          >
            M1 · Nghe → gõ lại
          </div>

          {/* audio player */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="k-btn k-btn--info"
              style={{ width: 110, height: 110, padding: 0, boxShadow: "var(--sh-lg)" }}
              onClick={() => speak(word.en)}
              aria-label="Phát âm"
            >
              <Icon name="play" size={48} stroke={2} />
            </button>
            <div style={{ fontWeight: 800, fontSize: 22, marginTop: 8 }}>
              Nghe và gõ lại từ bạn nghe được
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                className="k-badge k-badge--white"
                style={{ boxShadow: "var(--sh-sm)", cursor: "pointer" }}
                onClick={() => speak(word.en)}
              >
                <Icon name="replay" size={15} stroke={3} /> Phát lại
              </button>
            </div>
          </div>

          <div style={{ height: 3, background: "#000", margin: "24px 0", opacity: 0.12 }} />

          {/* typing cells — word hidden */}
          <div className="k-word" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            {cells.map((c, i) => (
              <Cell key={i} state={c.state} ch={c.ch} />
            ))}
          </div>

          {status === "wrong" && (
            <div
              className="k-b"
              style={{
                marginTop: 22,
                background: "var(--neo-red-soft)",
                boxShadow: "var(--sh-sm)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    opacity: 0.6,
                  }}
                >
                  Đáp án
                </span>
                <span style={{ fontWeight: 900, fontSize: 24 }}>{word.en}</span>
              </div>
              <button
                type="button"
                className="k-btn k-btn--primary k-btn--sm"
                onClick={continueNext}
              >
                Tiếp tục <Icon name="arrow" size={16} />
              </button>
            </div>
          )}

          {!tts && (
            <div
              className="k-b2"
              style={{
                marginTop: 24,
                padding: "10px 14px",
                background: "var(--neo-yellow-soft)",
                boxShadow: "none",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                fontWeight: 700,
                textAlign: "left",
              }}
            >
              <Icon name="volume" size={18} stroke={2.5} style={{ flex: "0 0 auto" }} />
              Trình duyệt thiếu giọng tiếng Anh — phiên âm: {word.ipa ?? "—"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
