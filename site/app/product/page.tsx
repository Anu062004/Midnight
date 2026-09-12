import { pageMeta } from "@/lib/site";
import { Button, Container, Display, Divider, FeatureRow, H2, Section, SectionLabel } from "@/components/ui";
import { ArchitectureFlow } from "@/components/diagrams";
import { SiteImage } from "@/components/SiteImage";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Product Overview",
  description: "The control layer for enterprise AI: local detection, policy engine, token vault, AI gateway, and verifiable receipts.",
  path: "/product",
});

const sections = [
  { id: "local", n: "01", title: "Input protection", body: "Every prompt, file, and agent action enters through one boundary. Nothing reaches a model without passing the layer first." },
  { id: "detect", n: "02", title: "Local detection", body: "Credentials, PII, financial figures, customer data, and internal context are found on-device with versioned scanners — no content sent for analysis." },
  { id: "policy", n: "03", title: "Policy engine", body: "Versioned organization rules decide per category: allow, tokenize, redact, or block. Changes publish as new versions; history is immutable." },
  { id: "vault", n: "04", title: "Token vault", body: "Sensitive values map to placeholders scoped to a single request. The vault lives locally, expires fast, and never syncs." },
  { id: "gateway", n: "05", title: "AI gateway", body: "One controlled egress to any model. Payloads are revalidated against the frozen approval before dispatch; retries can't double-send." },
  { id: "output", n: "06", title: "Output protection", body: "Model responses are rescanned before display. Permitted placeholders restore for the human reader only — history keeps the sanitized form." },
  { id: "receipts", n: "07", title: "Audit receipts", body: "Each protected request emits a commitment-based receipt to Midnight: policy version, request binding, scanner version, timestamp. Metadata only." },
];

export default function ProductPage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">Product / Overview</p>
          <Display className="mt-6 max-w-[14ch]">
            The control layer for enterprise AI.
          </Display>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
            Seven mechanisms, one boundary. Bulkhead sits between your people and agents on one side and external AI
            models on the other — and proves it did its job.
          </p>
        </Container>
      </Section>

      <Section dark>
        <Container className="py-14 md:py-20">
          <Reveal>
            <SectionLabel index="Architecture" title="Request path" dark />
            <div className="mt-8 grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-10">
              <div className="col-span-4 md:col-span-12 lg:col-span-7">
                <ArchitectureFlow
                  dark
                  steps={[
                    { label: "User / Agent", detail: "Prompt, file, or tool action." },
                    { label: "Local privacy engine", detail: "Scanner · Policy engine · Token vault.", accent: true },
                    { label: "Safe request", detail: "Only approved context continues." },
                    { label: "Midnight receipt", detail: "Commitments recorded in parallel." },
                    { label: "AI gateway", detail: "Revalidated, then dispatched." },
                    { label: "AI model", detail: "Sees placeholders, never secrets." },
                    { label: "Output scanner + local restore", detail: "Rescanned response, human-only restore." },
                  ]}
                />
              </div>
              <div className="col-span-4 md:col-span-12 lg:col-span-4 lg:col-start-9">
                <p className="meta-label text-bone/50">Design rules</p>
                <ul className="mt-4 space-y-4 text-[15px] leading-relaxed text-bone/75">
                  <li><strong className="font-medium text-bone">Policy before inference.</strong> No approval, no dispatch.</li>
                  <li><strong className="font-medium text-bone">Originals stay local.</strong> The vault never syncs or logs.</li>
                  <li><strong className="font-medium text-bone">Receipts, not content.</strong> Midnight sees commitments only.</li>
                  <li><strong className="font-medium text-bone">Fail closed.</strong> Unknown detectors, expired approvals, and outages block rather than leak.</li>
                </ul>
                <div className="mt-8">
                  <Button href="/how-it-works" variant="dark">See each step</Button>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Console" title="Operations view" />
            <H2 className="mt-4">See every enforcement.</H2>
          </Reveal>
          <Reveal className="mt-10">
            <SiteImage slot="product-console" fig="FIG. 01" />
          </Reveal>
        </Container>
      </Section>

      <Container>
        <Divider />
      </Container>

      <Section>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Components" title="Seven mechanisms" />
            <H2 className="mt-4">What the layer is made of.</H2>
          </Reveal>
          <div className="mt-8">
            {sections.map((s) => (
              <div key={s.id} id={s.id} className="scroll-mt-24">
                <Reveal>
                  <FeatureRow index={s.n} title={s.title} body={s.body} />
                </Reveal>
              </div>
            ))}
            <div className="border-b border-line" aria-hidden />
          </div>
        </Container>
      </Section>

      <Container>
        <Divider />
      </Container>

      <Section>
        <Container className="flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center md:py-20">
          <H2 className="max-w-[16ch]">Put the layer in front of your AI.</H2>
          <Button href="/contact" variant="accent">Request Demo</Button>
        </Container>
      </Section>
    </>
  );
}
