# Bulkhead — marketing site

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion + Lucide. Swiss/International Typographic Style: monochrome (`#F5F5F2` / `#111111`), one lime accent (`#B9F227`), hairline grids, editorial type (Space Grotesk display + Inter body, self-hosted in `assets/fonts/`).

Product name lives in `lib/site.ts` (`siteConfig`). No created asset may claim built integrations: provider/SDK surfaces are labeled “Architecture target” / “Coming soon” / “Planned”.

## Scripts

```sh
npm run dev        # http://127.0.0.1:3001
npm run lint       # eslint (flat config, no eslint-config-next: see note)
npm run typecheck  # tsc --noEmit
npm run build      # production build, all routes prerendered
```

ESLint note: `eslint-config-next` (legacy eslintrc format) crashes under ESLint 9 via `FlatCompat` (circular-structure error), so this project lints with `@eslint/js` + `typescript-eslint` plus a rule set that bans raw `<img>`. All links use `next/link`; there are no `<img>` tags.

Framer Motion note: `framer-motion` must stay version-locked with its `motion-dom` peer (a drifted minor broke the production build with a missing `activeAnimations` export). Both are pinned exact; bump them together.

## Routes

`/`, `/product`, `/how-it-works`, `/agents`, `/enterprise`, `/midnight`, `/security`, `/developers`, `/docs`, `/pricing`, `/about`, `/contact`, `/blog`, `/blog/[slug]` (5 essays), `/legal/privacy`, `/legal/terms`, 404. Plus `/sitemap.xml`, `/robots.txt`, `/icon.svg`, `/favicon.ico` (hand-built, matches the SVG mark).

## Wiring to the workspace app

Every “Launch App” button (`components/LaunchApp.tsx`) points at `siteConfig.appUrl`
(`NEXT_PUBLIC_APP_URL`, default `http://127.0.0.1:3000`) and probes it first with a
`no-cors` request — no workspace server changes needed, since any HTTP response
counts as reachable. Online opens the app in a new tab; offline reveals the
`npm start` command instead of a dead tab. Results cache for 10s. The workspace
links back via a “Product docs ↗” footer link to the site’s `/docs`.

## QA

Real-Chrome Playwright checks (see task history): all routes 200 with zero console errors, custom 404, no horizontal overflow at 375/768/1024/1440, every homepage link resolves, contact validation + success path, mobile nav. The 12-column page grids collapse to a 4-column base grid on mobile — a fixed-gutter 12-col grid overflows small viewports by construction, which is why the responsive column classes exist; do not “simplify” them back.
