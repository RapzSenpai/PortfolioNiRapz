import { Moon, Sun } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/components/theme-provider"

type ThemeToggleProps = {
  className?: string
}

/** Plan 5. The icon shows the current theme: moon while dark, sun while light.
 *  aria-pressed reports the light state, and the current theme is also spelled
 *  out for a screen reader rather than left to the icon alone. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          aria-pressed={!isDark}
          className={cn(
            "relative size-9 rounded-md text-fg-secondary transition-colors duration-micro ease-out active:scale-[0.97] pointer-fine:hover:bg-secondary pointer-fine:hover:text-foreground",
            className
          )}
        >
          <Moon
            data-theme-icon=""
            aria-hidden="true"
            className={cn(
              "absolute size-4 transition-[opacity,transform] duration-micro ease-out",
              isDark
                ? "scale-100 rotate-0 opacity-100"
                : "scale-90 -rotate-30 opacity-0"
            )}
          />
          <Sun
            data-theme-icon=""
            aria-hidden="true"
            className={cn(
              "absolute size-4 transition-[opacity,transform] duration-micro ease-out",
              isDark
                ? "scale-90 rotate-30 opacity-0"
                : "scale-100 rotate-0 opacity-100"
            )}
          />
          <span className="sr-only">
            {isDark ? "Dark theme active" : "Light theme active"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Switch to {isDark ? "light" : "dark"} theme
      </TooltipContent>
    </Tooltip>
  )
}
