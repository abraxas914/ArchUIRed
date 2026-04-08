---
name: Preview Phase
description: Defines the behavior of archui import --preview, which displays the proposed module tree and files to be created without writing anything.
---

## Overview

The preview phase shows the user exactly what `--apply` would do. No files are written. The output is a tree view of proposed new files and directories.

## Mechanical vs. AI-Assisted Preview

### Mechanical preview (default)

For projects with 20 or fewer top-level entries, the preview is generated mechanically:

- Module names are derived from folder names (lowercased, hyphens preserved)
- Module descriptions are left as stubs: `"TODO: add description"`
- The proposed tree is printed immediately without any API call

### AI-assisted preview (opt-in)

For projects with more than 20 top-level entries, or when `--enhance` is passed:

```bash
archui import . --preview --enhance
```

An AI agent is invoked to generate meaningful module descriptions by reading each folder's contents. Requires an API key configured in the environment.

## Output Format

```
Proposed module tree for: /path/to/project
─────────────────────────────────────────
  [CREATE]  README.md                     (root module: "My Project")
  [CREATE]  .archui/index.yaml            (uuid: <generated>)
  [CREATE]  api/README.md                 (module: "API")
  [CREATE]  api/.archui/index.yaml        (uuid: <generated>)
  [CREATE]  cli/README.md                 (module: "CLI")
  [CREATE]  cli/.archui/index.yaml        (uuid: <generated>)
  ...

  6 modules to create. 12 files to write. 0 files to move.

Run 'archui import . --apply --partial' to apply.
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Preview generated successfully |
| `1` | Path error |
| `2` | AI enhancement requested but no API key configured |
