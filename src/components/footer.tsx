import { Divider } from "@/components/divider"
import { profile } from "@/data/profile"

/** Plan 4.9: one line, dashed rule, back to top. Nothing else. */
export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[720px] px-6 pb-12 sm:px-8">
      <Divider className="mb-6" />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-label text-fg-muted uppercase">
          {`© ${new Date().getFullYear()} ${profile.name} · Built with React + Tailwind`}
        </p>
        <a
          href="#hero"
          className="text-label text-fg-secondary uppercase transition-colors duration-micro ease-out pointer-fine:hover:text-foreground"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
