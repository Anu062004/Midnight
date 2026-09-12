import type { Metadata } from "next";

export const siteConfig = {
  name: "Bulkhead",
  tagline: "AI Privacy Firewall",
  domain: "bulkhead.ai",
  url: "https://bulkhead.ai",
  description:
    "Protect sensitive company data before it reaches AI models and agents. Enforce privacy policies locally and generate verifiable protection receipts.",
  year: 2026,
  /** Local workspace application. Baked at build time from NEXT_PUBLIC_APP_URL; defaults to the repo server. */
  appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://127.0.0.1:3000",
} as const;

export function pageMeta({
  title,
  description,
  path = "/",
}: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  const fullTitle = `${title} — ${siteConfig.name}`;
  const desc = description ?? siteConfig.description;
  const url = `${siteConfig.url}${path}`;
  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
  };
}

export const navProduct = [
  { label: "Overview", href: "/product" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "AI Gateway", href: "/product#gateway" },
  { label: "Policy Engine", href: "/product#policy" },
  { label: "Local Protection", href: "/product#local" },
  { label: "Midnight Verification", href: "/midnight" },
] as const;

export const navSolutions = [
  { label: "For Employees", href: "/enterprise#teams" },
  { label: "For AI Agents", href: "/agents" },
  { label: "For Developers", href: "/developers" },
  { label: "For Enterprise", href: "/enterprise" },
] as const;
