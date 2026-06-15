"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function AuthFrame({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="k-site-wrap flex min-h-full items-center py-10">
      <div className="mx-auto grid w-full max-w-[980px] gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="k-badge k-badge--violet mb-5">{eyebrow}</div>
          <h1 className="max-w-[620px] text-5xl leading-tight tracking-normal sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-[560px] text-base font-bold leading-7 text-neo-ink/70">
            {subtitle}
          </p>
          <Link href="/typing" className="k-btn k-btn--sm mt-6 inline-flex">
            Vào luyện từ
          </Link>
        </div>
        <div className="k-card bg-neo-white p-6 sm:p-8">{children}</div>
      </div>
    </section>
  );
}
