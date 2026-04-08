---
name: Design System Harness
description: "Executable enforcement layer that prevents design-token drift — generates token files from Figma, statically lints code for hardcoded values, and captures visual snapshots for regression detection."
---

## Overview

The harness converts the design system from passive documentation into an executable constraint. Instead of relying on agents to read token tables and manually transcribe values, the harness provides three automated checkpoints that run before any UI code is committed.

The token generator fetches the canonical Figma token values via MCP and renders platform-specific token mapping files. Generated files carry a file-header guard and must never be hand-edited. The token lint scans implementation code for hardcoded color, typography, spacing, and dimension values that bypass the token vocabulary. The visual snapshot layer captures component states via headless browser and diffs them against committed baselines to catch regressions invisible to static analysis.

All three layers are wired into the agent workflow via the `implement-ui` command on platform modules. An agent must pass all harness checks before committing UI changes.

## Submodules

- **token-generator** — Fetches Figma Foundations tokens via MCP and renders platform-native token mapping files (CSS custom properties, Swift extensions, Compose theme).
- **token-lint** — Static analysis rules that detect hardcoded values escaping the design-token vocabulary in implementation code.
- **visual-snapshots** — Headless-browser screenshot capture and pixel-diff regression checks for key component states.
