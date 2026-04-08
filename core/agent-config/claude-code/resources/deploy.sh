#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — Claude Code adapter deployment script
# Run from the repo root: bash core/agent-config/claude-code/resources/deploy.sh
#
# Reads skill and rule content from .claude/skills/archui-spec/ (source of truth)
# and writes them to their correct destinations under .claude/skills/archui-spec/.
# This script is idempotent: re-running it overwrites files with canonical content.

SKILL_DIR=".claude/skills/archui-spec"
RULES_DIR="${SKILL_DIR}/rules"

echo "==> Creating destination directories..."
mkdir -p "${SKILL_DIR}"
mkdir -p "${RULES_DIR}/spec-format"
mkdir -p "${RULES_DIR}/uuid"
mkdir -p "${RULES_DIR}/validation"
mkdir -p "${RULES_DIR}/resources"
mkdir -p "${RULES_DIR}/commits"
mkdir -p "${RULES_DIR}/sync"
mkdir -p "${RULES_DIR}/context-loading"

# ---------------------------------------------------------------------------
echo "==> Writing ${SKILL_DIR}/SKILL.md ..."
cat > "${SKILL_DIR}/SKILL.md" << 'HEREDOC'
---
name: archui-spec
description: ArchUI architecture document modification workflow. Use when adding, changing, or removing ArchUI modules (README.md files with YAML frontmatter). Enforces filesystem rules, UUID management, and .archui/index.yaml sync.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# ArchUI Spec Modification Workflow

This skill is the entry point for all ArchUI spec work. Load the rule documents below **on demand** based on what the task requires — do not load all of them upfront.

## Module Commands

Every module can expose executable commands. Commands are `.md` files located at:

```
<module-path>/.archui/commands/<command-name>.md
```

To discover what actions a module supports, list its `.archui/commands/` directory. Each file has a `name` (button label), `description` (what it does), and a body (skill instructions for the AI agent). When the user asks to run a command on a module, read the corresponding command file and follow its instructions.

---

## Rule Loading Guide

| Situation | Load |
|---|---|
| User mentions `resources/`, reports a bug, or asks to investigate code | [rules/resources/README.md](rules/resources/README.md) — **load first, before anything else** |
| Writing or editing any README.md or `.archui/index.yaml` | [rules/spec-format/README.md](rules/spec-format/README.md) |
| Creating a new module | [rules/uuid/README.md](rules/uuid/README.md) + [rules/spec-format/README.md](rules/spec-format/README.md) |
| After any spec change | [rules/validation/README.md](rules/validation/README.md) — mandatory, no exceptions |
| After resources/ code changes pass testing | [rules/sync/README.md](rules/sync/README.md) |
| Before or during a git commit | [rules/commits/README.md](rules/commits/README.md) |
| Reading any module to understand it or its dependencies | [rules/context-loading/README.md](rules/context-loading/README.md) — always read identity doc + .archui/index.yaml together |

---

## Workflow Steps

### Step 1 — Determine scope

Read the affected modules and their parent modules to understand current state:
- What modules are changing (added / renamed / moved / deleted)?
- What modules link TO or FROM the affected modules?
- Does the task involve `resources/`? → Load [rules/resources/README.md](rules/resources/README.md) immediately.

### Step 2 — Update README.md and .archui/index.yaml

Load [rules/spec-format/README.md](rules/spec-format/README.md) for the exact format rules.

### Step 3 — Generate UUIDs (new modules only)

Load [rules/uuid/README.md](rules/uuid/README.md) for generation and uniqueness rules.

### Step 4 — Validate (mandatory)

Load [rules/validation/README.md](rules/validation/README.md). Run the validator. Fix all errors before proceeding.

### Step 5 — Sync spec after resources changes

If the task involved resources/ code changes, load [rules/sync/README.md](rules/sync/README.md) and apply the sync workflow.

### Step 6 — Commit

Load [rules/commits/README.md](rules/commits/README.md). Spec and resources commits must be separate.

---

## Quick reference — relation vocabulary

| relation | meaning |
|---|---|
| `depends-on` | this module needs the other to function |
| `implements` | this module is a concrete implementation of the other |
| `extends` | this module builds on the other |
| `references` | informational reference |
| `related-to` | loosely related, no strict dependency |
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${RULES_DIR}/spec-format/README.md ..."
cat > "${RULES_DIR}/spec-format/README.md" << 'HEREDOC'
# Spec File Format Rules

## Node types and identity documents

Every module folder contains exactly one typed identity document. The filename determines the node type:

| File | Node type | When to use |
|---|---|---|
| `SPEC.md` | Spec | An implementation specification with generated `resources/`. Must have exactly one HARNESS as a **direct** submodule; MEMORY submodule is optional (at most one). |
| `HARNESS.md` | Harness | Test harness for a SPEC. Exactly one link → direct parent SPEC. No other links permitted. |
| `MEMORY.md` | Memory | Persistent memory record. Links only to parent SPEC. Additional outbound links are a validation **warning** (not an error). |
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

**Forbidden in identity documents:** `uuid`, `submodules`, `links`, `layout`, any other structural field. These belong in `.archui/index.yaml`, not frontmatter.

**Description must be a single, declarative, self-contained sentence.** Multi-paragraph or multi-sentence descriptions trigger a validation warning. Keep it sharp — it is always loaded into agent context.

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
schema_version: 1          # REQUIRED
uuid: <stable 8-hex UUID — never change after creation>   # REQUIRED
submodules:                # folder-name → child uuid (must match actual subfolders)
  folder-name-a: <uuid-a>
  folder-name-b: <uuid-b>
links:
  - uuid: <target module UUID>
    relation: depends-on   # depends-on | implements | extends | references | related-to | custom
    description: Optional clarification
```

**Rules:**
- `schema_version` and `uuid` are REQUIRED fields
- `uuid` is permanent — never change it, even on rename/move
- `submodules` is a **map** (`folder-name → uuid`), not an array
- `submodules` keys must match actual subfolders on disk (bidirectional)
- `links` targets are UUIDs, not paths

**HARNESS link structure** (exactly one link, no others permitted):
```yaml
links:
  - uuid: <parent SPEC uuid>
    relation: implements
```

**layout.yaml:** The CLI checks for this file's existence but does not validate its contents. Stale UUIDs in `layout.yaml` are silently ignored.

## Module design principles

**Split aggressively.** If a module covers more than one coherent concept, split it. Prefer many small focused modules over fewer large ones. Every split must be reversible — child modules together must fully reconstruct the parent's meaning.

## .archui/ data handling

**Use the CLI to query or modify `.archui/` data; do not load raw `.archui/index.yaml` files into context.** Use `archui validate .` to check consistency. Read `.archui/index.yaml` only when you need the exact UUID of a specific module and cannot get it another way.
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${RULES_DIR}/uuid/README.md ..."
cat > "${RULES_DIR}/uuid/README.md" << 'HEREDOC'
# UUID Rules

## Format

8 lowercase hex characters. Examples: `93ab33c4`, `7e3f1c9a`.

**Never use full RFC 4122 UUIDs** (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

## Generating

```bash
openssl rand -hex 4
```

## Before using a generated UUID

Check it is not already in any existing `.archui/index.yaml`:

```bash
grep -r "<generated-uuid>" . --include="*.yaml"
```

If found, generate a new one.

## Rules

- UUID is assigned at module creation — **never changes** after that (not on rename, move, or content edit)
- Never reuse UUIDs from deleted modules
- UUIDs must be unique across the entire project

## YAML quoting

Some valid 8-hex strings are misread by YAML parsers:
- `785e2416` → looks like scientific notation (785 × 10^2416)
- `54534937` → looks like an integer

**Always quote UUIDs that could be misread:**

```yaml
uuid: "785e2416"   # quoted
```

When in doubt, quote it.
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${RULES_DIR}/validation/README.md ..."
cat > "${RULES_DIR}/validation/README.md" << 'HEREDOC'
# Validation Rules

## Mandatory after every change — no exceptions

```bash
archui validate .
```

## Reading output

- `ERROR` — blocking, fix all before proceeding
- `WARN` — advisory, acceptable but note them

## Common warnings

| Warning | Meaning | Fix |
|---|---|---|
| `frontmatter/description-multiline` | `description` field spans multiple sentences or lines | Rewrite as one concise, declarative sentence |
| `links/memory-extra-links` | MEMORY module has outbound links beyond its parent SPEC | Advisory only — remove extra links if possible |
| `spec/multiple-memory` | SPEC module has more than one MEMORY submodule | Keep at most one MEMORY submodule |

## Common errors

| Error code | Meaning | Fix |
|---|---|---|
| `links/dangling-uuid` | A link targets a UUID not found in the project | Remove the link or add the missing module |
| `archui/undeclared-subfolder` | A subfolder exists but is not in `.archui/index.yaml` submodules | Add it to the parent's submodules map |
| `archui/submodule-not-found` | submodules map references a folder or UUID that doesn't exist | Remove the entry or create the missing folder |
| `frontmatter/missing-field` | README.md is missing `name` or `description` | Add the missing field |
| `archui/missing-file` | `.archui/index.yaml` not found | Create it with at minimum `schema_version: 1` and a `uuid` |
| `spec/missing-harness` | SPEC module has no HARNESS submodule | Add a `<name>-harness/` subfolder with a `HARNESS.md` identity document |
| `spec/multiple-harness` | SPEC module has more than one HARNESS submodule | Keep exactly one HARNESS submodule |

## If validation fails

Return to the relevant step and fix. Never proceed past a failing validation.
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${RULES_DIR}/resources/README.md ..."
cat > "${RULES_DIR}/resources/README.md" << 'HEREDOC'
# Resources Boundary Rules

## The Rule

**Never read or modify any `resources/` folder content unless the user explicitly says so.**

"Explicitly" means the user's message contains words like: fix, update, modify, change, implement, build, rebuild, generate — AND the target is clearly `resources/` code (not spec files).

## Before touching resources/

1. **Always analyze from spec level first.** Read the relevant module README.md files.
2. **Check if the spec is complete.** If a spec module is missing or incomplete, that may be the root cause — add/fix the spec before touching code.
3. **Only after spec analysis**, if resources/ code must be read or changed, confirm with the user or proceed only if the user has explicitly authorized it in this message.

## Allowed without asking

- Reading module README.md and `.archui/index.yaml` files
- Running the CLI validator
- Running `git diff` / `git log` to understand what changed

## Requires explicit user authorization

- Reading any file inside `resources/`
- Modifying any file inside `resources/`
- Running `npm run build` or any build command

## When the user reports a bug

1. Read the relevant spec modules' README.md first
2. Run `archui validate .` to check spec consistency
3. If spec is valid and complete → tell the user the issue is in resources/, ask if they want you to investigate there
4. If spec is incomplete → fix the spec first, then ask about resources
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${RULES_DIR}/commits/README.md ..."
cat > "${RULES_DIR}/commits/README.md" << 'HEREDOC'
# Commit Discipline Rules

## Spec and resources must always be separate commits

| Commit type | Files it may touch | Message prefix |
|---|---|---|
| Spec | `README.md`, `.archui/index.yaml` only | `spec:` |
| Resources (web) | `web-development-release/**/resources/**` only | `web:` |
| Resources (iOS) | `ios-development-release/**/resources/**` only | `ios:` |
| Resources (Android) | `android-development-release/**/resources/**` only | `android:` |
| Resources (CLI) | `cli/resources/**` only | `cli:` |

**Mixed commits are not allowed.** If you find yourself staging both spec and resources files, split them into two separate commits before proceeding.

## How to check before committing

```bash
git diff --cached --name-only
```

If the output contains both README.md / `.archui/index.yaml` files AND files under `resources/`, unstage and split.

## Ordering

When both spec and resources need to change for the same feature:
- Spec commit first (defines the contract)
- Resources commit second (implements the contract)
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${RULES_DIR}/sync/README.md ..."
cat > "${RULES_DIR}/sync/README.md" << 'HEREDOC'
# Spec ↔ Resources Sync Workflow

## When to use

After any `resources/` code change has passed acceptance testing, the corresponding ArchUI spec modules must be synchronized. This is a mandatory step — do not skip it.

## Workflow

1. **Check what changed**
   ```bash
   git diff HEAD~1 --name-only | grep resources/
   git log --oneline -5
   ```

2. **Find the smallest affected modules**
   Start from the innermost modules whose spec is affected by the change. Do not start from the root.

3. **Update from the bottom up**
   - Update the leaf module's README.md body and `.archui/index.yaml` (links/submodules) first
   - After each leaf, check its parent — if the parent's description or links no longer match, update it too
   - Continue upward until all affected ancestors are updated

4. **Delegate per platform to sub-agents**
   For platform-specific resources (e.g. `web-development-release/`, `ios-development-release/`), spawn a sub-agent scoped to that platform's module tree. The sub-agent starts from the smallest changed module and works upward.

5. **Run validation**
   ```bash
   archui validate .
   ```

## What "affected" means

A spec module is affected if:
- Its described behavior changed in resources/
- A new capability was added that isn't described
- An existing description references something that no longer exists
- Links to/from this module are now inaccurate

## Scope rule

Only update spec modules whose content is genuinely stale. Do not touch modules that aren't affected by the resources change.
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${RULES_DIR}/context-loading/README.md ..."
cat > "${RULES_DIR}/context-loading/README.md" << 'HEREDOC'
# Module Context Loading

## Rule

When reading any module's identity document (`README.md`, `SPEC.md`, `SKILL.md`, `HARNESS.md`, `MEMORY.md`), you **must also read** `.archui/index.yaml` in the same directory. A module's context is not complete until both files have been read.

## Why

Identity documents contain only `name` and `description`. The structural half of a module — its `uuid`, `submodules` (child modules), and `links` (cross-module dependencies) — lives exclusively in `.archui/index.yaml`. Skipping it means you are missing:

- **uuid** — needed to identify this module in links from other modules
- **submodules** — the list of child modules this module contains
- **links** — what other modules this module depends on, implements, or extends

## When this applies

Every time you read a module to understand it, modify it, or reason about its relationships. There are no exceptions.

## Common violations

- Reading `SPEC.md` and starting to edit without checking what the module links to
- Answering "what does this module depend on?" from the identity document body alone
- Creating a new link without first reading `index.yaml` to check existing links
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing ${SKILL_DIR}/commands/convert-project.md ..."
mkdir -p "${SKILL_DIR}/commands"
cat > "${SKILL_DIR}/commands/convert-project.md" << 'HEREDOC'
# Convert Project to ArchUI Structure

You are converting an existing software project into a valid ArchUI-compliant module structure. Work autonomously and completely. Do not pause to ask questions.

---

## Module Decomposition Principles

Before creating any files, read the project structure and understand what each directory does. Then apply these principles to decide what becomes a module:

### What to make a module

- A directory that represents a **coherent, nameable concept** — something you could describe in one sentence
- A directory that other parts of the project depend on, or that has its own lifecycle
- A directory that a new team member would think of as "a thing" (e.g., "the CLI", "the API layer", "the auth module")

### What NOT to make a module

- Pure implementation detail folders that are not meaningful on their own: `utils/`, `helpers/`, `types/`, `constants/` — unless they represent a distinct library boundary
- Build artifacts: `dist/`, `build/`, `out/`, `.next/`, `coverage/`
- Dependency folders: `node_modules/`, `vendor/`
- Hidden infrastructure: `.git/`, `.cache/`, `__pycache__/`
- The `resources/` folder inside any ArchUI module (reserved by ArchUI)

### Naming rules

- `name`: Human-readable, 2–4 words, Title Case — e.g. "CLI Init Command", "Auth Service", "User Profile API"
- `description`: One sentence, present tense, describes **purpose** not implementation — e.g. "Handles user authentication and session management." NOT "Contains auth.ts and session.ts."

### Depth guidance

- **Depth 1 first**: Start by making every meaningful top-level directory a module. These are your primary boundaries.
- **Go deeper selectively**: Only create child modules inside a top-level module if that module is large enough that its subdirectories are themselves independently meaningful. Rule of thumb: if you'd describe a subdirectory to a new team member as "the X part of Y", it deserves its own module.
- **Avoid over-splitting**: A module with only one or two source files rarely needs child modules.

### Link inference rules

After creating all modules, look for relationships:
- If module A imports from module B → `A depends-on B`
- If module A is the test suite for module B → `A implements B`  
- If module A is built on top of module B's API → `A extends B`
- If module A just references module B for documentation → `A references B`
- Loose coupling without clear direction → `related-to`

Only add links you are confident about. Do not fabricate links.

---

## Execution Workflow

### Step 1: Read the Conversion Plan

Read `.archui/conversion-plan.yaml` from the project root. This file was generated by the CLI pre-scan and lists candidate folders with inferred names, descriptions, and README states. Use it as a starting point, but read actual folder contents to improve quality.

### Step 2: For Each Candidate Module

#### 2a. Determine Final Name and Description

- Read the actual folder (README.md, package.json, key source files) to understand what it does
- Apply the naming rules above
- Improve the pre-scan's `inferred_name` and `inferred_description` based on real content

#### 2b. Apply the README Merge Rule

Based on `readme_state` in the conversion plan:

| `readme_state` | Action |
|---|---|
| `"missing"` | Create `README.md` with frontmatter only (`name` + `description`) |
| `"no-frontmatter"` | Prepend the frontmatter block; preserve existing body verbatim |
| `"partial"` | Patch only the missing field(s); preserve everything else |
| `"complete"` | Leave the file completely untouched |

**Prepend format** (for `no-frontmatter`):
```
---
name: <name>
description: <description>
---

<original README body, unchanged>
```

The description when prepending must be derived from the actual content — read the file to write a quality sentence.

#### 2c. Write `.archui/index.yaml`

```yaml
schema_version: 1
uuid: "<generate a new 8-hex UUID>"
submodules: {}
links: []
```

Generate: `openssl rand -hex 4`
Verify uniqueness: `grep -r "<uuid>" . --include="*.yaml"` — if found, regenerate.

#### 2d. Write `.archui/layout.yaml`

```yaml
nodes: {}
viewport:
  zoom: 1
  pan: {x: 0, y: 0}
```

### Step 3: Register Child Modules in Parent

For each module created, add it to the parent's `.archui/index.yaml` submodules map:

```yaml
submodules:
  <folder-name>: <child-uuid>
```

Update the parent's `.archui/layout.yaml` to the parent form:
```yaml
layout:
  <parent-uuid>:
    x: "0"
    y: "0"
```
(The GUI will update positions when first opened.)

### Step 4: Infer and Write Cross-Module Links

After all modules are created, scan for dependencies (see link inference rules above). For each confident link, add to the source module's `.archui/index.yaml`:

```yaml
links:
  - uuid: <target-uuid>
    relation: depends-on
    description: <one-sentence explanation>
```

### Step 5: Archive Non-Spec Files into Resources

After all modules are created, every non-natural-language file in the project must live inside a module's `resources/` directory. Natural-language files are identity documents (`README.md`, `SPEC.md`, `HARNESS.md`, `MEMORY.md`, `SKILL.md`) and `.archui/` metadata — everything else is a resource.

#### 5a. Scan for Unarchived Files

Walk the entire project tree. For each file that is NOT one of:
- An identity document (`README.md`, `SPEC.md`, `HARNESS.md`, `MEMORY.md`, `SKILL.md`)
- An `.archui/` metadata file (`index.yaml`, `layout.yaml`, `commands/*.md`)
- Inside a `resources/` directory already
- Inside a skip directory (`node_modules`, `.git`, `dist`, `build`, `.next`, `__pycache__`, `vendor`, `.cache`, `coverage`, `out`, `tmp`)

...flag it as an unarchived resource.

#### 5b. Match Each File to Its Owning Module

For each unarchived file, determine which module it belongs to:
- A file at `<module-path>/foo.ts` belongs to the module at `<module-path>/`
- A file in a non-module subdirectory (e.g. `<module-path>/utils/helper.ts`) belongs to the nearest ancestor module

#### 5c. Relocate into Resources

Move each unarchived file into its owning module's `resources/` directory, preserving the relative path within the module:
- `my-module/src/index.ts` → `my-module/resources/src/index.ts`
- `my-module/package.json` → `my-module/resources/package.json`
- `my-module/utils/helper.ts` → `my-module/resources/utils/helper.ts`

Use `git mv` if inside a git repository to preserve history.

#### 5d. Handle Orphan Files — Refine Module Decomposition

If a file has no suitable owning module (it sits at a level where the nearest module is the project root and the file clearly belongs to a more specific domain):

1. **Do not dump it into the root module's `resources/`.** This means the earlier decomposition missed a boundary.
2. Create a new module for the orphan's directory — apply the same module creation rules from Step 2 (name, description, UUID, `index.yaml`, `layout.yaml`, register in parent).
3. Then archive the file into the new module's `resources/`.

Repeat until every non-spec file is inside some module's `resources/`.

#### 5e. Promote Identity Document Type

Once a module has a `resources/` directory, its identity document type must match the nature of those resources. A `README.md` (generic fallback) is only correct for modules with no resources or with purely generic content.

| Resources content | Correct identity type | Required submodules |
|---|---|---|
| Source code, configs, implementation files | `SPEC.md` | Must create `<name>-harness/` with `HARNESS.md` (one link → parent SPEC). May create `<name>-memory/` with `MEMORY.md`. |
| Test code, test fixtures, test configs | `HARNESS.md` | None (HARNESS is a leaf with exactly one link to its parent SPEC) |
| Logs, session records, accumulated knowledge | `MEMORY.md` | None (MEMORY links only to its parent SPEC) |
| Mixed or unclear | `SPEC.md` | Same as source code row — default to SPEC when in doubt |

**Promotion workflow:**

1. For each module that now has `resources/`, classify its resource content using the table above.
2. If the module currently has `README.md` but should be a different type:
   - Rename the identity document: `git mv README.md SPEC.md` (or `HARNESS.md`, `MEMORY.md`)
   - Preserve all frontmatter and body content — only the filename changes.
3. If promoted to `SPEC.md`, create the required HARNESS submodule:
   - Create `<module-name>-harness/` directory
   - Write `HARNESS.md` with frontmatter (`name`, `description`)
   - Write `.archui/index.yaml` with a new UUID, empty submodules, and exactly one link to the parent SPEC's UUID with `relation: implements`
   - Write `.archui/layout.yaml` (leaf form)
   - Register the harness in the parent SPEC's `.archui/index.yaml` submodules map
4. Optionally create `<module-name>-memory/` submodule (same pattern, with `MEMORY.md` and a link to parent SPEC).

### Step 6: Validate and Fix

```bash
archui validate .
```

Read all ERROR lines. Fix each one:

| Error | Fix |
|---|---|
| `links/dangling-uuid` | Remove the link or add the missing target module |
| `archui/undeclared-subfolder` | Add the folder to its parent's `submodules` map |
| `frontmatter/missing-field` | Add missing `name` or `description` to the identity document |
| `archui/missing-file` | Create `.archui/index.yaml` in the folder |

Re-run after each fix round. Continue until zero ERRORs.

### Step 7: Multi-Agent Submodule Completion

Spawn one sub-agent per top-level module directory. Each sub-agent is responsible for auditing and completing the `submodules` maps within its assigned subtree.

**Sub-agent task per top-level module `<module-path>/`:**

1. Walk the entire directory tree under `<module-path>/`, collecting every subfolder that has a `.archui/index.yaml`.
2. For each such subfolder, read its parent's `.archui/index.yaml` and check whether the subfolder's `folder-name → uuid` entry is present in the parent's `submodules` map.
3. For any missing entry, add it:
   ```yaml
   submodules:
     <folder-name>: <child-uuid>   # uuid read from child's .archui/index.yaml
   ```
4. After all missing entries are added, re-run `archui validate .` scoped to that module subtree and fix any `archui/undeclared-subfolder` or `archui/submodule-not-found` errors that remain.

**Coordination rule:** Sub-agents work in parallel across top-level modules. No two sub-agents touch the same `index.yaml` file. After all sub-agents complete, the orchestrating agent runs `archui validate .` over the full project and fixes any residual errors before proceeding.

### Step 8: Multi-Agent Link Completion

Spawn one sub-agent per top-level module directory. Each sub-agent is responsible for inferring and completing the `links` arrays within its assigned subtree.

**Sub-agent task per top-level module `<module-path>/`:**

1. Walk every module under `<module-path>/` and read its identity document and `.archui/index.yaml`.
2. For each module, scan its `resources/` directory (if present) for import statements, package dependencies, and references to other modules:
   - Source imports (e.g. `import ... from '../../other-module'`)
   - Package.json `dependencies` / `devDependencies` that correspond to sibling modules
   - Explicit cross-module references in prose (identity documents)
3. For each detected relationship, locate the target module's UUID from its `.archui/index.yaml`.
4. If a link to that UUID is not already present in the source module's `links` array, add it using the appropriate relation from the vocabulary:
   ```yaml
   links:
     - uuid: <target-uuid>
       relation: depends-on   # or implements | extends | references | related-to
       description: <one-sentence reason>
   ```
5. Apply the link inference rules: only add links you are confident about. Do not fabricate links for vague or indirect relationships.
6. After completing link additions, run `archui validate .` scoped to the subtree and fix any `links/dangling-uuid` errors.

**Coordination rule:** Sub-agents work in parallel. Links are directional — each sub-agent only adds outbound links from modules in its own subtree. After all sub-agents complete, the orchestrating agent runs `archui validate .` over the full project and fixes any residual errors before proceeding.

### Step 9: Clean Up

Delete `.archui/conversion-plan.yaml` — it is a temporary file and should not be committed.

---

## Hard Constraints

- **Never** modify files that are already inside an existing `resources/` directory — only move new files in
- **Never** change an existing UUID in any `.archui/index.yaml`
- **Never** add `uuid`, `submodules`, or `links` to README.md frontmatter — these belong only in `.archui/index.yaml`
- `description` must be a single sentence with no line breaks
- All UUIDs must be 8 lowercase hex characters (e.g., `a3f2b1c9`) — never RFC 4122 format
- Use `README.md` as the initial identity document for all modules you create. After resource archival, promote to `SPEC.md`, `HARNESS.md`, or `MEMORY.md` per Step 5e — never leave a module with `resources/` as a generic `README.md`
HEREDOC

echo "==> Deployment complete."
