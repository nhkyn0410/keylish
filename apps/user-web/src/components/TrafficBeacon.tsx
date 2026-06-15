"use client";

import { useEffect } from "react";

const VISIT_FLAG = "kl_visited";

function apiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000";
  }
  return "";
}

/**
 * Records ONE visit per browser session — not per page view. The sessionStorage
 * flag means internal SPA navigation and reloads within the same tab session
 * don't add extra counts. Only active in production. The API drops hits whose
 * Origin isn't allow-listed and aggregates per UTC hour (no raw events).
 */
export function TrafficBeacon() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    try {
      if (sessionStorage.getItem(VISIT_FLAG)) return;
      sessionStorage.setItem(VISIT_FLAG, "1");
    } catch {
      // sessionStorage unavailable (e.g. some private modes) — count anyway.
    }

    const base = apiBase();
    if (!base) return;

    const url = base + "/api/v1/track";
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(url);
      } else {
        void fetch(url, { method: "POST", keepalive: true, credentials: "include" });
      }
    } catch {
      // Analytics must never break navigation.
    }
  }, []);

  return null;
}
