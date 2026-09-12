import { pageMeta } from "@/lib/site";
import { Button, Container, Display, Section, SectionLabel } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Pricing",
  description: "Start free in early access. Team and enterprise plans for shared policies, audit controls, and agent security.",
  path: "/pricing",
});

const tiers = [
  {
    name: "Developer",
    price: "Free",
    note: "For testing and small projects.",
    features: ["Local privacy engine", "Default policy pack", "Single workspace", "Community docs"],
    cta: "Start building",
    featured: false,
  },
  {
    name: "Team",
    price: "Contact us",
    note: "For shared policies and team usage.",
    features: ["Everything in Developer", "Organization policies", "Member roles", "Shared audit activity"],
    cta: "Contact us",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    note: "For managed deployment, audit controls, and agent security.",
    features: ["Everything in Team", "SSO and role policies", "Private model routing", "Midnight receipt verification", "Managed deployment"],
    cta: "Contact us",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">Pricing / Early access</p>
          <Display className="mt-6 max-w-[12ch]">Simple pricing, early days.</Display>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
            The product is in early access. Developer is free; team and enterprise are scoped conversations, not
            checkout buttons.
          </p>
        </Container>
      </Section>
      <Section>
        <Container className="pb-16 md:pb-24">
          <div className="grid gap-px border border-line bg-line md:grid-cols-3">
            {tiers.map((tier) => (
              <Reveal key={tier.name} className={tier.featured ? "bg-ink text-paper" : "bg-paper"}>
                <div className="flex h-full flex-col p-6 md:p-8">
                  <p className={`meta-label ${tier.featured ? "text-paper/60" : "text-muted"}`}>{tier.name}</p>
                  <p className="mt-4 font-display text-4xl font-medium tracking-tight">{tier.price}</p>
                  <p className={`mt-2 text-sm ${tier.featured ? "text-paper/70" : "text-muted"}`}>{tier.note}</p>
                  <ul className={`mt-6 space-y-2.5 border-t pt-6 text-[15px] ${tier.featured ? "border-paper/20" : "border-line"}`}>
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span aria-hidden className={tier.featured ? "text-accent" : ""}>—</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Button href="/contact" variant={tier.featured ? "accent" : "secondary"} className="w-full">
                      {tier.cta}
                    </Button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 max-w-[62ch]">
            <SectionLabel index="Note" title="No per-secret billing" />
            <h2 className="mt-4 font-display text-2xl font-medium leading-[1.0] tracking-[-0.025em] md:text-3xl">We don&apos;t charge per detected secret.</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Detection counts don&apos;t map to customer value. Plans follow workspaces and usage — protected
              requests, seats, and deployment — once generally available.
            </p>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
