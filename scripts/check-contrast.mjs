import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const css = readFileSync(join(root, "src/index.css"), "utf8")

function parseBlock(selector) {
  // Anchored to a line start on purpose: ".dark" also appears inside
  // `@custom-variant dark (&:is(.dark *))`, which is not the theme block.
  const match = new RegExp(
    `^\\s*${selector.replace(".", "\\.")}\\s*\\{`,
    "m"
  ).exec(css)
  if (!match) {
    throw new Error(`no ${selector} block in src/index.css`)
  }
  const open = match.index + match[0].length - 1
  const close = css.indexOf("}", open)
  const out = {}
  for (const [, name, value] of css
    .slice(open + 1, close)
    .matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    out[`--${name}`] = value.trim()
  }
  return out
}

function hexToRgb(hex) {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`not a hex colour: ${hex}`)
  }
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

const channel = (v) => {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Every text pair that can reach the screen, in both themes. Plan 9:
// body/secondary and muted meta must clear 4.5:1.
const PAIRS = [
  ["--foreground", "--background"],
  ["--foreground", "--card"],
  ["--foreground", "--popover"],
  ["--foreground", "--secondary"],
  ["--foreground", "--surface-3"],
  ["--card-foreground", "--card"],
  ["--popover-foreground", "--popover"],
  ["--primary-foreground", "--primary"],
  ["--secondary-foreground", "--secondary"],
  ["--secondary-foreground", "--muted"],
  ["--secondary-foreground", "--surface-3"],
  ["--accent-foreground", "--accent"],
  ["--muted-foreground", "--background"],
  ["--muted-foreground", "--card"],
  ["--muted-foreground", "--popover"],
  ["--muted-foreground", "--muted"],
  ["--muted-foreground", "--accent"],
  ["--muted-foreground", "--surface-3"],
  ["--fg-secondary", "--background"],
  ["--fg-secondary", "--card"],
  ["--fg-secondary", "--secondary"],
  ["--fg-secondary", "--surface-3"],
  ["--fg-muted", "--background"],
  ["--fg-muted", "--surface-3"],
  ["--brand", "--background"],
  ["--brand", "--card"],
  ["--brand", "--secondary"],
  ["--brand", "--accent"],
  ["--brand", "--surface-3"],
  ["--brand-foreground", "--brand"],
]

const MIN = 4.5

// Non-text pairs. WCAG 1.4.11 asks for 3:1 on the parts that identify a
// component, not on text. The timeline node is one of those: it is what says
// "this entry is the current one". Its fill is --brand.
const NON_TEXT_MIN = 3
const NON_TEXT_PAIRS = [
  ["--brand", "--background"],
  ["--brand", "--card"],
  ["--brand", "--secondary"],
  ["--brand-foreground", "--brand"],
]

// Deliberately NOT checked: the timeline trunk and the ring on a past node,
// both --border-strong. Plan 4.2 asks for a subtle rule, and at 1.83:1 light
// / 1.81:1 dark that is what subtle costs. Both are 1px decorative marks; the
// entry text carries the meaning on its own, and 1.4.11 exempts pure
// decoration. If the trunk ever reads as invisible in review, darken
// --border-strong rather than special-casing one component.

const themes = { light: parseBlock(":root"), dark: parseBlock(".dark") }
const failures = []

// Both theme blocks must define the same variables. A token added to one theme
// only is the classic way this design system silently rots.
const THEME_INDEPENDENT = new Set([
  // Radius is a single value in both themes, so it is declared once.
  "--radius",
  // Same for motion, plan 6: a duration is the same length whether the page is
  // light or dark, so neither token is repeated in the .dark block.
  "--duration-micro",
  "--duration-reveal",
])

const lightKeys = Object.keys(themes.light)
  .filter((key) => !THEME_INDEPENDENT.has(key))
  .sort()
const darkKeys = Object.keys(themes.dark)
  .filter((key) => !THEME_INDEPENDENT.has(key))
  .sort()
for (const key of lightKeys) {
  if (!darkKeys.includes(key)) {
    failures.push(`dark theme is missing ${key}`)
  }
}
for (const key of darkKeys) {
  if (!lightKeys.includes(key)) {
    failures.push(`light theme is missing ${key}`)
  }
}

function check(pairs, min) {
  for (const [theme, tokens] of Object.entries(themes)) {
    for (const [fgName, bgName] of pairs) {
      const fg = tokens[fgName]
      const bg = tokens[bgName]
      if (!fg || !bg) {
        failures.push(`${theme}: ${fgName} or ${bgName} is undefined`)
        continue
      }
      let ratio
      try {
        ratio = contrast(fg, bg)
      } catch (error) {
        failures.push(`${theme}: ${fgName} on ${bgName}: ${error.message}`)
        continue
      }
      if (ratio < min) {
        failures.push(
          `${theme}: ${fgName} ${fg} on ${bgName} ${bg} = ${ratio.toFixed(2)}:1, needs ${min}`
        )
      }
    }
  }
}

check(PAIRS, MIN)
check(NON_TEXT_PAIRS, NON_TEXT_MIN)

/**
 * Deliberately NOT checked: opacity on an element that inherits its colour.
 *
 * `text-fg-muted opacity-80` looks like a passing pair here, because the checks
 * above compare token values and the opacity is applied afterwards. On a child
 * span the colour is inherited from the parent, so there is no token on the
 * element carrying the opacity and no static rule can see the composite.
 *
 * A same-element rule was written and mutation-tested: it passed a real
 * `opacity-80` on an inherited colour, because that is exactly the case it
 * cannot see. Rejected rather than kept as a false sense of coverage.
 *
 * Lighthouse's color-contrast audit measures the rendered pixels and does catch
 * it, so `check:audit` is the gate for this. Do not dim text with opacity; pick
 * a lighter token instead.
 */

if (failures.length > 0) {
  console.error(`contrast check failed, ${failures.length} problem(s):`)
  for (const line of failures) {
    console.error(`  ${line}`)
  }
  process.exit(1)
}

console.log(
  `contrast check passed: ${PAIRS.length} text pairs x 2 themes >= ${MIN}:1, ${NON_TEXT_PAIRS.length} non-text pairs x 2 themes >= ${NON_TEXT_MIN}:1`
)
