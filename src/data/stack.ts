export type StackCategory = {
  category: string
  items: string[]
}

export const stack: StackCategory[] = [
  {
    category: "languages",
    items: ["TypeScript", "JavaScript", "Rust"],
  },
  {
    category: "frontend",
    items: ["React", "Svelte", "Tailwind CSS", "HTML", "CSS"],
  },
  {
    category: "backend/baas",
    items: ["Node.js", "Supabase", "Firebase", "Cloudflare Workers"],
  },
  {
    category: "tooling",
    items: ["Vite", "npm", "Git", "GitHub Actions"],
  },
  {
    category: "deployment",
    items: ["Vercel", "Cloudflare"],
  },
  {
    category: "design",
    items: ["Figma", "Canva"],
  },
]
