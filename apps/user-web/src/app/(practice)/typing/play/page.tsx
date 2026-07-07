import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayFlow } from "@/components/vocab/typing/PlayFlow";

export const metadata: Metadata = {
  title: "Luyện gõ · KeyLish",
};

export default function TypingPlayPage() {
  return (
    <div style={{ height: "100dvh" }}>
      <Suspense fallback={null}>
        <PlayFlow />
      </Suspense>
    </div>
  );
}
