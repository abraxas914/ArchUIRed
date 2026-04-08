---
name: Copilot
description: "Deployment adapter that transforms platform-agnostic skill and rule templates into GitHub Copilot's .github/copilot-instructions.md format and optional .github/copilot/ directory structure."
---

## Overview

This adapter reads skill and rule templates from sibling modules and outputs the instruction files that GitHub Copilot expects:

- `.github/copilot-instructions.md` — Primary instruction file loaded into every Copilot session
- `.github/copilot/*.md` — Optional additional instruction files for specific contexts

## Output Structure

```
project-root/
└── .github/
    ├── copilot-instructions.md    ← primary instruction file (generated)
    └── copilot/                   ← optional scoped instructions
        └── archui-spec.md
```

## Adaptation Rules

### copilot-instructions.md Structure

The generated instruction file follows this structure:

1. **Project context** — What ArchUI is and the filesystem-first model
2. **Constraints** (from rule-templates) — Always-on rules as concise statements
3. **Procedures** (from skill-templates) — Key workflows condensed for Copilot's context window

### Context Window Considerations

Copilot has a more limited context window than Claude Code or Cursor agents. The adapter prioritizes:

- Brevity over completeness — rules are stated as one-liners where possible
- Most critical constraints first — frontmatter purity, validation mandate, resources boundary
- Links to full documentation rather than inlining detailed procedures

### Key Differences from Other Adapters

- Single primary file with optional supplementary files
- Optimized for shorter context windows — more concise than AGENTS.md or CLAUDE.md
- Hosted in `.github/` directory alongside other GitHub configurations
- No frontmatter or metadata — plain Markdown throughout
