import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"

/**
 * Structural accessibility checks that catch malformed nesting, which neither
 * a linter nor a token-level contrast check can see.
 *
 * Scope is deliberately narrow: rules decidable from source with no browser and
 * no DOM parser. Anything needing layout, computed styles, or a real
 * accessibility tree belongs to `check:contrast` (tokens) or `check:audit`
 * (Lighthouse). Reimplementing axe here would only produce a second, weaker
 * engine that disagrees with the first.
 *
 * One depth-tracking pass over the JSX builds the whole element tree; every
 * rule below is a query against that tree.
 */

const failures = []
const fail = (file, rule, detail) => failures.push({ file, rule, detail })

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory()
      ? walk(path)
      : /\.(tsx|ts)$/.test(entry.name)
        ? [path]
        : []
  })

/** Elements that never have children, so they never open a scope. */
const VOID = new Set([
  "img",
  "br",
  "hr",
  "input",
  "meta",
  "link",
  "source",
  "path",
  "circle",
])

/**
 * Demo components exist to eyeball the design system. They are not part of the
 * rendered page, so heading rules are not judged against them.
 */
const DEV_ONLY = new Set(["src/components/kitchen-sink.tsx"])

/**
 * Builds an element tree from JSX text.
 *
 * String literals and `{...}` expression bodies are skipped so a `>` or `<`
 * inside them cannot be mistaken for a tag. Fragments are recorded as `#frag`
 * and are transparent: their children attach to the fragment's parent, which
 * is what the structural rules want to assert about.
 */
const parseJsx = (text) => {
  const root = { name: "#root", attrs: "", children: [], line: 1 }
  const stack = [root]
  const tag =
    /<(\/?)([A-Za-z][\w.]*|#)((?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^<>])*?)(\/?)>/g

  let match
  while ((match = tag.exec(text)) !== null) {
    const [, closing, rawName, attrs, selfClosing] = match
    const isFragment = rawName === "#"
    const name = isFragment ? "#frag" : rawName

    // A real JSX tag sits in an expression position: preceded by whitespace or
    // punctuation. TypeScript generics (`Record<A, B>`, `useState<string>`)
    // also look like tags but are preceded by an identifier, so skip them.
    const before = text[match.index - 1] ?? " "
    if (/[\w$]/.test(before)) continue

    if (closing) {
      // Close the nearest matching open element, tolerating unbalanced source.
      const depth = stack.findLastIndex((node) => node.name === name)
      if (depth > 0) {
        stack[depth].end = match.index
        stack.length = depth
      }
      continue
    }

    const node = {
      name,
      attrs,
      line: text.slice(0, match.index).split("\n").length,
      start: match.index,
      end: 0,
      children: [],
    }
    stack[stack.length - 1].children.push(node)
    if (!selfClosing && !VOID.has(name)) stack.push(node)
  }
  return root
}

/** Flattens fragments away so callers see real element ancestry. */
const flatten = (nodes) =>
  nodes.flatMap((node) =>
    node.name === "#frag" ? flatten(node.children) : [node]
  )

/** Every element in the tree, depth first. */
const allTags = (node) =>
  flatten(node.children).flatMap((child) => [child, ...allTags(child)])

/** Raw source between an element's own tags. */
const innerSource = (node, text) =>
  node.end ? text.slice(node.start, node.end) : ""

/**
 * The class strings on one element.
 *
 * className takes three shapes in this app: a plain string, a `cn(...)` call,
 * and a conditional expression. Reading only the quoted form would miss the
 * common case, since Tailwind classes are nearly always passed through `cn`.
 * So the attribute value is located, then every string literal inside it is
 * collected and treated as class text.
 */
const classStringsOf = (attrs) => {
  const at = /\bclassName\s*=/.exec(attrs)
  if (!at) return []
  const rest = attrs.slice(at.index + at[0].length)
  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1)
    return end === -1 ? [] : [rest.slice(1, end)]
  }
  if (!rest.startsWith("{")) return []
  // Walk the brace group, tracking nesting, so `cn(cond ? "a" : "b")` works.
  let depth = 0
  let end = -1
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === "{") depth += 1
    else if (rest[i] === "}") {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const body = end === -1 ? rest : rest.slice(0, end)
  return [...body.matchAll(/"([^"]*)"/g)].map((m) => m[1])
}

const is = (node, name) => node.name === name

/**
 * Resolves a Tailwind size token to CSS pixels, or null when the value is not
 * measurable without a browser (`full`, `auto`, fractions, percentages).
 * Arbitrary values in px or rem are resolved; spacing-scale numbers use
 * Tailwind's 0.25rem step against a 16px root.
 */
const toPx = (token) => {
  const arbitrary = /^\[([\d.]+)(px|rem)\]$/.exec(token)
  if (arbitrary) {
    const value = Number(arbitrary[1])
    return arbitrary[2] === "rem" ? value * 16 : value
  }
  const numeric = Number(token)
  return Number.isFinite(numeric) ? numeric * 4 : null
}

// --- h1 count ---------------------------------------------------------------
let h1Count = 0

for (const file of walk("src")) {
  const key = file.replace(/\\/g, "/")
  const relative = key.replace(/^.*?(?=\bsrc\/)/, "")
  const text = readFileSync(file, "utf8")
  const tree = parseJsx(text)

  if (!DEV_ONLY.has(relative))
    h1Count += allTags(tree).filter((n) => is(n, "h1")).length

  // --- heading order -------------------------------------------------------
  // Two rules, because one is not enough.
  //
  // Within a file, a heading may not skip a level going down. Across files it
  // cannot be judged from source at all: `Section` renders the page's h2 and
  // the components it wraps own their h3, and neither file can see the other.
  // So the cross-file invariant is stated directly: a component that mounts
  // inside a `Section` starts at h2, which leaves exactly one level (h3) for
  // its own headings. Anything deeper skips a level in the rendered page.
  let previous = null
  const mountsInSection = /<Section[\s/>]/.test(text)
  for (const node of allTags(tree)) {
    const level = /^h([1-6])$/.exec(node.name)
    if (!level) continue
    const value = Number(level[1])
    if (previous !== null && value > previous + 1) {
      fail(
        relative,
        "heading-order",
        `h${previous} -> h${value} skips a level (line ${node.line})`
      )
    }
    if (mountsInSection && value > 3) {
      fail(
        relative,
        "heading-order",
        `h${value} inside a Section whose own heading is h2 skips a level (line ${node.line})`
      )
    }
    previous = value
  }

  // --- alt text ------------------------------------------------------------
  // Covers native <img> and the shadcn AvatarImage wrapper, which renders an
  // img and takes alt the same way.
  for (const node of allTags(tree)) {
    if (!is(node, "img") && !is(node, "AvatarImage")) continue
    if (/\balt\s*=/.test(node.attrs)) continue
    fail(
      relative,
      "img-alt",
      `<${node.name}> has no alt attribute (line ${node.line})`
    )
  }

  // --- <dl> shape ----------------------------------------------------------
  // A <dl> may only contain dt, dd, div, script, or template. This is the rule
  // Lighthouse reported as definition-list/dlitem when a Divider was nested
  // inside the list.
  const DL_CHILDREN = new Set(["dt", "dd", "div", "script", "template"])
  for (const node of allTags(tree)) {
    if (!is(node, "dl")) continue
    const kids = flatten(node.children)
    const offenders = kids.filter((child) => !DL_CHILDREN.has(child.name))
    if (offenders.length) {
      fail(
        relative,
        "dl-children",
        `<dl> may only contain dt/dd/div, found <${offenders.map((o) => o.name).join(">, <")}> (line ${node.line})`
      )
    }
    // Every dt must be followed by at least one dd before the next dt.
    const terms = kids.filter((child) => child.name === "dt")
    const defs = kids.filter((child) => child.name === "dd")
    if (terms.length && terms.length !== defs.length) {
      fail(
        relative,
        "dl-pairs",
        `<dl> has ${terms.length} dt and ${defs.length} dd; every term needs a definition (line ${node.line})`
      )
    }
  }

  // --- accessible names ----------------------------------------------------
  // Focusable, text-less controls need an explicit name. A button with visible
  // text content is fine and cannot be judged from the opening tag alone.
  const NEEDS_NAME = new Set(["button", "a", "input", "select", "textarea"])
  for (const node of allTags(tree)) {
    if (!NEEDS_NAME.has(node.name)) continue
    // An input's name comes from its own attributes, never from inner text.
    const hasAria = /\b(aria-label|aria-labelledby|title)\s*=/.test(node.attrs)
    // Any inner content names the control. An expression such as `{initials}`
    // counts too: whether it renders empty is a runtime concern, and the
    // alternative is a false positive on every component that derives its
    // label from data.
    const hasContent =
      node.name !== "input" &&
      node.end > 0 &&
      innerSource(node, text).trim().length > 0
    if (!hasAria && !hasContent) {
      fail(
        relative,
        "accessible-name",
        `<${node.name}> has no accessible name (line ${node.line})`
      )
    }
  }

  // --- tap target size -----------------------------------------------------
  // WCAG 2.2 target size (minimum) is 24x24 CSS px. Judged from an inline
  // className, which is where every size in this app is written; sizes supplied
  // through a variable or a component default are not measurable from source
  // and are left to the manual pass. Tailwind's spacing scale is 0.25rem per
  // unit, so size-6 is exactly 24px and size-5 is 20px.
  for (const node of allTags(tree)) {
    const interactive =
      is(node, "button") ||
      is(node, "a") ||
      is(node, "Button") ||
      /\bonClick\s*=/.test(node.attrs)
    if (!interactive) continue
    for (const className of classStringsOf(node.attrs)) {
      for (const match of className.matchAll(
        /(?:^|[\s:])(?:h|w|size)-(\[[^\]]+\]|\d+(?:\.\d+)?)/g
      )) {
        const px = toPx(match[1])
        if (px !== null && px < 24) {
          fail(
            relative,
            "tap-target",
            `<${node.name}> is ${match[1]} (${px}px), below the 24px minimum (line ${node.line})`
          )
        }
      }
    }
  }
}

if (h1Count !== 1) {
  fail(
    "src",
    "single-h1",
    h1Count === 0
      ? "no h1 in the page"
      : `${h1Count} h1 elements, need exactly 1`
  )
}

// --- report -----------------------------------------------------------------
const fileCount = walk("src").length
console.log(
  `check:a11y  ${fileCount} source files, ${failures.length} issue(s)`
)
if (failures.length === 0) {
  console.log(
    "  ok  heading order, alt text, <dl> shape, accessible names, tap targets"
  )
  process.exit(0)
}
for (const rule of [...new Set(failures.map((f) => f.rule))]) {
  console.log(`\n  ${rule}`)
  for (const item of failures.filter((f) => f.rule === rule)) {
    console.log(`    ${item.file}  ${item.detail}`)
  }
}
console.log("\n  rules that need a browser live in check:audit (Lighthouse).")
process.exit(1)
