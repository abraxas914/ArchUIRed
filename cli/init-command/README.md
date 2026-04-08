---
name: Init Command
description: Specifies the behavior of archui init, which initializes a new ArchUI project at a given path by creating the root module's identity files.
---

## Overview

`archui init` is the entry point for creating a new ArchUI project from scratch. It creates the minimum required files at the project root: `README.md` (with frontmatter) and `.archui/index.yaml` (with a generated UUID). After running `archui init`, the project is at conformance L1 and ready for `archui new` to add submodules.

## Command Signature

```
archui init [path] [--name <name>] [--description <desc>]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `path` | `.` (cwd) | Directory to initialize |
| `--name` | basename of path | Module name for README.md frontmatter |
| `--description` | *(required or prompted)* | One-sentence summary for README.md frontmatter |

If `--description` is omitted and the terminal is interactive, the command prompts for it. If not interactive (e.g., in a script), `--description` is required.

## Behavior

1. Verify `path` is a writable directory. Exit with an error if not.
2. Check for an existing `.archui/index.yaml`. If found:
   - Print: `Already an ArchUI project (uuid: <uuid>). Nothing to do.`
   - Exit 0 (idempotent — safe to run twice).
3. Generate a new 8-hex UUID. Verify it does not collide with any existing `.archui/index.yaml` in the tree (if any).
4. Write `README.md`:
   ```markdown
   ---
   name: <name>
   description: <description>
   ---
   ```
5. Write `.archui/index.yaml`:
   ```yaml
   schema_version: 1
   uuid: <generated-uuid>
   ```
6. If a `.git` directory is present at `path`, stage both files with `git add`.
7. Print: `Initialized ArchUI project: <name> (uuid: <uuid>)`

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success (including no-op on already-initialized project) |
| `1` | `path` does not exist or is not writable |
| `2` | `--description` required but not provided in non-interactive mode |
