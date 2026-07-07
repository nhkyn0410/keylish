/* practiceSpec — đặc tả phiên luyện (V2.1 · FR-PVOC-08, ADR-020).
   Hạ ngữ cảnh phiên xuống URL của /typing/play: path = hoạt động, query = nguồn + spec.
   `play` tự nạp từ theo spec (kho hệ thống qua fetchVocab, kho cá nhân qua fetchUserVocab).
   Đợt 1: chỉ run-defining (method/drill/size/source-filter) + settings (run-defining).
   Custom-options lifecycle (pre-commit/in-play matrix) là đợt 2 — xem 06-ui-ux §4.6. */

import type { CefrLevel, UserVocabEntryDto } from "@keylish/shared";
import { fetchVocab, type VocabSource } from "@/infra/vocab/vocabApi";
import { ApiError, fetchUserVocab, getErrorMessage } from "@/infra/user/userApi";
import { SEED_VOCABULARY } from "@/data/seed/vocabulary";
import type { Method } from "./SetupMethod";
import type {
  Drill,
  ExampleMode,
  FeedbackMode,
  HintLevel,
  LiveMode,
  PracticeSettings,
  RepeatMode,
} from "./practiceSettings";
import { DEFAULT_PRACTICE_SETTINGS } from "./practiceSettings";
import type { VocabWord } from "./useTypingSession";

/** Nguồn phiên. Đợt 1 hỗ trợ kho hệ thống + kho cá nhân; "một từ" = source + search + size=1. */
export type PracticeSource = "system" | "personal";

export interface PracticeSpec {
  source: PracticeSource;
  method: Method;
  drill: Drill;
  size: number;
  levels?: CefrLevel[];
  topics?: string[];
  search?: string;
  settings: PracticeSettings;
}

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SETTING_KEYS = ["hint", "example", "feedback", "repeat", "live"] as const;
const MIN_SIZE = 1;
const MAX_SIZE = 200;
const DEFAULT_SIZE = 20;

function clampSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SIZE;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.trunc(value)));
}

function parseCsv(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const list = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parseSettings(raw: string | null): PracticeSettings {
  if (!raw) return DEFAULT_PRACTICE_SETTINGS;
  const p = raw.split(".");
  return {
    hint: pick<HintLevel>(p[0], ["off", "underline", "first", "full"], DEFAULT_PRACTICE_SETTINGS.hint),
    example: pick<ExampleMode>(p[1], ["off", "show", "cloze"], DEFAULT_PRACTICE_SETTINGS.example),
    feedback: pick<FeedbackMode>(p[2], ["mark", "char", "reveal"], DEFAULT_PRACTICE_SETTINGS.feedback),
    repeat: pick<RepeatMode>(p[3], ["none", "once", "until"], DEFAULT_PRACTICE_SETTINGS.repeat),
    live: pick<LiveMode>(p[4], ["on", "off"], DEFAULT_PRACTICE_SETTINGS.live),
  };
}

/** Spec → query string cho /typing/play. */
export function buildPracticeQuery(spec: PracticeSpec): string {
  const params = new URLSearchParams();
  params.set("source", spec.source);
  params.set("m", spec.method);
  params.set("d", spec.drill);
  params.set("n", String(clampSize(spec.size)));
  if (spec.levels?.length) params.set("lv", spec.levels.join(","));
  if (spec.topics?.length) params.set("tp", spec.topics.join(","));
  if (spec.search?.trim()) params.set("q", spec.search.trim());
  // Kiểm tra khoá settings về TEST_SETTINGS nên không cần mã hoá.
  if (spec.drill === "practice") {
    params.set("set", SETTING_KEYS.map((key) => spec.settings[key]).join("."));
  }
  return params.toString();
}

/** Query → spec (null nếu thiếu/không hợp lệ → caller redirect về /typing/setup). */
export function parsePracticeSpec(params: URLSearchParams): PracticeSpec | null {
  const source = params.get("source");
  if (source !== "system" && source !== "personal") return null;
  const levels = parseCsv(params.get("lv"))?.filter((value): value is CefrLevel =>
    (LEVELS as string[]).includes(value)
  );
  return {
    source,
    method: params.get("m") === "M1" ? "M1" : "M2",
    drill: params.get("d") === "test" ? "test" : "practice",
    size: clampSize(parseInt(params.get("n") ?? "", 10)),
    levels: levels?.length ? levels : undefined,
    topics: parseCsv(params.get("tp")),
    search: params.get("q")?.trim() || undefined,
    settings: parseSettings(params.get("set")),
  };
}

/** Helper cho nút "Luyện..." ở kho từ vựng (mặc định M2 · Luyện tập · settings mặc định). */
export function makeLibrarySpec(input: {
  source: PracticeSource;
  levels?: CefrLevel[];
  topics?: string[];
  search?: string;
  size?: number;
}): PracticeSpec {
  return {
    source: input.source,
    method: "M2",
    drill: "practice",
    size: input.size ?? DEFAULT_SIZE,
    levels: input.levels?.length ? input.levels : undefined,
    topics: input.topics?.length ? input.topics : undefined,
    search: input.search?.trim() || undefined,
    settings: DEFAULT_PRACTICE_SETTINGS,
  };
}

/** Đường dẫn /typing/play cho một spec. */
export function practiceHref(spec: PracticeSpec): string {
  return `/typing/play?${buildPracticeQuery(spec)}`;
}

const entryToVocabWord = (entry: UserVocabEntryDto): VocabWord => ({
  id: entry.word?.id ?? entry.id,
  en: entry.word?.en ?? entry.custom?.en ?? "",
  vi: entry.word?.vi ?? entry.custom?.vi ?? "",
  level: entry.word?.level ?? entry.custom?.level ?? null,
  topic: entry.word?.topic ?? entry.custom?.topic ?? null,
  ipa: entry.word?.ipa ?? null,
  example: entry.word?.example ?? entry.custom?.example ?? null,
});

export interface LoadSpecResult {
  words: VocabWord[];
  source: VocabSource;
  error?: string;
  authRequired?: boolean;
}

/** Nạp danh sách từ cho một spec (kho hệ thống / kho cá nhân). */
export async function loadWordsForSpec(spec: PracticeSpec): Promise<LoadSpecResult> {
  if (spec.source === "personal") {
    try {
      const res = await fetchUserVocab({
        search: spec.search,
        levels: spec.levels,
        topics: spec.topics,
        page: 1,
        pageSize: Math.min(spec.size, 100),
      });
      return { words: res.items.map(entryToVocabWord).filter((word) => word.en), source: "api" };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return { words: [], source: "seed", authRequired: true };
      }
      return { words: [], source: "seed", error: getErrorMessage(err) };
    }
  }

  const res = await fetchVocab({
    levels: spec.levels,
    topics: spec.topics,
    search: spec.search,
    limit: spec.size,
    random: true,
  });
  const words: VocabWord[] = res.words.length ? res.words : SEED_VOCABULARY.slice(0, spec.size);
  return { words, source: res.source, error: res.error };
}
