# Spec File Format Rules

## Node types and identity documents

Every module folder contains exactly one typed identity document. The filename determines the node type:

| File | Node type | When to use |
|---|---|---|
| `SPEC.md` | Spec | An implementation specification with generated `resources/`. Must have HARNESS + MEMORY submodules. |
| `HARNESS.md` | Harness | Test harness for a SPEC. Exactly one link → parent SPEC. |
| `MEMORY.md` | Memory | Persistent memory record. Links only to parent SPEC (softly enforced). |
| `SKILL.md` | Skill | Reusable skill or knowledge unit. No `resources/` typically. |
| `README.md` | Generic | Untyped fallback when no stronger type applies. |

**Precedence when multiple files exist:** `SPEC.md` > `HARNESS.md` > `MEMORY.md` > `SKILL.md` > `README.md`. Only the highest-priority file acts as the identity document.

## Identity document format

All identity document types share the same frontmatter schema. Only two fields are allowed:

```yaml
---
name: Human-readable module name
description: One-sentence summary — always loaded into agent context, keep it sharp
---

Body markdown here.
```

**Forbidden in identity documents:** `uuid`, `submodules`, `links`, `layout`, any other structural field.

## Default names for whitelisted hidden folders

When creating an identity document for a root-level whitelisted hidden folder, use these default names:

| Folder | Default `name` |
|---|---|
| `.archui` | ArchUI Settings |
| `.claude` | Claude Settings |
| `.cursor` | Cursor Settings |
| `.github` | GitHub Settings |
| `.vscode` | VS Code Settings |
| `.aider` | Aider Settings |
| `.windsurf` | Windsurf Settings |

**Body rules:**
- Natural language prose only
- No code snippets, scripts, config files — those belong in `resources/`
- Keep it as short as the concept allows

## .archui/index.yaml format

```yaml
schema_version: 1
uuid: <stable 8-hex UUID — never change after creation>
submodules:             # folder-name → child uuid (must match actual subfolders)
  folder-name-a: <uuid-a>
  folder-name-b: <uuid-b>
links:
  - uuid: <target module UUID>
    relation: depends-on   # depends-on | implements | extends | references | related-to | custom
    description: Optional clarification
```

**Rules:**
- `uuid` is permanent — never change it, even on rename/move
- `submodules` is a **map** (`folder-name → uuid`), not an array
- `submodules` keys must match actual subfolders on disk (bidirectional)
- `links` targets are UUIDs, not paths

## Module design principles

**Split aggressively.** If a module covers more than one coherent concept, split it. Prefer many small focused modules over fewer large ones. Every split must be reversible — child modules together must fully reconstruct the parent's meaning.

## .archui/ data handling

**Use the CLI to query or modify `.archui/` data; do not load raw `.archui/index.yaml` files into context.** Use `archui validate .` to check consistency. Read `.archui/index.yaml` only when you need the exact UUID of a specific module and cannot get it another way.
