import Link from "next/link";
import { Container, Section } from "@/components/ui";

export default function NotFound() {
  return (
    <Section>
      <Container className="pb-24 pt-16 md:pb-32 md:pt-24">
        <p className="meta-label text-muted">404 / Not found</p>
        <p className="mt-6 font-display text-[clamp(4rem,10vw,9rem)] font-medium leading-[0.9] tracking-[-0.03em]">
          Nothing here.
        </p>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
          The page you asked for doesn&apos;t exist or moved. The sensitive part, at least, stayed local.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-ink bg-ink px-6 font-medium text-paper hover:bg-soot"
          >
            Back home
          </Link>
          <Link
            href="/docs"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-line px-6 font-medium hover:border-ink"
          >
            Browse docs
          </Link>
        </div>
      </Container>
    </Section>
  );
}
