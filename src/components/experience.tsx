import { Section } from "@/components/section"
import { Timeline } from "@/components/timeline"
import { formatDate } from "@/lib/date"
import { experience } from "@/data/experience"

/** Plan 4.2. The company is omitted rather than printed as a placeholder marker
 *  while the brief supplies none; see docs/TODO.md item 5. */
export function Experience() {
  return (
    <Section index="02" label="Experience" headingId="experience">
      <Timeline
        entries={experience.map((entry) => {
          const company =
            entry.company && !entry.company.startsWith("TODO(")
              ? entry.company
              : undefined

          return {
            key: `${entry.start}-${entry.title}`,
            period: (
              <>
                <time dateTime={entry.start}>{formatDate(entry.start)}</time>
                <span aria-hidden="true"> – </span>
                <time dateTime={entry.end}>{formatDate(entry.end)}</time>
              </>
            ),
            title: (
              <>
                {entry.title}
                {company ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="text-fg-muted">{company}</span>
                  </>
                ) : null}
              </>
            ),
            description: entry.description,
          }
        })}
      />
    </Section>
  )
}
