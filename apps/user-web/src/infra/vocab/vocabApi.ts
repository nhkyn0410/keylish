import {
  TopicDTOSchema,
  VocabCountSchema,
  VocabResponseSchema,
  type CefrLevel,
  type TopicDTO,
  type VocabQuery,
  type WordDTO,
} from "@keylish/shared";
import { SEED_TOPICS, SEED_VOCABULARY } from "@/data/seed/vocabulary";

export interface VocabFilter {
  levels?: CefrLevel[];
  topics?: string[];
}

const DB_NAME = "keylish-vocab-v1";
const STORE_NAME = "responses";

export type VocabSource = "api" | "cache" | "seed";

export interface FetchVocabResult {
  words: WordDTO[];
  source: VocabSource;
  error?: string;
}

export async function fetchVocab(params: Partial<VocabQuery> = {}): Promise<FetchVocabResult> {
  const query = normalizeQuery(params);
  const key = cacheKey(query);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  let error: string | undefined;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/v1/vocab?${toSearchParams(query)}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const parsed = VocabResponseSchema.parse(await res.json());
      if (parsed.length) {
        await writeCache(key, parsed);
        return { words: parsed, source: "api" };
      }
      error = "API returned an empty vocabulary set.";
    } catch (err) {
      error = err instanceof Error ? err.message : "Unable to fetch vocabulary API.";
    }
  } else {
    error = "NEXT_PUBLIC_API_URL is not configured.";
  }

  const cached = await readCache(key);
  if (cached.length) return { words: cached, source: "cache", error };

  return { words: filterSeed(query), source: "seed", error };
}

/** Slug hóa tên chủ đề — dùng chung để so khớp topic title (seed) với slug (API). */
export function topicSlug(value: string) {
  return slugify(value);
}

/** Danh sách chủ đề suy ra từ seed offline (fallback khi không có API). */
export function seedTopicDtos(): TopicDTO[] {
  return SEED_TOPICS.map((title) => ({
    slug: slugify(title),
    title,
    count: SEED_VOCABULARY.filter((w) => w.topic === title).length,
  }));
}

export async function fetchTopics(): Promise<{
  topics: TopicDTO[];
  source: VocabSource;
  error?: string;
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  let error: string | undefined;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/v1/topics`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const parsed = TopicDTOSchema.array().parse(await res.json());
      if (parsed.length) return { topics: parsed, source: "api" };
      error = "API returned an empty topic list.";
    } catch (err) {
      error = err instanceof Error ? err.message : "Unable to fetch topics API.";
    }
  } else {
    error = "NEXT_PUBLIC_API_URL is not configured.";
  }

  return { topics: seedTopicDtos(), source: "seed", error };
}

/** API có được cấu hình không (NEXT_PUBLIC_API_URL). */
export function apiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_API_URL;
}

/** Fire-and-forget: chạm /api/health để đánh thức Render sớm (prewarm cold start). */
export function warmApi(): void {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiUrl) return;
  fetch(`${apiUrl}/api/health`, { cache: "no-store" }).catch(() => {});
}

const sleep = (ms: number) =>
  new Promise<void>((r) => {
    setTimeout(r, ms);
  });

/**
 * Chờ API thức rồi mới trả chủ đề thật: thử fetchTopics tới khi nguồn = "api"
 * hoặc hết lượt. Dùng cho màn "Đang nạp từ vựng" để không rớt seed lúc Render
 * cold start (502/503). Nếu không cấu hình API → trả seed ngay.
 */
export async function loadTopicsAwait(
  isAborted: () => boolean = () => false,
  attempts = 30,
  delayMs = 3500
): Promise<{ topics: TopicDTO[]; source: VocabSource; error?: string }> {
  let last = await fetchTopics();
  if (!apiConfigured() || last.source === "api") return last;
  for (let i = 1; i < attempts; i += 1) {
    if (isAborted()) break;
    await sleep(delayMs);
    if (isAborted()) break;
    last = await fetchTopics();
    if (last.source === "api") return last;
  }
  return last;
}

/** Số từ thật khớp bộ lọc (DB qua API), fallback đếm trên seed offline. */
export async function fetchVocabCount(filter: VocabFilter = {}): Promise<number> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (apiUrl) {
    try {
      const params = new URLSearchParams();
      if (filter.levels?.length) params.set("levels", filter.levels.join(","));
      if (filter.topics?.length) params.set("topics", filter.topics.join(","));
      const res = await fetch(`${apiUrl}/api/v1/vocab/count?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) return VocabCountSchema.parse(await res.json()).count;
    } catch {
      // rơi xuống đếm seed
    }
  }
  return countSeed(filter);
}

function countSeed(filter: VocabFilter): number {
  return SEED_VOCABULARY.filter((word) => {
    const levelOk =
      !filter.levels?.length || (word.level != null && filter.levels.includes(word.level));
    const topicOk =
      !filter.topics?.length ||
      (word.topic != null &&
        filter.topics.some((t) => t === word.topic || t === slugify(word.topic ?? "")));
    return levelOk && topicOk;
  }).length;
}

function normalizeQuery(params: Partial<VocabQuery>): VocabQuery {
  return {
    levels: params.levels?.length ? params.levels : undefined,
    topics: params.topics?.length ? params.topics : undefined,
    limit: params.limit ?? 20,
    random: params.random ?? false,
  };
}

function toSearchParams(query: VocabQuery) {
  const params = new URLSearchParams();
  if (query.levels?.length) params.set("levels", query.levels.join(","));
  if (query.topics?.length) params.set("topics", query.topics.join(","));
  params.set("limit", String(query.limit));
  if (query.random) params.set("random", "1");
  return params.toString();
}

function cacheKey(query: VocabQuery) {
  const levels = [...(query.levels ?? [])].sort().join(",");
  const topics = [...(query.topics ?? [])].sort().join(",");
  return `vocab:${levels}:${topics}:${query.limit}:${query.random ? "1" : "0"}`;
}

function filterSeed(query: VocabQuery): WordDTO[] {
  const rows = SEED_VOCABULARY.filter((word) => {
    const levelOk =
      !query.levels?.length || (word.level != null && query.levels.includes(word.level));
    const topicOk =
      !query.topics?.length ||
      (word.topic != null &&
        query.topics.some((topic) => topic === word.topic || topic === slugify(word.topic ?? "")));
    return levelOk && topicOk;
  });
  const source = query.random ? shuffle(rows) : rows;
  return source.slice(0, query.limit);
}

async function openDb() {
  if (typeof indexedDB === "undefined") return null;
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function readCache(key: string): Promise<WordDTO[]> {
  try {
    const db = await openDb();
    if (!db) return [];
    return await new Promise<WordDTO[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

async function writeCache(key: string, words: WordDTO[]) {
  try {
    const db = await openDb();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(words, key);
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Cache is opportunistic; fetch/fallback should stay usable if IndexedDB fails.
  }
}

function shuffle<T>(rows: T[]) {
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
