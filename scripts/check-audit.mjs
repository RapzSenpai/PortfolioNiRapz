import { spawn } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import process from "node:process"

/**
 * Runs Lighthouse against a throwaway production preview and fails below the
 * target score. Kept out of `verify` because it needs Chrome and a preview
 * server; run it before a release.
 */

const TARGET = 95
const PORT = Number(process.env.PORT ?? 4179)
const URL = `http://localhost:${PORT}/`
const report = join(process.env.TMPDIR ?? tmpdir(), `lh-${process.pid}.json`)
const profile = mkdtempSync(join(tmpdir(), "lh-profile-"))

const chrome = process.env.CHROME_PATH
if (!chrome) {
  console.log(
    "check:audit  skipped  CHROME_PATH not set (or Chrome not on PATH)"
  )
  process.exit(0)
}

const cleanup = () => {
  rmSync(profile, { recursive: true, force: true })
  rmSync(report, { force: true })
}
process.on("exit", cleanup)

/**
 * Runs a command through the platform shell.
 *
 * `spawn` with `shell: true` and an argv array triggers a deprecation warning
 * on Windows, and hand-quoting the command broke npx's own path resolution. So
 * the command is passed as one string with no shell-wrapper ambiguity, and the
 * preview server skips the shell entirely by calling vite's bin directly.
 */
const sh = (command, options = {}) =>
  spawn(command, {
    stdio: "inherit",
    ...(process.platform === "win32" ? { shell: true } : {}),
    ...options,
  })

const viteBin = join(
  import.meta.dirname,
  "..",
  "node_modules",
  "vite",
  "bin",
  "vite.js"
)

const server = spawn(
  process.execPath,
  [viteBin, "preview", "--port", String(PORT), "--strictPort"],
  {
    stdio: "ignore",
  }
)

const waitForServer = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(URL)
      if (response.ok) return true
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return false
}

if (!(await waitForServer())) {
  server.kill()
  console.error("check:audit  failed  preview server never came up")
  process.exit(1)
}

const lighthouse = sh(
  [
    "npx",
    "--yes",
    "lighthouse@12",
    URL,
    "--output=json",
    `--output-path=${report}`,
    "--quiet",
    `--chrome-flags=--headless=new --no-sandbox --disable-gpu --no-first-run --no-default-browser-check --user-data-dir=${profile}`,
  ].join(" "),
  { env: { ...process.env, CHROME_PATH: chrome } }
)

const code = await new Promise((resolve) => lighthouse.on("close", resolve))
server.kill()
if (code !== 0) {
  console.error(`check:audit  failed  lighthouse exited ${code}`)
  process.exit(1)
}

const categories = JSON.parse(readFileSync(report, "utf8")).categories
let worst = 100
for (const category of Object.values(categories)) {
  const score = Math.round(category.score * 100)
  worst = Math.min(worst, score)
  console.log(
    `check:audit  ${category.id.padEnd(16)}${score}${score < TARGET ? "  below target" : ""}`
  )
}

if (worst < TARGET) {
  console.error(
    `check:audit  failed  lowest category ${worst} is below ${TARGET}`
  )
  process.exit(1)
}
console.log(`check:audit  ok  every category at or above ${TARGET}`)
