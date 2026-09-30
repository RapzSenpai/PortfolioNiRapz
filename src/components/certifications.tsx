import { ArrowUpRight } from "lucide-react"
import { cn } from "cn"
import { Section } from "@/components/section"
import { Divider } from "@/components/divider"
import { Link } from "@/components/link"
import { formatMonthYear } from "@/lib/date"
import { isPlaceholder } from "@/lib/placeholders"
import { certifications } from "@/data/certifications"

/** Plan 4.5: plain rows with dashed separators, not cards. Newest first. */
export function Certifications() {
  const rows = certifications
    .filter((cert) => !isPlaceholder(cert.name))
    .toSorted((a, b) => b.issued.localeCompare(a.issued))

  // Item 6 in docs/TODO.md: the section hides until at least one is real.
  if (rows.length === 0) {
    return null
  }

  return (
    <Section index="05" label="Certifications" headingId="certifications">
      <ul>
        {rows.map((cert, index) => {
          const verifyUrl = isPlaceholder(cert.verifyUrl)
            ? undefined
            : cert.verifyUrl
          const issued = isPlaceholder(cert.issued)
            ? undefined
            : formatMonthYear(cert.issued)

          return (
            <li key={`${cert.issued}-${cert.name}`}>
              {index > 0 ? <Divider /> : null}

              {/* Hover only on rows that actually have a link to follow, so an
                  unclickable row does not pretend to be clickable. */}
              <div
                className={cn(
                  "-mx-3 flex flex-col gap-2 rounded-md px-3 py-5 sm:flex-row sm:items-baseline sm:gap-6",
                  verifyUrl &&
                    "transition-colors duration-micro ease-out pointer-fine:hover:bg-secondary"
                )}
              >
                <div className="min-w-0 sm:flex-1">
                  <h3 className="text-base font-medium text-foreground">
                    {cert.name}
                  </h3>
                  {!isPlaceholder(cert.issuer) ? (
                    <p className="mt-1 text-body text-fg-secondary">
                      {cert.issuer}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  {issued ? (
                    <time
                      dateTime={cert.issued}
                      className="text-label text-fg-muted uppercase"
                    >
                      {issued}
                    </time>
                  ) : null}

                  {verifyUrl ? (
                    <Link
                      external
                      href={verifyUrl}
                      className="group/verify inline-flex items-center gap-1"
                    >
                      Verify
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3.5 transition-transform duration-micro ease-out group-hover/verify:translate-x-0.5 group-hover/verify:-translate-y-0.5"
                      />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
