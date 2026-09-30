/* eslint-disable react-refresh/only-export-components -- a provider and the
   hook that reads it belong together; splitting them means exporting the
   context, which the rule would flag just as loudly. */
import * as React from "react"

export type Theme = "dark" | "light"

const STORAGE_KEY = "theme"
const DARK_QUERY = "(prefers-color-scheme: dark)"

const THEME_COLOR: Record<Theme, string> = {
  dark: "#050505",
  light: "#f3f2ee",
}

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

/** Read back what the pre-paint script in index.html already decided. */
function readAppliedTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

/** Move the DOM. Deliberately does not persist: following the OS must not
 *  write a preference the visitor never expressed. */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute("data-theme-switching", "")
  root.classList.toggle("dark", theme === "dark")
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme])
  // Two frames with transitions suppressed, then release. One is not enough:
  // the style recalc has not happened yet.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.removeAttribute("data-theme-switching"))
  })
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(readAppliedTheme)

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked. The theme still applies for this page view.
    }
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [setTheme, theme])

  React.useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(STORAGE_KEY) !== null) {
          return
        }
      } catch {
        // Cannot tell whether a preference exists. Follow the OS for this view.
      }
      const next = event.matches ? "dark" : "light"
      applyTheme(next)
      setThemeState(next)
    }

    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
