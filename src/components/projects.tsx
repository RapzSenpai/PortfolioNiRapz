import { ArrowUpRight } from "lucide-react"
import { cn } from "cn"
import { Section } from "@/components/section"
import { Link } from "@/components/link"
import { Divider } from "@/components/divider"
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

function RepoLinks({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  const meta = metaFor(project)
  const repoUrl = meta?.url
  const liveUrl = real(project.liveUrl)

  if (!repoUrl && !liveUrl) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {repoUrl ? (
        <Link
          external
          href={repoUrl}
          className="inline-flex items-center gap-1"
        >
          Source
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      ) : null}
      {liveUrl ? (
        <Link
          external
          href={liveUrl}
          className="inline-flex items-center gap-1"
        >
          Live
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      ) : null}
    </div>
  )
}

/** Plan 4.3 featured: full width, 1px border, image left and text right at
 *  768px and up. Emphasis comes from size and the border, never a colour
 *  splash. */
function FeaturedCard({ project }: { project: Project }) {
  const cover = coverFor(project)

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        {cover ? (
          <AspectRatio ratio={16 / 10} className="md:aspect-auto md:h-full">
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
          <h3 className="text-base leading-snug font-medium">
            {project.title}
          </h3>
          {!isPlaceholder(project.blurb) ? (
            <CardDescription className="text-body text-fg-secondary">
              {project.blurb}
            </CardDescription>
          ) : null}
          <div className="mt-1">
            <MetaLine project={project} />
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            "px-5 pb-5",
            cover ? "md:px-6 md:pt-0 md:pb-6" : "pt-0"
          )}
        >
          <Chips stack={project.stack} />
          <RepoLinks project={project} className="mt-4" />
        </CardContent>
      </div>
    </Card>
  )
}

/** Plan 4.3 regular: one compact text row, dashed rules between, no image. */
function ProjectRow({ project }: { project: Project }) {
  const meta = metaFor(project)

  return (
    <li className="group/row">
      <div className="flex flex-col gap-3 py-6 transition-colors duration-micro ease-out md:flex-row md:items-baseline md:gap-6 pointer-fine:group-hover/row:text-fg-secondary">
        <div className="min-w-0 md:flex-1">
          <h3 className="text-base font-medium text-foreground">
            {project.title}
          </h3>
          {!isPlaceholder(project.blurb) ? (
            <p className="mt-1 max-w-[62ch] text-body text-fg-muted">
              {project.blurb}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:justify-end">
          {meta?.stars ? (
            <span className="text-label text-fg-muted uppercase">
              {meta.stars} stars
            </span>
          ) : null}
          <Chips stack={project.stack} />
          <RepoLinks project={project} />
        </div>
      </div>
    </li>
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

  return (
    <Section index="03" label="Projects" headingId="projects">
      <div className="space-y-12">
        {featured.map((project) => (
          <FeaturedCard key={project.slug} project={project} />
        ))}

        {regular.length > 0 ? (
          <ul>
            {regular.map((project, index) => (
              <div key={project.slug}>
                {index > 0 ? <Divider /> : null}
                <ProjectRow project={project} />
              </div>
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
