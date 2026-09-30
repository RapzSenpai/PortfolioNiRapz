import * as React from "react"
import { Check, Copy, Mail } from "lucide-react"
import { Section } from "@/components/section"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/link"
import { isPlaceholder } from "@/lib/placeholders"
import { profile } from "@/data/profile"

const SUBJECT = "Hello%20from%20your%20portfolio"

/** Plan 4.8. One CTA, one primary mail action, one convenience copy button, and
 *  the socials repeated as text. Anything not filled in yet is left out rather
 *  than rendered as a dead link. */
export function Contact() {
  const [copied, setCopied] = React.useState(false)
  const email = isPlaceholder(profile.email) ? undefined : profile.email

  React.useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  async function copyEmail() {
    if (!email) return
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
    } catch {
      // Clipboard needs a secure context, and can be blocked by permissions.
      // The mail button above is the real path, so failing quietly is fine.
      setCopied(false)
    }
  }

  const socials = profile.socials.filter(
    (social) => !isPlaceholder(social.href)
  )

  return (
    <Section
      index="08"
      label="Contact"
      headingId="contact"
      className="py-24 md:py-32"
    >
      {!isPlaceholder(profile.cta) ? (
        <p className="text-name font-bold text-foreground">{profile.cta}</p>
      ) : null}

      {email ? (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <a href={`mailto:${email}?subject=${SUBJECT}`}>
              <Mail data-icon="inline-start" aria-hidden="true" />
              {email}
            </a>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={copyEmail}
            className="text-fg-secondary"
          >
            {copied ? (
              <Check data-icon="inline-start" aria-hidden="true" />
            ) : (
              <Copy data-icon="inline-start" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy email"}
          </Button>

          <span aria-live="polite" className="sr-only">
            {copied ? "Email address copied to clipboard" : ""}
          </span>
        </div>
      ) : null}

      {socials.length > 0 ? (
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {socials.map((social) => (
            <li key={social.platform}>
              <Link external href={social.href} className="text-body">
                {social.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  )
}
