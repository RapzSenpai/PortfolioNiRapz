import { ArrowUpRight } from "lucide-react"
import {
  siFacebook,
  siGithub,
  siInstagram,
  type SimpleIcon,
} from "simple-icons"
import { FaLinkedin } from "react-icons/fa"
import { cn } from "cn"
import { profile, type SocialPlatform } from "@/data/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Divider } from "@/components/divider"
import { ThemeToggle } from "@/components/theme-toggle"

/** Plan 2 names simple-icons for the brand marks. LinkedIn is the exception:
 *  it was taken down from Simple Icons, so that one glyph comes from
 *  react-icons. See docs/TODO.md. */
const SIMPLE_ICONS: Partial<Record<SocialPlatform, SimpleIcon>> = {
  github: siGithub,
  facebook: siFacebook,
  instagram: siInstagram,
}

/** 36px visual, 44px on touch, which is the smallest comfortable tap target. */
const ICON_CONTROL =
  "size-9 rounded-md text-fg-secondary transition-colors duration-micro ease-out pointer-fine:hover:bg-secondary pointer-fine:hover:text-foreground active:scale-[0.97] [@media(pointer:coarse)]:size-11"

function isPlaceholder(value: string) {
  return value.startsWith("TODO(")
}

function BrandIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === "linkedin") {
    return <FaLinkedin aria-hidden="true" className="size-4" />
  }

  const icon = SIMPLE_ICONS[platform]
  if (!icon) {
    return null
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="size-4 fill-current"
    >
      <path d={icon.path} />
    </svg>
  )
}

export function Hero() {
  const { name, tagline, intro, specialties, photo, socials } = profile
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  return (
    <div
      id="hero"
      className="mx-auto w-full max-w-[720px] px-6 pt-20 pb-16 sm:px-8 md:pt-32 md:pb-24"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <Avatar
          className={cn(
            "size-24 rounded-full after:border-border-strong lg:size-28",
            "[&_svg]:size-full"
          )}
        >
          {isPlaceholder(photo.src) ? null : (
            <AvatarImage src={photo.src} alt={photo.alt} />
          )}
          <AvatarFallback className="bg-secondary text-name text-fg-secondary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="text-name">{name}</h1>
          <p className="mt-2 text-body text-fg-muted">{tagline}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {socials.map((social) => {
              const pending = isPlaceholder(social.href)

              if (pending) {
                return (
                  <Button
                    key={social.platform}
                    variant="outline"
                    size="icon"
                    disabled
                    aria-label={`${social.label} (link not set yet)`}
                    title={`${social.label} URL not set yet`}
                    className={ICON_CONTROL}
                  >
                    <BrandIcon platform={social.platform} />
                  </Button>
                )
              }

              return (
                <Button
                  key={social.platform}
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={ICON_CONTROL}
                  >
                    <BrandIcon platform={social.platform} />
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </Button>
              )
            })}

            {/* Plan 5: a dashed rule so the toggle reads as appearance, not as
                a fifth social link. */}
            <Divider orientation="vertical" className="mx-1 h-6 self-center" />

            <ThemeToggle />

            <Button asChild className="ml-auto w-full sm:ml-0 sm:w-auto">
              <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                View Resume
                <ArrowUpRight aria-hidden="true" />
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Divider className="mt-12" />

      <p className="mt-8 max-w-[62ch] text-body text-fg-secondary">{intro}</p>

      <dl className="mt-8 space-y-3">
        {specialties.map((specialty) => (
          <div key={specialty.label} className="flex gap-4">
            <dt className="w-24 shrink-0 text-body text-fg-muted sm:w-28">
              {specialty.label}
              <span aria-hidden="true" className="float-right">
                →
              </span>
            </dt>
            <dd className="min-w-0 text-body text-fg-secondary">
              {specialty.text}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
