---
name: Cursor
description: "Deployment adapter that transforms platform-agnostic skill and rule templates into Cursor's .cursor/skills/ and .cursor/rules/ directory structures, following Cursor's SKILL.md and RULE.md conventions."
---

## Overview

This adapter reads skill and rule templates from sibling modules and outputs the file structures that Cursor expects:

- `.cursor/skills/<skill-name>/SKILL.md` — Skill files registered in Cursor's skill system
- `.cursor/rules/<rule-name>.md` or `.cursor/rules/<rule-name>/RULE.md` — Rule files that Cursor applies as always-on constraints

## Output Structure

```
project-root/
└── .cursor/
    ├── skills/
    │   └── archui-spec/
    │       └── SKILL.md
    └── rules/
        ├── frontmatter-purity.md
        ├── validation-mandate.md
        ├── resources-boundary.md
        └── uuid-permanence.md
```

## Adaptation Rules

### Skill Files

Cursor skills use a SKILL.md format with frontmatter fields:

- `name` — skill identifier
- `description` — one-line summary used for skill discovery and context loading

The body contains the full skill instructions, adapted from skill-templates.

### Rule Files

Cursor rules are always-on constraints loaded into every agent session. Each rule-template maps to one rule file. Rules are concise — typically under 50 lines — and state the constraint, rationale, and examples of correct/incorrect behavior.

### Key Differences from Claude Code

- Cursor separates skills and rules into distinct directories; Claude Code merges rules into `CLAUDE.md`
- Cursor rule files are individually loaded; Claude Code's `CLAUDE.md` is a single monolithic file
- Cursor skills may reference project-level `.cursor/rules/` for shared constraints
