import { ArrowUpRight } from "lucide-react"
import { Section } from "@/components/section"
import { Link } from "@/components/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { projects, type Project } from "@/data/projects"
import { profile } from "@/data/profile"
import { isPlaceholder } from "@/lib/placeholders"

type RepoMeta = {
  url: string
  stars: number
  language: string | null
  pushedAt: string
}

// Both of these are globbed rather than imported directly.
//
// The metadata file is gitignored and rewritten by scripts/fetch-github.mjs on
// every build, so it is absent on a fresh clone and empty when the fetch fails
// offline. A static import would break typecheck before any build had run, so
// the glob is what lets the site build with no network and no token. Same
// reason for covers: a cover that was never captured is simply not in the map.
// For a .json module, import:"default" yields the parsed file, so each entry of
// the glob map is the whole repo-keyed object rather than one repo's metadata.
const metaFiles = import.meta.glob("../data/generated/github-repos.json", {
  eager: true,
  import: "default",
}) as Record<string, Record<string, RepoMeta> | undefined>

const coverFiles = import.meta.glob("../assets/projects/*/cover.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

const REPO_META_PATH = "../data/generated/github-repos.json"

// Annotated rather than inferred: `metaFiles[PATH] ?? {}` widens to a union
// with {}, and indexing that union is an error.
const metadata: Record<string, RepoMeta> = metaFiles[REPO_META_PATH] ?? {}

function real(value: string | undefined) {
  return isPlaceholder(value) ? undefined : value
}

function metaFor(project: Project) {
  return metadata[project.repo]
}

function coverFor(project: Project) {
  const cover = real(project.cover)
  if (!cover) {
    return undefined
  }
  return coverFiles[`../assets/projects/${project.slug}/${cover}`]
}

/** Stars are only worth showing once there are some. Language is always real
 *  information, so it shows whenever the fetch got that far. */
function MetaLine({ project }: { project: Project }) {
  const meta = metaFor(project)
  if (!meta) {
    return null
  }

  const parts = [
    meta.stars > 0 ? `${meta.stars} stars` : null,
    meta.language ? meta.language : null,
  ].filter(Boolean)

  if (parts.length === 0) {
    return null
  }

  return (
    <p className="text-label text-fg-muted uppercase">{parts.join(" · ")}</p>
  )
}

function Chips({ stack }: { stack: string[] }) {
  const names = stack.filter((name) => !isPlaceholder(name))
  if (names.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {names.map((name) => (
        <li key={name}>
          <Badge variant="outline">{name}</Badge>
        </li>
      ))}
    </ul>
  )
}

/** Every card links the repository. The label is the same everywhere rather
 *  than "Source" on one and "View on GitHub" on another, so the repeated link
 *  reads as a pattern instead of as five different labels. */
function ViewOnGitHub({ project }: { project: Project }) {
  // Prefer the fetched canonical URL, fall back to the repo key so the link
  // survives a build with no network and no token.
  const url = metaFor(project)?.url ?? `https://github.com/${project.repo}`

  return (
    <Link
      external
      href={url}
      className="inline-flex items-center gap-1 text-fg-secondary transition-colors duration-micro ease-out pointer-fine:hover:text-foreground"
    >
      View on GitHub
      <ArrowUpRight aria-hidden="true" className="size-3.5" />
    </Link>
  )
}

/** Plan 4.3 featured: full width, 1px border, cover on top, text below. The
 *  accent is a brand left edge rather than a colour splash across the card. */
function FeaturedCard({ project }: { project: Project }) {
  const cover = coverFor(project)

  return (
    <Card className="relative overflow-hidden border-l-2 border-l-brand">
      {cover ? (
        <AspectRatio ratio={16 / 6}>
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        </AspectRatio>
      ) : null}

      <CardHeader className="px-5 pt-5 md:px-6">
        {/* Not CardTitle: in shadcn v4 it renders a div, and this needs to be
            a real h3 so the section's heading hierarchy stays intact. */}
        <h3 className="text-name font-bold text-foreground">{project.title}</h3>
        {!isPlaceholder(project.blurb) ? (
          <CardDescription className="max-w-[62ch] text-body text-fg-secondary">
            {project.blurb}
          </CardDescription>
        ) : null}
        <div className="mt-2">
          <MetaLine project={project} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 md:px-6 md:pb-6">
        <Chips stack={project.stack} />
        <ViewOnGitHub project={project} />
      </CardContent>
    </Card>
  )
}

/** Bento cell. The grid item is the li and carries the column span, so the
 *  card inside is always a plain full-height block. */
function BentoCard({ project }: { project: Project }) {
  const cover = coverFor(project)

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {cover ? (
        <AspectRatio ratio={16 / 9}>
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        </AspectRatio>
      ) : null}

      <CardHeader className="px-5 pt-5">
        <h3 className="text-base leading-snug font-medium text-foreground">
          {project.title}
        </h3>
        {!isPlaceholder(project.blurb) ? (
          <CardDescription className="text-body text-fg-muted">
            {project.blurb}
          </CardDescription>
        ) : null}
        <div className="mt-1">
          <MetaLine project={project} />
        </div>
      </CardHeader>

      <CardContent className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 pb-5">
        <Chips stack={project.stack} />
        <ViewOnGitHub project={project} />
      </CardContent>
    </Card>
  )
}

export function Projects() {
  const ordered = [...projects].sort((a, b) => a.order - b.order)
  const featured = ordered.filter((project) => project.featured)
  const regular = ordered.filter((project) => !project.featured)

  const githubUser = real(
    profile.socials.find((s) => s.platform === "github")?.href
  )
  const anyRepoLink = ordered.some((project) => metaFor(project)?.url)

  if (projects.length === 0) {
    return null
  }

  // Bento spans, cycling: 3/3, 2/4, 3/3. Unequal cells read as bento; a uniform
  // grid would just be a card list.
  const SPANS = [
    "sm:col-span-3",
    "sm:col-span-3",
    "sm:col-span-2",
    "sm:col-span-4",
  ]

  return (
    <Section index="03" label="Projects" headingId="projects">
      <div className="space-y-6">
        {featured.map((project) => (
          <FeaturedCard key={project.slug} project={project} />
        ))}

        {regular.length > 0 ? (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-6">
            {regular.map((project, index) => (
              <li key={project.slug} className={SPANS[index % SPANS.length]}>
                <BentoCard project={project} />
              </li>
            ))}
          </ul>
        ) : null}

        {githubUser && anyRepoLink ? (
          <Link
            external
            href={`https://github.com/${githubUser.replace(/^.*github\.com\//, "")}`}
            className="inline-flex items-center gap-1"
          >
            View all on GitHub
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </Section>
  )
}
