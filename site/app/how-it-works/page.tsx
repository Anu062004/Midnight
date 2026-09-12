import { pageMeta } from "@/lib/site";
import { Button, Container, Display, H2, Section, SectionLabel } from "@/components/ui";
import { HeroDemo } from "@/components/HeroDemo";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "How It Works",
  description: "What happens before your prompt reaches AI: capture, scan, classify, policy, tokenize, verify, send, restore.",
  path: "/how-it-works",
});

const steps = [
  { n: "01", title: "Capture", input: "Raw prompt, file, or agent action.", transform: "Routed into the local privacy engine.", output: "Framed request, still containing secrets." },
  { n: "02", title: "Scan", input: "Framed request.", transform: "Versioned detectors find credentials, PII, financial and client patterns.", output: "Span list with categories and offsets." },
  { n: "03", title: "Classify", input: "Detected spans.", transform: "Overlaps merged; block wins over redact over allow.", output: "One decision-ready finding set." },
  { n: "04", title: "Apply policy", input: "Findings + active policy version.", transform: "Organization rules assign allow, tokenize, redact, or block.", output: "Approved transformation plan." },
  { n: "05", title: "Tokenize / Redact", input: "Approved plan.", transform: "Values replaced with request-scoped placeholders; vault sealed locally.", output: "Safe prompt + sealed local map." },
  { n: "06", title: "Verify", input: "Safe prompt + policy version.", transform: "Commitments computed; receipt recorded via Midnight.", output: "Request 0x82A9…91F2 · VERIFIED." },
  { n: "07", title: "Send", input: "Safe prompt + frozen approval.", transform: "Gateway revalidates bytes, then dispatches once.", output: "Model sees placeholders only." },
  { n: "08", title: "Restore", input: "Model response.", transform: "Rescanned; permitted placeholders restored for display only.", output: "Human-readable answer, sanitized history." },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">How it works</p>
          <Display className="mt-6 max-w-[15ch]">
            What happens before your prompt reaches AI?
          </Display>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
            Eight steps, all before transmission. Read them once and you understand the whole product.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="pb-16 md:pb-24">
          <ol className="border-t border-line">
            {steps.map((step) => (
              <li key={step.n} className="grid grid-cols-4 gap-4 border-b border-line py-8 md:grid-cols-12 md:py-10">
                <Reveal className="col-span-4 md:col-span-4">
                  <p className="meta-label text-muted">{step.n}</p>
                  <h2 className="mt-2 font-display text-3xl font-medium leading-[1.0] tracking-[-0.025em] md:text-4xl">{step.title}</h2>
                </Reveal>
                <Reveal delay={0.05} className="col-span-4 md:col-span-8">
                  <dl className="grid gap-4 sm:grid-cols-3">
                    {[
                      ["Input", step.input],
                      ["Transformation", step.transform],
                      ["Output", step.output],
                    ].map(([k, v]) => (
                      <div key={k} className="border border-line p-4">
                        <dt className="meta-label text-muted">{k}</dt>
                        <dd className="mt-2 text-[15px] leading-relaxed">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section dark>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Full pass" title="Watch it run" dark />
            <H2 className="mt-4">One animated workflow.</H2>
          </Reveal>
          <Reveal className="mt-10">
            <HeroDemo />
          </Reveal>
          <div className="mt-10">
            <Button href="/agents" variant="dark">Next: agent security</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
