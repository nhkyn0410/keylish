import type { Metadata } from "next";
import { VocabLibraryTabs } from "@/components/vocab/library/VocabLibraryTabs";

export const metadata: Metadata = {
  title: "Kho từ vựng · KeyLish",
};

export default function VocabLibraryPage() {
  return (
    <div
      style={{
        height: "100%",
        minWidth: 0,
        width: "100%",
        maxWidth: 1600,
        marginInline: "auto",
        paddingBlock: 16,
        paddingInline: 40,
        boxSizing: "border-box",
      }}
    >
      <VocabLibraryTabs />
    </div>
  );
}
