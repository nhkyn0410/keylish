/* Neo-brutalist shared primitives for KeyLish F-009 screens.
   Ported from the Claude Design bundle (neo-primitives.jsx) to typed TSX. */
import type { CSSProperties } from "react";
import {
  AlignLeft,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  Flame,
  Home,
  Keyboard,
  KeyRound,
  ListChecks,
  Lock,
  MessageSquare,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Star as LucideStar,
  Target,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";

export type IconName =
  | "arrow"
  | "book"
  | "chat"
  | "check"
  | "chevright"
  | "clock"
  | "compass"
  | "filter"
  | "flame"
  | "gear"
  | "home"
  | "keyboard"
  | "key"
  | "list"
  | "lock"
  | "play"
  | "refresh"
  | "replay"
  | "search"
  | "sentence"
  | "star"
  | "swap"
  | "target"
  | "volume"
  | "x";

export type CharState = "ok" | "bad" | "cur" | "todo";

const ICONS: Record<IconName, LucideIcon> = {
  arrow: ArrowRight,
  book: BookOpen,
  chat: MessageSquare,
  check: Check,
  chevright: ChevronRight,
  clock: Clock,
  compass: Compass,
  filter: Filter,
  flame: Flame,
  gear: Settings,
  home: Home,
  keyboard: Keyboard,
  key: KeyRound,
  list: ListChecks,
  lock: Lock,
  play: Play,
  refresh: RefreshCw,
  replay: RotateCcw,
  search: Search,
  sentence: AlignLeft,
  star: LucideStar,
  swap: ArrowLeftRight,
  target: Target,
  volume: Volume2,
  x: X,
};

export function KeylishIcon({
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
  const Glyph = ICONS[name];
  return (
    <Glyph
      aria-hidden="true"
      absoluteStrokeWidth
      fill={fill}
      size={size}
      strokeWidth={stroke}
      style={style}
    />
  );
}

export const Icon = KeylishIcon;

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
    <LucideStar
      aria-hidden="true"
      absoluteStrokeWidth
      className={spin ? "k-spin" : ""}
      fill={fill}
      size={size}
      stroke="#000"
      strokeWidth={5}
      style={style}
    />
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
        <Icon name="key" size={26 * scale} stroke={3} style={{ color: "#000" }} />
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
