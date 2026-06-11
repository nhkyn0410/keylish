import Link from "next/link";
import { TourButton } from "@/components/layout/TourButton";
import { Icon, type IconName } from "@/components/vocab/typing/primitives";

type Metric = {
  value: string;
  label: string;
  detail: string;
  bg: string;
};

type LandingCard = {
  icon: IconName;
  title: string;
  text: string;
  badge: string;
  bg: string;
};

const metrics: Metric[] = [
  {
    value: "10.000+",
    label: "từ vựng",
    detail: "EN → VI",
    bg: "var(--neo-yellow)",
  },
  { value: "6", label: "cấp độ", detail: "A1 → C2", bg: "var(--neo-violet)" },
  { value: "13", label: "chủ đề", detail: "lọc nhanh", bg: "var(--neo-green)" },
  { value: "2", label: "chế độ", detail: "gõ & nghe", bg: "var(--neo-white)" },
];

const flowSteps: LandingCard[] = [
  {
    icon: "filter",
    title: "Lọc đúng nguồn từ",
    text: "Chọn CEFR, chủ đề và số từ trong một màn thiết lập gọn, giống cách phiên luyện đang chạy.",
    badge: "Bước 1",
    bg: "var(--neo-yellow)",
  },
  {
    icon: "swap",
    title: "Chọn cách luyện",
    text: "M2 cho nhìn nghĩa tiếng Việt rồi gõ tiếng Anh. M1 cho nghe phát âm và gõ lại từ vừa nghe.",
    badge: "Bước 2",
    bg: "var(--neo-violet)",
  },
  {
    icon: "refresh",
    title: "Sai thì quay lại",
    text: "Từ gõ sai không biến mất; nó quay về cuối vòng để bạn sửa ngay trong cùng phiên.",
    badge: "Bước 3",
    bg: "var(--neo-green)",
  },
];

const highlights: LandingCard[] = [
  {
    icon: "keyboard",
    title: "Phản hồi từng ký tự",
    text: "Mỗi phím được chấm ngay: đúng, sai, con trỏ hiện tại và phần chưa gõ đều hiện rõ.",
    badge: "Focus",
    bg: "var(--neo-white)",
  },
  {
    icon: "volume",
    title: "Có mode nghe",
    text: "Dùng giọng đọc của trình duyệt để luyện nghe - gõ mà không cần rời khỏi bàn phím.",
    badge: "M1",
    bg: "var(--neo-white)",
  },
  {
    icon: "target",
    title: "Một phiên, một mục tiêu",
    text: "Phiên 20, 50 hoặc 100 từ giúp việc luyện ngắn gọn và dễ lặp lại mỗi ngày.",
    badge: "M2",
    bg: "var(--neo-white)",
  },
];

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="k-b k-sh-sm p-4" style={{ background: metric.bg }}>
      <div className="k-stat-num text-4xl sm:text-5xl">{metric.value}</div>
      <div className="mt-2 text-sm font-black uppercase tracking-normal">
        {metric.label}
      </div>
      <div className="text-xs font-bold uppercase tracking-normal opacity-60">
        {metric.detail}
      </div>
    </div>
  );
}

function LandingFeatureCard({ card }: { card: LandingCard }) {
  return (
    <article
      className="k-card k-card--hover p-5"
      style={{ background: card.bg }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="k-b2 k-sh-sm flex h-14 w-14 items-center justify-center bg-neo-white">
          <Icon name={card.icon} size={30} stroke={3} />
        </div>
        <span className="k-badge k-badge--white">{card.badge}</span>
      </div>
      <h3 className="text-2xl tracking-normal">{card.title}</h3>
      <p className="mt-3 text-sm font-bold leading-6 opacity-70">{card.text}</p>
    </article>
  );
}

function StateLegend({
  label,
  state,
}: {
  label: string;
  state: "ok" | "bad" | "cur" | "todo";
}) {
  const color =
    state === "ok"
      ? "var(--neo-green)"
      : state === "bad"
        ? "var(--neo-red)"
        : state === "cur"
          ? "var(--neo-ink)"
          : "var(--neo-white)";

  return (
    <div className="k-b2 flex items-center gap-2 bg-neo-white px-3 py-2 text-sm font-black uppercase tracking-normal">
      <span
        className="k-b2 inline-flex h-7 w-7 items-center justify-center"
        style={{
          background: color,
          color: state === "cur" ? "var(--neo-white)" : "var(--neo-ink)",
        }}
      >
        {state === "ok" ? (
          <Icon name="check" size={15} stroke={4} />
        ) : state === "bad" ? (
          <Icon name="x" size={15} stroke={4} />
        ) : state === "todo" ? (
          "a"
        ) : (
          ""
        )}
      </span>
      {label}
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-hidden bg-neo-bg">
      <section id="tour-hero" className="border-b-4 border-black">
        <div className="k-site-wrap py-8 sm:py-12">
          <div className="max-w-[860px]">
            <div className="k-badge k-badge--violet mb-6">
              KeyLish v1 · typed vocabulary
            </div>
            <h1 className="max-w-[780px] flex flex-col items-start gap-2 text-[42px] tracking-normal sm:gap-3 sm:text-[64px] lg:text-[76px]">
              <span>Học tiếng Anh</span>
              <span className="inline-flex w-fit border-4 border-black bg-neo-yellow px-4 py-2 leading-none shadow-neo-sm sm:px-5 sm:py-9">
                bằng cách gõ
              </span>
            </h1>
            <p className="mt-6 max-w-[620px] text-base font-semibold leading-7 text-neo-ink/75 sm:text-lg sm:leading-8">
              Chọn cấp độ CEFR, lọc chủ đề, rồi luyện từ vựng bằng chính thao
              tác gõ. KeyLish cho phản hồi ngay từng ký tự và đưa từ sai quay
              lại cuối vòng.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/typing" className="k-btn k-btn--primary">
                Bắt đầu luyện <Icon name="arrow" size={20} />
              </Link>
              <TourButton />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-black bg-neo-violet">
        <div className="k-site-wrap grid grid-cols-2 gap-3 py-5 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <section
        id="demo-typing"
        className="k-site-wrap grid gap-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-16"
      >
        <div>
          <div className="k-h-eyebrow text-[#7a6a00]">Phản hồi tức thì</div>
          <h2 className="mt-2 text-4xl leading-tight tracking-normal sm:text-5xl">
            Biết sai ở đâu ngay khi gõ
          </h2>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-neo-ink/70 sm:text-lg">
            Trang luyện không chờ đến cuối bài mới báo lỗi. Mỗi ký tự có trạng
            thái riêng, kèm dấu hiệu trực quan để không phụ thuộc vào màu sắc
            đơn thuần.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <StateLegend label="Đúng" state="ok" />
            <StateLegend label="Sai" state="bad" />
            <StateLegend label="Con trỏ" state="cur" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map((card) => (
            <LandingFeatureCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      <section id="tour-how" className="border-y-4 border-black bg-neo-white">
        <div className="k-site-wrap py-12 lg:py-16">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="k-h-eyebrow text-[#7a6a00]">Cách hoạt động</div>
              <h2 className="mt-2 text-4xl leading-tight tracking-normal sm:text-5xl">
                Một phiên luyện rõ ràng
              </h2>
            </div>
            <Link
              href="/typing"
              className="k-btn k-btn--sm k-btn--primary self-start sm:self-auto"
            >
              Vào màn luyện <Icon name="arrow" size={18} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {flowSteps.map((card) => (
              <LandingFeatureCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </section>

      <section id="tour-cta" className="border-b-4 border-black bg-neo-yellow">
        <div className="k-site-wrap flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="k-badge k-badge--white mb-4">Sẵn sàng luyện?</div>
            <h2 className="text-4xl leading-tight tracking-normal sm:text-5xl">
              Bắt đầu một phiên 20 từ
            </h2>
            <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-neo-ink/70">
              Lần đầu vào màn luyện sẽ có hướng dẫn từng bước để chọn cấp độ,
              chủ đề và phương pháp.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/typing" className="k-btn k-btn--lg">
              Luyện ngay <Icon name="arrow" size={22} />
            </Link>
            <TourButton />
          </div>
        </div>
      </section>

      <section className="k-site-wrap py-6 text-sm font-bold leading-6 text-neo-ink/60">
        Kho từ vựng xây từ{" "}
        <a
          className="underline"
          href="https://kaikki.org/dictionary/English/"
          target="_blank"
          rel="noreferrer"
        >
          English Wiktionary (kaikki.org)
        </a>{" "}
        và{" "}
        <a
          className="underline"
          href="https://github.com/Maximax67/Words-CEFR-Dataset"
          target="_blank"
          rel="noreferrer"
        >
          Words-CEFR-Dataset
        </a>{" "}
        - CC BY-SA / MIT.
      </section>
    </div>
  );
}
