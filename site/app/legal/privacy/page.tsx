import { pageMeta } from "@/lib/site";
import { Container, Section } from "@/components/ui";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description: "How Bulkhead handles personal data. Draft template — requires legal review.",
  path: "/legal/privacy",
});

const sections = [
  ["Scope", "This draft covers the marketing site and the early-access product. It describes data handling principles, not final legal commitments. Requires legal review before any launch."],
  ["What we collect", "Contact details you submit (name, work email, company, message). Product metadata needed to operate the service: policy versions, enforcement counts, receipt commitments. We do not collect prompt bodies, token mappings, or restored values as telemetry."],
  ["What never leaves your device", "In local-first deployments, raw prompts, secrets, client names, and token vault contents stay local. They are not analytics, not crash-report fields, and not log fields."],
  ["AI providers", "Providers receive only approved, sanitized context. Response-storage retrieval is disabled on our calls. Provider-side retention is governed by the provider's terms — sanitization is why that exposure is minimized."],
  ["Midnight receipts", "Receipts contain commitments, versions, statuses, and timestamps. They are designed to be safe to retain and, where anchored, impossible to delete — retention applies to proofs, never to content."],
  ["Retention and deletion", "Metadata retention is configurable per organization (1–365 days in current builds). Local session data expires on timeout, logout, or explicit clearing."],
  ["Your rights", "Request access, correction, or deletion of your contact and account data via hello@bulkhead.ai. Receipts anchored to a ledger cannot be deleted; they contain no personal content by design."],
  ["Changes", "Material changes will be noted here with a revision date. This draft is dated 2026-09-12."],
];

export default function PrivacyPage() {
  return (
    <Section>
      <Container className="grid grid-cols-4 gap-8 pb-16 pt-12 md:grid-cols-12 md:pb-24 md:pt-20">
        <div className="col-span-4 md:col-span-12 lg:col-span-8">
          <p className="meta-label text-muted">Legal / Privacy</p>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.03em]">Privacy Policy.</h1>
          <p className="mt-4 inline-block rounded border border-line px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Draft template — requires legal review
          </p>
          <div className="mt-10 space-y-0 border-t border-line">
            {sections.map(([title, body]) => (
              <div key={title} className="grid grid-cols-4 gap-3 border-b border-line py-6 md:grid-cols-12">
                <h2 className="col-span-4 font-display text-lg font-medium tracking-tight md:col-span-3">{title}</h2>
                <p className="col-span-4 leading-relaxed text-muted md:col-span-9">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
