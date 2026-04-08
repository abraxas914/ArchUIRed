---
name: Agent Config
description: "Generates platform-specific skill files and rule files for external AI coding agents (Claude Code, Cursor, Codex, Copilot) from ArchUI's core spec, separating content templates from per-agent deployment adapters."
---

## Overview

External AI coding agents — Claude Code, Cursor, Codex, GitHub Copilot — each need their own configuration files to understand how to operate on an ArchUI project. Today these files are maintained by hand; this module replaces manual maintenance with a generation pipeline.

The architecture separates two concerns:

1. **Content** — what skills and rules to teach agents. This is platform-agnostic and derived from core spec modules (`filesystem-rules`, `readme-schema`, `uuid-system`, `link-system`, etc.).
2. **Deployment** — how to format and place those skills/rules for each agent platform. Each platform has its own file format, directory convention, and metadata requirements.

## Submodules

- **skill-templates** — Platform-agnostic skill content templates derived from core spec. Each template captures one teachable capability (e.g. "how to create a module", "how to validate structure").
- **rule-templates** — Platform-agnostic rule content templates derived from core spec. Rules are always-on constraints (e.g. "never put uuid in frontmatter", "run validator after changes").
- **claude-code** — Adapter that reads templates and outputs `.claude/skills/` directory structure and `CLAUDE.md` content, following Claude Code's SKILL.md frontmatter format.
- **cursor** — Adapter that reads templates and outputs `.cursor/skills/` and `.cursor/rules/` directory structures, following Cursor's skill and rule file conventions.
- **codex** — Adapter that reads templates and outputs `AGENTS.md` and related files following OpenAI Codex's agent instruction format.
- **copilot** — Adapter that reads templates and outputs `.github/copilot-instructions.md` and related files following GitHub Copilot's instruction format.

## Generation Flow

```
core spec modules (filesystem-rules, readme-schema, uuid-system, link-system, schema)
    ↓ extract rules and procedures
skill-templates/ + rule-templates/   (platform-agnostic content)
    ↓ format adaptation
claude-code/   → .claude/skills/, CLAUDE.md
cursor/        → .cursor/skills/, .cursor/rules/
codex/         → AGENTS.md
copilot/       → .github/copilot-instructions.md
```

## Design Principles

**Templates are the source of truth.** Agent-specific output files are generated artifacts. When a core spec rule changes, the template is updated once and all agent outputs are regenerated.

**Adapters are thin.** Each agent adapter handles only format differences (frontmatter fields, directory layout, file naming). Business logic and content live in templates.

**Additive for new agents.** Supporting a new AI coding agent means adding one adapter submodule. No changes to templates or other adapters required.

## Relationship to core/ai-agent

`core/ai-agent` defines how ArchUI **hosts** an embedded AI agent (API client, skill loader, task runner). This module defines how ArchUI **is operated by** external coding agents. The two are complementary but independent.
