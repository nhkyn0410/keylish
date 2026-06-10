import type { ReactNode } from "react";

/** Badge/sticker neo-brutalism. */
export function NeoBadge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-black uppercase tracking-widest shadow-neo-sm ${className}`}
    >
      {children}
    </span>
  );
}
