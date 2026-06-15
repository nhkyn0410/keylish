import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "info" | "danger" | "outline";

const variantClass: Record<Variant, string> = {
  primary: "bg-neo-yellow", // CTA chính
  info: "bg-neo-violet", // phụ / info
  danger: "bg-neo-red", // hành động xóa
  outline: "bg-neo-white",
};

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/**
 * Nút keycap neo-brutalism: viền dày, hard shadow, "nhấn xuống" khi active.
 * Trình bày thuần — onClick chỉ truyền từ trong Client Component.
 */
export function NeoButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: NeoButtonProps) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center border-4 border-black px-5 text-sm font-bold uppercase tracking-wide shadow-neo-sm transition-all duration-100 hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
