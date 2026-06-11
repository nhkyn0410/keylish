"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TopicDTO } from "@keylish/shared";
import { SetupMethod, type Method, type VocabLoadState, type VocabSelection } from "./SetupMethod";
import { TypingScreen } from "./TypingScreen";
import { ListenScreen } from "./ListenScreen";
import { Summary } from "./Summary";
import { TopBar } from "./primitives";
import type { SessionResult, VocabWord } from "./useTypingSession";
import { SEED_VOCABULARY } from "@/data/seed/vocabulary";
import { fetchTopics, fetchVocab, seedTopicDtos } from "@/infra/vocab/vocabApi";

const SESSION_SIZE = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ctxFrom(words: VocabWord[], method: Method, topicTitle: (value: string) => string) {
  const levels = (Array.from(new Set(words.map((w) => w.level).filter(Boolean))) as string[]).sort();
  const topics = (Array.from(new Set(words.map((w) => w.topic).filter(Boolean))) as string[]).map(topicTitle);
  const lv = levels.join("–") || "—";
  return {
    ctx: `${topics[0] ?? "Từ vựng"} · ${lv}`,
    ctxLabel: `${method} · ${topics.slice(0, 2).join(", ") || "Tất cả chủ đề"} · ${lv}`,
  };
}

type Step = "setup" | "loading" | "play" | "summary";

function LoadingSession({ loadState }: { loadState: VocabLoadState }) {
  return (
    <div className="k-screen">
      <TopBar>
        <Link href="/" className="k-btn k-btn--sm k-btn--ghost k-b2">Thoát</Link>
      </TopBar>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="k-card k-focus" style={{ width: 520, maxWidth: "100%", padding: "30px 34px", textAlign: "center", boxShadow: "var(--sh-2xl)" }}>
          <div className="k-badge k-badge--violet" style={{ display: "inline-flex", marginBottom: 18 }}>Kho từ</div>
          <h1 className="k-display" style={{ fontSize: 42, lineHeight: 1 }}>Đang nạp phiên luyện</h1>
          <p style={{ margin: "12px auto 0", maxWidth: 360, fontSize: 15, fontWeight: 700, opacity: 0.62 }}>
            {loadState.error ? "Dùng cache hoặc seed để phiên không bị gián đoạn." : "Đang lấy danh sách từ phù hợp với bộ lọc."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TypingFlow() {
  const [step, setStep] = useState<Step>("setup");
  const [method, setMethod] = useState<Method>("M2");
  const [pool, setPool] = useState<VocabWord[]>(SEED_VOCABULARY);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [loadState, setLoadState] = useState<VocabLoadState>({ loading: true, source: "seed" });
  const [topicList, setTopicList] = useState<TopicDTO[]>(seedTopicDtos);
  const [sessionSize, setSessionSize] = useState(SESSION_SIZE);

  useEffect(() => {
    let live = true;
    fetchVocab({ limit: 100, random: false }).then((res) => {
      if (!live) return;
      if (res.words.length) setPool(res.words);
      setLoadState({ loading: false, source: res.source, error: res.error });
    });
    fetchTopics().then((res) => {
      if (live && res.topics.length) setTopicList(res.topics);
    });
    return () => {
      live = false;
    };
  }, []);

  const topicTitle = (value: string) => topicList.find((t) => t.slug === value || t.title === value)?.title ?? value;

  function beginSession(p: VocabWord[], sz: number) {
    const src = p.length ? p : SEED_VOCABULARY;
    setWords(shuffle(src).slice(0, sz));
    setRunId((x) => x + 1);
    setStep("play");
  }
  async function start(m: Method, selection: VocabSelection) {
    setMethod(m);
    setSessionSize(selection.size);
    setStep("loading");
    setLoadState((state) => ({ ...state, loading: true }));
    const res = await fetchVocab({
      levels: selection.levels,
      topics: selection.topics,
      limit: selection.size,
      random: true,
    });
    const nextPool = res.words.length ? res.words : SEED_VOCABULARY;
    setPool(nextPool);
    setLoadState({ loading: false, source: res.source, error: res.error });
    beginSession(nextPool, selection.size);
  }
  function complete(r: SessionResult) {
    setResult(r);
    setStep("summary");
  }
  function reviewWrong() {
    if (result && result.wrongWords.length) {
      setWords(result.wrongWords);
      setRunId((x) => x + 1);
      setStep("play");
    }
  }
  function retry() {
    beginSession(pool, sessionSize);
  }
  function changeMethod() {
    setStep("setup");
  }

  if (step === "setup") return <SetupMethod topics={topicList} loadState={loadState} onStart={start} />;
  if (step === "loading") return <LoadingSession loadState={loadState} />;
  if (step === "summary" && result) {
    const { ctxLabel } = ctxFrom(words, method, topicTitle);
    return <Summary result={result} contextLabel={ctxLabel} onReviewWrong={reviewWrong} onRetry={retry} onChangeMethod={changeMethod} />;
  }
  const { ctx } = ctxFrom(words, method, topicTitle);
  return method === "M2" ? (
    <TypingScreen key={runId} words={words} contextLabel={ctx} onComplete={complete} onExit={changeMethod} />
  ) : (
    <ListenScreen key={runId} words={words} contextLabel={ctx} onComplete={complete} onExit={changeMethod} />
  );
}
