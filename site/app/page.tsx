import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMeta } from "@/lib/site";
import { Button, Container, Display, Divider, FeatureRow, H2, Section, SectionLabel, Stat, StatusBadge, TextLink } from "@/components/ui";
import { ArchitectureFlow, ReceiptCard } from "@/components/diagrams";
import { SiteImage } from "@/components/SiteImage";
import { CodeBlock } from "@/components/CodeBlock";
import { HeroDemo } from "@/components/HeroDemo";
import { LaunchAppButton } from "@/components/LaunchApp";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Privacy Firewall for AI",
  path: "/",
});

const trustItems = ["Local-first", "Policy-driven", "Model-agnostic", "Agent-ready", "Verifiable"];

const problemExamples = ["API credentials", "Customer records", "Contracts", "Internal code", "Payroll", "Financial data", "Private documents"];

const capabilities = [
  { n: "01", title: "Sensitive Data Detection", body: "Find credentials, PII, customer data, and sensitive financial context before anything is transmitted.", motif: "secrets · pii · financial" },
  { n: "02", title: "Local Tokenization", body: "Replace sensitive values with placeholders. Originals never leave the device or the vault.", motif: "[CLIENT_1] → local only" },
  { n: "03", title: "Organization Policies", body: "Versioned rules per team and role. Allow, tokenize, redact, or block — enforced on every request.", motif: "allow · redact · block" },
  { n: "04", title: "AI Gateway", body: "One controlled path to any model. Approved context in, scanned output out, every call logged as metadata.", motif: "single egress" },
  { n: "05", title: "Agent / MCP Firewall", body: "Inspect agent tool calls and MCP requests before they execute. Rewrite or block unsafe actions.", motif: "action → policy → tool" },
  { n: "06", title: "Midnight Verification", body: "Tamper-resistant receipts prove which policy version protected each request — without storing content.", motif: "commitment ≠ content" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <Section>
        <Container className="pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <div className="col-span-4 md:col-span-12 lg:col-span-5">
              <p className="meta-label text-muted">AI privacy infrastructure / 2026</p>
              <Display className="mt-6">
                Use AI.
                <br />
                Keep the sensitive part yours.
              </Display>
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
                Protect sensitive company information before it reaches AI models and agents. Enforce data policies
                locally, send only the safe context, and verify protection with privacy-preserving receipts.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/contact" variant="accent" className="sm:w-auto w-full">
                  Start protecting
                </Button>
                <Button href="/how-it-works" variant="secondary" className="sm:w-auto w-full">
                  See how it works <ArrowRight size={16} aria-hidden />
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted">Works with AI models, agents and MCP workflows.</p>
              <p className="mt-2 text-sm">
                <LaunchAppButton tone="link" />
              </p>
            </div>
            <div className="col-span-4 md:col-span-12 lg:col-span-7">
              <HeroDemo />
            </div>
          </div>
        </Container>
      </Section>

      {/* TRUST STRIP */}
      <div className="border-y border-line bg-paper">
        <Container>
          <ul className="grid grid-cols-2 gap-y-3 py-4 md:grid-cols-5" aria-label="Product principles">
            {trustItems.map((item) => (
              <li key={item} className="meta-label flex items-center gap-2 text-ink">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-ink" />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </div>

      {/* 01 PROBLEM */}
      <Section>
        <Container className="py-16 md:py-28">
          <Reveal>
            <SectionLabel index="01" title="The problem" />
            <H2 className="mt-4 max-w-[16ch]">
              AI became easy to use.
              <br />
              Data governance did not.
            </H2>
          </Reveal>
          <div className="mt-10 grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <div className="col-span-4 md:col-span-5">
              <Reveal>
                <p className="max-w-[48ch] text-lg leading-relaxed text-muted">
                  Employees paste customer details, contracts, source code, and credentials into AI tools every day.
                  Agents do it faster, at machine scale, through email, tickets, and MCP tools. Each paste moves
                  sensitive data outside your organization&apos;s control — into provider logs, training pipelines,
                  and third-party retention systems.
                </p>
                <p className="mt-6 border-l-2 border-accent pl-4 font-display text-xl font-medium tracking-tight">
                  One paste is enough to move sensitive data outside your organization&apos;s control.
                </p>
              </Reveal>
            </div>
            <div className="col-span-4 md:col-span-12 lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.1}>
                <ul className="border-t border-line">
                  {problemExamples.map((item, i) => (
                    <li key={item} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
                      <span className="text-[15px] font-medium">{item}</span>
                      <span className="meta-label text-muted">{String(i + 1).padStart(2, "0")}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <Container>
        <Divider />
      </Container>

      {/* 02 FLOW */}
      <Section>
        <Container className="py-16 md:py-28">
          <Reveal>
            <SectionLabel index="02" title="The flow" />
            <H2 className="mt-4">From raw input to safe AI.</H2>
          </Reveal>
          <Reveal className="mt-10">
            <ArchitectureFlow
              horizontalOnDesktop
              steps={[
                { label: "Input", detail: "Human prompt, file, agent action, MCP request." },
                { label: "Detect", detail: "Secrets, PII, financial and client data." },
                { label: "Policy", detail: "Allow, tokenize, redact, block." },
                { label: "Protect", detail: "Sensitive values remain local.", accent: true },
                { label: "Verify", detail: "Privacy-preserving enforcement receipt." },
                { label: "AI", detail: "Only approved context reaches the model." },
              ]}
            />
          </Reveal>
          <p className="mt-8">
            <TextLink href="/how-it-works">Walk through each step →</TextLink>
          </p>
        </Container>
      </Section>

      {/* BEFORE / AFTER */}
      <Section dark>
        <Container className="py-16 md:py-28">
          <Reveal>
            <SectionLabel index="" title="Before / After" dark />
            <H2 className="mt-4 max-w-[18ch]">
              The prompt can leave.
              <br />
              The secret doesn&apos;t have to.
            </H2>
          </Reveal>
          <div className="mt-10 grid gap-px border border-bone/20 bg-bone/20 md:grid-cols-2">
            <Reveal className="bg-coal p-6 md:p-10">
              <p className="meta-label text-bone/50">Without — everything exposed</p>
              <pre className="mt-5 whitespace-pre-wrap font-mono text-sm leading-relaxed text-bone">
{`Client: Acme Corp
Revenue: ₹5.2 Cr
AWS key: AKIAIOSFODNN7EXAMPLE`}
              </pre>
              <p className="mt-6 font-mono text-sm text-bone/50">→ External AI</p>
            </Reveal>
            <Reveal delay={0.1} className="bg-coal p-6 md:p-10">
              <p className="meta-label text-bone/50">With Bulkhead — only safe context sent</p>
              <pre className="mt-5 whitespace-pre-wrap font-mono text-sm leading-relaxed text-bone">
{`Client: [CLIENT_1]
Revenue: [AMOUNT_1]
AWS key: [REMOVED]`}
              </pre>
              <p className="mt-6 font-mono text-sm text-bone/50">
                → External AI · <span className="text-accent">Real values remain local.</span>
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* 03 CONTROL LAYER */}
      <Section>
        <Container className="py-16 md:py-28">
          <Reveal>
            <SectionLabel index="03" title="Control layer" />
            <H2 className="mt-4">Six mechanisms. One boundary.</H2>
          </Reveal>
          <div className="mt-6">
            {capabilities.map((cap) => (
              <Reveal key={cap.n}>
                <FeatureRow index={cap.n} title={cap.title} body={cap.body}>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-muted">{cap.motif}</p>
                </FeatureRow>
              </Reveal>
            ))}
            <div className="border-b border-line" aria-hidden />
          </div>
        </Container>
      </Section>

      {/* AGENTS */}
      <Section dark>
        <Container className="py-16 md:py-28">
          <Reveal>
            <SectionLabel index="" title="Agent security" dark />
            <H2 className="mt-4 max-w-[20ch]">
              AI agents can act.
              <br />
              So policy must act first.
            </H2>
          </Reveal>
          <div className="mt-10 grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-10">
            <div className="col-span-4 md:col-span-12 lg:col-span-5">
              <Reveal>
                <ArchitectureFlow
                  dark
                  steps={[
                    { label: "AI agent", detail: "Plans and calls tools on your behalf." },
                    { label: "Privacy policy layer", detail: "Every action request is inspected first.", accent: true },
                    { label: "Allow / redact / block", detail: "Decisions per tool, recipient, and data class." },
                    { label: "Tools", detail: "Email · GitHub · Slack · Database · CRM · MCP." },
                  ]}
                />
              </Reveal>
            </div>
            <div className="col-span-4 md:col-span-12 lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.1}>
                <div className="border border-bone/20 bg-soot p-6">
                  <p className="meta-label text-bone/50">Blocked action — real example</p>
                  <p className="mt-4 font-mono text-sm leading-relaxed text-bone">
                    Agent wants to send:
                    <br />
                    <span className="text-bone/70">&ldquo;Microsoft pays us $420K annually.&rdquo;</span>
                  </p>
                  <p className="mt-4 text-sm text-bone/70">External recipient detected. Customer pricing detected.</p>
                  <p className="mt-3 inline-block rounded bg-ink px-2 py-1 font-mono text-xs font-semibold text-paper">
                    → BLOCKED
                  </p>
                  <div className="mt-5 border-t border-bone/15 pt-4">
                    <p className="meta-label text-bone/50">Safe rewrite offered</p>
                    <p className="mt-2 font-mono text-sm text-bone/80">
                      &ldquo;A [TIER_1] customer renews at standard enterprise pricing.&rdquo;
                    </p>
                  </div>
                </div>
                <p className="mt-6">
                  <Link href="/agents" className="font-medium text-bone underline decoration-bone/30 underline-offset-4 hover:decoration-accent">
                    Explore Agent Security →
                  </Link>
                </p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* 04 VERIFICATION */}
      <Section>
        <Container className="py-16 md:py-28">
          <Reveal>
            <SectionLabel index="04" title="Verification" />
            <H2 className="mt-4 max-w-[18ch]">
              Don&apos;t just say the policy ran.
              <br />
              Prove it.
            </H2>
            <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted">
              The private data remains private. Midnight records only the minimum information required to verify that
              the approved protection workflow was used.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <div className="col-span-4 md:col-span-4">
              <Reveal>
                <p className="meta-label text-muted">Private — never leaves</p>
                <ul className="mt-4 space-y-2.5 border-t border-line pt-4 text-[15px]">
                  {["Raw prompt", "Client names", "Secrets", "Token mappings", "AI response"].map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink" /> {i}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <div className="col-span-4 md:col-span-4">
              <Reveal delay={0.05}>
                <p className="meta-label text-muted">Verifiable — on Midnight</p>
                <ul className="mt-4 space-y-2.5 border-t border-line pt-4 text-[15px]">
                  {["Operator authority", "Request commitment", "Contract schema version", "Receipt status", "Finalized block"].map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink" /> {i}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <div className="col-span-4 md:col-span-4">
              <Reveal delay={0.1}>
                <ReceiptCard />
              </Reveal>
            </div>
          </div>
          <p className="mt-8">
            <TextLink href="/midnight">How Midnight is used →</TextLink>
          </p>
        </Container>
      </Section>

      <Container>
        <Divider />
      </Container>

      {/* DEVELOPERS */}
      <Section>
        <Container className="py-16 md:py-28">
          <div className="grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <div className="col-span-4 md:col-span-12 lg:col-span-5">
              <Reveal>
                <SectionLabel index="05" title="Developers" />
                <H2 className="mt-4">
                  One layer.
                  <br />
                  Any model.
                </H2>
                <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">
                  Wrap the model call you already have. Policy, tokenization, and receipts attach automatically.
                </p>
                <ul className="mt-8 flex flex-wrap gap-2" aria-label="Provider targets">
                  {["OpenAI", "Claude", "Gemini", "Private LLM", "MCP"].map((p) => (
                    <li key={p}>
                      <StatusBadge>
                        {p} · <span className="normal-case tracking-normal">architecture target</span>
                      </StatusBadge>
                    </li>
                  ))}
                </ul>
                <p className="mt-6">
                  <TextLink href="/developers">Read documentation →</TextLink>
                </p>
              </Reveal>
            </div>
            <div className="col-span-4 md:col-span-12 lg:col-span-7">
              <Reveal delay={0.1}>
                <CodeBlock
                  title="typescript"
                  code={`import { createSecureAI } from "@bulkhead/ai";

const secureAI = createSecureAI({
  policy: "company-default",
});

const response = await secureAI.chat({
  prompt, // scanned, tokenized, and receipted automatically
});`}
                />
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <Stat value="<300ms" label="Scan budget p95" />
                  <Stat value="0" label="Raw prompts stored" />
                  <Stat value="v4" label="Policy under receipt" />
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* FILM */}
      <Section>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Film" title="Live workflow / 00:24" />
          </Reveal>
          <Reveal className="mt-8">
            <SiteImage slot="home-film" fig="FIG. 01" />
          </Reveal>
          <p className="mt-4 text-sm text-muted">The interactive demo runs above; the recorded walkthrough drops in here.</p>
        </Container>
      </Section>

      <Container>
        <Divider />
      </Container>

      {/* FINAL CTA */}
      <Section dark>
        <Container className="py-20 md:py-32">
          <Reveal>
            <p className="meta-label text-bone/50">Get started</p>
            <p className="mt-6 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.03em]">
              Your AI should know
              <br />
              what it needs.
              <br />
              <span className="text-bone/50">Not everything you know.</span>
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="/contact" variant="accent" className="w-full sm:w-auto">
                Get Started
              </Button>
              <Button href="/contact" variant="dark" className="w-full sm:w-auto">
                Request Demo
              </Button>
              <LaunchAppButton tone="dark" className="w-full sm:w-auto" />
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
