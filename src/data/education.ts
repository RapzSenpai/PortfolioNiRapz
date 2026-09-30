export type Education = {
  degree: string
  school: string
  /** ISO dates. The year is what gets rendered, see formatYear in timeline.tsx. */
  start: string
  end: string
  /** Muted meta beside the period, "Expected 2027". */
  status?: string
  description?: string
}

/** Plan 4.6. Confirmed in plan section 14, so no TODO placeholder here: the
 *  brief supplies the degree, school, and years, and fixes the status wording
 *  as "Expected 2027". */
export const education: Education[] = [
  {
    degree: "BSIT",
    school: "Consolatrix College of Toledo City",
    start: "2022-01-01",
    end: "2027-12-31",
    status: "Expected 2027",
  },
]
