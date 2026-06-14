export type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type UserRegisterInput = {
  email: string;
  password: string;
  displayName?: string;
};

export type UserLoginInput = {
  email: string;
  password: string;
};

export type UserProfileUpdateInput = {
  displayName?: string;
  avatarUrl?: string | null;
};

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }
  return "";
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

async function getUserCsrfToken() {
  const body = await requestJson<{ token: string }>("/api/user/csrf", {
    cache: "no-store",
  });
  return body.token;
}

async function requestWithCsrf<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getUserCsrfToken();
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

export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    return await requestJson<UserProfile>("/api/user/profile", { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function loginUser(input: UserLoginInput): Promise<UserProfile> {
  const response = await requestWithCsrf<{ user: UserProfile }>("/api/user/login", {
    method: "POST",
    ...jsonBody(input),
  });
  return response.user;
}

export async function registerUser(input: UserRegisterInput): Promise<UserProfile> {
  const response = await requestWithCsrf<{ user: UserProfile }>("/api/user/register", {
    method: "POST",
    ...jsonBody(input),
  });
  return response.user;
}

export async function logoutUser() {
  return requestWithCsrf<{ ok: true }>("/api/user/logout", { method: "POST" });
}

export async function updateUserProfile(input: UserProfileUpdateInput): Promise<UserProfile> {
  return requestWithCsrf<UserProfile>("/api/user/profile", {
    method: "PATCH",
    ...jsonBody(input),
  });
}

export async function changeUserPassword(input: PasswordChangeInput) {
  return requestWithCsrf<{ ok: true }>("/api/user/change-password", {
    method: "POST",
    ...jsonBody(input),
  });
}

export async function forgotPassword(email: string) {
  return requestWithCsrf<{ ok: true; token?: string }>("/api/user/forgot-password", {
    method: "POST",
    ...jsonBody({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return requestWithCsrf<{ ok: true }>("/api/user/reset-password", {
    method: "POST",
    ...jsonBody({ token, password }),
  });
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
