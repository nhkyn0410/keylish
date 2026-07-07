"use client";

/* PlayFlow — route /typing/play (ADR-020). Tự nạp từ theo session-spec trên query,
   chạy engine gõ rồi tổng kết. Vòng đời (đợt 1): resolving → ready → play → summary.
   Không qua /typing/setup: kho từ vựng điều hướng thẳng vào đây qua ?source=... */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { TopicDTO } from "@keylish/shared";
import { AppShell } from "@/components/layout/AppShell";
import { TypingScreen } from "./TypingScreen";
import { ListenScreen } from "./ListenScreen";
import { Summary } from "./Summary";
import { Icon } from "./primitives";
import { ctxFrom, LoadingSession, shuffle } from "./typingFlowParts";
import { loadWordsForSpec, parsePracticeSpec } from "./practiceSpec";
import { settingsForDrill } from "./practiceSettings";
import { fetchTopics } from "@/infra/vocab/vocabApi";
import type { VocabLoadState } from "./SetupMethod";
import type { SessionResult, VocabWord } from "./useTypingSession";

type Phase = "resolving" | "empty" | "ready" | "play" | "summary";

const METHOD_LABEL = { M2: "Nghĩa VI → Gõ EN", M1: "Nghe → Gõ" } as const;

export function PlayFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sp = searchParams.toString();
  const spec = useMemo(() => parsePracticeSpec(new URLSearchParams(sp)), [sp]);

  const [phase, setPhase] = useState<Phase>("resolving");
  const [pool, setPool] = useState<VocabWord[]>([]);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [loadState, setLoadState] = useState<VocabLoadState>({ loading: true, source: "seed" });
  const [topicList, setTopicList] = useState<TopicDTO[]>([]);

  useEffect(() => {
    let active = true;
    fetchTopics()
      .then((res) => {
        if (active) setTopicList(res.topics);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!spec) {
      router.replace("/typing/setup");
      return;
    }
    let aborted = false;
    setPhase("resolving");
    setLoadState({ loading: true, source: "seed" });
    loadWordsForSpec(spec).then((res) => {
      if (aborted) return;
      if (res.authRequired) {
        router.replace(`/login?next=${encodeURIComponent(`/typing/play?${sp}`)}`);
        return;
      }
      setLoadState({ loading: false, source: res.source, error: res.error });
      if (!res.words.length) {
        setPool([]);
        setPhase("empty");
        return;
      }
      setPool(res.words);
      setPhase("ready");
    });
    return () => {
      aborted = true;
    };
  }, [spec, sp, router]);

  const topicTitle = (value: string) =>
    topicList.find((t) => t.slug === value || t.title === value)?.title ?? value;

  function begin(source: VocabWord[]) {
    setWords(shuffle(source));
    setRunId((x) => x + 1);
    setPhase("play");
  }
  function complete(r: SessionResult) {
    setResult(r);
    setPhase("summary");
  }
  function reviewWrong() {
    if (result && result.wrongWords.length) {
      setWords(result.wrongWords);
      setRunId((x) => x + 1);
      setPhase("play");
    }
  }
  function retry() {
    begin(pool);
  }
  function backToSetup() {
    router.push("/typing/setup");
  }

  if (phase === "resolving" || !spec) {
    return (
      <AppShell>
        <LoadingSession loadState={loadState} />
      </AppShell>
    );
  }

  if (phase === "empty") {
    return (
      <AppShell>
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
            <div className="k-card" style={{ padding: "28px 30px", textAlign: "center", maxWidth: 440 }}>
              <div className="k-badge k-badge--violet" style={{ marginBottom: 12 }}>
                Phiên luyện
              </div>
              <h2 className="k-display" style={{ fontSize: 26, marginBottom: 10 }}>
                Bộ lọc không có từ nào
              </h2>
              <p style={{ fontWeight: 600, opacity: 0.7, marginBottom: 18, lineHeight: 1.5 }}>
                Thử bỏ bớt cấp độ / chủ đề hoặc chọn nguồn khác ở màn thiết lập.
              </p>
              <Link href="/typing/setup" className="k-btn k-btn--primary">
                Đổi thiết lập <Icon name="arrow" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (phase === "ready") {
    return (
      <AppShell>
        <ReadyCard
          method={spec.method}
          drill={spec.drill}
          count={pool.length}
          source={spec.source === "personal" ? "Kho của tôi" : "Kho hệ thống"}
          onStart={() => begin(pool)}
          onBack={backToSetup}
        />
      </AppShell>
    );
  }

  if (phase === "summary" && result) {
    const { ctxLabel } = ctxFrom(words, spec.method, topicTitle);
    return (
      <AppShell>
        <Summary
          result={result}
          contextLabel={ctxLabel}
          onReviewWrong={reviewWrong}
          onRetry={retry}
          onChangeMethod={backToSetup}
        />
      </AppShell>
    );
  }

  // play → focus mode (immersive, KHÔNG sidebar)
  const { ctx } = ctxFrom(words, spec.method, topicTitle);
  const drillCtx = `${spec.drill === "test" ? "Kiểm tra" : "Luyện tập"} · ${ctx}`;
  return spec.method === "M2" ? (
    <TypingScreen
      key={runId}
      words={words}
      contextLabel={drillCtx}
      onComplete={complete}
      onExit={backToSetup}
      settings={settingsForDrill(spec.drill, spec.settings)}
      drill={spec.drill}
    />
  ) : (
    <ListenScreen
      key={runId}
      words={words}
      contextLabel={ctx}
      onComplete={complete}
      onExit={backToSetup}
    />
  );
}

function ReadyCard({
  method,
  drill,
  count,
  source,
  onStart,
  onBack,
}: {
  method: "M2" | "M1";
  drill: "practice" | "test";
  count: number;
  source: string;
  onStart: () => void;
  onBack: () => void;
}) {
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
        <div className="k-card" style={{ width: 460, maxWidth: "100%", padding: "26px 28px" }}>
          <div className="k-badge k-badge--violet" style={{ marginBottom: 14 }}>
            Sẵn sàng luyện
          </div>
          <h1 className="k-display" style={{ fontSize: 30, lineHeight: 1, marginBottom: 16 }}>
            {count} từ · {drill === "test" ? "Kiểm tra" : "Luyện tập"}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <span className="k-badge k-badge--white" style={{ boxShadow: "none" }}>
              {source}
            </span>
            <span className="k-badge k-badge--white" style={{ boxShadow: "none" }}>
              {METHOD_LABEL[method]}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="k-btn k-btn--primary" onClick={onStart} style={{ flex: 1 }}>
              Bắt đầu gõ <Icon name="arrow" size={20} />
            </button>
            <button className="k-btn k-btn--ghost k-b2" onClick={onBack}>
              Thiết lập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
