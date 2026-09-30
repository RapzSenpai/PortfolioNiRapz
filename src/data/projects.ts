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
    slug: "hotel-ease",
    repo: "RapzSenpai/HotelEase",
    title: "HotelEase",
    blurb:
      "A modern simplified hotel management system for seamless guest and room operations.",
    featured: true,
    stack: ["JavaScript"],
    order: 0,
    status: "active",
  },
  {
    slug: "clearout",
    repo: "RapzSenpai/clearout",
    title: "ClearOut",
    blurb: "Deep Windows uninstaller — removes apps and hunts leftovers.",
    stack: ["Rust"],
    order: 1,
    status: "active",
  },
  {
    slug: "student-mart",
    repo: "RapzSenpai/Student-Mart",
    title: "StudentMart",
    blurb:
      "Students browse products, add them to a cart, and place orders. Role-based access for students, sellers, and admins.",
    stack: ["JavaScript"],
    order: 2,
    status: "active",
  },
  {
    slug: "project-omni",
    repo: "RapzSenpai/PROJECT-OMNI",
    title: "Project OMNI",
    blurb: "Currently unfinished and still in development.",
    stack: ["JavaScript"],
    order: 3,
    status: "wip",
  },
  {
    slug: "facultytrack",
    // The trailing hyphen is the real repo name, not a typo. GitHub 404s on
    // "facultytrack" and serves the repository at "facultytrack-".
    repo: "RapzSenpai/facultytrack-",
    title: "FacultyTrack",
    blurb: "Currently unfinished and still in development.",
    stack: ["JavaScript"],
    order: 4,
    status: "wip",
  },
]
