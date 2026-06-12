import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, Logo } from "@/components/vocab/typing/primitives";

const soonItems = ["Kho từ vựng", "Cài đặt"] as const;

export function AppHeader({
  children,
  accent = "var(--neo-bg)",
}: {
  children?: ReactNode;
  accent?: string;
}) {
  const hasCustomActions = children != null;

  return (
    <header className="k-app-header border-b-4 border-black" style={{ background: accent }}>
      <div className="k-site-wrap flex h-full items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center" aria-label="Về trang chủ KeyLish">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {hasCustomActions ? (
            children
          ) : (
            <>
              <nav className="hidden items-center gap-2 lg:flex" aria-label="Điều hướng chính">
                {soonItems.map((label) => (
                  <span
                    key={label}
                    aria-disabled="true"
                    title="Sắp ra mắt"
                    className="k-badge k-badge--white cursor-not-allowed opacity-50"
                  >
                    {label} · Sắp có
                  </span>
                ))}
              </nav>
              <Link href="/typing" className="k-btn k-btn--sm k-btn--primary">
                <span className="hidden sm:inline">Bắt đầu luyện</span>
                <span className="sm:hidden">Luyện</span>
                <Icon name="arrow" size={17} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
