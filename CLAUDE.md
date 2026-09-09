# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

GoPocket's marketing site. Astro 5 in `output: "server"` mode on the Cloudflare
adapter — **every route is SSR, nothing is prerendered**. React is available via
`@astrojs/react` but is the exception; prefer `.astro`.

```
npm run dev       # astro dev
npm run build     # astro build
npm run format    # prettier --write "src/**/*.{astro,js,ts,jsx,tsx,css,json}"
```

Prettier is configured (120 cols, 2 spaces, double quotes, semicolons), but
**do not run `npm run format`** — the repo is not currently Prettier-clean, so
the repo-wide script rewrites ~90 untouched files and buries your change in
thousands of lines of reformatting. Format only what you edited:

```
npx prettier --write src/components/MyComponent.astro
```

```
src/components/       # section components, grouped in subfolders per page (api/, partner/, downloads/, header/)
src/layouts/          # Layout.astro (all SEO tags live here), LegalPage.astro
src/pages/            # one .astro per route + src/pages/api/*.ts endpoints
src/styles/           # global.css, dark-theme.css, accessibility.css, cursor.css
src/lib/              # frappe.ts (CMS client)
```

Import with the `@/*` alias (`@/components/Button.astro`), which maps to `src/*`.

---

## 1. Icons — always Lucide, always deep-imported

`@lucide/astro` is installed. Use it for every new icon; do not hand-write an
SVG and do not add another icon library.

Import each icon from its own path so only that icon ships in the bundle. A
barrel import (`import { Download } from "@lucide/astro"`) pulls in the whole
set and wrecks the payload budget.

```astro
---
// Correct: one deep import per icon, kebab-case file, PascalCase local name
import Download from "@lucide/astro/icons/download";
import ArrowRight from "@lucide/astro/icons/arrow-right";
---

<Download class="h-5 w-5" stroke-width={1.6} aria-hidden="true" />
```

- Size with Tailwind classes (`h-5 w-5`), not the `size` prop, so the icon
  scales with the breakpoint variants around it.
- Decorative icons get `aria-hidden="true"`. An icon that is the only content of
  a button needs an `aria-label` on the button.
- Icons passed through data files are typed `AstroComponent` from
  `@lucide/astro` — see [header-data.ts](src/components/header/header-data.ts).

## 2. Styling — inline Tailwind in the markup

Write utilities inline on the element. This is the majority convention already
(37 of 43 root components) and keeps a component readable in one place.

```astro
<section class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 md:px-8 lg:py-24">
  <h2 class="text-h3 text-dark font-semibold tracking-tight lg:text-h2">{title}</h2>
</section>
```

- Tailwind v4, configured entirely in CSS. There is **no `tailwind.config.js`** —
  design tokens are declared in the `@theme` block at the top of
  [global.css](src/styles/global.css). Use the project tokens rather than raw
  hex: `text-primary`, `bg-theme-light`, `text-text-default`, `text-dark`,
  `border-border-light`, and the `text-h1`…`text-h6` type scale.
- Mobile-first: base classes are the phone layout, then `md:` / `lg:` / `xl:`.
- Reach for a scoped `<style>` block only when a utility genuinely cannot express
  it — keyframes, `@media (prefers-reduced-motion)`, masks, or a long BEM section
  with many interdependent states (see
  [DownloadsHero.astro](src/components/downloads/DownloadsHero.astro) for that
  pattern). Never add a plain global class to `global.css` for a one-off; it is
  already 100 KB+.
- Arbitrary values (`w-[148px]`) are fine when matching a design spec exactly.

### Dark mode: two mechanisms, in this order

The theme toggle sets `class="dark"` on `<html>`. `dark:` utilities are bound to
that class by `@custom-variant dark (&:where(.dark, .dark *))` at the top of
[global.css](src/styles/global.css) — Tailwind v4 ships `dark:` as
`@media (prefers-color-scheme: dark)`, which tracked the OS and ignored the
toggle, so that line is load-bearing. Don't remove it.

**Prefer semantic tokens over `dark:`.** The site re-skins itself by repointing
tokens under `html.dark` in [dark-theme.css](src/styles/dark-theme.css), and
those rules are **unlayered**, so they outrank any `dark:` utility in
`@layer utilities` no matter the specificity. On an element written
`bg-white dark:bg-[#1c202e]`, the token remap wins and the `dark:` class does
nothing.

So, for a new component:

1. Reach for tokens that already invert — `bg-white`, `bg-theme-light`,
   `text-text-default`, `border-border-light`. Dark mode then comes for free and
   stays consistent with the rest of the site.
2. Use `dark:` only for a colour the token layer doesn't cover (the slate, gray,
   purple and emerald palettes are not remapped, so `dark:text-slate-200` works).
3. For a section with its own palette, declare local CSS variables on the
   component root and repoint them in `:global(html.dark) .my-section { … }` —
   the pattern in
   [DownloadsHero.astro](src/components/downloads/DownloadsHero.astro).

## 3. Reusable UI components

Before writing markup, check whether a shared component exists. If a pattern
appears (or is about to appear) in more than one place, extract it into
`src/components/` with a typed `Props` interface and sensible defaults.

- **[Button.astro](src/components/Button.astro) is the site's button.** Use it
  for every CTA rather than styling an `<a>` by hand. It takes `label`, optional
  `href` (renders `<a>`, else `<button>`), `variant`
  (`primary` | `outline` | `outline-white` | `black`), `glow`, and forwards the
  rest via `...rest`.
- Follow its shape for new shared components:

```astro
---
interface Props {
  title: string;
  href?: string;
  variant?: "solid" | "ghost";
  class?: string;
  [key: string]: unknown;
}

const { title, href, variant = "solid", class: className = "", ...rest } = Astro.props;
---
```

- Page-specific sections belong in a per-page subfolder (`src/components/api/`).
- Content a page owns — copy, card lists, links — goes in the component's
  frontmatter or a sibling `*-data.ts`, never hardcoded mid-markup.

## 4. Code style — plain and readable

- Prefer the obvious solution. No abstraction layer, no config object, and no
  utility file for a single caller.
- Small, focused components over one component with a dozen branching props.
- TypeScript is `astro/tsconfigs/strict`. Type props explicitly; no `any`.
- Comment the _why_, not the _what_. This codebase documents non-obvious
  decisions in block comments at the top of a component or above a tricky rule
  (see [Layout.astro](src/layouts/Layout.astro) on canonical vs. og:url) — match
  that density: thorough where behaviour is surprising, silent where the code
  speaks for itself.
- Match the surrounding file's naming and formatting rather than introducing a
  new style.

## 5. SEO on every page

`Layout.astro` emits title, description, keywords, canonical, hreflang, Open
Graph and theme-color. Pass real values — never ship the defaults on a content
page:

```astro
---
import Layout from "@/layouts/Layout.astro";
---

<Layout
  title="Brokerage Charges & Pricing | GoPocket"
  description="Flat ₹20 per order on intraday and F&O. No hidden charges. See GoPocket's full pricing."
  canonical="/pricing"
>
  <!-- … -->
</Layout>
```

- `canonical` takes a **site-relative path** (`"/pricing"`). It resolves against
  `site` in `astro.config.mjs`, deliberately _not_ the request origin, so
  staging deployments never self-canonicalise. Omit it only when the request
  pathname is already correct.
- `trailingSlash: "never"` — write internal hrefs without a trailing slash.
- One `<h1>` per page, then `h2`/`h3` in order. Do not pick a heading level for
  its size; set size with the `text-h*` utilities.
- Descriptive `alt` on meaningful images, `alt=""` + `aria-hidden="true"` on
  decoration.
- Real `<a href>` for navigation and `<button>` for actions — never a clickable
  `<div>`.
- [sitemap.xml.ts](src/pages/sitemap.xml.ts) discovers static pages from the
  filesystem, so a new `.astro` page under `src/pages/` is listed automatically.
  You only touch that file to add a route to `EXCLUDED` (it shouldn't be
  indexed) or to enumerate a new SSR-only dynamic route from its data source.
- Add JSON-LD via a `<script type="application/ld+json" set:html={...}>` where a
  page describes an FAQ, product or organisation.

## 6. Performance — Lighthouse / PageSpeed

Every route is SSR on Cloudflare Workers, so shipped bytes and layout stability
are the whole game.

- **Ship no JS by default.** `.astro` components render to zero client JS. Add a
  React island only for genuine interactivity, and hydrate it as late as
  correctness allows: `client:visible` > `client:idle` > `client:load`.
- **Images:** always set `width` and `height` (prevents CLS), plus
  `loading="lazy"` and `decoding="async"`. The exception is the above-the-fold
  hero image, which takes `loading="eager"` — lazy-loading the LCP element
  delays it. Serve `.webp`/`.avif` from `public/assets/`.
- **Fonts:** already wired in `Layout.astro`. Don't add another family or
  another `<link>` to a font host.
- **No new dependency** for something a few lines of Astro or CSS can do; each
  one is bytes on every SSR response.
- Animation: prefer `transform` and `opacity` (compositor-only). Anything
  animated must be muted under `@media (prefers-reduced-motion: reduce)`.
- AOS is available via `data-aos` attributes; reuse it instead of adding a
  second scroll-animation library.
- Never introduce a render-blocking inline script in `<head>`. The one that is
  there resolves the theme before first paint to avoid a flash — leave it alone.
