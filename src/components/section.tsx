import * as React from "react"
import { cn } from "cn"
import { Divider } from "@/components/divider"

type SectionProps = {
  /** Two digit section number as written in the plan, for example "01". */
  index: string
  label: string
  /** Wires up section[aria-labelledby] without the caller repeating the id. */
  headingId: string
  children: React.ReactNode
  className?: string
}

/** One resume section: index + label, then the dashed rule, then content.
 *  The index is one step brighter than the label rather than brand-coloured,
 *  so a long page does not end up with nine accent marks on it. */
export function Section({
  index,
  label,
  headingId,
  children,
  className,
}: SectionProps) {
  return (
    <section
      aria-labelledby={headingId}
      // Plan line 232: one centered 720px column for reading sections, 24px
      // padding on mobile and 32px from 640px up. This is the single place that
      // sets it. The hero, nav, and footer each repeat the same values because
      // they are not Sections, and the vertical padding is halved from the old
      // py-16 md:py-24 because it used to apply to both edges of every section,
      // which put 192px between two sections instead of a 96px rhythm.
      className={cn(
        "mx-auto w-full max-w-[720px] scroll-mt-16 px-6 py-12 sm:px-8 md:py-16",
        className
      )}
    >
      {/* scroll-mt here, not only on the section: the anchor target is this
          h2, because that is what carries the id, and scroll-margin-top only
          applies to the element being scrolled to. Plan 8 requires the sticky
          nav not to overlap the heading it just scrolled to. */}
      <h2
        id={headingId}
        className="scroll-mt-16 text-label font-medium text-fg-muted uppercase"
      >
        <span className="text-fg-secondary">{index}</span>
        <span aria-hidden="true"> / </span>
        {label}
      </h2>
      <Divider className="mt-3" />
      <div className="mt-8" data-reveal-root>
        {children}
      </div>
    </section>
  )
}
