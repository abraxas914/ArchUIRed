---
name: Analyze Phase
description: Defines the behavior of archui import --analyze, which scans a project and outputs a conformance report without making any changes.
---

## Overview

The analyze phase is a read-only scan. It never writes, moves, or modifies any file. Its output is a conformance report (see `core/adoption/conformance-report`) that tells the user:

1. What source type was detected
2. What conformance level the project is currently at
3. What actions are required to reach L2 and L3

## Algorithm

```
1. Walk the project root directory (non-recursive at depth 0)
2. Detect source type (see core/adoption/source-detection)
3. Check root for README.md frontmatter and .archui/index.yaml → determine L0/L1
4. For each top-level subfolder:
   - Check for README.md frontmatter → contributes to L2 gap
   - Check for .archui/index.yaml → contributes to L2 gap
5. Compute current conformance level
6. Build gap list: ordered actions to reach L2, then L3
7. Print conformance report
```

## Output

Prints the conformance report format defined in `core/adoption/conformance-report`.

With `--json`, emits machine-readable JSON instead.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Analysis complete (regardless of conformance level) |
| `1` | Path does not exist or is not readable |
