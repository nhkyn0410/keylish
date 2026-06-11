import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/vocab/typing/primitives";

export const metadata: Metadata = {
  title: "Tính năng đang phát triển · KeyLish",
};

const MASCOT_SIZE = 240;

export default function ComingSoonPage() {
  return (
    <div
      className="k-site-wrap"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 18,
        paddingTop: 48,
        paddingBottom: 48,
        boxSizing: "border-box",
      }}
    >
      <Image src="/mascot/notfound.png" alt="" width={MASCOT_SIZE} height={MASCOT_SIZE} priority style={{ width: MASCOT_SIZE, height: "auto" }} />
      <div className="k-badge k-badge--violet">Đang phát triển</div>
      <h1 className="k-display" style={{ fontSize: 44, lineHeight: 1, maxWidth: 620 }}>
        Tính năng này đang được phát triển
      </h1>
      <p style={{ maxWidth: 460, fontSize: 16, fontWeight: 600, lineHeight: 1.6, color: "rgba(0,0,0,.7)" }}>
        KeyLish đang tập trung vào luyện gõ từ vựng. Tính năng bạn vừa chọn sẽ
        xuất hiện trong các bản cập nhật tới — quay lại sau nhé!
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
        <Link href="/" className="k-btn k-btn--primary">
          Về trang chủ <Icon name="arrow" size={18} />
        </Link>
        <Link href="/typing" className="k-btn">
          <Icon name="keyboard" size={18} stroke={3} /> Luyện gõ ngay
        </Link>
      </div>
    </div>
  );
}
