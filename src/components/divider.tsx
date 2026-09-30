import * as React from "react"
import { cn } from "cn"
import { Separator } from "@/components/ui/separator"

type DividerProps = React.ComponentProps<typeof Separator> & {
  variant?: "dashed" | "solid"
}

/** App wrapper over shadcn Separator. Dashed is the plan's default, so a bare
 *  <Divider /> already reads as the section rule. */
export function Divider({
  variant = "dashed",
  className,
  ...props
}: DividerProps) {
  return (
    <Separator
      className={cn(
        variant === "dashed" ? "rule-dashed" : "rule-solid",
        className
      )}
      {...props}
    />
  )
}
