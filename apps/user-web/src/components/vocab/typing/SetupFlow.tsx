"use client";

/* SetupFlow — route /typing/setup (ADR-020). Warming + màn thiết lập phiên.
   Khi bấm bắt đầu: dựng session-spec rồi điều hướng sang /typing/play?... */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TopicDTO } from "@keylish/shared";
import { AppShell } from "@/components/layout/AppShell";
import { SetupMethod, type Method, type VocabLoadState, type VocabSelection } from "./SetupMethod";
import { WarmingGate } from "./typingFlowParts";
import { practiceHref } from "./practiceSpec";
import { settingsForDrill, type Drill, type PracticeSettings } from "./practiceSettings";
import { loadTopicsAwait, seedTopicDtos, warmApi } from "@/infra/vocab/vocabApi";

export function SetupFlow() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loadState, setLoadState] = useState<VocabLoadState>({ loading: true, source: "seed" });
  const [topicList, setTopicList] = useState<TopicDTO[]>(seedTopicDtos);

  useEffect(() => {
    let aborted = false;
    warmApi(); // đánh thức Render ngay khi vào màn luyện
    loadTopicsAwait(() => aborted).then((res) => {
      if (aborted) return;
      if (res.topics.length) setTopicList(res.topics);
      setLoadState({ loading: false, source: res.source, error: res.error });
      setReady(true);
    });
    return () => {
      aborted = true;
    };
  }, []);

  function start(
    method: Method,
    selection: VocabSelection,
    session: { drill: Drill; settings: PracticeSettings }
  ) {
    const href = practiceHref({
      source: "system",
      method,
      drill: session.drill,
      size: selection.size,
      levels: selection.levels.length ? selection.levels : undefined,
      topics: selection.topics.length ? selection.topics : undefined,
      settings: settingsForDrill(session.drill, session.settings),
    });
    router.push(href);
  }

  return (
    <AppShell>
      {ready ? (
        <SetupMethod topics={topicList} loadState={loadState} onStart={start} />
      ) : (
        <WarmingGate />
      )}
    </AppShell>
  );
}
