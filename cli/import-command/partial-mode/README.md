---
name: Partial Mode
description: Defines the --partial and --deepen flags for archui import --apply, enabling staged adoption from L0 to L2 and L2 to L3 without requiring full conversion in one step.
---

## Overview

Partial mode is the mechanism that makes incremental adoption practical. Without it, `archui import --apply` must convert the entire project tree at once — a high-friction, all-or-nothing operation. With partial mode, users can adopt ArchUI at the top level first, get immediate value, and deepen the conversion later.

## `--partial` flag (L0 → L2)

```bash
archui import [path] --apply --partial
```

**What it does:**

1. Creates `README.md` and `.archui/index.yaml` for the root module
2. Creates `README.md` and `.archui/index.yaml` for each direct subfolder (top-level modules only)
3. Updates the root's `submodules` map to declare each top-level module

**What it does NOT do:**

- Does NOT recurse into subdirectories beyond depth 1
- Does NOT move any existing files
- Does NOT create `resources/original/` directories
- Does NOT touch existing content inside submodule folders

**Result:** The project reaches conformance L2. Running `archui validate --level 2 .` passes. Running `archui validate .` (L3) will report warnings for undeclared content within submodules — this is expected and not treated as an error in partial mode.

## `--deepen` flag (L2 → L3)

```bash
archui import [path] --apply --deepen
```

**Prerequisites:** The project must already be at L2 (verified by a `--level 2` validation check before proceeding).

**What it does:**

For each top-level module that contains undeclared subfolders:
1. Proposes sub-module boundaries (mechanically or via AI with `--enhance`)
2. Creates `README.md` and `.archui/index.yaml` for each proposed submodule
3. Moves original files that are not part of any submodule to `resources/original/` within that module
4. Recursively processes nested subdirectories

**Result:** The project reaches conformance L3. Running `archui validate .` passes.

## Incremental Deepening

`--deepen` can be scoped to a single module:

```bash
archui import ./api --apply --deepen     # deepen only the api/ module
```

This allows users to adopt depth incrementally, one top-level module at a time.

## Validation After Each Phase

| Phase | Validation run |
|-------|----------------|
| After `--partial` | `archui validate --level 2 .` |
| After `--deepen` (full) | `archui validate .` |
| After `--deepen` (scoped) | `archui validate --level 2 .` |
