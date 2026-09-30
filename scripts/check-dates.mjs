import { execFileSync } from "node:child_process"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, join } from "node:path"

// Guards src/lib/date.ts, which the Experience and Education timelines render
// through. The bug it exists to catch: a bare YYYY-MM-DD parses as UTC
// midnight, so formatting it in a local zone west of Greenwich prints the
// previous day and "2026-06-01" becomes "May 31, 2026".
//
// Asserting a fixed expected string only catches that on a machine west of
// Greenwich, so instead each zone is formatted in a child process and the two
// results must match exactly. That proves timezone independence on any machine.

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const lib = pathToFileURL(join(root, "src/lib/date.ts")).href

const SNIPPET = `
  import { formatDate, formatMonthYear, formatYear } from ${JSON.stringify(lib)}
  const out = [
    formatDate("2026-06-01"),
    formatDate("2026-09-14"),
    formatDate("2027-12-31"),
    formatDate("2022-01-01"),
    formatYear("2022-01-01"),
    formatYear("2027-12-31"),
    formatMonthYear("2026-03"),
    formatMonthYear("2026-12"),
    formatMonthYear("2027-01"),
  ]
  process.stdout.write(JSON.stringify(out))
`

function runIn(tz) {
  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", SNIPPET], {
      encoding: "utf8",
      env: { ...process.env, TZ: tz },
    })
  )
}

// UTC-8 and UTC+14, so the local calendar dates differ by more than a day.
const west = runIn("America/Los_Angeles")
const east = runIn("Pacific/Kiritimati")

const failures = []

const expected = [
  "Jun 1, 2026",
  "Sep 14, 2026",
  "Dec 31, 2027",
  "Jan 1, 2022",
  "2022",
  "2027",
  // The 1st is pinned so "2026-12" cannot roll into January.
  "Mar 2026",
  "Dec 2026",
  "Jan 2027",
]

if (JSON.stringify(west) !== JSON.stringify(east)) {
  failures.push(
    `formatting depends on the system timezone:\n    TZ=America/Los_Angeles -> ${JSON.stringify(west)}\n    TZ=Pacific/Kiritimati   -> ${JSON.stringify(east)}`
  )
}

for (const [i, want] of expected.entries()) {
  if (west[i] !== want) {
    failures.push(
      `case ${i}: expected ${JSON.stringify(want)}, got ${JSON.stringify(west[i])}`
    )
  }
}

if (failures.length > 0) {
  console.error(`date check failed, ${failures.length} problem(s):`)
  for (const line of failures) {
    console.error(`  ${line}`)
  }
  process.exit(1)
}

console.log(
  `date check passed: ${expected.length} cases, identical in America/Los_Angeles and Pacific/Kiritimati`
)
