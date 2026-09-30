import * as React from "react"
import { cn } from "cn"

/** One entry on the trunk. Content is passed in rather than typed here so the
 *  Experience and Education sections can each map their own data shape while
 *  still sharing the visual. */
export type TimelineEntry = {
  /** Stable key. Data only, no index maths at the call site. */
  key: string
  /** Muted line above the title, normally a pair of <time> elements. */
  period: React.ReactNode
  title: React.ReactNode
  /** Trailing muted note after the period, for example "Expected 2027". */
  status?: React.ReactNode
  description?: React.ReactNode
  /** Fills the node in brand. Defaults to the last entry, which is the
   *  current one on a resume ordered oldest first. */
  current?: boolean
}

type TimelineProps = {
  entries: TimelineEntry[]
  className?: string
}

/** Trunk sits 8px from the left edge, so the node column is 17px wide: that
 *  centres a node on the trunk without any negative offsets. */
export function Timeline({ entries, className }: TimelineProps) {
  return (
    <ol className={cn("relative", className)}>
      {/* One line for the whole list, so a second entry just extends it. */}
      <span
        aria-hidden="true"
        className="timeline-trunk absolute inset-y-0 left-2 w-px"
      />

      {entries.map((entry, index) => {
        const filled = entry.current ?? index === entries.length - 1

        return (
          <li
            key={entry.key}
            className="grid grid-cols-[17px_1fr] gap-x-4 pb-8 last:pb-0"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-[2px] size-[9px] justify-self-center rounded-full border",
                filled ? "border-brand bg-brand" : "border-border-strong"
              )}
            />

            <div className="min-w-0">
              <p className="text-label text-fg-muted uppercase">
                {entry.period}
                {entry.status ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    {entry.status}
                  </>
                ) : null}
              </p>

              <h3 className="mt-2 text-base font-medium text-foreground">
                {entry.title}
              </h3>

              {entry.description ? (
                <p className="mt-2 max-w-[62ch] text-body text-fg-secondary">
                  {entry.description}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
