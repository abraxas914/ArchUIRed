---
name: Claude Code
description: "Deployment adapter that transforms platform-agnostic skill and rule templates into Claude Code's .claude/skills/ directory structure and CLAUDE.md root file, following Claude Code's SKILL.md frontmatter conventions."
---

## Overview

This adapter reads skill and rule templates from sibling modules and outputs the file structure that Claude Code expects:

- `.claude/skills/<skill-name>/SKILL.md` — Skill files with Claude Code-specific frontmatter (`name`, `description`, `user-invocable`, `allowed-tools`)
- `CLAUDE.md` — Root-level instruction file loaded into every Claude Code session

## Output Structure

```
project-root/
├── CLAUDE.md                          ← generated from rule-templates + project context
└── .claude/
    └── skills/
        └── archui-spec/
            ├── SKILL.md               ← generated from skill-templates
            └── rules/
                ├── spec-format/README.md
                ├── uuid/README.md
                ├── validation/README.md
                ├── sync/README.md
                ├── commits/README.md
                └── resources/README.md
```

## Adaptation Rules

### SKILL.md Frontmatter

Claude Code skills require these frontmatter fields:

- `name` — skill identifier (from template title)
- `description` — one-line summary (from template summary)
- `user-invocable: true` — whether users can trigger the skill directly
- `allowed-tools` — comma-separated list of tools the skill may use

### CLAUDE.md Generation

The root `CLAUDE.md` is assembled from:

1. Project overview (from the root module's README.md `description`)
2. Filesystem rules summary (from rule-templates)
3. Repository structure snapshot
4. Development workflow (from skill-templates)
5. Validation command reference

### Sub-rule Files

Complex skills are split into lazy-loaded sub-rule files under the skill directory. These are Markdown files that the main SKILL.md references via a loading guide table, allowing the agent to load context on demand rather than all at once.
