import * as React from "react"
import { Section } from "@/components/section"
import { Divider } from "@/components/divider"
import { Badge } from "@/components/ui/badge"
import { stack } from "@/data/stack"

/** Plan 4.4. One column of rows, each a fixed-width category label plus
 *  wrapping chips, dashed rule between rows. Chips are text only, no logos, and
 *  non-interactive, so there is nothing to focus and no hover to design. */
export function TechStack() {
  return (
    <Section index="04" label="Tech Stack" headingId="stack">
      {/* One dl per row, with the rule between them rather than inside. A div
          wrapper inside a dl is only valid when that div holds the dt/dd group
          itself, so a separator element in there breaks the list. Moving the
          rule out keeps every dl a plain, correctly ordered group. */}
      <div>
        {stack.map((row, index) => (
          <React.Fragment key={row.category}>
            {index > 0 ? <Divider /> : null}
            <dl className="flex flex-col gap-2 py-5 sm:flex-row sm:gap-6">
              <dt className="shrink-0 text-body text-fg-muted sm:w-[120px]">
                {row.category}
              </dt>
              <dd className="min-w-0 flex-1">
                <ul className="flex flex-wrap gap-2">
                  {row.items.map((item) => (
                    <li key={item}>
                      <Badge variant="outline">{item}</Badge>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </React.Fragment>
        ))}
      </div>
    </Section>
  )
}
