import { ArrowRight, Check, Keyboard, X } from "lucide-react";
import { NeoBadge } from "@/components/ui/NeoBadge";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";
import { TourButton } from "@/components/layout/TourButton";

type CharState = "correct" | "incorrect" | "current" | "pending";

const demoWord: { ch: string; state: CharState }[] = [
  { ch: "k", state: "correct" },
  { ch: "e", state: "correct" },
  { ch: "y", state: "correct" },
  { ch: "b", state: "incorrect" },
  { ch: "o", state: "current" },
  { ch: "a", state: "pending" },
  { ch: "r", state: "pending" },
  { ch: "d", state: "pending" },
];

const charClass: Record<CharState, string> = {
  correct: "bg-neo-green",
  incorrect: "bg-neo-red line-through",
  current: "bg-neo-ink text-neo-white motion-safe:animate-pulse",
  pending: "text-neo-ink/40",
};

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero */}
      <section className="mb-12">
        <NeoBadge className="mb-4 -rotate-2">
          Phiên bản v1 · luyện gõ từ vựng
        </NeoBadge>
        <h1 className="text-5xl leading-[0.95] sm:text-7xl">
          Học tiếng Anh
          <br />
          <span className="box-decoration-clone bg-neo-yellow px-2">
            bằng cách gõ
          </span>
        </h1>
        <p className="mt-6 max-w-prose text-lg sm:text-xl">
          KeyLish biến việc gõ phím thành cách học từ vựng tiếng Anh theo cấp
          độ — nhanh, rõ ràng, đầy năng lượng.
        </p>
        <div id="demo-buttons" className="mt-8 flex flex-wrap gap-4">
          <NeoButton variant="primary">
            Bắt đầu luyện
            <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
          </NeoButton>
          <TourButton />
        </div>
      </section>

      {/* Demo char-by-char (kiểm chứng trạng thái gõ từ vựng) */}
      <section id="demo-typing" className="mb-12">
        <NeoCard>
          <div className="mb-4 flex items-center gap-2">
            <Keyboard className="h-6 w-6" strokeWidth={3} />
            <h2 className="text-2xl">Demo trạng thái ký tự</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {demoWord.map((c, i) => (
              <span
                key={i}
                className={`inline-flex h-12 w-10 items-center justify-center border-4 border-black text-2xl font-black uppercase ${charClass[c.state]}`}
              >
                {c.ch}
              </span>
            ))}
          </div>
          {/* Chú giải: màu + icon/nhãn (không báo đúng/sai chỉ bằng màu) */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center border-2 border-black bg-neo-green">
                <Check className="h-4 w-4" strokeWidth={4} />
              </span>
              Đúng
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center border-2 border-black bg-neo-red">
                <X className="h-4 w-4" strokeWidth={4} />
              </span>
              Sai
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 border-2 border-black bg-neo-ink" />
              Con trỏ
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center border-2 border-black text-neo-ink/40">
                a
              </span>
              Chưa gõ
            </span>
          </div>
        </NeoCard>
      </section>

      {/* Palette semantic */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <NeoCard className="bg-neo-yellow">
          <h3 className="text-xl">Primary</h3>
          <p className="mt-2 text-sm">Vàng — CTA chính</p>
        </NeoCard>
        <NeoCard className="bg-neo-green">
          <h3 className="text-xl">Success</h3>
          <p className="mt-2 text-sm">Xanh — đúng / đã thuộc</p>
        </NeoCard>
        <NeoCard className="bg-neo-red">
          <h3 className="text-xl">Error</h3>
          <p className="mt-2 text-sm">Đỏ — sai / lỗi</p>
        </NeoCard>
        <NeoCard className="bg-neo-violet">
          <h3 className="text-xl">Info</h3>
          <p className="mt-2 text-sm">Violet — focus / phụ</p>
        </NeoCard>
      </section>
    </div>
  );
}
