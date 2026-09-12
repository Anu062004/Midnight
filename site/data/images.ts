/**
 * Image slot manifest — the single place to wire real images into the site.
 *
 * HOW TO ADD AN IMAGE:
 * 1. Save the file under `site/public/images/` (JPG/PNG/WebP, sRGB, < 500 KB).
 * 2. Set that slot's `src` below to `/images/<file>` (keep `alt` accurate).
 * 3. Rebuild. Layout never shifts: every scene reserves its aspect ratio
 *    whether or not `src` is set.
 */
export type ImageSlotEntry = {
  /** Public path, e.g. "/images/home-film.jpg". Empty = reserved placeholder scene. */
  src: string;
  /** Accurate description of the image content (also the placeholder label). */
  alt: string;
  /** Short caption rendered under the scene. */
  caption: string;
  /** CSS aspect-ratio, e.g. "16 / 9". */
  ratio: string;
  /** Recommended export size, shown on the placeholder. */
  recommended: string;
  /** Suggested filename inside site/public/images/. */
  file: string;
};

export const imageSlots: Record<string, ImageSlotEntry> = {
  "home-film": {
    src: "/images/home-film.jpg",
    alt: "Recorded walkthrough: a prompt being tokenized and receipted",
    caption: "Live workflow film — 24 seconds.",
    ratio: "3 / 2",
    recommended: "1536 × 1024",
    file: "home-film.jpg",
  },
  "product-console": {
    src: "",
    alt: "Operations console: request path, policy version, enforcement counts",
    caption: "The operations console.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "product-console.jpg",
  },
  "how-workflow": {
    src: "",
    alt: "Annotated capture of each pipeline step on a real request",
    caption: "The eight steps on one request.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "how-workflow.jpg",
  },
  "agents-console": {
    src: "",
    alt: "Blocked agent action with the safe rewrite offered inline",
    caption: "An intercepted action, as operators see it.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "agents-console.jpg",
  },
  "enterprise-audit": {
    src: "",
    alt: "Audit view: enforcement receipts across teams, metadata only",
    caption: "Audit without content.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "enterprise-audit.jpg",
  },
  "midnight-record": {
    src: "",
    alt: "Anchored receipt record: commitments, versions, confirmation state",
    caption: "The verifiable record.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "midnight-record.jpg",
  },
  "security-infra": {
    src: "",
    alt: "Deployment diagram: local engine, gateway, and verification sidecar",
    caption: "Where each part runs.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "security-infra.jpg",
  },
  "developers-reference": {
    src: "",
    alt: "Reference docs and SDK guides in use",
    caption: "Guides for every surface.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "developers-reference.jpg",
  },
  "about-workspace": {
    src: "",
    alt: "The team workspace where the product is built and reviewed",
    caption: "Built in the open, reviewed honestly.",
    ratio: "4 / 3",
    recommended: "1200 × 900",
    file: "about-workspace.jpg",
  },
  "blog-why-ai-needs-a-data-firewall": {
    src: "",
    alt: "Editorial illustration: prompts crossing a policy boundary",
    caption: "Why AI needs a data firewall.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "blog-firewall.jpg",
  },
  "blog-local-tokenization-changes-ai-privacy": {
    src: "",
    alt: "Editorial illustration: values replaced by placeholders before transmission",
    caption: "How local tokenization changes AI privacy.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "blog-tokenization.jpg",
  },
  "blog-securing-mcp-and-agent-actions": {
    src: "",
    alt: "Editorial illustration: an agent action stopped at a checkpoint",
    caption: "Securing MCP and AI agent actions.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "blog-agents.jpg",
  },
  "blog-verifiable-ai-policy-enforcement": {
    src: "",
    alt: "Editorial illustration: a checkable receipt beside sealed content",
    caption: "What verifiable AI policy enforcement means.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "blog-verification.jpg",
  },
  "blog-sensitive-prompts-audit-logs": {
    src: "",
    alt: "Editorial illustration: metadata logged, content withheld",
    caption: "Why sensitive prompts should not become audit logs.",
    ratio: "16 / 9",
    recommended: "1600 × 900",
    file: "blog-audit-logs.jpg",
  },
};

export function getImageSlot(slot: string): ImageSlotEntry {
  return (
    imageSlots[slot] ?? {
      src: "",
      alt: "Reserved image scene",
      caption: "Reserved scene.",
      ratio: "16 / 9",
      recommended: "1600 × 900",
      file: `${slot}.jpg`,
    }
  );
}
