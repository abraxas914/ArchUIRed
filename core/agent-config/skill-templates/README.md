---
name: Skill Templates
description: "Platform-agnostic skill content templates that capture teachable agent capabilities — module creation, spec editing, validation workflow — derived from core spec rules."
---

## Overview

Skill templates are the canonical, platform-neutral descriptions of what an AI coding agent needs to know to operate on an ArchUI project. Each template encodes one coherent capability as prose instructions.

Templates are consumed by agent-specific adapter modules (`claude-code`, `cursor`, `codex`, `copilot`) which wrap them in the metadata and directory structure each platform requires.

## Template Categories

### Spec Modification Skills

- **Module creation** — How to create a new ArchUI module: folder structure, identity document format, UUID generation, parent registration in `.archui/index.yaml`.
- **Spec editing** — How to modify an existing module's README.md frontmatter and body, what fields are allowed, what is forbidden.
- **Module linking** — How to declare cross-module links using UUIDs, the relation vocabulary, link constraints for HARNESS and MEMORY types.

### Validation Skills

- **Structure validation** — How to run the CLI validator, interpret its output, and fix common errors.
- **Pre-commit checks** — The mandatory validation step before any commit, and the rule that spec and resources commits must be separate.

### Navigation Skills

- **Module discovery** — How to navigate the module tree, read `description` fields for context, follow links to understand relationships.
- **UUID resolution** — How to look up a module by UUID, why paths are unstable but UUIDs are stable.

## Template Format

Each template is a Markdown file in `resources/` containing:

1. A title and one-line summary
2. Step-by-step instructions in imperative prose
3. Examples where helpful
4. Explicit constraints and anti-patterns

Templates reference core spec rules by module path (e.g. "see `core/filesystem-rules`") but do not embed the full rule text — adapters inline or link as appropriate for their platform.
