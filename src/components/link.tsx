import * as React from "react"
import { cn } from "cn"

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Opens in a new tab and announces that it does. */
  external?: boolean
}

/** shadcn has no text-link primitive, so this wraps a plain anchor. Underline
 *  offset carries the link/non-link distinction so colour is not the only cue. */
export function Link({
  external = false,
  className,
  children,
  target,
  rel,
  ...props
}: LinkProps) {
  return (
    <a
      className={cn(
        "text-brand underline decoration-brand/40 underline-offset-4 transition-colors duration-micro ease-out pointer-fine:hover:decoration-brand",
        className
      )}
      target={external ? "_blank" : target}
      rel={external ? "noopener noreferrer" : rel}
      {...props}
    >
      {children}
      {external ? <span className="sr-only"> (opens in new tab)</span> : null}
    </a>
  )
}
