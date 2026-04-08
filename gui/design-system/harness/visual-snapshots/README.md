---
name: Visual Snapshots
description: "Headless-browser screenshot capture and pixel-diff regression checks that detect visual deviations invisible to static token analysis."
---

## Overview

Visual snapshots provide the last line of defense against design drift. Even when all tokens are correctly referenced, subtle issues (wrong token applied to wrong element, unexpected interaction between properties, z-index overlap) can only be caught visually.

## Capture Matrix

The snapshot suite captures these component states:

| Component | States |
|---|---|
| PrimaryCard | default, hover, selected, modified, error |
| FallbackCard | default, selected |
| ExternalStub | default, selected |
| LinkEdge | depends-on, implements, references |
| Breadcrumb | root, deep-path |
| CommandPalette | open |

Each state is captured in both Light and Dark modes, producing a total baseline set.

## Workflow

1. A Playwright script navigates to a local dev server rendering each component in isolation.
2. Screenshots are saved as PNG to `resources/snapshots/` and committed as baselines.
3. On each agent UI change, the script re-captures and diffs against baselines.
4. A pixel-diff threshold of 0.1% flags regressions for human review.
5. If the change is intentional, the agent updates baselines and commits the new snapshots.

## Accessibility Note

Snapshot capture disables CSS animations (`prefers-reduced-motion: reduce`) to ensure deterministic screenshots.
