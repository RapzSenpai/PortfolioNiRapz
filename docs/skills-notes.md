# Design skill notes

The plan (`PORTFOLIO_PLAN.md` section 0) asks for two skills installed from npm:
`Leonxlnx/taste-skill` and `emilkowalski/skill`. Skipped both. The local skill
library already covers the same ground, and a second opinion from the same
guidance is noise, not signal.

| Plan asked for | Using instead | Covers |
|---|---|---|
| `emilkowalski/skill` | `emil-design-eng`, `make-interfaces-feel-better`, `animate` | Motion budgets, easing, transition properties, hover and press feedback, reduced motion |
| `taste-skill` | `high-end-visual-design`, `design-taste-frontend`, `minimalist-ui` | Restraint, spacing and type discipline, anti-generic review |

## Constraints that apply to every phase

1. **Restraint wins.** The plan beats the skills wherever they disagree. No
   flashy effects. If a skill suggests a flourish, it is out.
2. **No new dependencies for design guidance.** The skills are read for
   judgment, not installed as packages.
3. **Tokens over overrides.** Restyle once in `src/index.css` or
   `components/ui/*`, never per usage.
4. **Phase 0 and 8 get a real design review.** Phase 0 sets the visual
   direction, Phase 8 is the Emil Kowalski pass over every transition.

## Where each constraint lands

- Phase 1: type scale, token contrast, chip and border treatment.
- Phase 2: hero hierarchy, control row alignment, the 3 second read.
- Phase 4: featured card must dominate by size and border, not by color.
- Phase 8: full transition audit against plan section 6. Durations 300ms
  ceiling, ease-out only for entry, transform and opacity only, no layout
  animation, reduced motion removes transforms.
- Every phase: the "does this look templated" check. Stock shadcn defaults,
  generic hero gradients, and logo walls all get cut.
