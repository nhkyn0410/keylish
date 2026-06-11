import Link from "next/link";
import { ArrowRight, Check, Filter, Keyboard, RotateCcw, Volume2, X } from "lucide-react";
import { NeoBadge } from "@/components/ui/NeoBadge";
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

const stats = [
  { value: "10.000+", label: "từ vựng EN→VI" },
  { value: "6", label: "cấp độ CEFR" },
  { value: "13", label: "chủ đề" },
  { value: "2", label: "chế độ luyện" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero */}
      <section id="tour-hero" className="mb-10">
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
          Chọn cấp độ CEFR và chủ đề, rồi học từ vựng bằng chính việc gõ từng
          ký tự — nhìn nghĩa tiếng Việt gõ từ tiếng Anh, hoặc nghe phát âm và
          gõ lại. Sai ở đâu sửa ngay ở đó, từ sai tự quay lại cuối vòng.
        </p>
        <div id="tour-cta" className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/typing"
            className="inline-flex items-center border-4 border-black bg-neo-yellow px-6 py-3 text-lg font-black uppercase tracking-wide shadow-neo-sm transition-all duration-100 hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0.5 active:shadow-none"
          >
            Bắt đầu luyện
            <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
          </Link>
          <TourButton />
        </div>
      </section>

      {/* Stats */}
      <section className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-4 border-black bg-neo-white px-4 py-3 shadow-neo-sm">
            <div className="text-3xl font-black">{s.value}</div>
            <div className="text-xs font-bold uppercase tracking-wide text-neo-ink/60">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Demo char-by-char */}
      <section id="demo-typing" className="mb-12">
        <NeoCard>
          <div className="mb-4 flex items-center gap-2">
            <Keyboard className="h-6 w-6" strokeWidth={3} />
            <h2 className="text-2xl">Phản hồi từng ký tự</h2>
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

      {/* Cách hoạt động */}
      <section id="tour-how" className="mb-12">
        <h2 className="mb-6 text-3xl">Cách hoạt động</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <NeoCard className="bg-neo-yellow">
            <Filter className="mb-3 h-8 w-8" strokeWidth={3} />
            <h3 className="text-xl">1 · Chọn nguồn từ</h3>
            <p className="mt-2 text-sm font-bold">
              Lọc kho 10.000+ từ theo cấp độ A1–C2 và chủ đề — hoặc luyện tất cả.
            </p>
          </NeoCard>
          <NeoCard className="bg-neo-violet">
            <Volume2 className="mb-3 h-8 w-8" strokeWidth={3} />
            <h3 className="text-xl">2 · Chọn phương pháp</h3>
            <p className="mt-2 text-sm font-bold">
              Nhìn nghĩa tiếng Việt gõ từ tiếng Anh, hoặc nghe phát âm rồi gõ lại.
            </p>
          </NeoCard>
          <NeoCard className="bg-neo-green">
            <RotateCcw className="mb-3 h-8 w-8" strokeWidth={3} />
            <h3 className="text-xl">3 · Gõ &amp; ôn lại</h3>
            <p className="mt-2 text-sm font-bold">
              Gõ sai thấy ngay đáp án đúng; từ sai tự lặp lại cuối vòng cho đến khi thuộc.
            </p>
          </NeoCard>
        </div>
      </section>

      {/* Nguồn dữ liệu */}
      <section className="border-t-4 border-black pt-6 text-sm font-bold text-neo-ink/60">
        Kho từ vựng xây từ{" "}
        <a className="underline" href="https://kaikki.org/dictionary/English/" target="_blank" rel="noreferrer">
          English Wiktionary (kaikki.org)
        </a>{" "}
        và{" "}
        <a className="underline" href="https://github.com/Maximax67/Words-CEFR-Dataset" target="_blank" rel="noreferrer">
          Words-CEFR-Dataset
        </a>
        {" "}— CC BY-SA / MIT.
      </section>
    </div>
  );
}
