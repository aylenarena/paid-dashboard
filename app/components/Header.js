"use client";

import { usePathname } from "next/navigation";

const NAV = [
  { href: "/leads",     label: "Lead Scoring" },
  { href: "/audiences", label: "Audience Builder" },
  { href: "/creatives", label: "Creatives Intelligence" },
  { href: "/revenue",   label: "Revenue Intelligence" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-white/[0.03] px-6 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">

        {/* Logo */}
        <a href="/" className="shrink-0 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="NEXIAL" className="h-7 w-auto" />
        </a>

        {/* Nav — solo en páginas internas */}
        {pathname !== "/" && (
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <a
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-blue-600/20 text-white"
                      : "text-[#CAD5FE]/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        )}

      </div>
    </header>
  );
}
