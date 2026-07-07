import type { Metadata } from "next";
import { SetupFlow } from "@/components/vocab/typing/SetupFlow";

export const metadata: Metadata = {
  title: "Thiết lập phiên luyện · KeyLish",
};

export default function TypingSetupPage() {
  return (
    <div style={{ height: "100dvh" }}>
      <SetupFlow />
    </div>
  );
}
