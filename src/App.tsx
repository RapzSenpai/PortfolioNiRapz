import { Hero } from "@/components/hero"
import { Experience } from "@/components/experience"
import { Projects } from "@/components/projects"
import { TechStack } from "@/components/tech-stack"
import { Certifications } from "@/components/certifications"
import { Education } from "@/components/education"
import { GitHubActivity } from "@/components/github-activity"
import { Contact } from "@/components/contact"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { KitchenSink } from "@/components/kitchen-sink"
import { useRevealOnScroll } from "@/lib/reveal"

const showKitchenSink =
  import.meta.env.DEV && window.location.hash === "#kitchen-sink"

export function App() {
  useRevealOnScroll()

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Nav />
      <main id="content">
        {showKitchenSink ? (
          <KitchenSink />
        ) : (
          <>
            <Hero />
            <Experience />
            <Projects />
            <TechStack />
            <Certifications />
            <Education />
            <GitHubActivity />
            <Contact />
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

export default App
