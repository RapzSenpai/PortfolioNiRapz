import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1"
)
const SRC = join(ROOT, "src")
const MARKER = "TODO(content)"

const hits = []

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!/\.(ts|tsx|css|html)$/.test(entry.name)) continue

    readFileSync(full, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.includes(MARKER)) {
          hits.push(`${relative(ROOT, full)}:${i + 1}`)
        }
      })
  }
}

walk(SRC)

if (hits.length === 0) {
  console.log("check:todo passed, no content placeholders left.")
  process.exit(0)
}

console.error(`check:todo failed, ${hits.length} placeholder(s) remaining:`)
for (const hit of hits) console.error(`  ${hit}`)
console.error(
  "\nReplace each with real content, or delete the field if it is optional."
)
console.error("See docs/TODO.md for what each one is waiting on.")
process.exit(1)
