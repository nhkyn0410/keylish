"use client";

import { Cell, Icon, ProgressStrip, Star, StatPill, TopBar } from "./primitives";
import { useTypingSession, type SessionResult, type VocabWord } from "./useTypingSession";

function firstMismatch(target: string, typed: string) {
  let i = 0;
  while (i < target.length && typed[i] === target[i]) i++;
  return i;
}

function ExampleChip({ en, example }: { en: string; example: string }) {
  const parts = example.split(new RegExp(`(${en})`, "i"));
  return (
    <div className="k-badge k-badge--violet" style={{ marginTop: 22, fontSize: 14, letterSpacing: 0, textTransform: "none", padding: "8px 16px", maxWidth: 560, whiteSpace: "normal", lineHeight: 1.4 }}>
      <span style={{ fontWeight: 900, opacity: 0.55, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>Ví dụ</span>
      &ldquo;{parts.map((p, i) =>
        p.toLowerCase() === en.toLowerCase()
          ? <span key={i} style={{ background: "#fff", padding: "0 5px", border: "2px solid #000", fontWeight: 900 }}>{p}</span>
          : <span key={i}>{p}</span>,
      )}&rdquo;
    </div>
  );
}

function Correction({ target, typed, onContinue }: { target: string; typed: string; onContinue: () => void }) {
  const mis = firstMismatch(target, typed);
  const wrongCh = typed[mis] ?? "—";
  const rightCh = target[mis] ?? "";
  return (
    <div className="k-b" style={{ marginTop: 22, background: "var(--neo-red-soft)", boxShadow: "var(--sh-sm)", padding: "16px 20px", maxWidth: 640, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em", opacity: 0.6 }}>Đáp án đúng</span>
          <span style={{ fontWeight: 900, fontSize: 26 }}>
            {target.slice(0, mis)}
            <span style={{ background: "var(--neo-green)", padding: "0 4px", border: "2px solid #000" }}>{rightCh}</span>
            {target.slice(mis + 1)}
          </span>
        </div>
        <button type="button" className="k-btn k-btn--primary k-btn--sm" onClick={onContinue}>
          Tiếp tục <Icon name="arrow" size={16} />
        </button>
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13, flexWrap: "wrap" }}>
        <span style={{ color: "var(--neo-red)", textDecoration: "line-through", textDecorationThickness: 3, fontWeight: 800 }}>{wrongCh}</span>
        <Icon name="arrow" size={14} />
        <span style={{ color: "#149040", fontWeight: 900 }}>{rightCh}</span>
        <span style={{ opacity: 0.55 }}>· từ này sẽ lặp lại ở cuối vòng (M9)</span>
      </div>
    </div>
  );
}

export function TypingScreen({
  words, contextLabel, onComplete, onExit,
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
    cells,
    stats,
    inputRef,
    inputHandlers,
    focusInput,
    continueNext,
  } = useTypingSession(words, true, onComplete);

  if (!word) return null;

  return (
    <div className="k-screen">
      <TopBar>
        <StatPill icon="flame" value={String(stats.streak)} label="streak" bg="var(--neo-yellow)" />
        <StatPill icon="target" value={stats.accuracyPct + "%"} label="đúng" />
        <StatPill icon="clock" value={stats.elapsedStr} />
        <button type="button" className="k-btn k-btn--sm k-btn--ghost k-b2" onClick={onExit}>Thoát</button>
      </TopBar>
      <ProgressStrip idx={index + 1} total={total} ctx={contextLabel} />

      <div onClick={focusInput} style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, minHeight: 0, overflow: "auto" }}>
        <input ref={inputRef} className="k-capture" autoFocus aria-label="Gõ từ tiếng Anh" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} {...inputHandlers} />
        <Star size={48} fill="var(--neo-yellow)" spin style={{ position: "absolute", bottom: 26, left: 38, opacity: 0.8 }} />

        {/* VI meaning — small quiet tag (D · EN làm chủ đạo) */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", border: "2px solid #000", padding: "3px 8px", opacity: 0.6 }}>Nghĩa TV</span>
          <span style={{ fontSize: 26, fontWeight: 600, color: "rgba(0,0,0,.55)" }}>{word.vi}</span>
        </div>

        {/* EN hero on a pedestal */}
        <div className="k-card k-focus" style={{ padding: "30px 48px 26px", boxShadow: "var(--sh-2xl)", position: "relative", textAlign: "center" }}>
          <div className="k-badge k-badge--green" style={{ position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)" }}>Từ tiếng Anh</div>
          <div className="k-word" style={{ justifyContent: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            {cells.map((c, i) => <div key={i} style={{ transform: "scale(1.18)" }}><Cell state={c.state} ch={c.ch} /></div>)}
          </div>
          {word.ipa && <div style={{ marginTop: 28, fontSize: 24, fontWeight: 800, letterSpacing: ".02em" }}>{word.ipa}</div>}
        </div>

        {status === "wrong" ? (
          <Correction target={target} typed={typed} onContinue={continueNext} />
        ) : word.example ? (
          <ExampleChip en={word.en} example={word.example} />
        ) : null}

        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, opacity: 0.45 }}>
          {status === "wrong" ? "Xem đáp án đúng rồi tiếp tục" : "Nhìn nghĩa tiếng Việt → gõ từ tiếng Anh"}
        </div>
      </div>
    </div>
  );
}
