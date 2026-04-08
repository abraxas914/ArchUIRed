---
name: Adoption
description: Defines how existing non-ArchUI projects adopt the ArchUI schema incrementally, including conformance levels, source type detection, and partial compliance semantics.
---

## Overview

Adoption is distinct from two similar flows:

- **`core/migration`** — handles schema version upgrades for *existing* ArchUI projects (v1 → v2).
- **`core/import`** — handles the GUI-triggered, AI-driven conversion of a non-ArchUI folder.

Adoption covers the CLI-facing, user-controlled path for bringing an existing project into ArchUI conformance. It defines the concepts that both the CLI import command and the GUI import flow share: conformance levels, source type detection, and what "partial compliance" means.

## Conformance Levels

Rather than binary pass/fail, adoption uses four conformance levels (L0–L3). This allows users to adopt ArchUI incrementally rather than converting everything at once.

| Level | State | Condition |
|-------|-------|-----------|
| L0 | No ArchUI files | No `README.md` with frontmatter, no `.archui/index.yaml` anywhere |
| L1 | Root initialized | Root directory has valid `README.md` + `.archui/index.yaml` |
| L2 | Top-level declared | All direct subfolders being treated as modules have valid identity files and UUIDs |
| L3 | Fully compliant | Entire folder tree is valid; all UUIDs unique; all links resolve |

`archui validate --level <1|2|3>` only enforces rules up to that level. The default (no flag) is equivalent to `--level 3`.

## Submodules

- **source-detection** — Heuristics for identifying the source type of a project being imported (Obsidian vault, Notion export, plain folders).
- **conformance-report** — Defines the output format of the analysis phase: what fields are reported, what scoring means.
- **partial-compliance** — Defines exactly which validation rules apply at each conformance level.
