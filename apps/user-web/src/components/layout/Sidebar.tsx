"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSessionActions } from "@/components/auth/UserSessionActions";
import { Icon, Logo, type IconName } from "@/components/vocab/typing/primitives";

/* Icon đậm nét bổ sung không có trong primitives (port từ design navbar.jsx). */
function NavIcon({
  name,
  size = 20,
  stroke = 3,
}: {
  name: string;
  size?: number;
  stroke?: number;
}) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<string, ReactNode> = {
    home: (
      <g {...p}>
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v9h12v-9" />
      </g>
    ),
    compass: (
      <g {...p}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3z" />
      </g>
    ),
    sentence: (
      <g {...p}>
        <path d="M4 6h16M4 11h16M4 16h9" />
      </g>
    ),
    list: (
      <g {...p}>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth={stroke + 1} />
      </g>
    ),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}

function ItemIcon({ name, custom }: { name: string; custom?: boolean }) {
  return (
    <span className="k-side-icon">
      {custom ? <NavIcon name={name} /> : <Icon name={name as IconName} size={20} stroke={3} />}
    </span>
  );
}

function SideLink({
  href,
  label,
  icon,
  custom,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  custom?: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={"k-side-item " + (active ? "k-side-item--active" : "k-side-item--idle")}
      aria-current={active ? "page" : undefined}
    >
      <ItemIcon name={icon} custom={custom} />
      <span className="k-side-label">{label}</span>
    </Link>
  );
}

/* Tính năng chưa làm trong v1 → dẫn tới trang "đang phát triển". */
const DEV = "/dang-phat-trien";
const soonHref = (feature: string) => `${DEV}/${feature}`;

/**
 * Sidebar dọc (variant D) — logo trên, danh sách tính năng giữa, đăng nhập/đăng
 * ký dưới. Port từ design `navbar.jsx` → NavSidebar.
 */
export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const exploreHref = soonHref("kham-pha");
  const sentenceHref = soonHref("luyen-cau");
  const vocabularyHref = soonHref("kho-tu-vung");
  const lessonsHref = soonHref("quan-ly-bai");

  return (
    <aside className="k-sidebar" aria-label="Thanh điều hướng">
      <div className="k-side-brand">
        <Link href="/" aria-label="Về trang chủ KeyLish" className="k-side-logo">
          <Logo />
        </Link>
      </div>

      <nav className="k-side-nav" aria-label="Điều hướng chính">
        <SideLink href="/" label="Trang chủ" icon="home" custom active={isActive("/")} />
        <SideLink
          href={exploreHref}
          label="Khám phá"
          icon="compass"
          custom
          active={isActive(exploreHref)}
        />
        <div className="k-side-divider" />
        <div className="k-h-eyebrow k-side-eyebrow">Luyện tập</div>
        <SideLink href="/typing" label="Luyện từ" icon="keyboard" active={isActive("/typing")} />
        <SideLink
          href={sentenceHref}
          label="Luyện câu"
          icon="sentence"
          custom
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
          custom
          active={isActive(lessonsHref)}
        />
      </nav>

      <UserSessionActions />
    </aside>
  );
}
