export type ProjectStatus = "active" | "archived" | "wip"

export type Project = {
  /** Stable id, matches the assets folder. */
  slug: string
  /** "owner/name", the key used to fetch GitHub metadata. */
  repo: string
  title: string
  /** 140 characters or fewer, written by hand. */
  blurb: string
  /** Exactly one project sets this. */
  featured?: boolean
  /** 4 or fewer, every name must exist in stack.ts. */
  stack: string[]
  liveUrl?: string
  /** Import path under src/assets/projects/<slug>/ */
  cover?: string
  order: number
  status?: ProjectStatus
}

export const projects: Project[] = [
  {
    slug: "clearout",
    repo: "RapzSenpai/ClearOut",
    title: "ClearOut",
    blurb: "TODO(content)",
    featured: true,
    stack: ["TODO(content)"],
    liveUrl: "TODO(content)",
    cover: "TODO(content)",
    order: 0,
    status: "active",
  },
]
