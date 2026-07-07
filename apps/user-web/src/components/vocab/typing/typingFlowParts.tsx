"use client";

/* Mảnh dùng chung cho luồng luyện gõ sau khi tách route (ADR-020):
   WarmingGate (đánh thức API), LoadingSession (nạp phiên), shuffle, ctxFrom. */

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Method, VocabLoadState } from "./SetupMethod";
import type { VocabWord } from "./useTypingSession";

const LOADING_MASCOT_SRC = "/mascot/loading-vocab.png";
const LOADING_MASCOT_SIZE = 240;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ctxFrom(
  words: VocabWord[],
  method: Method,
  topicTitle: (value: string) => string
) {
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

/** Màn "Đang nạp từ vựng" — cầm chân người dùng trong lúc đánh thức API (Render cold start). */
export function WarmingGate() {
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

export function LoadingSession({ loadState }: { loadState: VocabLoadState }) {
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
          <div className="k-badge k-badge--violet" style={{ display: "inline-flex", marginBottom: 18 }}>
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
