export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type UserStatus = "ACTIVE" | "DISABLED" | "DELETED";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type AdminSummary = {
  users: number;
  topics: number;
  vocab: number;
  api: { status: "ok" };
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type AdminUserList = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminUser[];
};

export type AdminTopic = {
  id: string;
  slug: string;
  title: string;
  count?: number;
};

export type AdminTopicList = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminTopic[];
};

export type AdminVocabTopic = {
  id: string;
  slug: string;
  title: string;
};

export type AdminVocab = {
  id: string;
  en: string;
  vi: string;
  level: CefrLevel | null;
  frequency: number;
  pos: string | null;
  ipa: string | null;
  example: string | null;
  source: string;
  topic: AdminVocabTopic | null;
};

export type AdminVocabList = {
  total: number;
  page: number;
  pageSize: number;
  items: AdminVocab[];
};

export type AdminVocabInput = {
  en: string;
  vi: string;
  level?: CefrLevel | null;
  frequency?: number;
  pos?: string | null;
  ipa?: string | null;
  example?: string | null;
  source?: string;
  topicId?: string | null;
};

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000";
  }
  return "";
}

function toQuery(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const value = query.toString();
  return value ? "?" + value : "";
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL is not configured.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(baseUrl + path, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let message = "Request failed with status " + response.status + ".";
    try {
      const body = (await response.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(body.message)) message = body.message.join(" ");
      else if (body.message) message = body.message;
      else if (body.error) message = body.error;
    } catch {
      // Keep the generic status message.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function getAdminCsrfToken() {
  const body = await requestJson<{ token: string }>("/api/admin/csrf", { cache: "no-store" });
  return body.token;
}

async function requestWithCsrf<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminCsrfToken();
  const headers = new Headers(init.headers);
  headers.set("X-CSRF-Token", token);
  return requestJson<T>(path, { ...init, headers });
}

function jsonBody(body: unknown) {
  return {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

export async function adminLogin(input: { username: string; password: string }) {
  return requestWithCsrf<{ ok: true }>("/api/admin/login", {
    method: "POST",
    ...jsonBody(input),
  });
}

export async function adminLogout() {
  return requestWithCsrf<{ ok: true }>("/api/admin/logout", { method: "POST" });
}

export function getAdminSummary() {
  return requestJson<AdminSummary>("/api/admin/dashboard/summary", { cache: "no-store" });
}

export function listUsers(
  params: {
    search?: string;
    status?: UserStatus;
    page?: number;
    pageSize?: number;
  } = {}
) {
  return requestJson<AdminUserList>("/api/admin/users" + toQuery(params), { cache: "no-store" });
}

export function updateUserStatus(id: string, status: UserStatus) {
  return requestWithCsrf<AdminUser>("/api/admin/users/" + encodeURIComponent(id), {
    method: "PATCH",
    ...jsonBody({ status }),
  });
}

export function listTopics(params: { search?: string; page?: number; pageSize?: number } = {}) {
  return requestJson<AdminTopicList>("/api/admin/topics" + toQuery(params), { cache: "no-store" });
}

export function createTopic(input: { slug: string; title: string }) {
  return requestWithCsrf<AdminTopic>("/api/admin/topics", {
    method: "POST",
    ...jsonBody(input),
  });
}

export function updateTopic(id: string, input: { slug?: string; title?: string }) {
  return requestWithCsrf<AdminTopic>("/api/admin/topics/" + encodeURIComponent(id), {
    method: "PATCH",
    ...jsonBody(input),
  });
}

export function deleteTopic(id: string) {
  return requestWithCsrf<{ ok: true }>("/api/admin/topics/" + encodeURIComponent(id), {
    method: "DELETE",
  });
}

export function listVocab(
  params: {
    search?: string;
    topicId?: string;
    level?: CefrLevel;
    page?: number;
    pageSize?: number;
  } = {}
) {
  return requestJson<AdminVocabList>("/api/admin/vocab" + toQuery(params), { cache: "no-store" });
}

export function createWord(input: AdminVocabInput) {
  return requestWithCsrf<AdminVocab>("/api/admin/vocab", {
    method: "POST",
    ...jsonBody(input),
  });
}

export function updateWord(id: string, input: Partial<AdminVocabInput>) {
  return requestWithCsrf<AdminVocab>("/api/admin/vocab/" + encodeURIComponent(id), {
    method: "PATCH",
    ...jsonBody(input),
  });
}

export function deleteWord(id: string) {
  return requestWithCsrf<{ ok: true }>("/api/admin/vocab/" + encodeURIComponent(id), {
    method: "DELETE",
  });
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
