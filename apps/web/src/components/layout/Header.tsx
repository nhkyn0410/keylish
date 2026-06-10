import Link from "next/link";

const navItems = [
  { label: "Gõ từ vựng", href: "/typing" },
  { label: "Kho từ vựng", href: "/vocab" },
  { label: "Cài đặt", href: "/settings" },
];

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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-4 border-transparent px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all duration-100 hover:border-black hover:bg-neo-violet hover:shadow-neo-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
