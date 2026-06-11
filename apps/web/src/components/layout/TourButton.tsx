"use client";

import { useRouter } from "next/navigation";
import { startHomeTour } from "@/lib/tour";

/** Onboarding tour trang chủ (F-013) — kết thúc tour thì dẫn sang /typing. */
export function TourButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      className={`k-btn k-btn--info ${className}`}
      type="button"
      onClick={() => startHomeTour(() => router.push("/typing"))}
    >
      Xem hướng dẫn
    </button>
  );
}