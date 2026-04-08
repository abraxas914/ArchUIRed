---
name: Conformance Report
description: Defines the output format of the archui import --analyze phase, including the conformance level, gap list, and proposed action plan.
---

## Overview

The conformance report is the output of `archui import --analyze`. It gives users a clear picture of where their project stands relative to ArchUI conformance and what steps are needed to reach each level.

## Report Format

```
ArchUI Conformance Report
═══════════════════════════════════════
Project:     /path/to/project
Detected:    plain folders
Current:     L0 (no ArchUI files found)
Target:      L3 (full compliance)

Files:       142 total  (87 .md, 31 .ts, 24 other)
Top-level:   6 directories, 3 files

Conformance Gap
───────────────
L0 → L1  Create root README.md (name + description)
         Create root .archui/index.yaml (uuid)

L1 → L2  Create README.md + .archui/index.yaml for 6 top-level directories:
           api/, cli/, core/, docs/, tests/, web/

L2 → L3  Process subdirectories within each top-level module
         Move original files to resources/original/
         Declare cross-module links

Next step:  archui import . --preview
```

## Fields

| Field | Description |
|-------|-------------|
| `Detected` | Source type from source-detection heuristics |
| `Current` | Highest conformance level already achieved |
| `Target` | Conformance level the import will aim for (configurable via `--target-level`) |
| `Conformance Gap` | Ordered list of actions needed to reach each level |

## Programmatic Output

With `--json`, the report is emitted as structured JSON for integration with other tools.
