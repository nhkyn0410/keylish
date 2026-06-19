"use client";

import { useState } from "react";
import { VocabLibrarySplit } from "./VocabLibrarySplit";
import { MyVocabSplit } from "./MyVocabSplit";

type Tab = "system" | "mine";

export function VocabLibraryTabs() {
  const [tab, setTab] = useState<Tab>("system");

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          className="k-chip"
          data-on={tab === "system" ? "1" : "0"}
          onClick={() => setTab("system")}
          style={{ boxShadow: "3px 3px 0 0 #000" }}
        >
          Kho hệ thống
        </button>
        <button
          className="k-chip"
          data-on={tab === "mine" ? "1" : "0"}
          onClick={() => setTab("mine")}
          style={{ boxShadow: "3px 3px 0 0 #000" }}
        >
          Kho của tôi
        </button>
      </div>

      {tab === "system" ? <VocabLibrarySplit /> : <MyVocabSplit />}
    </>
  );
}
