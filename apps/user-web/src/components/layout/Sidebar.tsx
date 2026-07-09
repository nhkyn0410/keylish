"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSessionActions } from "@/components/auth/UserSessionActions";
import { Icon, Logo, type IconName } from "@/components/vocab/typing/primitives";

function ItemIcon({ name }: { name: IconName }) {
  return (
    <span className="k-side-icon">
      <Icon name={name} size={20} stroke={3} />
    </span>
  );
}

function SideLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={"k-side-item " + (active ? "k-side-item--active" : "k-side-item--idle")}
      aria-current={active ? "page" : undefined}
    >
      <ItemIcon name={icon} />
      <span className="k-side-label">{label}</span>
    </Link>
  );
}

/* Tính năng chưa làm trong v1 → dẫn tới trang "đang phát triển". */
const DEV = "/dang-phat-trien";
const soonHref = (feature: string) => `${DEV}/${feature}`;

/* Link Google Form cho mục Góp ý (cấu hình qua env NEXT_PUBLIC_FEEDBACK_FORM_URL). */
const FEEDBACK_FORM_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL ?? "https://forms.gle/REPLACE_WITH_YOUR_FORM";

/**
 * Sidebar dọc (variant D) — logo trên, danh sách tính năng giữa, đăng nhập/đăng
 * ký dưới. Port từ design `navbar.jsx` → NavSidebar.
 */
export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const exploreHref = soonHref("kham-pha");
  const sentenceHref = soonHref("luyen-cau");
  const vocabularyHref = "/vocabulary"; // route tiếng Anh (V2.1)
  const lessonsHref = soonHref("quan-ly-bai");

  return (
    <aside className="k-sidebar" aria-label="Thanh điều hướng">
      <div className="k-side-brand">
        <Link href="/" aria-label="Về trang chủ KeyLish" className="k-side-logo">
          <Logo />
        </Link>
      </div>

      <nav className="k-side-nav" aria-label="Điều hướng chính">
        <SideLink href="/" label="Trang chủ" icon="home" active={isActive("/")} />
        <SideLink
          href={exploreHref}
          label="Khám phá"
          icon="compass"
          active={isActive(exploreHref)}
        />
        <div className="k-side-divider" />
        <div className="k-h-eyebrow k-side-eyebrow">Luyện tập</div>
        <SideLink href="/typing" label="Luyện từ" icon="keyboard" active={isActive("/typing")} />
        <SideLink
          href={sentenceHref}
          label="Luyện câu"
          icon="sentence"
          active={isActive(sentenceHref)}
        />
        <div className="k-side-divider" />
        <SideLink
          href={vocabularyHref}
          label="Kho từ vựng"
          icon="book"
          active={isActive(vocabularyHref)}
        />
        <SideLink
          href={lessonsHref}
          label="Quản lý bài"
          icon="list"
          active={isActive(lessonsHref)}
        />
        <div className="k-side-divider" />
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="k-side-item k-side-item--idle"
        >
          <ItemIcon name="chat" />
          <span className="k-side-label">Góp ý</span>
        </a>
      </nav>

      <UserSessionActions />
    </aside>
  );
}
