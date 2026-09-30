import { ThemeToggle } from "@/components/theme-toggle"
import { Divider } from "@/components/divider"
import { Link } from "@/components/link"
import { Section } from "@/components/section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const SWATCHES = [
  "--bg",
  "--surface-1",
  "--surface-2",
  "--surface-3",
  "--border",
  "--border-strong",
  "--fg",
  "--fg-secondary",
  "--fg-muted",
  "--brand",
]

function Swatches() {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {SWATCHES.map((token) => (
        <li key={token} className="text-label text-fg-muted">
          <span
            className="mb-1 block h-8 w-full rounded-sm border"
            style={{ backgroundColor: `var(${token})` }}
          />
          {token}
        </li>
      ))}
    </ul>
  )
}

function Primitives() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button>default</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="outline">outline</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="link">link</Button>
        <Button disabled>disabled</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg">lg</Button>
        <Button size="default">default</Button>
        <Button size="sm">sm</Button>
        <Button size="xs">xs</Button>
        <Button variant="outline" size="icon" aria-label="icon button">
          @
        </Button>
        <ThemeToggle />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>default</Badge>
        <Badge variant="secondary">secondary</Badge>
        <Badge variant="outline">outline</Badge>
        <Badge variant="ghost">ghost</Badge>
        <Badge variant="destructive">destructive</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar size="sm">
          <AvatarFallback>sm</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>md</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>lg</AvatarFallback>
        </Avatar>
        <Link href="#kitchen-sink">inline link</Link>
        <Link href="#kitchen-sink" external>
          external link
        </Link>
      </div>
      <div className="space-y-3">
        <Divider />
        <Divider variant="solid" />
        <Divider orientation="vertical" className="h-6" />
      </div>
      <div className="space-y-1">
        <h1 className="text-name">Name scale</h1>
        <h2 className="text-label text-fg-muted uppercase">01 / label scale</h2>
        <p className="text-body text-fg-secondary">
          Body scale, 15px, line height 1.7. Ligatures are off so words like fi
          and off do not fuse in prose.
        </p>
        <p className="text-label text-fg-muted">meta scale, 13px</p>
      </div>
    </div>
  )
}

function Panel({
  theme,
  children,
}: {
  theme: string
  children: React.ReactNode
}) {
  return (
    <div
      className={
        theme === "dark" ? "dark bg-background text-foreground" : undefined
      }
    >
      <p className="sticky top-0 bg-background/85 px-6 py-2 text-label text-fg-muted uppercase backdrop-blur">
        {theme}
      </p>
      {children}
    </div>
  )
}

/** Dev only, reached at #kitchen-sink. Not linked from anywhere. */
export function KitchenSink() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid lg:grid-cols-2">
        <Panel theme="light">
          <Section index="01" label="swatches" headingId="ks-sw-light">
            <Swatches />
          </Section>
          <Section index="02" label="primitives" headingId="ks-pr-light">
            <Primitives />
          </Section>
        </Panel>
        <Panel theme="dark">
          <Section index="01" label="swatches" headingId="ks-sw-dark">
            <Swatches />
          </Section>
          <Section index="02" label="primitives" headingId="ks-pr-dark">
            <Primitives />
          </Section>
        </Panel>
      </div>
    </div>
  )
}
