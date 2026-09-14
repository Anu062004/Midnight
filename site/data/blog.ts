export type Post = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  readMinutes: number;
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "why-ai-needs-a-data-firewall",
    title: "Why AI needs a data firewall",
    dek: "Firewalls succeeded because networks couldn't be trusted. Prompts are the new packets.",
    date: "2026-08-28",
    readMinutes: 6,
    body: [
      "Every enterprise already accepts a premise: traffic crossing a trust boundary passes a firewall. Firewalls don't understand your business; they enforce declared rules about what may cross. AI prompts need the same treatment, because a prompt is a packet carrying company data into someone else's infrastructure.",
      "The failure mode is identical too. Nobody pastes a production credential into ChatGPT out of malice — it happens the way breaches always happen: a deadline, a helpful tool, one paste. A data firewall converts that accident class from 'inevitable incident' into 'blocked event with a receipt'.",
      "The design constraints rhyme as well. A network firewall that added seconds of latency would be ripped out; a prompt firewall must scan in milliseconds. One that demanded perfect classification would be misconfigured into uselessness; ours fails closed on declared categories and says plainly what it cannot detect.",
    ],
  },
  {
    slug: "local-tokenization-changes-ai-privacy",
    title: "How local tokenization changes AI privacy",
    dek: "Deletion promises require trust. Locality doesn't — the data simply never moves.",
    date: "2026-08-14",
    readMinutes: 5,
    body: [
      "Most AI privacy stories are deletion stories: send everything, then trust the provider to delete it, exclude it from training, and shorten retention. Each promise is unverifiable from the outside.",
      "Tokenization inverts the problem. Replace Acme Corporation with [CLIENT_1] before transmission, and there is nothing to delete, retain, or train on. The sensitive value never crossed the boundary, so no promise is needed.",
      "The trade is explicit: the model reasons about placeholders, and answers lose specificity where values were removed. Our restoration step recovers readability for the human reader without putting originals back into model-bound history. Privacy with a measured cost beats privacy on faith.",
    ],
  },
  {
    slug: "securing-mcp-and-agent-actions",
    title: "Securing MCP and AI agent actions",
    dek: "Agents don't just read secrets — they act on them. Policy has to sit in front of the tool.",
    date: "2026-07-30",
    readMinutes: 7,
    body: [
      "A chatbot leaking a secret in its reply is bad. An agent emailing that secret to an external address is worse — the action is irreversible, and it happened at machine speed while nobody watched.",
      "Agent security therefore can't be output filtering. It has to be action gating: inspect the tool, the arguments, the recipient, and the data classes involved, then allow, rewrite, or block before execution. Our MCP gateway applies the same scan-and-policy pass to tool calls that the chat path applies to prompts.",
      "The practical starting point is small: govern five actions (send, upload, query, post, create) across your connected tools, default external recipients to redact, and block credentials in arguments outright. Expand from evidence, not ambition.",
    ],
  },
  {
    slug: "verifiable-ai-policy-enforcement",
    title: "What verifiable AI policy enforcement means",
    dek: "'Trust our logs' is a slogan. A receipt is a checkable claim.",
    date: "2026-07-16",
    readMinutes: 5,
    body: [
      "Saying 'the policy ran' is easy. Proving it — to an auditor, a customer, a regulator — requires evidence that can't be edited after the fact and doesn't leak the content it describes. That combination rules out conventional logs, which are either mutable or stuffed with the very secrets they record.",
      "On-chain, a receipt is one opaque commitment plus the operator's authority — nothing else. Off it, the gateway holds the envelope that hashes to that commitment: organization, actor, job, policy version, model, nonce. Each is checkable: recompute the commitment from the disclosed envelope, then check that exact commitment's membership in the finalized ledger. Nothing else is stored, so there is nothing else to leak.",
      "Verification composes. A customer can confirm their document was processed under the approved policy without seeing your other traffic; an auditor can sample receipts without reading prompts. That is what 'verifiable' has to mean to be worth the word.",
    ],
  },
  {
    slug: "sensitive-prompts-audit-logs",
    title: "Why sensitive prompts should not become audit logs",
    dek: "An audit trail full of secrets is a second breach waiting for a reader.",
    date: "2026-06-29",
    readMinutes: 4,
    body: [
      "The standard compliance reflex is to log everything. Applied to AI, that means the audit system accumulates every credential, contract figure, and customer record employees ever pasted — searchable, retained, and readable by everyone with log access.",
      "We log the metadata instead: who, which policy version, what decision, which receipt. The question 'was this request handled correctly?' is answerable without the question 'what did the request say?' ever arising.",
      "Retention then becomes a policy choice about commitments, not a liability choice about secrets. Delete a receipt and you lose a proof; delete a prompt log and you destroy evidence of the leak it recorded. Prefer the system where deletion is safe.",
    ],
  },
];
