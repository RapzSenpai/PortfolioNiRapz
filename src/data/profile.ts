export type SocialPlatform = "github" | "linkedin" | "facebook" | "instagram"

export type Social = {
  platform: SocialPlatform
  /** Accessible name for the icon button, for example "GitHub". */
  label: string
  href: string
}

export type Specialty = {
  /** Dim left-hand label, rendered as a plain text row. */
  label: string
  text: string
}

export type Profile = {
  name: string
  tagline: string
  intro: string
  specialties: Specialty[]
  email: string
  cta: string
  photo: {
    src: string
    alt: string
  }
  socials: Social[]
}

export const profile: Profile = {
  name: "Loriano Librado Jr.",
  tagline: "IT Support · Full-stack developer",
  intro:
    "IT student and full-stack developer. I build web apps and fix what's broken.",
  specialties: [
    {
      label: "build",
      text: "Full-stack web development · UI/UX · Commission/project-based work",
    },
    {
      label: "ai",
      text: "AI tool integration · AI-assisted engineering · AI-native development",
    },
    {
      label: "system",
      text: "Android modification · Tech generalist",
    },
  ],
  email: "lorianoalibrado@gmail.com",
  cta: "Open to internships, junior roles, and freelance work.",
  photo: {
    src: "TODO(content)",
    alt: "Portrait of Loriano Librado Jr.",
  },
  socials: [
    {
      platform: "github",
      label: "GitHub",
      href: "https://github.com/RapzSenpai",
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      href: "TODO(content)",
    },
    {
      platform: "facebook",
      label: "Facebook",
      href: "TODO(content)",
    },
    {
      platform: "instagram",
      label: "Instagram",
      href: "TODO(content)",
    },
  ],
}
