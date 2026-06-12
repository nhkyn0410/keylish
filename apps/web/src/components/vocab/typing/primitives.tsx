/* Neo-brutalist shared primitives for KeyLish F-009 screens.
   Ported from the Claude Design bundle (neo-primitives.jsx) to typed TSX. */
import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "arrow"
  | "check"
  | "x"
  | "lock"
  | "volume"
  | "play"
  | "replay"
  | "star"
  | "flame"
  | "target"
  | "clock"
  | "keyboard"
  | "swap"
  | "refresh"
  | "book"
  | "filter"
  | "chevright"
  | "gear";

export type CharState = "ok" | "bad" | "cur" | "todo";

export function Icon({
  name,
  size = 24,
  stroke = 3,
  fill = "none",
  style,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
}) {
  const p = {
    fill,
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <g {...p}>
        <path d="M4 12h15" />
        <path d="M13 6l7 6-7 6" />
      </g>
    ),
    check: (
      <g {...p}>
        <path d="M4 12l5 6L20 5" />
      </g>
    ),
    x: (
      <g {...p}>
        <path d="M5 5l14 14M19 5L5 19" />
      </g>
    ),
    lock: (
      <g {...p}>
        <rect x="4.5" y="11" width="15" height="9.5" />
        <path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" />
      </g>
    ),
    volume: (
      <g {...p}>
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19.5 6a9 9 0 0 1 0 12" />
      </g>
    ),
    play: (
      <g {...p} fill="currentColor">
        <path d="M7 5l12 7-12 7V5z" />
      </g>
    ),
    replay: (
      <g {...p}>
        <path d="M4 12a8 8 0 1 1 2.3 5.6" />
        <path d="M4 20v-5h5" />
      </g>
    ),
    star: (
      <g {...p} fill="currentColor">
        <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17.9 6.5 19.8l1.1-6.1L3.1 9.4l6.1-.8L12 3z" />
      </g>
    ),
    flame: (
      <g {...p}>
        <path d="M12 3c1 3-1.5 4-1.5 6.5A2.5 2.5 0 0 0 13 12c.5-1.5 0-2.5 0-2.5 2 1.5 4 4 4 7a5.5 5.5 0 0 1-11 0c0-3 2.5-5 3.5-7C10.5 6.5 11 4.5 12 3z" />
      </g>
    ),
    target: (
      <g {...p}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.6" fill="currentColor" />
      </g>
    ),
    clock: (
      <g {...p}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </g>
    ),
    keyboard: (
      <g {...p}>
        <rect x="2.5" y="6" width="19" height="12" />
        <path d="M6 9.5h0M9 9.5h0M12 9.5h0M15 9.5h0M18 9.5h0M7 13h10" />
      </g>
    ),
    swap: (
      <g {...p}>
        <path d="M7 4L3 8l4 4" />
        <path d="M3 8h12" />
        <path d="M17 20l4-4-4-4" />
        <path d="M21 16H9" />
      </g>
    ),
    refresh: (
      <g {...p}>
        <path d="M20 11a8 8 0 1 0-1 5" />
        <path d="M20 4v5h-5" />
      </g>
    ),
    book: (
      <g {...p}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5V5.5z" />
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      </g>
    ),
    filter: (
      <g {...p}>
        <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
      </g>
    ),
    chevright: (
      <g {...p}>
        <path d="M9 5l7 7-7 7" />
      </g>
    ),
    gear: (
      <g {...p}>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.8 5.8l1.7 1.7M16.5 16.5l1.7 1.7M18.2 5.8l-1.7 1.7M7.5 16.5l-1.7 1.7" />
      </g>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}

export function Star({
  size = 64,
  fill = "var(--neo-yellow)",
  spin = false,
  style,
}: {
  size?: number;
  fill?: string;
  spin?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={spin ? "k-spin" : ""}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M50 4l11 26 28 2-21 19 7 28-25-15-25 15 7-28L11 32l28-2z"
        fill={fill}
        stroke="#000"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Mark({ kind }: { kind: "ok" | "bad" }) {
  return (
    <span className="k-mark">
      {kind === "ok" ? (
        <Icon name="check" size={16} stroke={4} />
      ) : (
        <Icon name="x" size={16} stroke={4} />
      )}
    </span>
  );
}

/** Boxed keycap character cell — the 4 states (color + icon). */
export function Cell({ state, ch }: { state: CharState; ch: string }) {
  const cls =
    "k-cell " +
    (state === "ok"
      ? "k-cell--ok"
      : state === "bad"
        ? "k-cell--bad"
        : state === "cur"
          ? "k-cell--cur"
          : "k-cell--todo");
  return (
    <div className={cls}>
      <span>{ch}</span>
      {(state === "ok" || state === "bad") && <Mark kind={state} />}
    </div>
  );
}

export function Logo({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        className="k-b k-sh-sm"
        style={{
          width: 44 * scale,
          height: 44 * scale,
          background: "var(--neo-yellow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        <svg width={26 * scale} height={26 * scale} viewBox="0 0 24 24" aria-hidden="true">
          <g fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="4.5" fill="#000" />
            <path d="M11 11l8 8M16 16l2-2M19 19l2-2" />
          </g>
        </svg>
      </div>
      <span
        style={{
          fontWeight: 900,
          fontSize: 24 * scale,
          letterSpacing: 0,
          textTransform: "uppercase",
        }}
      >
        Key<span style={{ color: "var(--neo-red)", WebkitTextStroke: "1.5px #000" }}>Lish</span>
      </span>
    </div>
  );
}

export function StatPill({
  icon,
  value,
  label,
  bg = "var(--neo-white)",
}: {
  icon: IconName;
  value: string;
  label?: string;
  bg?: string;
}) {
  return (
    <div
      className="k-b2 k-sh-sm"
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 13px", background: bg }}
    >
      <Icon name={icon} size={18} stroke={3} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontWeight: 900, fontSize: 17, lineHeight: 1 }}>{value}</span>
        {label && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              opacity: 0.65,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProgressStrip({
  idx,
  total,
  ctx = "",
  bg = "var(--neo-violet)",
}: {
  idx: number;
  total: number;
  ctx?: string;
  bg?: string;
}) {
  return (
    <div style={{ flex: "0 0 auto", background: bg, borderBottom: "4px solid #000" }}>
      <div
        className="k-wrap"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        <div className="k-badge k-badge--white">
          Từ {idx} / {total}
        </div>
        <div className="k-prog" style={{ flex: 1 }}>
          <i style={{ width: (total ? (idx / total) * 100 : 0) + "%" }} />
        </div>
        {ctx && (
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            {ctx}
          </div>
        )}
      </div>
    </div>
  );
}

export function KeyboardMini({ nextKey = "", done = [] }: { nextKey?: string; done?: string[] }) {
  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];
  return (
    <div className="k-kbd" aria-hidden="true">
      {rows.map((row, i) => (
        <div className="k-kbd-row" key={i}>
          {row.map((k) => {
            let cls = "k-key";
            if (k === nextKey) cls += " k-key--next";
            else if (done.includes(k)) cls += " k-key--accent";
            return (
              <div className={cls} key={k}>
                {k}
              </div>
            );
          })}
        </div>
      ))}
      <div className="k-kbd-row">
        <div className="k-key k-key--space">space</div>
      </div>
    </div>
  );
}
