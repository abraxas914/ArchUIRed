---
name: Partial Compliance
description: Defines which ArchUI validation rules are enforced at each conformance level (L1–L3), enabling safe incremental adoption without false positives during migration.
---

## Overview

During incremental adoption, a project may be intentionally incomplete. Running the full validator (`archui validate .`) on a partially-converted project would produce dozens of false-positive errors that the user already knows about and plans to fix later. Partial compliance defines how to run validation in a way that matches the user's current adoption stage.

## Validation Rules by Level

### Level 1 checks (always enforced)

These rules apply as soon as `archui validate --level 1` is run:

- Root `README.md` must exist and have valid frontmatter (`name`, `description`)
- Root `.archui/index.yaml` must exist with `schema_version` and `uuid`
- Root `uuid` must be a valid 8-hex string

### Level 2 checks (additive — L1 + L2)

All Level 1 checks, plus:

- Every direct subfolder of the root that is declared in `submodules` must have a valid `README.md` and `.archui/index.yaml`
- Every declared submodule UUID must be unique within the declared modules
- Undeclared subfolders at depth 1 are reported as **warnings** (not errors) — they represent un-adopted content

### Level 3 checks (additive — L1 + L2 + L3, equivalent to default `archui validate`)

All Level 2 checks, plus:

- Every folder at every depth is either a declared submodule or `resources/`
- All link targets resolve to existing modules in the project
- No duplicate UUIDs anywhere in the project tree
- All declared submodule folder names exist on disk

## Invoking Validation at a Specific Level

```bash
archui validate --level 1 .    # root-only checks
archui validate --level 2 .    # top-level module checks
archui validate .               # full tree (same as --level 3)
```

The `--strict` flag promotes all warnings to errors at any level.

## Relationship to `archui import`

- `archui import . --apply --partial` targets L2 compliance and runs `archui validate --level 2 .` to verify
- `archui import . --apply --deepen` targets L3 compliance and runs `archui validate .` to verify
