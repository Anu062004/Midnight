import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { Container, Divider } from "./ui";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/product" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Agents", href: "/agents" },
      { label: "Enterprise", href: "/enterprise" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Developers", href: "/developers" },
      { label: "Midnight", href: "/midnight" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="py-14 md:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-4">
            <p className="font-display text-xl font-semibold tracking-tight">{siteConfig.name}</p>
            <p className="meta-label mt-3 text-muted">
              Privacy infrastructure for AI
            </p>
            <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-muted">
              A privacy layer between company data and AI models. Detect locally, enforce policy, verify with Midnight.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={`Footer — ${col.title}`} className="col-span-1 md:col-span-2">
              <p className="meta-label text-muted">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-ink/80 hover:text-ink hover:underline underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Divider className="mb-6 mt-12" />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted">© {siteConfig.year} {siteConfig.name}. All rights reserved.</p>
          <p className="meta-label text-muted">Privacy infrastructure for AI</p>
        </div>
      </Container>
    </footer>
  );
}
