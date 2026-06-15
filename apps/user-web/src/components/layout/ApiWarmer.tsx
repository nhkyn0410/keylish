"use client";

import { useEffect } from "react";
import { warmApi } from "@/infra/vocab/vocabApi";

/**
 * Prewarm: chạm /api/health ngay khi người dùng ở trang site (vd trang chủ),
 * để Render thức dậy trước lúc họ bấm sang /typing — giấu bớt cold start.
 * Không render gì.
 */
export function ApiWarmer() {
  useEffect(() => {
    warmApi();
  }, []);
  return null;
}
