# Portfolio Website — Implementation Plan

Single-page interactive resume. Dark + light. Technical, minimal, readable.
**Presentable > flashy.** Readability > aesthetic subtlety.

Handoff doc for an AI coding agent. Build phase by phase. Do not skip acceptance checks.

---

## 0. Agent Rules (read first)

- Install skills **before any planning/UI work** and apply them throughout:
  - `npx skills add Leonxlnx/taste-skill`
  - `npx skills add emilkowalski/skill`
- `emilkowalski/skill` governs: animation, transitions, interaction feedback, layout behavior, polish. Consult it in **every** phase that touches UI, not just the motion phase.
- `taste-skill` governs: overall design judgment, restraint, anti-generic checks. Run a "does this look templated / AI-portfolio-ish" review at the end of each phase.
- If either skill conflicts with this plan's restraint rules (no flashy effects), **this plan wins**.
- **All UI primitives = shadcn/ui components.** Scaffold with `npx shadcn@latest init -t vite`. Details in §2.1.
- Never hand-roll a component shadcn already provides. Add with `npx shadcn@latest add <name>`. Restyle centrally (tokens + `components/ui/*` variants), not with per-usage overrides.
- No placeholder lorem in final. Unknown content → `TODO(content)` marker + entry in `docs/TODO.md`.
- Names, paths, constants, tokens: use exactly as written here.

---

## 1. Structure Changes vs Original Brief

Reasoning first. Changes are small.

| Original | Change | Why |
|---|---|---|
| CTA + Contact as 2 sections | **Merge into one closing section** | Two adjacent "contact me" blocks feel repetitive. One CTA line + email + socials. |
| GitHub Activity as standalone section | **Keep, but compact, placed after Education, styled as a resume "footnote"** | Prevents dashboard feel. Contribution grid + 3 stats max. |
| Experience tree timeline with 1 entry | **Reuse same `Timeline` component for Education** | One node alone looks empty. Shared component keeps language consistent. Sections stay separate. |
| Specialties as list (8 items) | **Headline + 3 grouped one-liners** (see Hero) | 8 bullets in intro = wall of text. |
| Section order: Tech Stack before Certs/Education | **Keep order**, add sticky minimal nav | Resume convention: who → experience → work → skills → credentials. Fine as-is. |
| Nav not mentioned | **Add slim sticky nav (section anchors + theme toggle stays in hero only)** | Single long page needs orientation. Mobile: no hamburger, see §8. |

Final section order:

1. Hero
2. Experience
3. Projects
4. Tech Stack
5. Certifications
6. Education
7. GitHub Activity
8. Contact (CTA + email merged)
9. Footer

---

## 2. Stack

- **Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui**, scaffolded by `npx shadcn@latest init -t vite`. Matches existing skills, static output, zero server. (`vite` is the shadcn template used; no Next.js needed for a static one-pager.)
- Fonts: `@fontsource-variable/jetbrains-mono` (self-hosted, no Google Fonts request).
- Icons: `lucide-react` for UI (moon, sun, arrow, external-link, mail). Brand logos (GitHub, Facebook, Instagram, LinkedIn): `simple-icons` inline SVG, tree-shaken. Lucide dropped brand icons, do not rely on it for them.
- Motion: **CSS first** (transitions, keyframes). Add `motion` package only if a component genuinely needs it (e.g. layout/presence). Default: no lib.
- Deploy: Vercel or Cloudflare Pages (static). Decision in Phase 9.
- Build-time data: Node script (`scripts/fetch-github.mjs`) run in CI + `prebuild`.

### 2.1 shadcn/ui Usage

Scaffold:

```
npx shadcn@latest init -t vite
```

- Base library: **`radix`** (default). Do not mix with `base-ui`.
- Init generates Tailwind v4 wiring, `components.json`, `@/` alias, `lib/utils.ts` (`cn`), and default CSS variables in `src/index.css`. **Phase 1 replaces those default values with this plan's tokens** (§3.2). Keep the `@theme inline` block structure.
- Init may set its own font. Override with JetBrains Mono.
- shadcn defaults are a starting point, not the look. Restyle `components/ui/*` variants to match: 1px borders, mono type, radius token, focus ring, dashed dividers. Run the taste-skill check so it doesn't read as stock shadcn.
- Keep Radix accessibility behavior (focus management, aria) intact when editing.

Components to use (add only when a phase needs it):

| UI need | shadcn component | Notes |
|---|---|---|
| View Resume, mail, copy email | `button` | variants: default (solid), outline, ghost, link |
| Theme toggle, social icons | `button` (`size="icon"`, ghost/outline) + `tooltip` | same size/border for all icon controls |
| Tech chips, project chips | `badge` (`variant="outline"`) | restyled, non-interactive |
| Dashed/solid dividers | `separator` | wrapped by app-level `Divider` |
| Featured project frame | `card` | **featured only**; regular projects are rows, not cards |
| Profile photo | `avatar` | 96px / 112px |
| Project cover ratio | `aspect-ratio` | 16:10 |
| Graph tooltip, icon labels | `tooltip` | one `TooltipProvider` at root |
| Mobile nav row, graph scroll | `scroll-area` | hide scrollbar on nav row |
| Copy-email feedback | none | inline state swap, no toast (`sonner` not added) |

Not adding unless a need appears: `navigation-menu`, `sheet`, `dialog`, `tabs`, `accordion`, `carousel`, `hover-card`, `skeleton`.

- shadcn components ship enter/exit animations via `tw-animate-css` (`data-state`). Phase 8 audit covers `components/ui/*` too: durations ≤ 200ms, easing tokens from §6, reduced-motion respected.

Folder layout:

```
/
├─ public/
│  ├─ resume.pdf
│  ├─ og.png
│  └─ favicon.svg
├─ components.json       # shadcn config
├─ scripts/
│  └─ fetch-github.mjs
├─ src/
│  ├─ assets/projects/<slug>/cover.webp
│  ├─ components/
│  │  ├─ ui/             # shadcn components (generated by CLI, restyled centrally)
│  │  └─ ...             # app-level: Section, Timeline, ThemeToggle, ContributionGraph, ...
│  ├─ data/
│  │  ├─ profile.ts
│  │  ├─ experience.ts
│  │  ├─ projects.ts       # curated, manual
│  │  ├─ stack.ts
│  │  ├─ certifications.ts
│  │  ├─ education.ts
│  │  └─ generated/        # gitignored OR committed snapshot
│  │     ├─ github-repos.json
│  │     └─ github-contributions.json
│  ├─ styles/
│  │  ├─ tokens.css
│  │  └─ base.css
│  ├─ lib/               # utils.ts (cn), helpers
│  ├─ App.tsx
│  └─ main.tsx
├─ .github/workflows/
│  ├─ deploy.yml (or platform-native)
│  └─ refresh-github-data.yml
└─ docs/TODO.md
```

Content lives in `src/data/*.ts`. Components contain zero hardcoded resume content.

---

## 3. Design System

### 3.1 Typography (JetBrains Mono only)

Mono at large sizes gets loud. Keep scale tight.

| Role | Size | Weight | Line-height | Notes |
|---|---|---|---|---|
| Name (h1) | `clamp(1.75rem, 4vw, 2.5rem)` | 700 | 1.15 | letter-spacing `-0.02em` |
| Section label (h2) | `0.8125rem` (13px) | 500 | 1 | uppercase, `letter-spacing: 0.08em`, prefixed `//` or `01 /` index, muted color |
| Item title (h3) | `1rem` | 600 | 1.4 | primary text |
| Body | `0.9375rem` (15px) | 400 | 1.7 | secondary text color |
| Meta (dates, issuer) | `0.8125rem` | 400 | 1.5 | muted |
| Chip | `0.8125rem` | 500 | 1 | |

- Max 3 weights loaded: 400, 500, 700 (variable font covers it).
- `font-feature-settings`: keep ligatures **off** in prose (`"liga" 0, "calt" 0`) for readability. Optional on for code-ish snippets.
- No text above 40px anywhere. No giant hero type.

### 3.2 Color Tokens

Define tokens as CSS variables in `src/index.css` (shadcn location; `src/styles/tokens.css` optional split, imported there). Theme = shadcn convention: light tokens on `:root`, dark tokens on `.dark` (class on `<html>`). Tailwind reads them through the `@theme inline` block (`bg-background`, `text-foreground`, etc).

**Mapping design tokens → shadcn variables.** shadcn's `--accent` is a *hover surface*, not a brand color. Brand color is our own `--brand`.

| Design token (tables below) | shadcn variable(s) |
|---|---|
| `--bg` | `--background` |
| `--fg` | `--foreground`, `--card-foreground`, `--popover-foreground`, `--primary` |
| `--bg` (text on solid button) | `--primary-foreground` |
| `--surface-1` | `--card`, `--popover` |
| `--surface-2` | `--secondary`, `--muted`, `--accent` (hover surface) |
| `--fg-secondary` | `--secondary-foreground`, `--accent-foreground`; also custom `--fg-secondary` |
| `--fg-muted` | `--muted-foreground` |
| `--border` | `--border`, `--input` |
| `--surface-3`, `--border-strong`, `--brand`, `--brand-foreground` | custom vars, exposed in `@theme inline` (`bg-surface-3`, `border-strong`, `text-brand`, ...) |
| `--brand` | also `--ring` (focus ring) |
| radius | `--radius: 0.375rem` |

Unused shadcn vars (`--destructive`, `--chart-*`, `--sidebar-*`): keep defined with values from the palette so nothing renders off-palette.

Values below = starting point. **Verify contrast in Phase 1** and adjust; do not ship failing pairs.

**Dark**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#050505` | page background (AMOLED-ish, not `#000`) |
| `--surface-1` | `#0c0c0e` | section bands, nav |
| `--surface-2` | `#131316` | cards/rows on hover, chips |
| `--surface-3` | `#1b1b1f` | pressed/active, inputs |
| `--border` | `#26262b` | dividers, chip borders |
| `--border-strong` | `#3a3a41` | hover/focus-adjacent borders |
| `--fg` | `#f4f4f5` | headings, primary text |
| `--fg-secondary` | `#b8b8c0` | body copy |
| `--fg-muted` | `#8c8c96` | meta text (must stay ≥ 4.5:1 on `--bg`) |
| `--brand` | `#5eead4` | links, active nav, focus ring, key hover. **One accent only.** |
| `--brand-foreground` | `#04110e` | text on accent fill |

**Light** (smoky off-white, not inverted dark)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f3f2ee` | page background |
| `--surface-1` | `#ebeae5` | bands, nav |
| `--surface-2` | `#e3e1db` | hover, chips |
| `--surface-3` | `#d9d7d0` | pressed/active |
| `--border` | `#d4d1c9` | dividers |
| `--border-strong` | `#b9b5ab` | hover |
| `--fg` | `#18181b` | headings |
| `--fg-secondary` | `#44444c` | body |
| `--fg-muted` | `#666670` | meta (≥ 4.5:1 on `--bg`) |
| `--brand` | `#0f766e` | links, focus ring |
| `--brand-foreground` | `#f3f2ee` | text on accent fill |

Rules:

- Deepest black only for page bg. Layering: bg → surface-1 → surface-2 → surface-3. Do **not** use gray for everything; text and interactive elements must pop.
- No pure `#fff` or `#000` as dominant surfaces, either theme.
- No gradients except at most one very subtle radial/linear on hero (optional, cut if in doubt).
- No shadows in dark mode (use border + surface step). Light mode: at most a very soft, low-alpha shadow on the featured card.
- Interactive elements (links, buttons, active states) use `--fg` or `--brand` with visible contrast, never `--fg-muted`.
- Same layout, type, spacing, components, borders, motion in both themes. **Only tokens change.**

### 3.3 Border / Divider System

Signature element: fine **broken (dashed) lines**.

- Section separators: 1px dashed, `--border`. Implement with `repeating-linear-gradient` for controlled dash (e.g. 6px on / 4px off) so it renders identically across browsers, or `border-style: dashed` as fallback.
- Solid 1px `--border` for: chips, buttons, cards (featured project), inputs.
- Dashed for: section dividers, list row separators (certs), timeline connector.
- `Divider` = thin app wrapper over shadcn `Separator`, variants: `dashed` (default), `solid`.
- Never double up borders. Never thicker than 1px. Focus rings are the only 2px element.

### 3.4 Layout & Spacing

- Single centered column: `max-width: 720px` for reading sections; Projects featured card may extend to `860px`. Keeps mono line length ≤ ~75ch.
- Horizontal padding: `24px` mobile, `32px` ≥ 640px.
- Section vertical spacing: `96px` desktop, `64px` mobile.
- Spacing scale: 4/8/12/16/24/32/48/64/96. No off-scale values.
- Section header pattern: small index + label (`01 / experience`), dashed rule extends to right edge.

---

## 4. Section Blueprints

### 4.1 Hero

Purpose: identify me in 3 seconds. Give one clear next action.

Layout (≥ 640px):

```
[ (photo 96px circle) ]  Loriano Librado Jr.            [☾]
                          IT Support · Full-stack dev
                          [GH] [LI] [FB] [IG]   [ View Resume ↗ ]

──────────── dashed ────────────

Short intro (2–3 lines max)
Specialty lines (3, grouped)
```

- Photo: 96px circle (112px ≥ 1024px), 1px `--border-strong` ring, `object-fit: cover`. Placeholder until real photo provided. Provide `srcset` webp 96/192/288.
- Name = h1. Subtitle line = role tagline, muted.
- Socials: icon-only buttons, 36px hit area min 44px on touch, `aria-label` each ("GitHub", "LinkedIn", ...), `rel="noopener noreferrer"`, open new tab.
- **View Resume**: primary button (solid `--fg` bg / `--bg` text, or accent border variant, pick one, keep consistent). Links to `/resume.pdf`, opens new tab. Secondary small "download" affordance optional.
- **Theme toggle**: see §5. Sits in the same control row as socials, visually matching them (same size, same border treatment). Not a standalone button.
- Control order (per brief): Profile → Name → Social links → View Resume → Theme toggle. On desktop the toggle may float to the top-right of the hero block (same row as name) if that reads cleaner. **Decide during Phase 2 by looking at it**; keep it inside hero either way.

Intro copy structure (fill from `profile.ts`):

- Line 1: who + what. e.g. *"IT student and full-stack developer. I build web apps and fix what's broken."* (draft, user to approve)
- Then **3 grouped specialty lines**, each a plain text row with a dim label, not chips, not bullets:
  - `build   → Full-stack web development · UI/UX · Commission/project-based work`
  - `ai     → AI tool integration · AI-assisted engineering · AI-native development`
  - `system → Android modification · Tech generalist`
- This covers all 8 specialties without a list wall. Final wording = content pass with user.

Mobile (< 640px): photo + name stacked-left or photo above name, left-aligned. Socials wrap in one row. Resume button full width. Toggle stays in the top-right of hero.

### 4.2 Experience

- Uses shared `Timeline` component.
- Entry data:
  - title: `IT Support Specialist — OJT`
  - period: `Jun 1, 2026 – Sep 14, 2026` (machine-readable `<time datetime>`)
  - description: `Provided end-user technical support for hardware, software, and network issues in a corporate environment.`
  - `company` field: `TODO(content)` (ask user; brief has none)
- Timeline visual:
  - Vertical 1px **dashed** line on the left, `--border-strong`.
  - Node: 9px circle, 1px border, `--bg` fill; latest/current node filled `--brand`.
  - Entry content offset right of line. Date in muted meta above title.
  - "Root/tree" feel achieved by: single trunk line, nodes as branch points, optional short horizontal dashed stub from trunk to node. **No curves, icons, glows, or branching art.** Extra entries later just extend the trunk.
- Line fades at the bottom end (mask gradient) to imply "more to come". Subtle only.
- Mobile: same layout, trunk at 8px from left edge.

### 4.3 Projects

Structure: 1 featured + regular list.

**Featured**
- Full-width card, 1px solid border, `--surface-1` bg, cover image (16:10) on top or left (≥ 768px: 2-col image left, text right).
- Contents: title, 1–2 line description, tech chips (max 4), repo link + live link, stars/language from GitHub metadata.
- Emphasis via size + border + image, **not** color splashes.
- Suggested candidate: ClearOut (public, open-source). **User to confirm.**

**Regular**
- Compact rows, no images by default: `title — description — chips — links`, dashed separators. Hover: row bg → `--surface-2`, arrow nudge.
- Optional small thumbnail (64px) only if a good screenshot exists. Default off to avoid card clutter.
- 4–6 projects max shown. "View all on GitHub ↗" link at the end.

**Data approach (recommended): hybrid, curated + auto-enriched**

| Data | Source | Why |
|---|---|---|
| Which projects, order, featured flag, custom title/blurb, chips, live URL, screenshot | **Manual** `projects.ts` | Control over narrative. Repo descriptions are usually bad. |
| stars, primary language, `pushed_at`, repo URL, topics | **GitHub REST at build time** via `scripts/fetch-github.mjs` → `generated/github-repos.json` | No manual upkeep of numbers. No client-side API calls or rate limits. |
| Screenshots | **Manual, committed** `src/assets/projects/<slug>/cover.webp` | Auto screenshots are fragile. 1600×1000 webp, < 150KB. Featured gets 1, regulars optional. |

Rejected: fully dynamic list from all repos (noisy: forks, experiments, unfinished). Fully manual (stale stars).

`projects.ts` schema:

```ts
export type Project = {
  slug: string;              // stable id, matches assets folder
  repo: string;              // "owner/name"  (fetch key)
  title: string;
  blurb: string;             // <= 140 chars, written by hand
  featured?: boolean;        // exactly one true
  stack: string[];           // <= 4, must exist in stack.ts names
  liveUrl?: string;
  cover?: string;            // import path under assets/projects/<slug>/
  order: number;
  status?: "active" | "archived" | "wip";
};
```

- Fallback: if fetch fails or repo missing, render with manual data only, hide stars/lang. Site must build without network/token.
- Private/client repos (e.g. capstone/client systems): show **without** repo link, or omit. User decides per project.

### 4.4 Tech Stack

- Compact 2-column grid of category rows (1-col on mobile):

```
languages     [TypeScript] [JavaScript] [Rust]
frontend      [React] [Svelte] [Tailwind CSS] [HTML] [CSS]
backend/baas  [Node.js] [Supabase] [Firebase] [Cloudflare Workers]
tooling       [Vite] [npm] [Git] [GitHub Actions]
deployment    [Vercel] [Cloudflare]
design        [Figma] [Canva]
```

- Layout per row: category label (muted, fixed 120px col) + wrapping chips. Dashed divider between rows. Single column list of rows keeps it aligned/"justified".
- Chip = shadcn `Badge` (`outline`, restyled in `components/ui/badge.tsx`): 1px `--border`, `--surface-2` bg, radius 6px (not pill), 28px height, mono 13px, text `--fg-secondary`. **Text only. No logos** (avoids logo wall). Optional 12px monochrome glyph later, default off.
- Chips are non-interactive (no hover effects, not focusable). Use `<ul>` semantics.
- Data in `stack.ts` as `{ category, items: string[] }[]`.

### 4.5 Certifications

- Simple list, 5 rows, dashed separators. Not cards.
- Row: `name` (h3, primary) · `issuer` (secondary) · `date` (muted, right-aligned ≥ 640px, below on mobile) · optional `verify ↗` link.
- Schema:

```ts
export type Certification = {
  name: string;
  issuer: string;
  issued: string;        // "YYYY-MM"
  verifyUrl?: string;
};
```

- Content needed from user: 5 certificates (name, issuer, date, link). `TODO(content)` until given. Sort by `issued` desc.
- Hover on rows with verify link: subtle bg step + arrow shift. Rows without link: no hover.

### 4.6 Education

- Shared `Timeline` component, single node, matches Experience.
- `BSIT — Consolatrix College of Toledo City` · `2022 – 2027` · status "Expected 2027" as muted meta (**confirm wording**).
- Short. No description unless user adds one.

### 4.7 GitHub Activity

Goal: proof of consistency, not a dashboard.

- **Contribution graph: practical, yes.** Contributions require GraphQL API (`contributionsCollection`) which needs a token. Do it **in CI**, not client:
  - `.github/workflows/refresh-github-data.yml`: scheduled (daily) + manual dispatch. Runs `scripts/fetch-github.mjs` with a fine-grained/classic PAT (`read:user`) stored as a repo secret `GH_STATS_TOKEN`. Writes `src/data/generated/github-contributions.json`, commits, triggers redeploy.
  - Local dev without token: script exits 0 and uses committed snapshot.
  - Avoid third-party contribution proxy APIs/embeds (uptime, privacy, styling limits).
- **Render our own graph** from JSON: 53×7 grid of small squares (10px, 3px gap), 4 intensity levels using tint steps of `--brand` mixed into `--surface-2` (`color-mix`). Month labels top, no day labels on mobile. Horizontal scroll container on mobile, scrolled to latest week. Tooltip: date + count on hover/focus, no animation beyond opacity.
- Below graph: **max 3 stat lines** in plain text, e.g. `1,234 contributions in the last year · 12 public repos · last push 2 days ago`. No pie charts, language bars, streak badges, or follower counts.
- Heading style same as other sections. Small `github.com/RapzSenpai ↗` link. (Handle from profile, confirm.)
- Accessibility: graph is `aria-hidden` decorative + a visually-hidden text summary; tooltip content reachable via a `<table>` alternative is overkill, summary sentence is enough.
- Failure mode: if JSON missing/empty, hide the graph and show only the profile link.

### 4.8 Contact (CTA + Contact merged)

- Closing section, more whitespace, still same column width.
- One line CTA, low-pressure. Options (user picks; default first):
  1. `Open to internships, junior roles, and freelance work.`
  2. `Let's build something.`
  3. `Available for commissions.`
- Primary: mail button `lorianoalibrado@gmail.com` → `mailto:lorianoalibrado@gmail.com?subject=Hello%20from%20your%20portfolio`. Secondary: small "copy email" button with inline "Copied" state (aria-live polite).
- Social icons repeated as text links (`github`, `linkedin`, ...) row below.
- Optional availability line with small status dot (accent). Only if user wants; off by default.

### 4.9 Footer

- Dashed rule, one line: `© 2026 Loriano Librado Jr. · Built with React + Tailwind` and a "back to top ↑" link. Nothing else.

---

## 5. Theme System

- Values: `"dark" | "light"`. Storage key: `theme`.
- Resolution order: saved preference → `prefers-color-scheme` → dark default.
- **No flash**: inline blocking script in `index.html` `<head>` toggles the `dark` class on `document.documentElement` before paint. Also set `<meta name="color-scheme" content="dark light">` and update `<meta name="theme-color">` per theme.
- CSS: light tokens on `:root`, dark tokens on `.dark` (shadcn convention, with `@custom-variant dark (&:is(.dark *))`), plus `color-scheme: light` / `dark` set accordingly (native scrollbars/form controls).
- Switching: briefly add `data-theme-switching` on `<html>` that sets `transition: none` on all elements for one frame, then removes it (prevents a mess of mismatched per-element color transitions). Optionally a 150ms `background-color`/`color` transition on `body` only.
- Listen to `prefers-color-scheme` changes **only** if the user has no saved preference.

### Theme toggle spec

- Component: `ThemeToggle` = shadcn `Button` (`size="icon"`) + `Tooltip`. Icon button, same size/border as social icons (36×36 visual, ≥ 44px hit area on touch).
- Icon: **crescent moon (`Moon`)** as the identity of the control.
  - Dark active: outlined crescent moon.
  - Light active: swap to sun **or** keep the moon filled. **Default: moon in dark, sun in light**, so the icon shows current state. Crossfade 150ms (opacity + `scale(0.9→1)` + slight rotate ≤ 30°, ease-out). Confirm preference.
- `<button type="button" aria-label="Toggle theme" aria-pressed={isLight}>` plus visually-hidden current-state text ("Dark theme active") via `aria-live="polite"` region or `title`.
- States: hover → `--fg` icon + `--surface-2` bg; focus-visible → 2px `--brand` ring, 2px offset; active → `scale(0.97)`.
- Keyboard: Tab focus, Enter/Space toggles. No custom shortcut required (optional `t` key: skip, not worth it).
- Sits in hero control row with social icons, visually separated by a thin vertical dashed divider so it reads as "appearance," not another social.

---

## 6. Motion & Interaction Strategy

Apply `emilkowalski/skill` principles. Use the skill as source of truth; below are constraints for this project.

**Principles**
- Animate only to: confirm input, orient (nav/scroll), reveal hierarchy once, smooth state changes.
- Only animate `transform` and `opacity` (plus `background-color`/`border-color` on small elements). Never animate layout props (`height`, `top`, `margin`) except where unavoidable.
- Durations: micro-feedback 120–160ms, small reveals 200–260ms. **Nothing over 300ms.**
- Easing: strong ease-out for entering/responding. Define tokens:
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` (rare)
  - No default `ease`/`linear` for UI, no bounce/elastic.
- Never scale from 0; start reveals from `opacity: 0` + `translateY(8px)` (or `scale(0.96)` for popovers).
- Hover effects wrapped in `@media (hover: hover) and (pointer: fine)`.
- Buttons: `:active { transform: scale(0.97) }`, transition 120ms ease-out.
- Don't animate things used repeatedly/keyboard-driven (nav focus movement, tab focus).
- Tooltips/popovers: transform-origin from their trigger. First show has a small delay, subsequent shows instant if another is already open (graph tooltip).

**Where animation is allowed (complete list)**
1. Section entrance: fade + 8px rise, once, on first viewport entry (`IntersectionObserver`, `threshold ~0.15`, `rootMargin` `-10% 0px`). Stagger children max 40ms × 5 items.
2. Theme toggle icon crossfade.
3. Button/row hover + press feedback.
4. Nav active-section indicator (underline/opacity move, ≤ 200ms).
5. Timeline: node appear with section reveal. No line-drawing animation.
6. Copy-email "Copied" state swap.
7. Graph tooltip opacity.
8. Smooth scroll to anchors (`scroll-behavior: smooth`, disabled under reduced motion; offset with `scroll-margin-top` for sticky nav).

**Disallowed**: parallax, cursor effects, typewriter text, marquee, floating/idle animations, scroll-jacking, page-load splash, 3D tilt, animated gradients, number count-ups.

**Reduced motion**: under `prefers-reduced-motion: reduce`, remove transforms and smooth scroll; keep opacity fades ≤ 100ms or none. Content must be fully visible without JS animation (reveal classes must fail open: no-JS/observer failure = visible).

**Performance**: no layout thrash, no `will-change` unless measured need, reveal observer disconnects after firing.

---

## 7. Navigation

- Slim sticky top bar, ~48px, `--bg` at 85% + `backdrop-filter: blur(8px)`, bottom dashed border. Appears **after** scrolling past the hero (hero already has identity + controls).
- Contents: small mono name/initials on left, section anchors on right (`experience projects stack certs education github contact`). Active section highlighted via IntersectionObserver.
- Mobile (< 640px): **no hamburger**. Show a horizontally scrollable anchor row (no visible scrollbar, edge fade masks) or hide nav entirely and rely on scroll + "back to top". **Default: horizontal scroll row**, confirm on device.
- Skip link "Skip to content" as first focusable element.
- Theme toggle stays hero-only per brief. (Revisit: if it feels missing once scrolled, add a duplicate in nav in a later polish pass, not now.)

---

## 8. Responsive Behavior

Breakpoints (Tailwind defaults): `sm 640`, `md 768`, `lg 1024`.

| Section | < 640 | ≥ 640 | ≥ 768+ |
|---|---|---|---|
| Hero | photo + name stacked, buttons wrap, resume full width | photo left, name right | same, larger photo |
| Experience/Education | trunk left, content right, date above title | same | same |
| Featured project | image on top, text below | same | 2-col image left |
| Regular projects | stacked rows, chips wrap under text | title/blurb left, links right | same |
| Tech stack | label above chips | label left 120px column + chips | same |
| Certs | date under issuer | date right-aligned | same |
| GitHub graph | scroll-x, start at latest week | full width fits | full width |
| Contact | button full width | inline | same |

- Test widths: 320, 375, 414, 768, 1024, 1440. No horizontal page scroll at any width.
- Tap targets ≥ 44×44 on touch. Body text never below 14px.
- Sticky nav must not overlap anchors (`scroll-margin-top`).

---

## 9. Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `section[aria-labelledby]`, `footer`. One `h1`. Section labels are `h2`; items `h3`. Don't skip levels.
- Contrast: body/secondary ≥ 4.5:1, muted meta ≥ 4.5:1 (target), UI borders/icons ≥ 3:1 where they convey meaning. Check every token pair in both themes (Phase 1 task, document results in `docs/contrast.md`).
- Focus: visible 2px `--brand` ring, 2px offset, on every interactive element in both themes. Never `outline: none` without replacement.
- Keyboard: full tab order matches visual order. Skip link. Theme toggle, copy button, nav all reachable and operable.
- Links: distinguish from text by more than color where inline (underline offset). External links get `aria-label`/visually-hidden "(opens in new tab)".
- Icon-only buttons have `aria-label`. Decorative icons `aria-hidden`.
- Images: profile `alt="Portrait of Loriano Librado Jr."`; project covers have meaningful `alt` (describe UI) or `alt=""` if redundant.
- Dates in `<time datetime>`.
- Reduced motion honored (see §6).
- Zoom 200% no loss of content. Text resizes in `rem`.
- Contribution graph: `aria-hidden` + text summary.
- Run: axe, Lighthouse a11y ≥ 95, manual keyboard-only pass, screen reader smoke test (NVDA/VoiceOver) on hero, nav, theme toggle.

---

## 10. Static vs Dynamic

| Item | Type | When |
|---|---|---|
| Profile, experience, education, stack, certs | Static (`src/data/*.ts`) | edit + redeploy |
| Project selection, blurbs, screenshots, featured flag | Static, manual | edit + redeploy |
| Repo stars / language / pushed_at | **Build-time fetch** | every build + daily CI |
| Contribution calendar + totals | **CI-time fetch → committed JSON** | daily |
| Resume PDF | Static file `public/resume.pdf` | replace file |
| Theme | Client (localStorage + system) | runtime |
| Everything else | none | **No runtime API calls from the browser** |

Benefits: no rate limits, no token exposure, fast, works offline from cache, builds don't hard-fail on API outage.

---

## 11. Resume & Contact Strategy

- Resume: `public/resume.pdf`, single-page PDF, kept in sync manually. Filename `Loriano-Librado-Jr-Resume.pdf` (public URL stays `/resume.pdf`, with `download` attribute variant optional).
- "View Resume" opens PDF in new tab. Optional secondary "Download" link.
- Email: `lorianoalibrado@gmail.com` via `mailto:` plus copy button (handles users without a mail client). Do not obfuscate heavily; light obfuscation not needed (Gmail spam filtering OK).
- Meta: Open Graph + Twitter card (`og.png` 1200×630 dark surface with name + role), `<title>` = `Loriano Librado Jr. — Full-stack Developer & IT Support`, meta description ≤ 160 chars, canonical URL, favicon (SVG, theme-aware via `prefers-color-scheme` media in the SVG).
- JSON-LD `Person` schema (name, url, sameAs = socials, jobTitle).

---

## 12. Asset Strategy

- Profile photo: square crop source ≥ 600px, exported webp 96/192/288 + jpg fallback. `assets/profile/`.
- Project covers: webp, 1600×1000, < 150KB, dark and light readable (avoid pure white edges; add 1px border on the frame). `assets/projects/<slug>/cover.webp`.
- Icons: SVG only, inline via components. No icon fonts.
- OG image: static PNG in `public/`.
- All images have explicit `width`/`height`, `loading="lazy"` except hero photo (`fetchpriority="high"`). Avoid CLS.
- Fonts: preload the JetBrains Mono woff2 for weights used; `font-display: swap`.

---

## 13. Phases

Each phase ends with a **checklist** and a **skill review** (emilkowalski + taste-skill). Commit per phase.

### Phase 0 — Setup & Decisions
- [ ] Run `npx skills add Leonxlnx/taste-skill`
- [ ] Run `npx skills add emilkowalski/skill`
- [ ] Read both skills; note constraints that apply here in `docs/skills-notes.md` (short)
- [ ] Scaffold: `npx shadcn@latest init -t vite` (React + TS + Tailwind v4 + shadcn; base `radix`). Add ESLint/Prettier if missing.
- [ ] Repo init, `.gitignore`, `README.md`, `docs/TODO.md`
- [ ] Collect content from user (see §14). Missing items → `TODO(content)`
- [ ] Confirm decisions in §14

**Done when**: app runs, skills installed, content inventory exists.

### Phase 1 — Foundation
- [ ] `tokens.css`: dark + light tokens (§3.2), spacing, radii, easing, durations
- [ ] Replace shadcn default CSS variables with this plan's tokens using the §3.2 mapping table; add custom vars to `@theme inline`
- [ ] JetBrains Mono self-hosted, type scale (§3.1) as utilities/components
- [ ] Theme system: no-flash inline script, `.dark` class, storage, `color-scheme`, `theme-color`
- [ ] `npx shadcn@latest add button badge separator tooltip avatar` and restyle centrally to the design system
- [ ] App-level: `Divider` (over `Separator`), `Section` (index + label + dashed rule), `Link`
- [ ] Global focus-visible ring, reduced-motion base, skip link
- [ ] Contrast audit both themes → `docs/contrast.md`; adjust tokens until all pass
- [ ] A throwaway `/kitchen-sink` view (dev only) showing tokens/components in both themes

**Done when**: switching theme is flicker-free, all token pairs pass contrast, primitives look identical in structure across themes.

### Phase 2 — Hero + Theme Toggle
- [ ] Hero layout (§4.1), placeholder photo, name, tagline
- [ ] Social icon buttons (GitHub, Facebook, Instagram, LinkedIn) with simple-icons, real URLs from user
- [ ] View Resume button → `/resume.pdf` (placeholder file ok)
- [ ] `ThemeToggle` per §5 spec, integrated into control row
- [ ] Intro + 3 specialty lines from `profile.ts`
- [ ] Mobile layout pass at 320/375/414

**Done when**: hero communicates who/what in ≤ 3 seconds; toggle keyboard-operable with visible state; no horizontal scroll at 320px.

### Phase 3 — Timeline (Experience + Education)
- [ ] `Timeline` component (dashed trunk, nodes, end fade)
- [ ] Experience section from `experience.ts`
- [ ] Education section reuse
- [ ] Both themes visual check (trunk + nodes readable in light)

**Done when**: timeline reads clean, not decorative; adding a second entry requires only data change.

### Phase 4 — Projects + GitHub Metadata Pipeline
- [ ] `projects.ts` + type + validation (exactly one featured, stack names exist)
- [ ] `scripts/fetch-github.mjs`: REST fetch by `repo`, write `generated/github-repos.json`; graceful failure; optional `GITHUB_TOKEN` for rate limit
- [ ] `prebuild` runs the script
- [ ] `npx shadcn@latest add card aspect-ratio`. Featured card + regular rows (§4.3)
- [ ] Capture and add cover screenshots (manual)
- [ ] Fallback rendering when metadata missing
- [ ] "View all on GitHub ↗"

**Done when**: build succeeds offline; stars/language appear when data present; featured clearly dominant without color noise.

### Phase 5 — Tech Stack + Certifications
- [ ] `stack.ts` + rows layout (§4.4)
- [ ] `certifications.ts` (5 entries) + list (§4.5)
- [ ] Mobile layouts

**Done when**: stack fits in a compact block, no logos, alignment consistent; certs sorted and legible.

### Phase 6 — GitHub Activity
- [ ] GraphQL contributions fetch in `fetch-github.mjs` (token `GH_STATS_TOKEN`)
- [ ] `refresh-github-data.yml` scheduled workflow (daily + manual) committing JSON
- [ ] `npx shadcn@latest add scroll-area`. `ContributionGraph` component (own render, `color-mix` intensity levels)
- [ ] Tooltip (focus + hover), mobile scroll-x to latest
- [ ] ≤ 3 stat lines, profile link, hidden text summary
- [ ] Empty/failure state

**Done when**: graph legible in both themes, mobile scrollable, no runtime GitHub calls, doesn't dominate the page.

### Phase 7 — Contact + Footer + Nav
- [ ] Merged CTA + contact section (§4.8) with mailto + copy button
- [ ] Footer (§4.9)
- [ ] Sticky nav with active-section tracking, mobile anchor row (§7)
- [ ] `scroll-margin-top`, smooth scroll

**Done when**: every section reachable by nav and keyboard; email copy state announced.

### Phase 8 — Motion & Polish (Emil Kowalski pass)
- [ ] Implement section reveal (once, fail-open), stagger cap
- [ ] Button/row hover + `:active` scale, hover media query guards
- [ ] Theme toggle icon transition, nav indicator, tooltip behavior
- [ ] Audit every transition: property, duration ≤ 300ms, easing token, reduced-motion behavior
- [ ] Audit shadcn `components/ui/*` animations (`tw-animate-css` durations/easing) against §6
- [ ] Remove anything that doesn't improve hierarchy/feedback/navigation/perceived quality
- [ ] Taste-skill pass: anything generic, cluttered, or "AI portfolio"-ish → cut

**Done when**: turning all motion off leaves a fully usable site; motion on adds polish without drawing attention.

### Phase 9 — Accessibility, Performance, SEO
- [ ] axe + Lighthouse (Perf ≥ 95, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95) on mobile profile
- [ ] Keyboard-only walkthrough, screen reader smoke test
- [ ] 200% zoom, 320px, reduced motion, forced-colors sanity check
- [ ] OG/Twitter meta, JSON-LD, favicon, sitemap/robots (single URL, minimal)
- [ ] Bundle check: no unused deps; JS budget ~ < 100KB gzip

**Done when**: all scores met, issues logged/fixed.

### Phase 10 — Deploy
- [ ] Pick host: Vercel or Cloudflare Pages (connect repo, build `npm run build`, output `dist`)
- [ ] Env/secrets: `GH_STATS_TOKEN` in GitHub Actions secrets
- [ ] Redeploy hook on data refresh commit
- [ ] Custom domain (optional), HTTPS, redirects
- [ ] Final content proofread, resume PDF final, links tested (all socials, mailto, resume, verify links)
- [ ] Share preview test (OG image) on LinkedIn/Facebook debuggers

**Done when**: public URL live, all links verified, data refresh workflow proven once end-to-end.

---

## 14. Open Items (need from user)

Defaults in **bold** if unanswered.

**User inserts missing content manually** (photo, URLs, resume PDF, certs, OJT company, screenshots). Agent: build with typed placeholders in `src/data/*.ts`, each marked `TODO(content)`. Never invent real data. Add a `check:todo` script that fails if any `TODO(content)` remains, run before deploy.

- [ ] Real name display: **`Loriano Librado Jr.`**
- [ ] Profile photo (square, ≥ 600px) — **placeholder until given**
- [ ] URLs: GitHub (**`github.com/RapzSenpai`**), LinkedIn, Facebook, Instagram
- [ ] Resume PDF — **placeholder until given**
- [ ] OJT company name (**omit**), location/arrangement
- [ ] 5 certificates: name, issuer, date, verify link
- [ ] Framework: **Vite** via `npx shadcn@latest init -t vite`
- [ ] Featured project (**ClearOut**) + which repos are public and show in list; private/client projects: **omit repo link**
- [ ] Project screenshots (manual capture)
- [ ] Accent color: **teal (`#5eead4` dark / `#0f766e` light)**, or none/neutral
- [ ] Theme icon behavior: **moon in dark, sun in light**
- [ ] CTA wording: **"Open to internships, junior roles, and freelance work."**
- [ ] Education status text: **"Expected 2027"**
- [ ] Hero tagline: **"IT Support · Full-stack developer"**
- [ ] Host: **Vercel**; custom domain: **none for now**
- [ ] Nav on mobile: **horizontal anchor row**

---

## 15. Definition of Done (whole project)

- Reads as a well-made technical resume, not a showcase of effects.
- Dark and light feel like one design; only color/surface tokens differ.
- Text is readable everywhere; primary and interactive elements clearly stand out.
- No runtime GitHub API calls; site builds without network.
- All Phase checklists complete; a11y/perf targets met.
- Adding a project, cert, or experience entry = editing one data file.
- All UI primitives come from shadcn/ui (`components/ui/*`), restyled centrally; no duplicate hand-rolled buttons/badges/tooltips.
