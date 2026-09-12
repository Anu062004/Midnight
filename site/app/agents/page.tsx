import { pageMeta } from "@/lib/site";
import { Button, Container, Display, Divider, H2, Section, SectionLabel, StatusBadge } from "@/components/ui";
import { ArchitectureFlow, PolicyTable } from "@/components/diagrams";
import { SiteImage } from "@/components/SiteImage";
import { CodeBlock } from "@/components/CodeBlock";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "AI Agent Security",
  description: "Policy enforcement for AI agents and MCP tools: inspect every action before it executes. Allow, rewrite, or block.",
  path: "/agents",
});

const tools = ["Email", "Drive", "Slack", "GitHub", "CRM", "Databases", "MCP servers", "APIs"];
const actions = ["send_email", "upload_file", "query_database", "post_slack", "create_issue"];

export default function AgentsPage() {
  return (
    <>
      <Section dark>
        <Container className="pb-14 pt-12 md:pb-20 md:pt-20">
          <p className="meta-label text-bone/50">Solutions / AI agents</p>
          <Display className="mt-6 max-w-[15ch]">
            Security for AI that can actually do things.
          </Display>
          <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-bone/70">
            Agents read your drive, message your customers, and call your APIs. Bulkhead inspects every action
            request against policy before it executes — not after the damage.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/contact" variant="accent" className="w-full sm:w-auto">Secure your agents</Button>
            <Button href="#mcp" variant="dark" className="w-full sm:w-auto">MCP Gateway</Button>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="py-16 md:py-24">
          <div className="grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-10">
            <div className="col-span-4 md:col-span-12 lg:col-span-5">
              <Reveal>
                <SectionLabel index="Access" title="What agents touch" />
                <ul className="mt-6 border-t border-line">
                  {tools.map((tool, i) => (
                    <li key={tool} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
                      <span className="text-[15px] font-medium">{tool}</span>
                      <span className="meta-label text-muted">{String(i + 1).padStart(2, "0")}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <div className="col-span-4 md:col-span-12 lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.05}>
                <SectionLabel index="Enforcement" title="Request path" />
                <div className="mt-6">
                  <ArchitectureFlow
                    steps={[
                      { label: "Agent", detail: "Plans an action with real data attached." },
                      { label: "Action request", detail: "Tool, arguments, recipient, data classes." },
                      { label: "Privacy firewall", detail: "Scanned and checked against tool policies.", accent: true },
                      { label: "Policy decision", detail: "Allow · rewrite · block." },
                      { label: "Tool executes", detail: "Only the approved form runs." },
                    ]}
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <Section dark>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="Example" title="Blocked in practice" dark />
            <H2 className="mt-4 max-w-[20ch]">The email that never sent pricing.</H2>
          </Reveal>
          <div className="mt-10 grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <Reveal className="col-span-4 md:col-span-12 lg:col-span-7">
              <div className="border border-bone/20 bg-soot p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <p className="meta-label text-bone/50">Action: send_email</p>
                  <StatusBadge tone="bad">Blocked</StatusBadge>
                </div>
                <p className="mt-4 font-mono text-sm leading-relaxed text-bone">
                  To: partner-external@example.com
                  <br />
                  Body: &ldquo;Microsoft pays us $420K annually…&rdquo;
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-bone/70">
                  <li>— External recipient detected.</li>
                  <li>— Customer pricing detected.</li>
                </ul>
                <div className="mt-6 border-t border-bone/15 pt-5">
                  <p className="meta-label text-bone/50">Safe rewrite offered to the agent</p>
                  <p className="mt-2 font-mono text-sm text-bone/85">
                    &ldquo;A [TIER_1] customer renews at standard enterprise pricing.&rdquo;
                  </p>
                </div>
              </div>
            </Reveal>
            <div className="col-span-4 md:col-span-12 lg:col-span-4 lg:col-start-9">
              <Reveal delay={0.05}>
                <p className="meta-label text-bone/50">Governed actions</p>
                <ul className="mt-4 space-y-2">
                  {actions.map((action) => (
                    <li key={action} className="border border-bone/20 px-4 py-2.5 font-mono text-sm text-bone/85">
                      {action}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-bone/60">Each action carries its own argument and recipient policy.</p>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="py-16 md:py-24">
          <Reveal>
            <SectionLabel index="In operation" title="Interception, as operators see it" />
          </Reveal>
          <Reveal className="mt-8">
            <SiteImage slot="agents-console" fig="FIG. 01" />
          </Reveal>
        </Container>
      </Section>

      <Container>
        <Divider />
      </Container>

      <Section>
        <Container id="mcp" className="scroll-mt-24 py-16 md:py-24">
          <div className="grid grid-cols-4 gap-5 md:grid-cols-12 md:gap-8">
            <div className="col-span-4 md:col-span-12 lg:col-span-5">
              <Reveal>
                <SectionLabel index="MCP Gateway" title="Between agent and tools" />
                <H2 className="mt-4">One checkpoint for every tool.</H2>
                <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted">
                  Bulkhead sits between the agent and your MCP servers, applying the same scan-and-policy pass to
                  tool inputs and tool results. A compromised or curious tool sees placeholders, not secrets.
                </p>
                <p className="mt-4 inline-block">
                  <StatusBadge>Planned capability — architecture target</StatusBadge>
                </p>
              </Reveal>
            </div>
            <div className="col-span-4 md:col-span-12 lg:col-span-6 lg:col-start-7">
              <Reveal delay={0.05}>
                <CodeBlock
                  title="mcp policy"
                  language="json"
                  code={`{
  "tool": "query_database",
  "arguments": {
    "customer_email": "TOKENIZE",
    "salary_band": "BLOCK"
  },
  "results": {
    "api_keys": "REDACT"
  }
}`}
                />
                <div className="mt-8">
                  <PolicyTable
                    title="Example tool policy"
                    rows={[
                      { rule: "Internal recipients", decision: "ALLOW" },
                      { rule: "External recipients", decision: "REDACT", note: "Pricing and PII rewritten" },
                      { rule: "Credentials in arguments", decision: "BLOCK" },
                      { rule: "Bulk export actions", decision: "APPROVED MODELS ONLY" },
                    ]}
                  />
                </div>
              </Reveal>
            </div>
          </div>
          <div className="mt-14">
            <Button href="/enterprise" variant="primary">See enterprise controls</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
