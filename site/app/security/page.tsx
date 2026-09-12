import { pageMeta } from "@/lib/site";
import { Button, Container, Display, H2, Section, SectionLabel } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Security & Privacy",
  description: "Designed around what never leaves: local processing, token vault, threat model, and honest limitations.",
  path: "/security",
});

const pillars = [
  ["Local processing", "Scanning, tokenization, and restoration run on your device or in your deployment — never as a remote inspection service."],
  ["Encryption", "Data in transit is TLS-protected; the token vault is memory-first with short expiry and no sync."],
  ["Token vault", "Request-scoped mappings, random identifiers, and explicit clearing on timeout, logout, or session end."],
  ["Minimal data collection", "We keep policy versions, counts, and commitments. Prompt bodies and mappings are not telemetry."],
  ["AI provider boundary", "Providers receive approved context only, with response-storage retrieval disabled on our calls."],
  ["Wallet security", "Midnight wallets connect through the standard connector; we never see keys, seeds, or passwords."],
  ["Midnight commitments", "Receipts bind policy version, request, and scanner — checkable without disclosing content."],
];

const protects = [
  "Accidental prompt leakage",
  "API-key exposure",
  "Unnecessary PII sharing",
  "Agent data leakage",
  "Audit-log modification",
];

const notClaimed = [
  "Compromised operating systems",
  "Malicious administrators",
  "Screenshots",
  "Users intentionally bypassing managed security",
  "Perfect semantic detection",
];

export default function SecurityPage() {
  return (
    <>
      <Section>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-muted">Security</p>
          <Display className="mt-6 max-w-[14ch]">
            Designed around what never leaves.
          </Display>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted">
            Most security pages list what they protect. This one starts with an honest sentence:
          </p>
          <p className="mt-6 max-w-[40ch] border-l-2 border-accent pl-4 font-display text-2xl font-medium tracking-tight">
            No DLP system detects 100% of sensitive data.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="pb-16 md:pb-24">
          <Reveal>
            <SectionLabel index="Mechanisms" title="How protection is built" />
          </Reveal>
          <dl className="mt-8 grid gap-px border border-line bg-line md:grid-cols-2">
            {pillars.map(([title, body]) => (
              <div key={title} className="bg-paper p-6">
                <dt className="font-display text-lg font-medium tracking-tight">{title}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-muted">{body}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section dark>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Threat model" title="Honest boundaries" dark />
            <H2 className="mt-4">What we claim — and what we don&apos;t.</H2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <Reveal>
              <p className="meta-label text-bone/50">We protect against</p>
              <ul className="mt-4 border-t border-bone/20">
                {protects.map((item) => (
                  <li key={item} className="flex items-center gap-3 border-b border-bone/20 py-3.5 text-[15px] text-bone">
                    <span aria-hidden className="font-mono text-accent">✓</span> {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="meta-label text-bone/50">We do not claim to protect against</p>
              <ul className="mt-4 border-t border-bone/20">
                {notClaimed.map((item) => (
                  <li key={item} className="flex items-center gap-3 border-b border-bone/20 py-3.5 text-[15px] text-bone/70">
                    <span aria-hidden className="font-mono text-bone/40">✕</span> {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal className="mt-10 max-w-[62ch]">
            <p className="leading-relaxed text-bone/70">
              Reduction, not elimination: Bulkhead reduces accidental sensitive-data exposure and enforces defined AI
              data policies. Detection covers declared patterns; names and implied meaning can be missed — which is
              why block-by-default categories and human review gates exist.
            </p>
          </Reveal>
          <div className="mt-10">
            <Button href="/contact" variant="accent">Discuss your threat model</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
