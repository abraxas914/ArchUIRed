---
name: Import Command
description: Specifies the archui import command, which converts an existing non-ArchUI project to ArchUI format through analyze, preview, and apply phases.
---

## Overview

`archui import` is the CLI path for adopting ArchUI on an existing project. Unlike the GUI-triggered import flow (which is AI-driven and requires a confirmation dialog), the CLI import is designed for scripted, incremental, and user-controlled adoption.

The command follows a three-phase workflow that mirrors safe database migration practice: analyze first, preview before committing, then apply.

## Command Signature

```
archui import [path] <phase-flag> [options]
```

## Phase Flags

| Flag | Phase | Description |
|------|-------|-------------|
| `--analyze` | Analysis | Scan the project and produce a conformance report |
| `--preview` | Preview | Show exactly what files will be created/moved, without writing |
| `--apply` | Apply | Execute the conversion |

## Apply Options

| Option | Default | Description |
|--------|---------|-------------|
| `--partial` | off | L0 → L2: create identity files only, leave existing content in place |
| `--deepen` | off | L2 → L3: process subdirectories, move originals to `resources/original/` |
| `--target-level <1\|2\|3>` | 2 with `--partial`, 3 with `--deepen` | Override target conformance level |

## Typical Usage

```bash
# Step 1: understand current state
archui import . --analyze

# Step 2: preview what will change
archui import . --preview

# Step 3: snapshot before conversion
git add -A && git commit -m "snapshot before archui import"

# Step 4: convert top-level structure (L0 → L2)
archui import . --apply --partial

# Step 5 (later): deepen one module at a time
archui import ./api --apply --deepen
```

## Phase Submodules

- **analyze-phase** — traversal algorithm, source type detection, conformance report output
- **preview-phase** — proposed module tree, mechanical vs. AI-driven generation, output format
- **apply-phase** — prerequisite checks, file creation, validation gate per module
- **partial-mode** — `--partial` and `--deepen` behavior, what gets created vs. left in place
