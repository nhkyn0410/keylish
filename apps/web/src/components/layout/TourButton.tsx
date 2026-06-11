"use client";

import { useRouter } from "next/navigation";
import { NeoButton } from "@/components/ui/NeoButton";
import { startHomeTour } from "@/lib/tour";

/** Onboarding tour trang chủ (F-013) — kết thúc tour thì dẫn sang /typing. */
export function TourButton() {
  const router = useRouter();
  return (
    <NeoButton variant="info" type="button" onClick={() => startHomeTour(() => router.push("/typing"))}>
      Xem hướng dẫn
    </NeoButton>
  );
}
