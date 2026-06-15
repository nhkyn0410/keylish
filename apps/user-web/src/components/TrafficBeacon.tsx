"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function apiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000";
  }
  return "";
}

/**
 * Fires one page-view beacon per route change. Only active in production so
 * local browsing doesn't pollute the real counters. The API drops hits whose
 * Origin isn't allow-listed, and aggregates per UTC hour (no raw events).
 */
export function TrafficBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
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
  }, [pathname]);

  return null;
}
