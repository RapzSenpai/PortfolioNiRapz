// Fetches stars / language / pushed_at for the repos named in projects.ts and
// writes src/data/generated/github-repos.json.
//
// Also writes src/data/generated/github-contributions.json for the activity
// graph in plan 4.7. Repo stars come from the anonymous REST API, but the
// contribution calendar is GraphQL only and needs a token, so that half is
// skipped unless GH_STATS_TOKEN (or GITHUB_TOKEN) is set. The daily workflow in
// .github/workflows/refresh-github-data.yml supplies it and commits the result,
// which is why that file is not gitignored.
//
// Runs as npm prebuild, so the site must never fail to build because of it:
// every failure path here still writes a valid JSON file and exits 0. The site
// renders without stars, language, or a graph whenever those files are empty.
//
// GITHUB_TOKEN is optional for the REST half. Without it GitHub allows 60
// requests per hour per IP, which is plenty for one build; with it the limit is
// 5000. The GraphQL half needs a token either way.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { projects } from "../src/data/projects.ts"
import { profile } from "../src/data/profile.ts"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const OUT = join(root, "src", "data", "generated", "github-repos.json")
const ACTIVITY_OUT = join(
  root,
  "src",
  "data",
  "generated",
  "github-contributions.json"
)

function isPlaceholder(value) {
  return typeof value !== "string" || value.startsWith("TODO(")
}

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "portfolio-build",
}
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
}

// Plan 4.7 says take the handle from the profile rather than repeat it here.
const githubHref = profile.socials.find(
  (social) => social.platform === "github"
)?.href
const login = isPlaceholder(githubHref)
  ? undefined
  : githubHref.replace(/^.*github\.com\//, "").replace(/[/?#].*$/, "")

const statsToken = process.env.GH_STATS_TOKEN || process.env.GITHUB_TOKEN

const repos = [
  ...new Set(
    projects
      .map((project) => project.repo)
      .filter((repo) => !isPlaceholder(repo))
  ),
]

if (repos.length === 0) {
  console.log("fetch-github: no real repos in projects.ts, nothing to fetch")
}

const out = {}

for (const repo of repos) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })

    // 404 covers renamed, deleted, and private repos alike. Either way there is
    // nothing to show, which is the same as a fetch failure to the renderer.
    if (res.status === 404) {
      console.warn(`fetch-github: ${repo} not found or private, skipping`)
      continue
    }
    if (res.status === 403) {
      console.warn(`fetch-github: ${repo} rate limited or forbidden, skipping`)
      continue
    }
    if (!res.ok) {
      console.warn(`fetch-github: ${repo} HTTP ${res.status}, skipping`)
      continue
    }

    const json = await res.json()
    out[repo] = {
      url: json.html_url,
      stars: json.stargazers_count,
      language: json.language,
      pushedAt: json.pushed_at,
    }
  } catch (error) {
    // Offline, DNS failure, timeout: all non-fatal by design.
    console.warn(`fetch-github: ${repo} ${error.name}, skipping`)
  }
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`)

console.log(
  `fetch-github: wrote ${Object.keys(out).length} of ${repos.length} repo(s) to src/data/generated/github-repos.json`
)

// ---------------------------------------------------------------------------
// Plan 4.7. Two independent halves, because they have different permissions.
// ---------------------------------------------------------------------------

const activity = {
  login: login ?? null,
  publicRepos: null,
  lastPush: null,
  total: 0,
  days: [],
}

// The plan's third stat line is "last push N days ago". Taking it from the repo
// responses already fetched above keeps this section reading a single file
// instead of reaching into github-repos.json.
const pushedAts = Object.values(out)
  .map((repo) => repo.pushedAt)
  .filter(Boolean)
  .sort()
if (pushedAts.length > 0) {
  activity.lastPush = pushedAts[pushedAts.length - 1]
}

if (login) {
  // REST, no token required.
  try {
    const res = await fetch(`https://api.github.com/users/${login}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const json = await res.json()
      activity.publicRepos = json.public_repos ?? null
    } else {
      console.warn(`fetch-github: user ${login} HTTP ${res.status}`)
    }
  } catch (error) {
    console.warn(`fetch-github: user ${login} ${error.name}, skipping`)
  }

  // GraphQL, token required. Skipped silently rather than warned about when
  // there is simply no token, because that is the normal local case.
  if (statsToken) {
    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${statsToken}`,
          "Content-Type": "application/json",
          "User-Agent": "portfolio-build",
        },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          query: `{
            user(login: ${JSON.stringify(login)}) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks { contributionDays { date contributionCount } }
                }
              }
            }
          }`,
        }),
      })

      if (!res.ok) {
        console.warn(`fetch-github: graphql HTTP ${res.status}, no graph`)
      } else {
        const body = await res.json()
        if (body.errors) {
          console.warn(
            `fetch-github: graphql error: ${body.errors[0]?.message}, no graph`
          )
        } else {
          const calendar =
            body.data?.user?.contributionsCollection?.contributionCalendar
          if (calendar) {
            activity.total = calendar.totalContributions ?? 0
            // Column major, which is exactly how the grid wants it.
            activity.days = calendar.weeks.flatMap((week) =>
              week.contributionDays.map((day) => [
                day.date,
                day.contributionCount,
              ])
            )
          }
        }
      }
    } catch (error) {
      console.warn(`fetch-github: graphql ${error.name}, no graph`)
    }
  } else {
    console.log(
      "fetch-github: no GH_STATS_TOKEN, keeping the committed contribution snapshot"
    )
  }
}

mkdirSync(dirname(ACTIVITY_OUT), { recursive: true })

// Only write the snapshot when this run actually produced a graph. Without a
// token the GraphQL half is skipped, and writing then would overwrite the
// committed snapshot with an empty one — on every Vercel build, which has no
// token. That would delete the data the daily workflow committed and leave the
// graph permanently empty. The workflow is the single writer; the build only
// writes when it has something newer.
if (activity.days.length > 0 || !existsSync(ACTIVITY_OUT)) {
  writeFileSync(ACTIVITY_OUT, `${JSON.stringify(activity, null, 2)}\n`)
  console.log(
    `fetch-github: wrote activity for ${login ?? "nobody"} (${activity.publicRepos ?? "?"} public repos, ${activity.days.length} days) to src/data/generated/github-contributions.json`
  )
} else {
  const existing = JSON.parse(readFileSync(ACTIVITY_OUT, "utf8"))
  console.log(
    `fetch-github: kept the committed snapshot (${existing.days.length} days, no token to refresh it)`
  )
}
