import * as React from "react"
import { Section } from "@/components/section"
import { Divider } from "@/components/divider"
import { Badge } from "@/components/ui/badge"
import { stack } from "@/data/stack"
import { TECH_ICONS } from "@/data/tech-icons"

// Eager so the icons are in the bundle as URLs. The path is static, so a glob
// would resolve at build time and a missing file would be a type error rather
// than a broken image at runtime.
const iconFiles = import.meta.glob("../assets/tech/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

function iconFor(name: string) {
  const file = TECH_ICONS[name]
  return file ? iconFiles[`../assets/tech/${file}`] : undefined
}

/** Plan 4.4. One column of rows, each a fixed-width category label plus
 *  wrapping chips, dashed rule between rows. Chips are non-interactive, so
 *  there is nothing to focus and no hover to design.
 *
 *  The icons are decorative: the technology name is already the chip's text, so
 *  the image is aria-hidden and the text carries the meaning. */
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
                  {row.items.map((item) => {
                    const icon = iconFor(item)
                    return (
                      <li key={item}>
                        <Badge
                          variant="outline"
                          className="gap-1.5 py-1.5 text-fg-secondary"
                        >
                          {icon ? (
                            <img
                              src={icon}
                              alt=""
                              aria-hidden="true"
                              width={14}
                              height={14}
                              className="size-3.5 shrink-0 opacity-80"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                          {item}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              </dd>
            </dl>
          </React.Fragment>
        ))}
      </div>
    </Section>
  )
}
