import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, CompositionEvent } from "react";
import type { CharState } from "./primitives";

export interface VocabWord {
  id?: string;
  en: string;
  vi: string;
  frequency?: number;
  pos?: string | null;
  level?: string | null;
  topic?: string | null;
  ipa?: string | null;
  example?: string | null;
  source?: string;
}

export interface SessionResult {
  correct: number;
  wrong: number;
  wpm: number;
  accuracyPct: number;
  correctChars: number;
  totalChars: number;
  durationMs: number;
  wrongWords: VocabWord[];
}

export type SessionStatus = "typing" | "wrong";

const clean = (s: string) => s.toLowerCase().replace(/[^a-z'-]/g, "");

export function computeCells(target: string, typed: string, reveal: boolean) {
  return Array.from(target).map((tch, i) => {
    let state: CharState;
    if (i < typed.length) state = typed[i] === tch ? "ok" : "bad";
    else if (i === typed.length) state = "cur";
    else state = "todo";
    const ch = reveal ? tch : i < typed.length ? typed[i] : "";
    return { ch, state };
  });
}

export function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Real char-by-char typing session (IME/composition-safe). */
export function useTypingSession(
  words: VocabWord[],
  reveal: boolean,
  onComplete: (r: SessionResult) => void,
) {
  const [queue, setQueue] = useState<VocabWord[]>(words);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<SessionStatus>("typing");
  const [view, setView] = useState({ correct: 0, wrong: 0, streak: 0, accuracyPct: 100 });
  const [elapsed, setElapsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const locked = useRef(false);
  const done = useRef(false);
  const startRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const counters = useRef({ correct: 0, wrong: 0, streak: 0, correctChars: 0, totalChars: 0 });
  const requeued = useRef<Set<string>>(new Set());
  const wrongWords = useRef<VocabWord[]>([]);

  const word = queue[index];
  const target = word ? clean(word.en) : "";
  const total = queue.length;

  useEffect(() => {
    startRef.current = performance.now();
    const id = window.setInterval(
      () => setElapsed(Math.floor((performance.now() - startRef.current) / 1000)),
      1000,
    );
    return () => {
      window.clearInterval(id);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  function focusInput() {
    inputRef.current?.focus();
  }
  useEffect(focusInput, [index, status]);

  function finishSession() {
    if (done.current) return;
    done.current = true;
    const c = counters.current;
    const durationMs = Math.max(1, performance.now() - startRef.current);
    const minutes = durationMs / 60000;
    onComplete({
      correct: c.correct,
      wrong: c.wrong,
      accuracyPct: c.totalChars ? Math.round((c.correctChars / c.totalChars) * 100) : 100,
      wpm: minutes > 0 ? Math.max(0, Math.round(c.correctChars / 5 / minutes)) : 0,
      correctChars: c.correctChars,
      totalChars: c.totalChars,
      durationMs,
      wrongWords: wrongWords.current,
    });
  }

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function doAdvance(q: VocabWord[], i: number) {
    locked.current = false;
    clearInput();
    setTyped("");
    setStatus("typing");
    const ni = i + 1;
    if (ni >= q.length) finishSession();
    else setIndex(ni);
  }

  function syncView() {
    const c = counters.current;
    setView({
      correct: c.correct,
      wrong: c.wrong,
      streak: c.streak,
      accuracyPct: c.totalChars ? Math.round((c.correctChars / c.totalChars) * 100) : 100,
    });
  }

  function finalize(value: string) {
    if (!word) return;
    locked.current = true;
    const c = counters.current;
    let matches = 0;
    for (let i = 0; i < target.length; i++) if (value[i] === target[i]) matches++;
    c.correctChars += matches;
    c.totalChars += target.length;
    const ok = value === target;
    if (ok) {
      c.correct++;
      c.streak++;
      syncView();
      timerRef.current = window.setTimeout(() => doAdvance(queue, index), 360);
    } else {
      c.wrong++;
      c.streak = 0;
      if (!wrongWords.current.some((w) => w.en === word.en)) wrongWords.current.push(word);
      syncView();
      if (!requeued.current.has(target)) {
        requeued.current.add(target);
        setQueue((q) => [...q, word]);
      }
      setStatus("wrong");
    }
  }

  function applyValue(raw: string) {
    if (locked.current || status === "wrong" || !word) return;
    const v = clean(raw).slice(0, target.length);
    setTyped(v);
    if (v.length === target.length) finalize(v);
  }

  const inputHandlers = {
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      if (composing.current) return;
      applyValue(e.target.value);
    },
    onCompositionStart: () => {
      composing.current = true;
    },
    onCompositionEnd: (e: CompositionEvent<HTMLInputElement>) => {
      composing.current = false;
      applyValue(e.currentTarget.value);
    },
  };

  function continueNext() {
    doAdvance(queue, index);
  }

  return {
    word,
    target,
    index,
    total,
    typed,
    status,
    cells: computeCells(target, typed, reveal),
    stats: { ...view, elapsedStr: fmtTime(elapsed) },
    inputRef,
    inputHandlers,
    focusInput,
    continueNext,
  };
}
