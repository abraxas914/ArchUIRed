---
name: Token Lint
description: "Static analysis rules that scan implementation code for hardcoded color, typography, spacing, and dimension values that bypass the design-token vocabulary."
---

## Overview

Token lint enforces the design-system contract at the code level. It scans platform implementation files (CSS, TSX, Swift, Kotlin) for patterns that indicate a value was hardcoded instead of referencing a design token.

## Violation Patterns

The lint checks for the following escaping patterns:

- **Hardcoded hex colors** — any `#rrggbb` or `#rgb` literal in CSS or inline styles that is not inside a generated token file.
- **Hardcoded rgba colors** — `rgba(...)` in CSS outside of the known interactive overlay tokens.
- **JS/TS color arrays** — string arrays containing hex color literals (e.g. `['#6366f1', ...]`). These must reference CSS variables instead.
- **Out-of-vocabulary font sizes** — `font-size: Npx` where N does not match any typography token value.
- **Out-of-vocabulary border radii** — `border-radius: Npx` where N does not match any radius token value.
- **Out-of-vocabulary spacing** — padding/margin/gap values that are not multiples of the 4px spacing base or do not match a named spacing token.

## Integration

Token lint runs as part of `npm run lint` on web and is invoked by the `implement-ui` agent command before commits. Zero violations is the pass criteria.
