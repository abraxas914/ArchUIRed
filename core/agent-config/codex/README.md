---
name: Codex
description: "Deployment adapter that transforms platform-agnostic skill and rule templates into OpenAI Codex's AGENTS.md instruction format, consolidating skills and rules into a single agent instruction file."
---

## Overview

This adapter reads skill and rule templates from sibling modules and outputs the instruction file that OpenAI Codex expects:

- `AGENTS.md` — A single Markdown file at the project root (or in subdirectories for scoped instructions) containing all agent instructions

Codex uses a simpler model than Claude Code or Cursor: one file, no separate skill/rule distinction.

## Output Structure

```
project-root/
├── AGENTS.md              ← primary instruction file (generated)
└── core/
    └── AGENTS.md          ← optional scoped instructions for core work
```

## Adaptation Rules

### AGENTS.md Structure

The generated `AGENTS.md` follows this structure:

1. **Project overview** — What ArchUI is and how the filesystem-first model works
2. **Rules** (from rule-templates) — Always-on constraints, each as a headed section
3. **Workflows** (from skill-templates) — Step-by-step procedures for common tasks
4. **Validation** — How to run the CLI validator and what to expect

### Scoped Instructions

Codex supports directory-scoped `AGENTS.md` files. When an agent operates within a subdirectory, it loads that directory's `AGENTS.md` in addition to the root. The adapter can generate scoped files for areas with specific workflows (e.g. `core/AGENTS.md` for spec editing).

### Key Differences from Other Adapters

- Single-file format — no skill/rule directory hierarchy
- No frontmatter — instructions are plain Markdown
- Scoping is by directory placement, not by metadata
- Skills and rules are merged into one document with section headers
