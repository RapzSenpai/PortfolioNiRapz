# PortfolioNiRapz

Single-page interactive resume. Dark and light themes, JetBrains Mono, one accent
color, dashed rules. Static build, no runtime API calls.

Built phase by phase from [`PORTFOLIO_PLAN.md`](./PORTFOLIO_PLAN.md). That file is
the spec, including every design decision and acceptance check.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (radix base)

Motion is CSS only. No animation library unless a component genuinely needs one.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run prebuild` | Runs automatically before `build`. Fetches GitHub metadata; never fails the build. |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the repo. Correctness and bug detection only. |
| `npm run typecheck` | `tsc -b`, project references, no emit |
| `npm run format` | Prettier over source files. Rewrites in place. |
| `npm run format:check` | Prettier in check mode. Non-zero exit if anything is unformatted. |
| `npm run verify` | All gates in order: format check, lint, typecheck, date check, project check, contrast check, structural a11y check, placeholder check |
| `npm run check:todo` | List every remaining `TODO(content)` placeholder. Exits non-zero while any exist, so it blocks deploy. |
| `npm run check:dates` | Formats every date under two timezones 26 hours apart and requires identical output, so a date can never silently shift a day. Also pins the `YYYY-MM` certification months to the 1st, so December cannot roll into January. |
| `npm run check:projects` | Structure of `projects.ts`: exactly one featured, unique slugs and order, stack names resolve against `stack.ts`, blurb length. Skips placeholders, which are `check:todo`'s job. |
| `npm run check:contrast` | Every text pair in both themes at 4.5:1, plus the non-text pairs at 3:1. |
| `npm run check:a11y` | Structural assertions that a linter can catch: heading order, one `h1`, alt text, label association, `<dl>` shape, and tap-target size on touch viewports. Complements `check:contrast`; it is not a substitute for Lighthouse. |
| `npm run check:audit` | Lighthouse against a throwaway production preview, then prints the four category scores and exits non-zero below 95. Needs Chrome on `PATH`, or set `CHROME_PATH`. |

## Accessibility and performance

Colour contrast is enforced by `check:contrast`; DOM structure is enforced by
`check:a11y`; the rendered result is enforced by `check:audit`. They overlap on
purpose, because each catches what the others cannot:

- `check:contrast` reads CSS variables, so it sees token values no test can
  observe in a browser.
- `check:a11y` reads source and rendered HTML, so it catches malformed nesting
  (a `<div>` inside a `<dl>`, an unlabelled control) that axe only reports once
  hydrated.
- `check:audit` runs real axe rules plus the performance budget.

Current mobile baseline is 99 / 100 / 100 / 100 for performance, accessibility,
best practices, and SEO, with CLS 0. `check:audit` is not in `verify` because it
needs a browser and a preview server; run it before a release.

## GitHub metadata

`scripts/fetch-github.mjs` runs as `npm prebuild` and writes two files under
`src/data/generated/`:

- `github-repos.json` (gitignored) — stars, language, and pushed date per repo
- `github-contributions.json` (committed) — public repo count, last push, and
  the contribution calendar

Set `GITHUB_TOKEN` to lift the 60 requests-per-hour anonymous limit; it is
optional and never required.

The contribution calendar is GraphQL only and needs a token, so it is not
fetched during a normal build. `.github/workflows/refresh-github-data.yml` runs
daily and on demand with the `GH_STATS_TOKEN` repo secret, then commits the
snapshot, which is what triggers a redeploy. Until that secret exists the file
has an empty `days` array and the graph renders nothing.

**The workflow is the only writer of the snapshot.** A build without a token
does not overwrite it. That matters because `prebuild` also runs on the host,
which has no token: if the build wrote an empty calendar it would delete the
data the workflow just committed, and the graph would be permanently empty no
matter how well the daily refresh worked. A build writes the file only when it
actually fetched a calendar, or when the file does not exist yet.

Every failure path — offline, DNS, timeout, 404, 401, rate limited, missing
token — still exits 0, so the site builds with no network. The components read
both files through `import.meta.glob`, which is why a fresh clone can
`npm run verify` before anything has been fetched.

### `GH_STATS_TOKEN`

A classic personal access token with the `read:user` scope and nothing else.
That scope reads contribution data and cannot touch private repos, write
anything, or reach other settings. Fine-grained tokens do not expose
`contributionsCollection`, so `read:user` is the one that works.

Set it as a repo secret under Settings → Secrets and variables → Actions. Give
it an expiry. When it lapses the workflow stops committing, the graph quietly
freezes at its last snapshot, and nothing fails loudly — so re-check it after
the first expiry.

Do not add it to the host's environment. The workflow owns this file.

## Formatting and linting

They are separate tools with separate jobs, and they do not fight:

- **Prettier owns formatting.** It runs in `.prettierrc` with
  `prettier-plugin-tailwindcss`, which is what keeps the long `cva()` class
  strings in `components/ui/*` sorted and readable.
- **ESLint owns correctness.** Unused vars, hook rules, unsafe code.
- **`eslint-config-prettier` is the last entry in `eslint.config.js`.** It
  switches off every stylistic rule so ESLint cannot reformat what Prettier
  owns. Nothing goes after it.

Prettier is scoped to `src/**`, `scripts/**`, and root `*.ts` / `*.js`. Markdown,
`tsconfig*.json`, and the agent harness dotfiles are deliberately untouched, so
`PORTFOLIO_PLAN.md` stays byte-identical. shadcn output is already
Prettier-clean, so `npx shadcn add` produces no formatting churn.

## Content

All resume content lives in `src/data/*.ts`. Components hold zero hardcoded copy.
Adding a project, certificate, or job entry means editing one data file and
redeploying.

| File | Holds |
|---|---|
| `profile.ts` | Name, tagline, intro, specialty lines, email, CTA, photo, socials |
| `experience.ts` | Employment entries |
| `education.ts` | Degree entries |
| `projects.ts` | Curated project list, order, featured flag, blurbs, chips |
| `stack.ts` | Tech stack grouped by category |
| `certifications.ts` | Certificate entries, sorted by issue date |
| `generated/` | Build-time GitHub data, written by `scripts/fetch-github.mjs` |

Missing content uses a literal `TODO(content)` marker. Each one is listed in
[`docs/TODO.md`](./docs/TODO.md) with what it is waiting on.

## Design system

Tokens live in `src/index.css`, the file shadcn reads through its `@theme inline`
block. Dark and light themes differ only by token values, never by layout, type,
spacing, or motion.

One accent. Teal `#5eead4` on dark, `#0b665e` on light. Borders are 1px, and
section dividers are dashed. The light accent is darker than the plan's
`#0f766e` because that value failed contrast on the hover surface; see
`docs/contrast.md`.

The full palette, type scale, spacing scale, and motion budgets are specified in
`PORTFOLIO_PLAN.md` sections 3 and 6. Restyle centrally in `src/index.css` or
`components/ui/*`, never with per-usage overrides.

## Layout

```
src/
  components/
    ui/            shadcn components, restyled centrally
    <app level>    Section, Divider, Timeline, ThemeToggle, ContributionGraph
  data/            all resume content
  lib/             cn, date formatting, reveal observer
  assets/          images
public/            favicon, og image, resume PDF, robots.txt, sitemap.xml
scripts/           fetch-github.mjs, check-todo.mjs, check-dates.mjs,
                   check-projects.mjs, check-contrast.mjs, check-a11y.mjs,
                   check-audit.mjs
docs/              TODO inventory, contrast audit, skill notes
```

## Deploy

Vercel, build `npm run build`, output `dist`. Set `GH_STATS_TOKEN` in GitHub
Actions secrets before enabling the daily data refresh.

Vercel needs no config: it detects Vite, runs `npm run build`, and serves
`dist/`. `prebuild` fetches GitHub data and never fails the build, so a fresh
clone deploys without any secret.

Before the first deploy, replace the placeholder domain everywhere at once. It
appears in 6 places, and all of them must match or social previews and the
sitemap point at a host that does not exist:

```
index.html         canonical, og:url, og:image, twitter:image, JSON-LD url
public/sitemap.xml <loc>
```

The site URL is not a build variable on purpose: `index.html` is static HTML,
so nothing can inject a value at build time without a templating step that
would break the no-config deploy. One source, six copies, and `grep` finds
them all:

```
grep -rn "portfolionirapz.vercel.app" index.html public src
```

## Checks

`npm run verify` is the gate that must pass before every commit. It is expected
to fail on `check:todo` while any `TODO(content)` placeholder remains; every
other gate must pass at all times.

`npm run check:audit` is not in `verify` because it needs Chrome and a preview
server. It skips cleanly when `CHROME_PATH` is unset, so it is safe in a script
that may run on a machine without a browser:

```
CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm run check:audit
```
