// Structural checks on projects.ts. Plan 4.3 requires exactly one featured
// project and stack names that exist in stack.ts.
//
// Placeholder values are deliberately not this script's job: check-todo already
// reports every placeholder and fails the build on it. Repeating them here
// would report the same string twice under two different reasons, so a value
// still marked as a placeholder is skipped and only checked once it is real.

import { projects } from "../src/data/projects.ts"
import { stack } from "../src/data/stack.ts"

const MAX_BLURB = 140
const MAX_STACK = 4

const isPlaceholder = (value) =>
  typeof value !== "string" || value.startsWith("TODO(")

const knownStackNames = new Set(stack.flatMap((row) => row.items))
const failures = []
const notes = []

const featured = projects.filter((project) => project.featured)

if (featured.length === 0) {
  failures.push("no project is marked featured, expected exactly one")
} else if (featured.length > 1) {
  failures.push(
    `${featured.length} projects are marked featured, expected exactly one: ${featured
      .map((p) => p.slug)
      .join(", ")}`
  )
}

const seenSlugs = new Set()
const seenOrders = new Set()

for (const project of projects) {
  const where = `project "${project.slug}"`

  if (seenSlugs.has(project.slug)) {
    failures.push(`${where}: duplicate slug`)
  }
  seenSlugs.add(project.slug)

  if (seenOrders.has(project.order)) {
    failures.push(`${where}: duplicate order ${project.order}`)
  }
  seenOrders.add(project.order)

  if (project.stack.length > MAX_STACK) {
    failures.push(
      `${where}: ${project.stack.length} stack entries, plan allows ${MAX_STACK}`
    )
  }

  if (!isPlaceholder(project.blurb) && project.blurb.length > MAX_BLURB) {
    failures.push(
      `${where}: blurb is ${project.blurb.length} characters, plan allows ${MAX_BLURB}`
    )
  }

  for (const name of project.stack) {
    if (isPlaceholder(name)) {
      continue
    }
    if (!knownStackNames.has(name)) {
      failures.push(
        `${where}: stack name "${name}" is not in stack.ts, add it there first`
      )
    }
  }

  if (project.liveUrl && !isPlaceholder(project.liveUrl)) {
    try {
      const url = new URL(project.liveUrl)
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        failures.push(`${where}: liveUrl must be http(s), got ${url.protocol}`)
      }
    } catch {
      failures.push(`${where}: liveUrl is not a valid URL`)
    }
  }

  if (
    project.status &&
    !["active", "archived", "wip"].includes(project.status)
  ) {
    failures.push(
      `${where}: status "${project.status}" is not active, archived or wip`
    )
  }
}

if (projects.length === 0) {
  notes.push("projects.ts is empty, the section will render nothing")
}

if (failures.length > 0) {
  console.error(`project check failed, ${failures.length} problem(s):`)
  for (const line of failures) {
    console.error(`  ${line}`)
  }
  process.exit(1)
}

console.log(
  `project check passed: ${projects.length} project(s), ${featured.length} featured, stack names resolve`
)
for (const note of notes) {
  console.log(`  note: ${note}`)
}
