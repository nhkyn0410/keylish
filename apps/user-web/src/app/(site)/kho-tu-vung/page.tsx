import type { Metadata } from "next";
import { VocabLibraryTabs } from "@/components/vocab/library/VocabLibraryTabs";

export const metadata: Metadata = {
  title: "Kho từ vựng · KeyLish",
};

export default function VocabLibraryPage() {
  return (
    <main className="k-site-wrap" style={{ paddingTop: 28, paddingBottom: 28 }}>
      <div style={{ marginBottom: 16 }}>
        <div className="k-h-eyebrow" style={{ color: "#7a6a00", marginBottom: 6 }}>
          KeyLish · Kho từ vựng
        </div>
        <h1 className="k-display" style={{ fontSize: 40, lineHeight: 1 }}>
          Kho từ vựng
        </h1>
      </div>
      <VocabLibraryTabs />
    </main>
  );
}
