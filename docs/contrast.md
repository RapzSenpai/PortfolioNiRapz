# Contrast audit

Phase 1 checklist item. The audit runs as a script, not by hand, so it cannot
go stale when a token changes:

```
npm run check:contrast
```

It reads `:root` and `.dark` straight out of `src/index.css` and fails if any
text pair drops below 4.5:1, if a token is missing from one theme, or if a
colour is not a hex value. It is part of `npm run verify`.

## Result

30 pairs × 2 themes, all pass at 4.5:1. Covered: every foreground on every
surface (`--background`, `--card`, `--popover`, `--secondary`, `--surface-3`),
`--muted-foreground` on all five, `--fg-secondary` and `--fg-muted`, `--brand`
on all five surfaces, and `--brand-foreground` on `--brand`.

## Two tokens adjusted from the plan's starting values

The plan calls its colour table a starting point and says to adjust until
everything passes. Two light-theme pairs failed on the original values:

| Token | Plan value | Was failing | New value | Worst pair now |
|---|---|---|---|---|
| `--brand` | `#0f766e` | 4.19:1 on `--surface-2` | `#0b665e` | 4.74:1 on `--surface-3` |
| `--fg-muted` | `#666670` | 3.94:1 on `--surface-3` | `#5b5b65` | 4.66:1 on `--surface-3` |

Both are the smallest step that clears every surface. Dark theme needed no
changes. `--ring` follows `--brand` in both themes, so the focus ring moves
with it.

## Borders are deliberately not 3:1

`--border` lands at 1.35:1 on the page background and `--border-strong` at
1.81:1. That is below the 3:1 in WCAG 1.4.11, and it is intentional.

1.4.11 applies to the boundary of a component that must be identified by that
boundary alone. In this design the hairlines carry none of that load:

- section rules and list separators are decoration;
- chips, outline buttons and cards all contain a text label, so the label is
  what identifies them;
- the profile photo ring frames a face, it does not convey state.

Plan 3.3 asks for 1px hairlines as the signature element, and pushing borders
to 3:1 would mean roughly `#3f3f46` on `#050505` — a visible grey box outline,
which is the "generic AI portfolio" look this plan is avoiding. Kept as
specified, documented here so the deviation is on the record rather than
discovered in an audit later.

Interactive affordances do not lean on the border: hover, focus and active
states all move to `--fg` or `--brand`, which clear 4.5:1 with room to spare.

## Deferred to a later phase

Lighthouse, axe, keyboard-only pass and a screen reader smoke test are Phase 9
items. Not run yet.
