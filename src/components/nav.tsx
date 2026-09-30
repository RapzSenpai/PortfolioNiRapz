import * as React from "react"
import { cn } from "cn"
import { Divider } from "@/components/divider"
import { profile } from "@/data/profile"

const ANCHORS = [
  { id: "experience", label: "experience" },
  { id: "projects", label: "projects" },
  { id: "stack", label: "stack" },
  { id: "certifications", label: "certs" },
  { id: "education", label: "education" },
  { id: "github", label: "github" },
  { id: "contact", label: "contact" },
]

/** Plan 7. Slim sticky bar that only exists once the hero is behind you, since
 *  the hero already carries identity and the theme toggle.
 *
 *  Active section comes from an IntersectionObserver rather than a scroll
 *  handler: the browser already computes intersection on the compositor, and a
 *  scroll listener would put this component on the main thread for every frame
 *  of a long page. */
export function Nav() {
  const [shown, setShown] = React.useState(false)
  const [active, setActive] = React.useState<string | null>(null)
  const [anchors, setAnchors] = React.useState(ANCHORS)

  React.useEffect(() => {
    const hero = document.getElementById("hero")
    if (!hero) return

    // -64px top margin: the bar shows once the hero's bottom edge has cleared
    // the bar's own height, so the bar never lands on top of hero content.
    const observer = new IntersectionObserver(
      ([entry]) => setShown(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 }
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const sections = ANCHORS.map((anchor) =>
      document.getElementById(anchor.id)
    ).filter((element): element is HTMLElement => element !== null)

    // A band across the top fifth of the viewport. Whichever section occupies
    // it, in document order, is the active one.
    const visible = new Set<string>()
    let filtered = false

    const observer = new IntersectionObserver(
      (entries) => {
        // Certifications hides itself until it has real content, so a static
        // list would link to an id that is not in the document. Done here
        // rather than in the effect body: this callback fires when the first
        // observe() lands, and setting state synchronously in an effect body
        // triggers a cascading render.
        if (!filtered) {
          filtered = true
          setAnchors(
            ANCHORS.filter((anchor) => document.getElementById(anchor.id))
          )
        }

        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id)
          } else {
            visible.delete(entry.target.id)
          }
        }
        setActive(sections.find((s) => visible.has(s.id))?.id ?? null)
      },
      { rootMargin: "-72px 0px -66% 0px", threshold: 0 }
    )

    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [])

  if (!shown) return null

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-[8px]">
      <div className="mx-auto flex h-12 w-full max-w-[720px] items-center gap-4 px-6 sm:px-8">
        <a
          href="#hero"
          className="shrink-0 text-label font-medium text-fg-secondary uppercase transition-colors duration-micro ease-out pointer-fine:hover:text-foreground"
        >
          {initials}
        </a>

        <nav aria-label="Sections" className="nav-scroll min-w-0 flex-1">
          <ul className="flex items-center gap-1">
            {anchors.map((anchor) => {
              const isActive = active === anchor.id
              return (
                <li key={anchor.id}>
                  <a
                    href={`#${anchor.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative block rounded-sm px-2 py-1 text-label uppercase transition-colors duration-micro ease-out",
                      isActive
                        ? "text-brand"
                        : "text-fg-muted pointer-fine:hover:text-fg-secondary"
                    )}
                  >
                    {anchor.label}
                    <span
                      aria-hidden="true"
                      className="nav-link-underline"
                      data-active={isActive ? "true" : undefined}
                    />
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <Divider />
    </header>
  )
}
