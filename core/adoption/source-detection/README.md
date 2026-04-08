---
name: Source Detection
description: Heuristics for identifying the source type of a project being imported into ArchUI (Obsidian vault, Notion export, or plain folders).
---

## Overview

Before analyzing a project's structure, the import command identifies its source type. Source type affects how the analysis interprets the directory layout and what module-splitting heuristics apply.

## Detected Source Types

### Obsidian Vault

**Heuristic:** An `.obsidian/` directory exists at the project root.

**Characteristics:**
- Notes are Markdown files scattered across topic folders
- Cross-note links use `[[wiki-link]]` syntax (not UUID-based)
- Attachments are commonly in an `attachments/` or `assets/` subfolder
- Tags are inline in frontmatter (`tags: [a, b]`)

**Module-splitting guidance:** Each top-level folder typically maps to one ArchUI module. `.obsidian/` is excluded from conversion (moved to `resources/original/.obsidian/`).

### Notion Export

**Heuristic:** HTML files coexist with Markdown files at the root, OR the root contains a folder named `Markdown Export` or a file named `Export-*.zip`.

**Characteristics:**
- Each page is a `.md` file; subpages are in a matching subfolder (e.g., `Page.md` + `Page/`)
- Page UUIDs appear in filenames (e.g., `Page 1a2b3c4d.md`)
- Internal links use relative paths with encoded UUIDs

**Module-splitting guidance:** Each top-level Notion page (`.md` + matching folder) maps to one ArchUI module. UUID suffixes are stripped from folder names during conversion.

### Plain Folders

**Heuristic:** Neither of the above patterns is detected.

**Characteristics:** Arbitrary directory structure with mixed file types.

**Module-splitting guidance:** Each top-level directory becomes one ArchUI module. Files directly at the root are placed in `resources/original/` at the root module level.

## Fallback

If source type cannot be determined (empty directory, single-file project), the import command treats the project as plain folders and proceeds with mechanical analysis.
