import Link from "next/link";
import { Icon, Star } from "./primitives";
import type { SessionResult } from "./useTypingSession";

function StatBlock({
  value,
  label,
  sub,
  bg,
}: {
  value: string;
  label: string;
  sub?: string;
  bg: string;
}) {
  return (
    <div
      className="k-card"
      style={{ flex: 1, padding: "22px 20px", background: bg, textAlign: "center" }}
    >
      <div className="k-stat-num" style={{ fontSize: 62 }}>
        {value}
      </div>
      <div
        style={{
          fontWeight: 900,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          marginTop: 6,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

export function Summary({
  result,
  contextLabel,
  onReviewWrong,
  onRetry,
  onChangeMethod,
}: {
  result: SessionResult;
  contextLabel: string;
  onReviewWrong: () => void;
  onRetry: () => void;
  onChangeMethod: () => void;
}) {
  const hasWrong = result.wrongWords.length > 0;
  return (
    <div className="k-screen">
      <div
        style={{
          flex: 1,
          paddingTop: 30,
          paddingBottom: 30,
          position: "relative",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <Star
          size={56}
          fill="var(--neo-yellow)"
          spin
          style={{ position: "absolute", top: 10, right: 60, opacity: 0.85 }}
        />

        <div className="k-wrap" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div className="k-badge k-badge--green">
                <Icon name="check" size={15} stroke={4} /> Phiên hoàn thành
              </div>
              <span className="k-h-eyebrow" style={{ color: "#7a6a00" }}>
                {contextLabel}
              </span>
              {result.editedMidSession ? (
                <span
                  className="k-badge k-badge--white"
                  style={{ boxShadow: "none", fontSize: 11 }}
                  title="Đã chỉnh tuỳ chọn giữa phiên Luyện tập"
                >
                  Đã chỉnh tuỳ chọn giữa phiên
                </span>
              ) : null}
            </div>
            <h1 className="k-display" style={{ fontSize: 56 }}>
              Tổng kết phiên
            </h1>
          </div>

          <div style={{ display: "flex", gap: 18 }}>
            <StatBlock
              value={String(result.wpm)}
              label="WPM"
              sub="tốc độ gõ"
              bg="var(--neo-yellow)"
            />
            <StatBlock
              value={result.accuracyPct + "%"}
              label="Chính xác"
              sub={`${result.correctChars} / ${result.totalChars} ký tự`}
              bg="var(--neo-violet)"
            />
            <StatBlock
              value={String(result.correct)}
              label="Đúng"
              sub="từ đã thuộc"
              bg="var(--neo-green)"
            />
            <StatBlock
              value={String(result.wrong)}
              label="Sai"
              sub="cần ôn lại"
              bg="var(--neo-red)"
            />
          </div>

          <div className="k-card" style={{ padding: 24, flex: 1, minHeight: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div className="k-badge k-badge--red">
                <Icon name="refresh" size={15} stroke={3} /> Từ sai · lặp lại (M9)
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.55 }}>
                {hasWrong ? "Sẽ được đưa lại để gõ đúng" : "Không có từ sai — tuyệt vời!"}
              </span>
            </div>
            {hasWrong ? (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {result.wrongWords.map((w) => (
                  <div
                    key={w.en}
                    className="k-b2 k-sh-sm"
                    style={{
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "#fff",
                      minWidth: 220,
                    }}
                  >
                    <span style={{ fontWeight: 900, fontSize: 22, color: "#149040" }}>{w.en}</span>
                    <Icon name="arrow" size={18} />
                    <span style={{ fontWeight: 700, fontSize: 16, opacity: 0.7 }}>{w.vi}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="k-b2"
                style={{
                  padding: "18px 20px",
                  background: "var(--neo-green-soft)",
                  boxShadow: "none",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon name="check" size={18} stroke={4} /> 0 lỗi trong phiên này.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="k-btn k-btn--primary k-btn--lg"
              onClick={onReviewWrong}
              disabled={!hasWrong}
            >
              <Icon name="refresh" size={20} /> Ôn từ sai ({result.wrongWords.length})
            </button>
            <button type="button" className="k-btn k-btn--info" onClick={onRetry}>
              <Icon name="replay" size={18} /> Làm lại
            </button>
            <button type="button" className="k-btn" onClick={onChangeMethod}>
              <Icon name="swap" size={18} /> Đổi phương pháp
            </button>
            <div style={{ flex: 1 }} />
            <Link href="/" className="k-btn k-btn--ghost k-b2">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
