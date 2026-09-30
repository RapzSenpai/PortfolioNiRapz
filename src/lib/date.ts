// A date-only ISO string parses as UTC midnight per spec, and the formatter is
// pinned to UTC, so "2026-06-01" renders as "Jun 1, 2026" on every machine.
// Without that pin it renders as "May 31, 2026" west of Greenwich.
// scripts/check-dates.mjs guards it by formatting under two zones 26 hours
// apart and requiring identical output, so removing the pin fails the check.
const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

/** Plan 4.2: "Jun 1, 2026". */
export function formatDate(iso: string) {
  return DATE.format(new Date(iso))
}

/** Plan 4.5 certification dates are stored as "YYYY-MM" and shown as "Mar 2026".
 *  The day is pinned to the 1st so the month can never roll over. */
export function formatMonthYear(iso: string) {
  return MONTH_YEAR.format(new Date(`${iso}-01`))
}

/** Plan 4.6 shows years only: "2022 – 2027". */
export function formatYear(iso: string) {
  return iso.slice(0, 4)
}

/** Plan 4.7: "last push 2 days ago". Relative to now, so it cannot join the
 *  deterministic cases in check-dates.mjs. Days are floored, and anything a
 *  month or older falls back to the absolute date rather than inventing
 *  precision ("43 weeks ago" is not a useful thing to tell a reader). */
export function formatRelative(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""

  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "1 day ago"

  if (days < 30) return `${days} days ago`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? "1 month ago" : `${months} months ago`
  }
  return formatDate(iso)
}
