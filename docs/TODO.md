# Content TODO

Every placeholder in the site is a literal `TODO(content)` string in `src/data/*.ts`.
Run `npm run check:todo` to list them. The script exits non-zero while any remain, so it
blocks deploy until this file is empty.

## Inventory

| # | File | Field | What is needed | Default if unanswered |
|---|---|---|---|---|
| 1 | `src/data/profile.ts` | `photo.src` | Profile photo, square crop, 600px or larger. Export to webp at 96/192/288 plus a jpg fallback. Drop in `src/assets/profile/`. | Placeholder avatar until supplied |
| 2 | `src/data/profile.ts` | `socials[linkedin].href` | LinkedIn profile URL | Omit the entry |
| 3 | `src/data/profile.ts` | `socials[facebook].href` | Facebook profile URL | Omit the entry |
| 4 | `src/data/profile.ts` | `socials[instagram].href` | Instagram profile URL | Omit the entry |
| 5 | `src/data/experience.ts` | `company` | OJT employer name and arrangement | Omit the field. The brief lists no employer, so the entry reads as a role with dates only. |
| 6 | `src/data/certifications.ts` | all 5 entries | Certificate name, issuer, issue date as `YYYY-MM`, verify link. Five rows exactly. | Section hides until at least one is real |
| 7 | `src/data/projects.ts` | `clearout.blurb` | Hand-written description, 140 characters or fewer | Required, no default |
| 8 | `src/data/projects.ts` | `clearout.stack` | Up to 4 stack names, each must match a name in `stack.ts` | Required, no default |
| 9 | `src/data/projects.ts` | `clearout.liveUrl` | Deployed URL | Omit the field |
| 10 | `src/data/projects.ts` | `clearout.cover` | Screenshot at 1600x1000 webp under 150KB, saved as `src/assets/projects/clearout/cover.webp`. Drop the file in and it is picked up automatically, no code change. | Omit the field, card renders text only |
| 11 | `src/data/projects.ts` | remaining entries | Which other repos are public and worth listing. Private or client repos get no repo link. | Only ClearOut shows |

## Real data fetched from GitHub

`scripts/fetch-github.mjs` confirmed ClearOut is real and public as
`RapzSenpai/clearout`: primary language **Rust**, 0 stars, last pushed
2026-09-15, description *"Deep Windows uninstaller — removes apps and hunts
leftovers"*. Those numbers refresh themselves on every build.

The description is the obvious seed for item 7, the hand-written blurb. It is
**not** used automatically: plan 4.3 marks the blurb as authored copy, and a
repo description is written for people who already know the project.

The card currently shows the title, the language, and a Source link, and hides
the blurb, chips, live URL, and cover while they are still placeholders.

## Assets not tracked by the script

| Item | Where | Status |
|---|---|---|
| Resume PDF | `public/resume.pdf` | Placeholder, 917 bytes, one page of Courier saying the real PDF is not supplied yet. Swap for the real file before deploy. |
| Photo `srcset` | `src/components/hero.tsx` | No `srcset` yet, because there is no photo to size. When item 1 lands, add webp 96/192/288 plus `sizes`, and `fetchpriority="high"` per plan 12. |
| Open Graph image | `public/og.png` | Done. 1200x630, dark surface, name plus role. |
| Favicon | `public/favicon.svg` | Done. Theme-aware via a `prefers-color-scheme` media query inside the SVG. |

## Manual QA, not automated

Everything below needs a real browser and a real person, so no script covers
it. `check:audit` runs axe and the performance budget, not any of this.

| Check | How | Notes |
|---|---|---|
| Keyboard only | Tab through the whole page, `Shift+Tab` back, activate every control with `Enter` and `Space` | Focus ring visibility, skip link, graph scroll container, tooltip escape |
| Screen reader | VoiceOver or NVDA over Hero, Projects, Contact | Heading order announced as a sensible outline, Tech Stack read as term/definition, graph described rather than read cell by cell |
| 200% zoom | Browser zoom, not text-only zoom | No horizontal scrollbar, no clipped nav, no overlap |
| 320px width | Devtools device toolbar | Widest element must not overflow; the nav is the usual culprit |
| Reduced motion | Devtools emulation, or `prefers-reduced-motion: reduce` | Sections must be visible, not stuck at `opacity: 0` |
| Forced colors | Windows High Contrast, or devtools `forced-colors: active` | Dashed rules and the brand accent use CSS variables that forced-colors does not remap. Known unverified risk, not yet worked around. |
| Light and dark by eye | Toggle the theme at each breakpoint | Token swaps only; any layout difference is a bug |
| Margins and spacing | Full read-through at desktop width | Deliberately left to review rather than driven by tokens |

## Automated Phase 9 baseline

`npm run check:audit`, mobile, production build:

| Category | Score |
|---|---|
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

CLS 0, LCP 1.7s, TBT 60ms. Bundle is 345 kB raw / 112 kB gzip against a plan
target of roughly 100 kB gzip. The gap is React 19 plus five Radix primitives,
all in use; no unused dependency was found, and nothing was cut to chase the
number. The plan target is approximate, so this is recorded rather than chased.

## Deviations from the plan, on the record

- **LinkedIn icon source.** Plan 2 says the four brand marks come from
  `simple-icons`. LinkedIn was taken down from Simple Icons (legal takedown), so
  that one glyph comes from `react-icons/fa` (`FaLinkedin`). GitHub, Facebook
  and Instagram are still `simple-icons`. Both barrels tree-shake to the single
  glyphs actually used, verified against the built bundle.
- **Accent colour.** Plan lists `#5eead4` dark / `#0f766e` light. Light is now
  `#0b665e` because `#0f766e` failed contrast on the hover surface. See
  `docs/contrast.md`.
- **Timeline trunk contrast.** Plan 4.2 puts the trunk and the ring on a past
  node on `--border-strong`. That token is 1.83:1 on the light background and
  1.81:1 on the dark one, both under the 3:1 that WCAG 1.4.11 sets for non-text
  UI. Both are 1px decorative marks and the entry text carries the meaning on
  its own, so this is treated as pure decoration and left subtle per plan. The
  brand-filled current node, which is the part that actually says "this is the
  current entry", is 6.09:1 light and 13.78:1 dark and is checked at 3:1 by
  `npm run check:contrast`. **Worth an eyeball in the browser.** If the trunk
  reads as invisible, darken `--border-strong` in both themes rather than
  special-casing the timeline.
- **One `<dl>` per Tech Stack row.** Plan 4.4 renders the stack as a definition
  list with the dashed rule between rows. Nesting the rule element inside a
  single `<dl>` is invalid, and Lighthouse confirmed it: `definition-list` and
  `dlitem` both failed at 92 accessibility. Each row is now its own `<dl>` with
  the rule as a sibling. `npm run check:a11y` fails if a non-`dt`/`dd`/`div`
  element ever reappears inside a `<dl>`.
- **The build does not overwrite the contribution snapshot.** `prebuild` runs
  `fetch-github.mjs` on the host, where there is no `GH_STATS_TOKEN`, and the
  GraphQL half is skipped without one. It used to write the empty result anyway,
  which meant every deploy deleted the calendar the daily workflow had just
  committed. The script now writes the file only when it fetched a calendar, or
  when no file exists yet. Verified three ways: a tokenless run preserves 371
  days, a fresh clone with no file still gets a valid one, and a 401 from a bad
  token is a no-op rather than a wipe.

## Confirmed, not placeholders

- Name: `Loriano Librado Jr.`
- GitHub: `github.com/RapzSenpai`
- Email: `lorianoalibrado@gmail.com`
- Tagline: `IT Support · Full-stack developer`
- Education: BSIT, Consolatrix College of Toledo City, 2022 to 2027, expected 2027
- OJT dates: 2026-06-01 to 2026-09-14
- Accent: teal, `#5eead4` dark and `#0b665e` light
- CTA: `Open to internships, junior roles, and freelance work.`
- Host: Vercel, no custom domain
