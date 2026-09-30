// Download an svgl icon per stack name into src/assets/tech/.
//
// One-off generator. It resolves each name to an exact svgl title, then writes
// the file. Run it again whenever stack.ts gains an item, then delete nothing:
// the generator is the record of where the SVGs came from.
//
// svgl's `route` is a string for single-colour icons and a {light,dark} object
// for two-tone brands, so it is normalised to a light URL here. Both variants
// are recoloured to currentColor on the way out, so only one file is needed.
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, "..", "src", "assets", "tech")

// Name as written in stack.ts -> the exact svgl title. Where svgl spells it
// differently the title is spelled out rather than guessed by search.
const MAP = {
  TypeScript: "TypeScript",
  JavaScript: "JavaScript",
  Rust: "Rust",
  React: "React",
  Svelte: "Svelte",
  "Tailwind CSS": "Tailwind CSS",
  HTML: "HTML5",
  CSS: "CSS",
  "Node.js": "Node.js",
  Supabase: "Supabase",
  Firebase: "Firebase",
  "Cloudflare Workers": "Cloudflare Workers",
  Vite: "Vite",
  npm: "NPM",
  Git: "Git",
  Vercel: "Vercel",
  Cloudflare: "Cloudflare",
  Figma: "Figma",
  Canva: "Canva",
  // svgl has no GitHub Actions logo, only the plain GitHub mark. Using the
  // GitHub mark next to a separate Git icon would read as a duplicate, so
  // GitHub Actions ships without one and the row simply skips the glyph.
  "GitHub Actions": null,
}

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function search(query) {
  const res = await fetch(
    "https://api.svgl.app?search=" + encodeURIComponent(query),
    {
      signal: AbortSignal.timeout(20000),
    }
  )
  if (!res.ok) throw new Error("HTTP " + res.status)
  return res.json()
}

const lightUrl = (route) =>
  typeof route === "string" ? route : (route?.light ?? null)

mkdirSync(OUT, { recursive: true })

const results = {}
const skipped = []

for (const [name, svglTitle] of Object.entries(MAP)) {
  const file = slug(name) + ".svg"

  if (svglTitle === null) {
    skipped.push(name)
    console.log(`  ${name.padEnd(20)} skipped, no svgl logo`)
    continue
  }

  let icon = null
  // Search by the exact title first, then fall back to a looser query. svgl
  // search is fuzzy and will happily return Preact for "react", so the title
  // has to be compared rather than trusted.
  for (const query of [svglTitle, name]) {
    try {
      const hits = await search(query)
      icon =
        hits.find((h) => norm(h.title) === norm(svglTitle)) ??
        hits.find((h) => norm(h.title) === norm(name)) ??
        null
      if (icon) break
    } catch (error) {
      console.log(
        `  ${name.padEnd(20)} search "${query}" failed: ${error.message}`
      )
      await sleep(1200)
    }
    await sleep(350)
  }

  if (!icon) {
    skipped.push(name)
    console.log(`  ${name.padEnd(20)} MISS, no exact svgl title`)
    continue
  }

  const url = lightUrl(icon.route)
  if (!url) {
    skipped.push(name)
    console.log(`  ${name.padEnd(20)} MISS, no light route`)
    continue
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) {
    skipped.push(name)
    console.log(`  ${name.padEnd(20)} download HTTP ${res.status}`)
    continue
  }
  let svg = await res.text()

  if (!svg.includes("<svg")) {
    skipped.push(name)
    console.log(`  ${name.padEnd(20)} MISS, response was not an svg`)
    continue
  }

  // Recolour to currentColor. svgl ships brand colours, and two of these are
  // fill="#000" (rust, vercel), which is invisible against the dark background.
  // currentColor lets the icon inherit whatever text colour it sits in, so one
  // asset works in both themes and keeps the palette to the design tokens.
  // fill="none" is left alone; it means "no paint", not "black".
  svg = svg
    .replace(/fill="(?!none")[^"]*"/g, 'fill="currentColor"')
    .replace(/stroke="(?!none")[^"]*"/g, 'stroke="currentColor"')

  writeFileSync(join(OUT, file), svg, "utf8")
  const kb = (Buffer.byteLength(svg) / 1024).toFixed(1)
  console.log(
    `  ${name.padEnd(20)} -> tech/${file.padEnd(20)} ${kb} kB  (svgl id ${icon.id})`
  )
  results[name] = file
  await sleep(250)
}

console.log(
  `\n${Object.keys(results).length} icons written to src/assets/tech/`
)
if (skipped.length) console.log(`skipped: ${skipped.join(", ")}`)
console.log("already on disk:", readdirSync(OUT).length, "files")
if (existsSync(join(OUT, "git.svg"))) console.log("git.svg present")
