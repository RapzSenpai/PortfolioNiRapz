import { Section } from "@/components/section"
import { Timeline } from "@/components/timeline"
import { formatYear } from "@/lib/date"
import { education } from "@/data/education"

/** Plan 4.6. Same Timeline as Experience, single node, years only. */
export function Education() {
  return (
    <Section index="06" label="Education" headingId="education">
      <Timeline
        entries={education.map((entry) => ({
          key: entry.school,
          period: (
            <>
              <time dateTime={entry.start}>{formatYear(entry.start)}</time>
              <span aria-hidden="true"> – </span>
              <time dateTime={entry.end}>{formatYear(entry.end)}</time>
            </>
          ),
          status: entry.status,
          title: `${entry.degree} — ${entry.school}`,
          description: entry.description,
        }))}
      />
    </Section>
  )
}
