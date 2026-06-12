import type { Metadata } from "next";
import { TypingFlow } from "@/components/vocab/typing/TypingFlow";

export const metadata: Metadata = {
  title: "Luyện gõ từ vựng · KeyLish",
};

export default function TypingPage() {
  return (
    <div style={{ height: "100dvh" }}>
      <TypingFlow />
    </div>
  );
}
