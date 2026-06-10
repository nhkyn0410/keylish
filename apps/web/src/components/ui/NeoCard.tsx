import type { ReactNode } from "react";

/** Card neo-brutalism: viền dày + hard shadow, góc sắc. */
export function NeoCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-4 border-black bg-neo-white p-6 shadow-neo transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}
