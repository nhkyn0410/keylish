import Link from "next/link";

const navItems = [
  { label: "Gõ từ vựng", href: "/typing" },
  { label: "Kho từ vựng", soon: true },
  { label: "Cài đặt", soon: true },
] as const;

export function Header() {
  return (
    <header className="border-b-4 border-black bg-neo-bg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center">
          <span className="border-4 border-black bg-neo-yellow px-3 py-1 text-xl font-black uppercase tracking-tight shadow-neo-sm">
            KeyLish
          </span>
        </Link>
        <nav className="hidden gap-2 sm:flex">
          {navItems.map((item) =>
            "href" in item ? (
              <Link
                key={item.label}
                href={item.href}
                className="border-4 border-transparent px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-100 hover:border-black hover:bg-neo-violet hover:shadow-neo-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                title="Sắp ra mắt"
                className="inline-flex cursor-not-allowed items-center gap-2 border-4 border-transparent px-3 py-2 text-sm font-bold uppercase tracking-wide text-neo-ink/40"
              >
                {item.label}
                <span className="border-2 border-black bg-neo-violet px-1.5 py-0.5 text-[10px] font-black uppercase text-neo-ink">
                  Sắp có
                </span>
              </span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
