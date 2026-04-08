---
name: Implement UI
description: Guided UI implementation workflow that enforces design-system harness checks before committing.
icon: 🎨
---

## Agent Workflow

This command must be followed whenever implementing or modifying any visual UI component in the web-dev codebase.

### Step 1 — Refresh tokens

Run the token generator to ensure `design-tokens.css` reflects the latest Figma source. If the generator reports any token missing from the Figma Foundations page, halt and notify the human.

### Step 2 — Consult the spec

Read the relevant GUI component modules under `gui/components/` and `gui/screens/` for the spec of what is being implemented. Read `gui/design-system/foundations/` for the token vocabulary. Never invent values — every color, font-size, spacing, border-radius, and shadow must map to a named token.

### Step 3 — Implement

Write the component code. All visual values must reference CSS custom properties defined in `design-tokens.css`. Forbidden patterns:
- Hardcoded hex colors (`#rrggbb`) in CSS or JS/TS
- Hardcoded `rgba()` color values (except the two interactive overlay tokens)
- Font sizes, weights, or line-heights not matching a typography token
- Border-radius values not matching a radius token
- JS/TS arrays of color strings — use CSS variable references instead

### Step 4 — Run token lint

Execute the token lint check. Fix all violations before proceeding. Zero violations is the pass criteria.

### Step 5 — Run visual snapshots

Capture screenshots of the affected component states and diff against baselines. If pixel diff exceeds 0.1%, review the change. If intentional, update baselines and commit them alongside the code change.

### Step 6 — Commit

Only after steps 1–5 pass, commit the implementation changes following the standard commit rules.
