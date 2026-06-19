"use client";

import { useState } from "react";
import { VocabLibrarySplit } from "./VocabLibrarySplit";
import { MyVocabSplit } from "./MyVocabSplit";

type Tab = "system" | "mine";

export function VocabLibraryTabs() {
  const [tab, setTab] = useState<Tab>("system");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header: tiêu đề + toggle + nút hướng dẫn (?) trên cùng một hàng */}
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 className="k-display" style={{ fontSize: 30, lineHeight: 1 }}>
          Kho từ vựng
        </h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="k-chip"
            data-on={tab === "system" ? "1" : "0"}
            onClick={() => setTab("system")}
            style={{ boxShadow: "3px 3px 0 0 #000" }}
          >
            Kho hệ thống
          </button>
          <button
            type="button"
            className="k-chip"
            data-on={tab === "mine" ? "1" : "0"}
            onClick={() => setTab("mine")}
            style={{ boxShadow: "3px 3px 0 0 #000" }}
          >
            Kho của tôi
          </button>
          {/* Nút hướng dẫn — chỗ dành cho tour sau này */}
          <button
            type="button"
            className="k-b2 k-sh-sm"
            aria-label="Hướng dẫn"
            title="Hướng dẫn nhanh (sắp có)"
            style={{
              width: 40,
              height: 40,
              flex: "0 0 auto",
              background: "var(--neo-white)",
              fontFamily: "var(--font)",
              fontWeight: 900,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ?
          </button>
        </div>
      </div>

      {/* Khung kho — lấp đầy chiều cao còn lại */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === "system" ? <VocabLibrarySplit /> : <MyVocabSplit />}
      </div>
    </div>
  );
}
