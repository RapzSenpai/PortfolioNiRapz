import { Divider } from "@/components/divider"
import { profile } from "@/data/profile"

/** Plan 4.9: dashed rule, credit line, back to top. */
export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[720px] px-6 pb-12 sm:px-8">
      <Divider className="mb-6" />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-label text-fg-muted uppercase">
          {`© ${new Date().getFullYear()} ${profile.name}`}
          {/* Second sentence carries the personality, so it steps down in size
              and goes italic rather than competing with the name on one line.
              No opacity here: it composites text-fg-muted down to 4.21:1 on
              the dark background, under the 4.5:1 floor. Smaller and italic
              already sets it apart. */}
          <span className="block text-[0.75rem] normal-case italic">
            Still sharpening. Every mistake is a lesson.
          </span>
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
