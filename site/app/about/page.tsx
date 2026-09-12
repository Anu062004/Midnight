import { pageMeta } from "@/lib/site";
import { Button, Container, Display, Divider, H2, Section, SectionLabel } from "@/components/ui";
import { SiteImage } from "@/components/SiteImage";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "About",
  description: "AI adoption shouldn't require surrendering data control. We build local-first, verifiable privacy infrastructure.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">About</p>
          <Display className="mt-6 max-w-[16ch]">
            AI adoption shouldn&apos;t require surrendering data control.
          </Display>
        </Container>
      </Section>
      <Section>
        <Container className="grid grid-cols-4 gap-8 pb-16 md:grid-cols-12 md:pb-24">
          <Reveal className="col-span-4 md:col-span-12 lg:col-span-5">
            <SectionLabel index="Mission" title="Why we exist" />
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Companies want the leverage of AI; security teams need control over what leaves the building. Those
              should not be in conflict. We build the layer that resolves it: detect locally, enforce policy,
              verify without exposing.
            </p>
          </Reveal>
          <div className="col-span-4 md:col-span-12 lg:col-span-6 lg:col-start-7">
            {[
              ["Privacy", "Sensitive values stay where they started. The product is designed around what never leaves."],
              ["AI infrastructure", "A serious control plane: versioned policy, controlled egress, quotas, audit — boring in the best way."],
              ["Verifiable security", "Claims backed by checkable receipts, not slogans. Pending is shown as pending."],
              ["Local-first design", "The strongest privacy guarantee is architectural: data that never moves can't leak in transit."],
            ].map(([title, body], i) => (
              <Reveal key={title}>
                <div className="grid grid-cols-4 gap-4 border-t border-line py-6 md:grid-cols-12">
                  <p className="meta-label col-span-1 text-muted">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="col-span-3 font-display text-xl font-medium tracking-tight md:col-span-3">{title}</h2>
                  <p className="col-span-4 leading-relaxed text-muted md:col-span-8 md:col-start-5">{body}</p>
                </div>
              </Reveal>
            ))}
            <div className="border-b border-line" aria-hidden />
          </div>
        </Container>
      </Section>

      <Container>
        <Divider />
      </Container>

      <Section>
        <Container className="grid grid-cols-4 gap-8 py-16 md:grid-cols-12 md:gap-8 md:py-24">
          <Reveal className="col-span-4 md:col-span-12 lg:col-span-5">
            <SectionLabel index="Studio" title="Where it is built" />
            <H2 className="mt-4">A small team, a review culture.</H2>
            <p className="mt-6 max-w-[44ch] leading-relaxed text-muted">
              Every claim on this site maps to something checkable: a test, a receipt, or a documented limit.
              That habit starts in the room where the work happens.
            </p>
          </Reveal>
          <Reveal delay={0.05} className="col-span-4 md:col-span-12 lg:col-span-6 lg:col-start-7">
            <SiteImage slot="about-workspace" fig="FIG. 01" />
          </Reveal>
        </Container>
      </Section>

      <Section dark>
        <Container className="py-16 md:py-24">
          <Reveal>
            <H2 className="max-w-[20ch]">Built in the open, reviewed honestly.</H2>
            <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-bone/70">
              We publish our threat model, our limitations, and our scanner boundaries. No invented team members, no
              invented investors, no invented customers — just the system and what it provably does.
            </p>
            <div className="mt-8">
              <Button href="/contact" variant="accent">Talk to us</Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
