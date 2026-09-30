export type Experience = {
  title: string
  /** Omitted by default, the brief lists no employer. */
  company?: string
  /** Machine-readable for <time datetime>, formatted at render. */
  start: string
  end: string
  description: string
}

export const experience: Experience[] = [
  {
    title: "IT Support Specialist — OJT",
    company: "TODO(content)",
    start: "2026-06-01",
    end: "2026-09-14",
    description:
      "Provided end-user technical support for hardware, software, and network issues in a corporate environment.",
  },
]
