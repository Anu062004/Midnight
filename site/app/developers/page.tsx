import { pageMeta } from "@/lib/site";
import { Button, Container, Display, H2, Section, SectionLabel, StatusBadge } from "@/components/ui";
import { ArchitectureFlow } from "@/components/diagrams";
import { DevTabs } from "./DevTabs";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Developers",
  description: "Put privacy between your app and your model: SDK, gateway, policy API, Midnight adapter, MCP gateway.",
  path: "/developers",
});

const surfaces = [
  ["SDK", "Wrap chat calls in any stack. Scanning, policy, and receipts attach automatically.", "Coming soon"],
  ["Gateway", "One HTTPS egress with revalidation, quotas, and idempotent dispatch.", "Coming soon"],
  ["Policy API", "Publish versions, manage exceptions, read enforcement counts.", "Coming soon"],
  ["Midnight adapter", "Request receipts and verify commitments from your own tooling.", "Architecture target"],
  ["MCP gateway", "Policy-checked tool ingress and egress for agents.", "Planned"],
  ["Webhook / audit events", "delivery_started, delivery_finished, policy_published — metadata only.", "Planned"],
];

export default function DevelopersPage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">Developers</p>
          <Display className="mt-6 max-w-[14ch]">
            Put privacy between your app and your model.
          </Display>
          <div className="mt-10 grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <div className="col-span-4 md:col-span-12 lg:col-span-7">
              <DevTabs />
            </div>
            <div className="col-span-4 md:col-span-12 lg:col-span-4 lg:col-start-9">
              <SectionLabel index="Path" title="Request shape" />
              <div className="mt-6">
                <ArchitectureFlow
                  steps={[
                    { label: "Your app", detail: "Prompt you already build." },
                    { label: "Privacy SDK", detail: "Scan + policy + tokenize.", accent: true },
                    { label: "Gateway", detail: "Revalidate + dispatch once." },
                    { label: "AI provider", detail: "Sees approved context only." },
                  ]}
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="pb-16 md:pb-24">
          <Reveal>
            <SectionLabel index="Surfaces" title="Integration points" />
            <H2 className="mt-4">Build on the layer.</H2>
          </Reveal>
          <div className="mt-8 border-t border-line">
            {surfaces.map(([title, body, status]) => (
              <Reveal key={title}>
                <div className="grid grid-cols-4 items-baseline gap-3 border-b border-line py-6 md:grid-cols-12">
                  <h3 className="col-span-4 font-display text-xl font-medium tracking-tight md:col-span-3">{title}</h3>
                  <p className="col-span-4 text-muted md:col-span-6">{body}</p>
                  <p className="col-span-4 md:col-span-3 md:text-right">
                    <StatusBadge>{status}</StatusBadge>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10">
            <Button href="/docs" variant="primary">Read documentation</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
