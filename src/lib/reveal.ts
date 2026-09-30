import * as React from "react"

/** Plan 8.1: each section fades up once, on first viewport entry.
 *
 * One observer for the whole page rather than one per section, and it
 * disconnects as soon as everything has fired, so a long scroll does not keep
 * a callback alive for the rest of the session.
 *
 * Fail-open is handled in CSS, not here: the hidden state is scoped to
 * [data-js] on <html>, so if this file never runs the content is already
 * visible. That is why there is no state and no cleanup path here. */
const STAGGER_STEP_MS = 40
const STAGGER_MAX_ITEMS = 5

function reveal(element: HTMLElement) {
  const children = Array.from(element.children).slice(
    0,
    STAGGER_MAX_ITEMS
  ) as HTMLElement[]

  for (const [index, child] of children.entries()) {
    child.style.setProperty("--reveal-delay", `${index * STAGGER_STEP_MS}ms`)
    child.setAttribute("data-reveal", "")
  }

  // Commit the hidden state above before applying shown. Setting both in one
  // task lets the browser coalesce them into a single computed style, and the
  // children would jump straight to visible with no fade at all. This one read
  // happens before the next paint, so nothing flashes in between.
  void element.offsetHeight

  for (const child of children) child.setAttribute("data-reveal", "shown")
  element.setAttribute("data-reveal", "shown")
}

export function useRevealOnScroll() {
  React.useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal-root]")
    )
    if (targets.length === 0) return

    // No IntersectionObserver means no way to know what is on screen, so show
    // everything rather than leaving the page blank.
    if (typeof IntersectionObserver === "undefined") {
      for (const element of targets) reveal(element)
      return
    }

    const pending = new Set(targets)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const target = entry.target as HTMLElement
          reveal(target)
          pending.delete(target)
          observer.unobserve(target)
        }
        if (pending.size === 0) observer.disconnect()
      },
      { threshold: 0.15, rootMargin: "-10% 0px" }
    )

    for (const element of targets) observer.observe(element)
    return () => observer.disconnect()
  }, [])
}
