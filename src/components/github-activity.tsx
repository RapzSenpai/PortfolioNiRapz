import * as React from "react"
import { ArrowUpRight } from "lucide-react"
import { Section } from "@/components/section"
import { Link } from "@/components/link"
import { formatRelative } from "@/lib/date"
import { isPlaceholder } from "@/lib/placeholders"
import { profile } from "@/data/profile"

type Activity = {
  login: string | null
  publicRepos: number | null
  /** Newest pushed_at across the repos in projects.ts, or null if none. */
  lastPush: string | null
  total: number
  /** Column major: 53 entries per week, 7 weeks tall. [date, count] pairs. */
  days: [string, number][]
}

// Same reason as the repo metadata file: this is committed by the workflow and
// may not exist on a fresh clone, so it cannot be a static import.
// import:"default" yields the parsed file rather than its module namespace.
// Without it the namespace happens to expose the top level keys as named exports
// so `activity.days` works, while Object.values() returns the object wrapped in
// `default`. That is a Vite implementation detail, not something to depend on.
const ACTIVITY_PATH = "../data/generated/github-contributions.json"
const activityFiles = import.meta.glob<Activity>("../data/generated/*.json", {
  eager: true,
  import: "default",
})

// Annotated rather than inferred: `activityFiles[PATH] ?? {}` widens to a union
// with the fallback and loses the field types.
const activity = (activityFiles[ACTIVITY_PATH] ?? {}) as Activity

const DAYS = 7

/** Plan 4.7: tint steps of --brand mixed into the surface, four levels. Count 0
 *  stays on the plain surface so an empty day reads as absent, not as level 1. */
function levelColor(count: number) {
  if (count <= 0) return "var(--secondary)"
  const pct = count <= 3 ? 25 : count <= 6 ? 50 : count <= 9 ? 75 : 100
  return `color-mix(in oklab, var(--brand) ${pct}%, var(--secondary))`
}

const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
})

export function GitHubActivity() {
  const href = profile.socials.find(
    (social) => social.platform === "github"
  )?.href
  const login = isPlaceholder(href)
    ? undefined
    : href.replace(/^.*github\.com\//, "").replace(/[/?#].*$/, "")

  const days = activity.days ?? []
  const weeks: [string, number][][] = []
  for (let i = 0; i < days.length; i += DAYS) {
    weeks.push(days.slice(i, i + DAYS))
  }

  const hasGraph = weeks.length > 0
  const stats = [
    hasGraph
      ? `${activity.total.toLocaleString("en-US")} contributions in the last year`
      : null,
    activity.publicRepos
      ? `${activity.publicRepos} public ${activity.publicRepos === 1 ? "repo" : "repos"}`
      : null,
  ].filter((line): line is string => line !== null)

  const pushedAt = activity.lastPush ?? undefined

  // Plan 4.7: mobile scrolls horizontally and opens on the most recent week.
  const scrollRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  if (login === undefined) {
    return null
  }

  // Month label sits over the first week that starts a new month, in the same
  // column grid as the squares so the two can never drift apart.
  const monthLabels = weeks.map((week, index) => {
    const previous = weeks[index - 1]?.[0]?.[0]
    const current = week[0]?.[0]
    if (!current) return null
    const month = MONTH.format(new Date(`${current}T00:00:00Z`))
    const previousMonth = previous
      ? MONTH.format(new Date(`${previous}T00:00:00Z`))
      : null
    return month === previousMonth ? null : month
  })

  return (
    <Section index="07" label="GitHub Activity" headingId="github">
      <p className="text-label uppercase">
        <Link
          external
          href={`https://github.com/${login}`}
          className="inline-flex items-center gap-1"
        >
          github.com/{login}
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </p>

      {hasGraph ? (
        <>
          <div
            ref={scrollRef}
            className="mt-6 overflow-x-auto pb-1"
            // Scrolling to the latest week on mount can fire a scroll event
            // with nothing to announce, so this stays quiet for screen readers.
            aria-label="Contribution graph, scrollable"
            tabIndex={0}
          >
            <div className="w-max">
              <div
                className="grid gap-[3px] pb-1"
                // Inline rather than a grid-cols-[repeat(53,10px)] class: the
                // count has to match the square grid exactly, and a literal
                // would drift the moment the API returns a different week count.
                style={{
                  gridTemplateColumns: `repeat(${weeks.length}, 10px)`,
                }}
                aria-hidden="true"
              >
                {monthLabels.map((month, index) => (
                  <span
                    key={index}
                    className="text-[9px] leading-none text-fg-muted uppercase"
                  >
                    {month ?? ""}
                  </span>
                ))}
              </div>

              {/* Plan 4.7: decorative, so it is hidden from assistive tech and
                  the sentence below carries the same information. */}
              <div
                className="grid grid-flow-col grid-rows-7 gap-[3px]"
                aria-hidden="true"
              >
                {weeks.flatMap((week, weekIndex) =>
                  week.map(([date, count], dayIndex) => (
                    <span
                      key={`${weekIndex}-${dayIndex}`}
                      className="size-2.5 rounded-[2px]"
                      style={{ backgroundColor: levelColor(count) }}
                      // Hover only. A styled tooltip would need 371 focusable
                      // targets inside an aria-hidden tree, which is worse than
                      // a native one on a decorative graph.
                      title={`${count} ${count === 1 ? "contribution" : "contributions"} on ${date}`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <p className="sr-only">
            {`Contribution graph for ${login}: ${activity.total.toLocaleString("en-US")} contributions in the last year.`}
          </p>

          {stats.length > 0 || pushedAt ? (
            <p className="mt-6 text-body text-fg-secondary">
              {[
                ...stats,
                pushedAt ? `last push ${formatRelative(pushedAt)}` : null,
              ]
                .filter((line): line is string => line !== null)
                .join(" · ")}
            </p>
          ) : null}
        </>
      ) : null}
    </Section>
  )
}
