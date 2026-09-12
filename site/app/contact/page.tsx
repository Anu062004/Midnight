import { pageMeta } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { ContactForm } from "./ContactForm";

export const metadata = pageMeta({
  title: "Contact",
  description: "Talk to us about secure AI adoption. Request a demo of the AI privacy firewall.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Section>
      <Container className="grid grid-cols-4 gap-10 pb-16 pt-12 md:grid-cols-12 md:pb-24 md:pt-20">
        <div className="col-span-4 md:col-span-12 lg:col-span-5">
          <p className="meta-label text-muted">Contact</p>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.03em]">
            Talk to us about secure AI adoption.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted">
            Tell us what you&apos;re protecting and how your teams use AI today. We reply within two business days.
          </p>
          <dl className="mt-10 space-y-4 border-t border-line pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="min-w-0 shrink-0 text-muted">Email</dt>
              <dd className="min-w-0 break-all text-right font-mono">hello@bulkhead.ai</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="min-w-0 shrink-0 text-muted">Response time</dt>
              <dd className="min-w-0 text-right">2 business days</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="min-w-0 shrink-0 text-muted">Starting point</dt>
              <dd className="min-w-0 text-right">30-minute technical walkthrough</dd>
            </div>
          </dl>
        </div>
        <div className="col-span-4 md:col-span-12 lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </Container>
    </Section>
  );
}
