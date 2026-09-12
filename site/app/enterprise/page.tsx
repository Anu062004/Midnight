import { pageMeta } from "@/lib/site";
import { Button, Container, Display, H2, Section, SectionLabel } from "@/components/ui";
import { PolicyTable } from "@/components/diagrams";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Enterprise",
  description: "Set one AI policy and enforce it everywhere: organization policies, model routing, team rules, audit receipts, SSO.",
  path: "/enterprise",
});

export default function EnterprisePage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">Solutions / Enterprise</p>
          <Display className="mt-6 max-w-[14ch]">
            Set one AI policy. Enforce it everywhere.
          </Display>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
            Policies by organization, team, and role. Approved model routing. Tamper-resistant audit receipts.
            Deployment you control.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/contact" variant="primary" className="w-full sm:w-auto">Talk to us</Button>
            <Button href="/security" variant="secondary" className="w-full sm:w-auto">Review the threat model</Button>
          </div>
        </Container>
      </Section>

      <Section>
        <Container id="teams" className="scroll-mt-24 pb-16 md:pb-24">
          <Reveal>
            <SectionLabel index="Example" title="Company policy, as code and as prose" />
            <H2 className="mt-4">One policy, every team.</H2>
          </Reveal>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Reveal>
              <PolicyTable
                title="Engineering"
                rows={[
                  { rule: "Public code", decision: "ALLOW" },
                  { rule: "Private repository", decision: "APPROVED MODELS ONLY", note: "Company model or approved vendors" },
                  { rule: "Credentials", decision: "BLOCK" },
                ]}
              />
            </Reveal>
            <Reveal delay={0.05}>
              <PolicyTable
                title="Finance"
                rows={[
                  { rule: "Financial results", decision: "PRIVATE MODEL ONLY" },
                  { rule: "Bank information", decision: "BLOCK" },
                  { rule: "Vendor names", decision: "TOKENIZE", note: "Placeholders, restored locally" },
                ]}
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section dark>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Controls" title="Enterprise surface" dark />
          </Reveal>
          <dl className="mt-8 grid gap-px border border-bone/20 bg-bone/20 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Organization policies", "Versioned, immutable history. Owners publish; members inherit."],
              ["Approved model routing", "Route categories to approved vendors or your private model."],
              ["Team rules", "Engineering, finance, support — each with its own defaults."],
              ["Role-based policies", "Owners, members, agents: different allowances, one engine."],
              ["Audit receipts", "Every enforcement provable via Midnight commitments."],
              ["Security analytics", "Blocked-category counts and policy drift — metadata only, never content."],
              ["Managed deployment", "Run the gateway in your VPC or ours."],
              ["SSO", "Company identity for membership and approvals."],
              ["Private model routing", "The strictest categories never leave your infrastructure."],
            ].map(([title, body]) => (
              <div key={title} className="bg-coal p-6">
                <dt className="font-display text-lg font-medium tracking-tight text-bone">{title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-bone/65">{body}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button href="/contact" variant="accent" className="w-full sm:w-auto">Request Demo</Button>
            <Button href="/midnight" variant="dark" className="w-full sm:w-auto">How verification works</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
