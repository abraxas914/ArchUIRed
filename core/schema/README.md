---
name: Schema
description: Canonical Zod-based type definitions and runtime validators for all ArchUI data structures, exportable as JSON Schema for editor tooling.
---

## Overview

This module is the single canonical source of truth for ArchUI's data model. It defines every field in every ArchUI data file as Zod schemas with runtime validation, and derives JSON Schema artifacts for use by editors and external tooling.

The CLI validator and the GUI both depend on this package rather than maintaining independent type definitions. This ensures that what the validator checks is exactly what the GUI reads and writes.

## Node Types

ArchUI modules are distinguished by their identity document filename. Each type carries specific structural semantics enforced by the CLI validator.

| Identity document | Node type | Typical `resources/` | Key constraints |
|---|---|---|---|
| `README.md` | Generic | Optional | None beyond base rules |
| `SKILL.md` | Skill / knowledge | No | None beyond base rules |
| `SPEC.md` | Implementation spec | Yes | Must contain exactly one HARNESS and one MEMORY submodule |
| `MEMORY.md` | Memory | No | Should link only to parent SPEC |
| `HARNESS.md` | Test harness | Yes | Must have exactly one link, pointing to parent SPEC |

When multiple identity documents coexist in the same folder, the validator uses this precedence order: `SPEC.md` > `HARNESS.md` > `MEMORY.md` > `SKILL.md` > `README.md`.

## Data Structures Defined

### Identity document frontmatter (`IdentityFrontmatter`)

All identity document types (`README.md`, `SKILL.md`, `SPEC.md`, `MEMORY.md`, `HARNESS.md`) share the same required frontmatter schema:

```typescript
{
  name: string        // REQUIRED: human-readable module title
  description: string // REQUIRED: one-sentence summary, always loaded into agent context
}
```

No other fields are permitted in any identity document frontmatter. Presence of any additional field (e.g., `uuid`, `submodules`) is a validation error.

### `.archui/index.yaml` (`IndexYaml`)

```typescript
{
  schema_version: number | string  // REQUIRED: current schema version
  uuid: string                     // REQUIRED: 8 lowercase hex characters
  submodules?: Record<string, string>  // folder-name → child uuid
  links?: ModuleLink[]
  layout?: Record<string, { x: number | string; y: number | string }>
}
```

### Cross-module link entry (`ModuleLink`)

```typescript
{
  uuid: string        // REQUIRED: target module UUID
  relation?: string   // OPTIONAL: see relation vocabulary
  description?: string
}
```

## Published Package

The schema is published as `@archui/schema`. Both `cli/` and `web-development-release/web-dev/` declare it as a dependency.

## JSON Schema Artifacts

Running `npm run build` in this module's `resources/` generates:

- `resources/dist/index-yaml.schema.json` — JSON Schema for `.archui/index.yaml`
- `resources/dist/readme-frontmatter.schema.json` — JSON Schema for README.md frontmatter

These can be wired into VS Code settings (`yaml.schemas`, `markdownlint`) to provide inline validation and autocompletion.
