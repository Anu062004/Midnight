"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { navProduct, navSolutions, siteConfig } from "@/lib/site";
import { cn } from "@/lib/cn";

function Dropdown({ label, items, onNavigate }: { label: string; items: readonly { label: string; href: string }[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 py-2 text-sm font-medium text-ink/80 hover:text-ink"
      >
        {label}
        <ChevronDown size={14} aria-hidden className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-60 max-w-[calc(100vw-2.5rem)] border border-line bg-paper py-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                setOpen(false);
                onNavigate();
              }}
              className="block px-4 py-2.5 text-sm text-ink/80 hover:bg-ink/[0.04] hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const directLinks = [
  { label: "Developers", href: "/developers" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
];

const mobileGroups = [
  { title: "Product", links: [...navProduct] },
  { title: "Solutions", links: [...navSolutions] },
  { title: "Company", links: [
    { label: "Developers", href: "/developers" },
    { label: "Security", href: "/security" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ]},
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-[6px]">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-6 px-5 md:px-10 xl:px-[80px]">
        <Link href="/" onClick={close} className="flex items-center gap-2.5" aria-label={`${siteConfig.name} home`}>
          <span aria-hidden className="grid h-7 w-7 place-items-center bg-ink font-display text-sm font-semibold text-paper">
            B
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          <Dropdown label="Product" items={navProduct} onNavigate={close} />
          <Dropdown label="Solutions" items={navSolutions} onNavigate={close} />
          {directLinks.map((l) => (
            <Link key={l.label} href={l.href} className="py-2 text-sm font-medium text-ink/80 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/docs" className="px-2 py-2 text-sm font-medium text-ink/80 hover:text-ink">
            Docs
          </Link>
          <a
            href={siteConfig.appUrl}
            target="_blank"
            rel="noreferrer"
            title="Open the local workspace app (run npm start in the repo root first)"
            className="inline-flex min-h-[40px] items-center gap-1 rounded-md border border-line px-4 text-sm font-medium transition-colors hover:border-ink"
          >
            Launch App <ArrowUpRight size={14} aria-hidden />
          </a>
          <Link
            href="/contact"
            className="inline-flex min-h-[40px] items-center rounded-md bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-soot"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center lg:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      {mobileOpen && (
        <nav aria-label="Mobile" className="border-t border-line bg-paper lg:hidden">
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            {mobileGroups.map((group) => (
              <div key={group.title} className="border-b border-line py-3 last:border-0">
                <p className="meta-label text-muted">{group.title}</p>
                <ul className="mt-1">
                  {group.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} onClick={close} className="block py-2.5 text-[15px] font-medium">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link
              href="/contact"
              onClick={close}
              className="mt-4 flex min-h-[48px] items-center justify-center rounded-md bg-ink font-medium text-paper"
            >
              Get Started
            </Link>
            <a
              href={siteConfig.appUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-[48px] items-center justify-center gap-1.5 rounded-md border border-line font-medium"
            >
              Launch App <ArrowUpRight size={16} aria-hidden />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
