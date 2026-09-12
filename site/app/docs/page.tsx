import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pageMeta, siteConfig } from "@/lib/site";
import { Button, Container, Display, Section } from "@/components/ui";
import { docGroups } from "@/data/docs";

export const metadata = pageMeta({
  title: "Documentation",
  description: "Guides and reference for the privacy engine, AI gateway, agents, Midnight verification, and configuration.",
  path: "/docs",
});

export default function DocsPage() {
  return (
    <Section>
      <Container className="pb-16 pt-12 md:pb-24 md:pt-20">
        <p className="meta-label text-muted">Docs</p>
        <Display className="mt-6">Documentation.</Display>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
          Guides and reference. Start with Getting Started; come back for the engine details. The Workspace App
          section documents the working product in this repository.
        </p>
        <div className="mt-8 flex flex-col gap-4 border border-line p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="meta-label text-muted">Run it locally</p>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed">
              <code className="font-mono text-sm">npm start</code> in the repo root, then open the workspace to try
              the documented workflow with synthetic content.
            </p>
          </div>
          <Button href={siteConfig.appUrl} external variant="primary" className="shrink-0">
            Launch App <ArrowUpRight size={16} aria-hidden />
          </Button>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <nav aria-label="Documentation sections" className="lg:col-span-3">
            <ul className="space-y-6 lg:sticky lg:top-24">
              {docGroups.map((group) => (
                <li key={group.title}>
                  <p className="meta-label text-muted">{group.title}</p>
                  <ul className="mt-2 space-y-1">
                    {group.entries.map((entry) => (
                      <li key={entry.slug}>
                        <Link href={`#${entry.slug}`} className="block py-1 text-sm text-ink/80 hover:text-ink hover:underline underline-offset-4">
                          {entry.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
          <div className="lg:col-span-8 lg:col-start-5">
            {docGroups.map((group) => (
              <div key={group.title} className="mb-12">
                <h2 className="font-display text-2xl font-medium tracking-tight">{group.title}</h2>
                <div className="mt-6 space-y-10">
                  {group.entries.map((entry) => (
                    <article key={entry.slug} id={entry.slug} className="scroll-mt-24 border-t border-line pt-6">
                      <h3 className="font-display text-xl font-medium tracking-tight">{entry.title}</h3>
                      {entry.body.map((para, i) => (
                        <p key={i} className="mt-3 max-w-[68ch] leading-relaxed text-muted">{para}</p>
                      ))}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
