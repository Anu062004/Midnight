import { pageMeta } from "@/lib/site";
import { Container, Section } from "@/components/ui";

export const metadata = pageMeta({
  title: "Terms of Service",
  description: "Terms for using Bulkhead's site and early-access product. Draft template — requires legal review.",
  path: "/legal/terms",
});

const sections = [
  ["Service", "Bulkhead provides an AI privacy layer: local detection, policy enforcement, tokenization, a controlled model gateway, and verification receipts. Early-access features are marked as such and may change."],
  ["Acceptable use", "Do not use the service to exfiltrate data you are not authorized to process, to evade your organization's policies, or to misrepresent receipts as proof of things they do not establish (see Security)."],
  ["No leak-prevention guarantee", "Detection covers declared patterns. No configuration prevents all disclosure, and nothing in these terms promises otherwise. Block-by-default categories and review gates exist for exactly this reason."],
  ["Receipts", "Receipts assert that a recorded policy version and workflow were used. They do not assert that redaction was complete, that a provider deleted data, or that training excluded content."],
  ["Availability", "Early access is provided as-is, without uptime commitments. Managed deployments carry their own service terms."],
  ["Liability", "To the maximum extent permitted by law, liability is limited to fees paid in the preceding 12 months. Nothing here limits liability that cannot be limited by law."],
  ["Changes", "We may update these terms with notice. Continued use after changes take effect constitutes acceptance. This draft is dated 2026-09-12."],
];

export default function TermsPage() {
  return (
    <Section>
      <Container className="grid grid-cols-4 gap-8 pb-16 pt-12 md:grid-cols-12 md:pb-24 md:pt-20">
        <div className="col-span-4 md:col-span-12 lg:col-span-8">
          <p className="meta-label text-muted">Legal / Terms</p>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.03em]">Terms of Service.</h1>
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
