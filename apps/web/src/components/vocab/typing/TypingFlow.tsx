"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TopicDTO } from "@keylish/shared";
import { SetupMethod, type Method, type VocabLoadState, type VocabSelection } from "./SetupMethod";
import { TypingScreen } from "./TypingScreen";
import { ListenScreen } from "./ListenScreen";
import { Summary } from "./Summary";
import { AppShell } from "@/components/layout/AppShell";
import type { SessionResult, VocabWord } from "./useTypingSession";
import {
  DEFAULT_PRACTICE_SETTINGS,
  settingsForDrill,
  type Drill,
  type PracticeSettings,
} from "./practiceSettings";
import { SEED_VOCABULARY } from "@/data/seed/vocabulary";
import { fetchVocab, loadTopicsAwait, seedTopicDtos, warmApi } from "@/infra/vocab/vocabApi";

const SESSION_SIZE = 20;
const LOADING_MASCOT_SRC = "/mascot/loading-vocab.png";
const LOADING_MASCOT_SIZE = 240;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ctxFrom(words: VocabWord[], method: Method, topicTitle: (value: string) => string) {
  const levels = (
    Array.from(new Set(words.map((w) => w.level).filter(Boolean))) as string[]
  ).sort();
  const topics = (Array.from(new Set(words.map((w) => w.topic).filter(Boolean))) as string[]).map(
    topicTitle
  );
  const lv = levels.join("–") || "—";
  return {
    ctx: lv,
    ctxLabel: `${method} · ${topics.slice(0, 2).join(", ") || "Tất cả chủ đề"} · ${lv}`,
  };
}

type Step = "warming" | "setup" | "loading" | "play" | "summary";

/** Màn "Đang nạp từ vựng" — cầm chân người dùng trong lúc đánh thức API (Render
 *  cold start) và retry tải chủ đề, để không rớt về seed. */
function WarmingGate() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), 6000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="k-screen">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: 24,
          textAlign: "center",
        }}
      >
        <Image
          src={LOADING_MASCOT_SRC}
          alt=""
          width={LOADING_MASCOT_SIZE}
          height={LOADING_MASCOT_SIZE}
          priority
          className="k-bob"
          style={{ width: LOADING_MASCOT_SIZE, height: "auto" }}
        />
        <div className="k-badge k-badge--violet">Kho từ vựng</div>
        <h1 className="k-display" style={{ fontSize: 40, lineHeight: 1 }}>
          Đang nạp từ vựng
        </h1>
        <p style={{ maxWidth: 400, fontSize: 15, fontWeight: 700, opacity: 0.62, lineHeight: 1.5 }}>
          {slow
            ? "Máy chủ miễn phí đang khởi động lại — lần đầu mất ~30 giây. Cảm ơn bạn đã chờ một chút!"
            : "Đang lấy danh sách chủ đề và từ phù hợp…"}
        </p>
      </div>
    </div>
  );
}

function LoadingSession({ loadState }: { loadState: VocabLoadState }) {
  return (
    <div className="k-screen">
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          className="k-card k-focus"
          style={{
            width: 520,
            maxWidth: "100%",
            padding: "30px 34px",
            textAlign: "center",
            boxShadow: "var(--sh-2xl)",
          }}
        >
          <Image
            src={LOADING_MASCOT_SRC}
            alt=""
            width={LOADING_MASCOT_SIZE}
            height={LOADING_MASCOT_SIZE}
            priority
            className="k-bob"
            style={{ width: LOADING_MASCOT_SIZE, height: "auto", margin: "0 auto 14px" }}
          />
          <div
            className="k-badge k-badge--violet"
            style={{ display: "inline-flex", marginBottom: 18 }}
          >
            Kho từ
          </div>
          <h1 className="k-display" style={{ fontSize: 42, lineHeight: 1 }}>
            Đang nạp phiên luyện
          </h1>
          <p
            style={{
              margin: "12px auto 0",
              maxWidth: 360,
              fontSize: 15,
              fontWeight: 700,
              opacity: 0.62,
            }}
          >
            {loadState.error
              ? "Dùng cache hoặc seed để phiên không bị gián đoạn."
              : "Đang lấy danh sách từ phù hợp với bộ lọc."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TypingFlow() {
  const [step, setStep] = useState<Step>("warming");
  const [method, setMethod] = useState<Method>("M2");
  const [pool, setPool] = useState<VocabWord[]>(SEED_VOCABULARY);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [loadState, setLoadState] = useState<VocabLoadState>({ loading: true, source: "seed" });
  const [topicList, setTopicList] = useState<TopicDTO[]>(seedTopicDtos);
  const [sessionSize, setSessionSize] = useState(SESSION_SIZE);
  const [drill, setDrill] = useState<Drill>("practice");
  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>(
    DEFAULT_PRACTICE_SETTINGS
  );

  useEffect(() => {
    let aborted = false;
    warmApi(); // đánh thức Render ngay khi vào màn luyện
    loadTopicsAwait(() => aborted).then((res) => {
      if (aborted) return;
      if (res.topics.length) setTopicList(res.topics);
      setLoadState({ loading: false, source: res.source, error: res.error });
      setStep("setup");
      // Nạp pool nền (không chặn) làm nguồn dự phòng cho retry/làm lại.
      fetchVocab({ limit: 100, random: false }).then((r) => {
        if (!aborted && r.words.length) setPool(r.words);
      });
    });
    return () => {
      aborted = true;
    };
  }, []);

  const topicTitle = (value: string) =>
    topicList.find((t) => t.slug === value || t.title === value)?.title ?? value;

  function beginSession(p: VocabWord[], sz: number) {
    const src = p.length ? p : SEED_VOCABULARY;
    setWords(shuffle(src).slice(0, sz));
    setRunId((x) => x + 1);
    setStep("play");
  }
  async function start(
    m: Method,
    selection: VocabSelection,
    session: { drill: Drill; settings: PracticeSettings }
  ) {
    setMethod(m);
    setSessionSize(selection.size);
    setDrill(session.drill);
    setPracticeSettings(settingsForDrill(session.drill, session.settings));
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

  if (step === "warming")
    return (
      <AppShell>
        <WarmingGate />
      </AppShell>
    );
  if (step === "setup")
    return (
      <AppShell>
        <SetupMethod topics={topicList} loadState={loadState} onStart={start} />
      </AppShell>
    );
  if (step === "loading")
    return (
      <AppShell>
        <LoadingSession loadState={loadState} />
      </AppShell>
    );
  if (step === "summary" && result) {
    const { ctxLabel } = ctxFrom(words, method, topicTitle);
    return (
      <AppShell>
        <Summary
          result={result}
          contextLabel={ctxLabel}
          onReviewWrong={reviewWrong}
          onRetry={retry}
          onChangeMethod={changeMethod}
        />
      </AppShell>
    );
  }
  // play → focus mode (immersive, KHÔNG sidebar)
  const { ctx } = ctxFrom(words, method, topicTitle);
  const drillCtx = `${drill === "test" ? "Kiểm tra" : "Luyện tập"} · ${ctx}`;
  return method === "M2" ? (
    <TypingScreen
      key={runId}
      words={words}
      contextLabel={drillCtx}
      onComplete={complete}
      onExit={changeMethod}
      settings={practiceSettings}
      drill={drill}
    />
  ) : (
    <ListenScreen
      key={runId}
      words={words}
      contextLabel={ctx}
      onComplete={complete}
      onExit={changeMethod}
    />
  );
}
