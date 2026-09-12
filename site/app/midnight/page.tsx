import { pageMeta } from "@/lib/site";
import { Button, Container, Display, H2, Section, SectionLabel } from "@/components/ui";
import { ArchitectureFlow, ReceiptCard } from "@/components/diagrams";
import { SiteImage } from "@/components/SiteImage";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Midnight Verification",
  description: "Privacy enforcement you can verify: Midnight records commitments and receipts — never prompts, secrets, or mappings.",
  path: "/midnight",
});

export default function MidnightPage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">Verification / Midnight</p>
          <Display className="mt-6 max-w-[14ch]">
            Privacy enforcement you can verify.
          </Display>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted">
            Detection and sanitizing happen in our privacy engine. Midnight does one job: prove the approved
            workflow ran — without ever seeing the confidential content.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="pb-16 md:pb-24">
          <div className="grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <Reveal className="col-span-4 md:col-span-6">
              <div className="border border-line p-6 md:p-8">
                <p className="meta-label text-muted">Midnight does not</p>
                <ul className="mt-4 space-y-3 text-[15px]">
                  {["Scan prompts", "Detect PII", "Call AI models", "Understand natural language"].map((i) => (
                    <li key={i} className="flex items-center gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                      <span aria-hidden className="font-mono text-muted">✕</span> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.05} className="col-span-4 md:col-span-6">
              <div className="border border-ink bg-ink p-6 text-paper md:p-8">
                <p className="meta-label text-paper/60">Midnight does</p>
                <ul className="mt-4 space-y-3 text-[15px]">
                  {["Verify policy commitments", "Record protection receipts", "Provide tamper-resistant audit history", "Enable selective disclosure"].map((i) => (
                    <li key={i} className="flex items-center gap-3 border-b border-paper/15 pb-3 last:border-0 last:pb-0">
                      <span aria-hidden className="font-mono text-accent">✓</span> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section dark>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Separation" title="Private vs verifiable" dark />
          </Reveal>
          <div className="mt-8 grid gap-px border border-bone/20 bg-bone/20 md:grid-cols-2">
            <div className="bg-coal p-6 md:p-10">
              <p className="meta-label text-bone/50">Private — stays local</p>
              <ul className="mt-5 space-y-3 font-mono text-sm text-bone/85">
                <li>Prompt</li>
                <li>Secrets</li>
                <li>Mappings</li>
                <li>Response</li>
              </ul>
              <p className="mt-6 font-mono text-sm text-bone/50">↓ Local</p>
            </div>
            <div className="bg-coal p-6 md:p-10">
              <p className="meta-label text-bone/50">Verifiable — on Midnight</p>
              <ul className="mt-5 space-y-3 font-mono text-sm text-bone/85">
                <li>Policy hash</li>
                <li>Request commitment</li>
                <li>Receipt</li>
                <li>Version</li>
              </ul>
              <p className="mt-6 font-mono text-sm text-accent">↓ Midnight</p>
            </div>
          </div>
          <Reveal className="mt-10 max-w-xl">
            <ReceiptCard dark />
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container className="py-16 md:py-24">
          <div className="grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <div className="col-span-4 md:col-span-12 lg:col-span-6">
              <Reveal>
                <SectionLabel index="Why" title="Why not a normal database?" />
                <H2 className="mt-4">Logs ask for trust. Receipts don&apos;t.</H2>
              </Reveal>
            </div>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <Reveal>
              <div className="border border-line p-6 md:p-8">
                <p className="meta-label text-muted">Traditional logs</p>
                <p className="mt-4 font-display text-2xl font-medium tracking-tight">Company says: “Trust our logs.”</p>
                <p className="mt-4 leading-relaxed text-muted">
                  Centralized, editable, and usually stuffed with the very content they were meant to protect. An
                  auditor sees either everything or nothing.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="border border-line border-l-2 border-l-accent p-6 md:p-8">
                <p className="meta-label text-muted">Midnight</p>
                <p className="mt-4 font-display text-2xl font-medium tracking-tight">Independent verification without publishing confidential content.</p>
                <p className="mt-4 leading-relaxed text-muted">
                  Commitments are tamper-resistant and checkable by third parties, while selective disclosure reveals
                  only what a specific review requires.
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal className="mt-12">
            <SectionLabel index="Pipeline" title="Technical shape" />
            <div className="mt-6 max-w-3xl">
              <ArchitectureFlow
                steps={[
                  { label: "Enforcement", detail: "Policy version + scanner version bound to the request." },
                  { label: "Commitment", detail: "Hash of the approved envelope with fresh randomness." },
                  { label: "Midnight record", detail: "Receipt anchored; status trackable to confirmation." },
                  { label: "Selective disclosure", detail: "Reveal policy or timing to a reviewer — never content.", accent: true },
                ]}
              />
            </div>
          </Reveal>
          <div className="mt-12">
            <Reveal>
              <SectionLabel index="Record" title="The verifiable record" />
            </Reveal>
            <Reveal className="mt-8">
              <SiteImage slot="midnight-record" fig="FIG. 01" />
            </Reveal>
          </div>
          <div className="mt-12">
            <Button href="/security" variant="primary">Read the security model</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
