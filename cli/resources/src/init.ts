import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as readline from 'readline'
import { execSync, spawnSync, spawn } from 'child_process'
import { parse as parseYaml } from 'yaml'

// ---------------------------------------------------------------------------
// Inline deploy script constants
// ---------------------------------------------------------------------------

const CLAUDE_CODE_DEPLOY_SH = `#!/usr/bin/env bash
set -euo pipefail

# deploy.sh — Claude Code adapter deployment script
# Run from the repo root: bash core/agent-config/claude-code/resources/deploy.sh
#
# Reads skill and rule content from .claude/skills/archui-spec/ (source of truth)
# and writes them to their correct destinations under .claude/skills/archui-spec/.
# This script is idempotent: re-running it overwrites files with canonical content.

SKILL_DIR=".claude/skills/archui-spec"
RULES_DIR="\${SKILL_DIR}/rules"

echo "==> Creating destination directories..."
mkdir -p "\${SKILL_DIR}"
mkdir -p "\${RULES_DIR}/spec-format"
mkdir -p "\${RULES_DIR}/uuid"
mkdir -p "\${RULES_DIR}/validation"
mkdir -p "\${RULES_DIR}/resources"
mkdir -p "\${RULES_DIR}/commits"
mkdir -p "\${RULES_DIR}/sync"
mkdir -p "\${RULES_DIR}/context-loading"

# ---------------------------------------------------------------------------
echo "==> Writing \${SKILL_DIR}/SKILL.md ..."
cat > "\${SKILL_DIR}/SKILL.md" << 'HEREDOC'
---
name: archui-spec
description: ArchUI architecture document modification workflow. Use when adding, changing, or removing ArchUI modules (README.md files with YAML frontmatter). Enforces filesystem rules, UUID management, and .archui/index.yaml sync.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# ArchUI Spec Modification Workflow

This skill is the entry point for all ArchUI spec work. Load the rule documents below **on demand** based on what the task requires — do not load all of them upfront.

## Module Commands

Every module can expose executable commands. Commands are \`.md\` files located at:

\`\`\`
<module-path>/.archui/commands/<command-name>.md
\`\`\`

To discover what actions a module supports, list its \`.archui/commands/\` directory. Each file has a \`name\` (button label), \`description\` (what it does), and a body (skill instructions for the AI agent). When the user asks to run a command on a module, read the corresponding command file and follow its instructions.

---

## Rule Loading Guide

| Situation | Load |
|---|---|
| User mentions \`resources/\`, reports a bug, or asks to investigate code | [rules/resources/README.md](rules/resources/README.md) — **load first, before anything else** |
| Writing or editing any README.md or \`.archui/index.yaml\` | [rules/spec-format/README.md](rules/spec-format/README.md) |
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
- Does the task involve \`resources/\`? → Load [rules/resources/README.md](rules/resources/README.md) immediately.

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
| \`depends-on\` | this module needs the other to function |
| \`implements\` | this module is a concrete implementation of the other |
| \`extends\` | this module builds on the other |
| \`references\` | informational reference |
| \`related-to\` | loosely related, no strict dependency |
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing \${RULES_DIR}/spec-format/README.md ..."
cat > "\${RULES_DIR}/spec-format/README.md" << 'HEREDOC'
# Spec File Format Rules

## Node types and identity documents

Every module folder contains exactly one typed identity document. The filename determines the node type:

| File | Node type | When to use |
|---|---|---|
| \`SPEC.md\` | Spec | An implementation specification with generated \`resources/\`. Must have exactly one HARNESS as a **direct** submodule; MEMORY submodule is optional (at most one). |
| \`HARNESS.md\` | Harness | Test harness for a SPEC. Exactly one link → direct parent SPEC. No other links permitted. |
| \`MEMORY.md\` | Memory | Persistent memory record. Links only to parent SPEC. Additional outbound links are a validation **warning** (not an error). |
| \`SKILL.md\` | Skill | Reusable skill or knowledge unit. No \`resources/\` typically. |
| \`README.md\` | Generic | Untyped fallback when no stronger type applies. |

**Precedence when multiple files exist:** \`SPEC.md\` > \`HARNESS.md\` > \`MEMORY.md\` > \`SKILL.md\` > \`README.md\`. Only the highest-priority file acts as the identity document.

## Identity document format

All identity document types share the same frontmatter schema. Only two fields are allowed:

\`\`\`yaml
---
name: Human-readable module name
description: One-sentence summary — always loaded into agent context, keep it sharp
---

Body markdown here.
\`\`\`

**Forbidden in identity documents:** \`uuid\`, \`submodules\`, \`links\`, \`layout\`, any other structural field. These belong in \`.archui/index.yaml\`, not frontmatter.

**Description must be a single, declarative, self-contained sentence.** Multi-paragraph or multi-sentence descriptions trigger a validation warning. Keep it sharp — it is always loaded into agent context.

## Default names for whitelisted hidden folders

When creating an identity document for a root-level whitelisted hidden folder, use these default names:

| Folder | Default \`name\` |
|---|---|
| \`.archui\` | ArchUI Settings |
| \`.claude\` | Claude Settings |
| \`.cursor\` | Cursor Settings |
| \`.github\` | GitHub Settings |
| \`.vscode\` | VS Code Settings |
| \`.aider\` | Aider Settings |
| \`.windsurf\` | Windsurf Settings |

**Body rules:**
- Natural language prose only
- No code snippets, scripts, config files — those belong in \`resources/\`
- Keep it as short as the concept allows

## .archui/index.yaml format

\`\`\`yaml
schema_version: 1          # REQUIRED
uuid: <stable 8-hex UUID — never change after creation>   # REQUIRED
submodules:                # folder-name → child uuid (must match actual subfolders)
  folder-name-a: <uuid-a>
  folder-name-b: <uuid-b>
links:
  - uuid: <target module UUID>
    relation: depends-on   # depends-on | implements | extends | references | related-to | custom
    description: Optional clarification
\`\`\`

**Rules:**
- \`schema_version\` and \`uuid\` are REQUIRED fields
- \`uuid\` is permanent — never change it, even on rename/move
- \`submodules\` is a **map** (\`folder-name → uuid\`), not an array
- \`submodules\` keys must match actual subfolders on disk (bidirectional)
- \`links\` targets are UUIDs, not paths

**HARNESS link structure** (exactly one link, no others permitted):
\`\`\`yaml
links:
  - uuid: <parent SPEC uuid>
    relation: implements
\`\`\`

**layout.yaml:** The CLI checks for this file's existence but does not validate its contents. Stale UUIDs in \`layout.yaml\` are silently ignored.

## Module design principles

**Split aggressively.** If a module covers more than one coherent concept, split it. Prefer many small focused modules over fewer large ones. Every split must be reversible — child modules together must fully reconstruct the parent's meaning.

## .archui/ data handling

**Use the CLI to query or modify \`.archui/\` data; do not load raw \`.archui/index.yaml\` files into context.** Use \`archui validate .\` to check consistency. Read \`.archui/index.yaml\` only when you need the exact UUID of a specific module and cannot get it another way.
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing \${RULES_DIR}/uuid/README.md ..."
cat > "\${RULES_DIR}/uuid/README.md" << 'HEREDOC'
# UUID Rules

## Format

8 lowercase hex characters. Examples: \`93ab33c4\`, \`7e3f1c9a\`.

**Never use full RFC 4122 UUIDs** (\`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\`).

## Generating

\`\`\`bash
openssl rand -hex 4
\`\`\`

## Before using a generated UUID

Check it is not already in any existing \`.archui/index.yaml\`:

\`\`\`bash
grep -r "<generated-uuid>" . --include="*.yaml"
\`\`\`

If found, generate a new one.

## Rules

- UUID is assigned at module creation — **never changes** after that (not on rename, move, or content edit)
- Never reuse UUIDs from deleted modules
- UUIDs must be unique across the entire project

## YAML quoting

Some valid 8-hex strings are misread by YAML parsers:
- \`785e2416\` → looks like scientific notation (785 × 10^2416)
- \`54534937\` → looks like an integer

**Always quote UUIDs that could be misread:**

\`\`\`yaml
uuid: "785e2416"   # quoted
\`\`\`

When in doubt, quote it.
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing \${RULES_DIR}/validation/README.md ..."
cat > "\${RULES_DIR}/validation/README.md" << 'HEREDOC'
# Validation Rules

## Mandatory after every change — no exceptions

\`\`\`bash
archui validate .
\`\`\`

## Reading output

- \`ERROR\` — blocking, fix all before proceeding
- \`WARN\` — advisory, acceptable but note them

## Common warnings

| Warning | Meaning | Fix |
|---|---|---|
| \`frontmatter/description-multiline\` | \`description\` field spans multiple sentences or lines | Rewrite as one concise, declarative sentence |
| \`links/memory-extra-links\` | MEMORY module has outbound links beyond its parent SPEC | Advisory only — remove extra links if possible |
| \`spec/multiple-memory\` | SPEC module has more than one MEMORY submodule | Keep at most one MEMORY submodule |

## Common errors

| Error code | Meaning | Fix |
|---|---|---|
| \`links/dangling-uuid\` | A link targets a UUID not found in the project | Remove the link or add the missing module |
| \`archui/undeclared-subfolder\` | A subfolder exists but is not in \`.archui/index.yaml\` submodules | Add it to the parent's submodules map |
| \`archui/submodule-not-found\` | submodules map references a folder or UUID that doesn't exist | Remove the entry or create the missing folder |
| \`frontmatter/missing-field\` | README.md is missing \`name\` or \`description\` | Add the missing field |
| \`archui/missing-file\` | \`.archui/index.yaml\` not found | Create it with at minimum \`schema_version: 1\` and a \`uuid\` |
| \`spec/missing-harness\` | SPEC module has no HARNESS submodule | Add a \`<name>-harness/\` subfolder with a \`HARNESS.md\` identity document |
| \`spec/multiple-harness\` | SPEC module has more than one HARNESS submodule | Keep exactly one HARNESS submodule |

## If validation fails

Return to the relevant step and fix. Never proceed past a failing validation.
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing \${RULES_DIR}/resources/README.md ..."
cat > "\${RULES_DIR}/resources/README.md" << 'HEREDOC'
# Resources Boundary Rules

## The Rule

**Never read or modify any \`resources/\` folder content unless the user explicitly says so.**

"Explicitly" means the user's message contains words like: fix, update, modify, change, implement, build, rebuild, generate — AND the target is clearly \`resources/\` code (not spec files).

## Before touching resources/

1. **Always analyze from spec level first.** Read the relevant module README.md files.
2. **Check if the spec is complete.** If a spec module is missing or incomplete, that may be the root cause — add/fix the spec before touching code.
3. **Only after spec analysis**, if resources/ code must be read or changed, confirm with the user or proceed only if the user has explicitly authorized it in this message.

## Allowed without asking

- Reading module README.md and \`.archui/index.yaml\` files
- Running the CLI validator
- Running \`git diff\` / \`git log\` to understand what changed

## Requires explicit user authorization

- Reading any file inside \`resources/\`
- Modifying any file inside \`resources/\`
- Running \`npm run build\` or any build command

## When the user reports a bug

1. Read the relevant spec modules' README.md first
2. Run \`archui validate .\` to check spec consistency
3. If spec is valid and complete → tell the user the issue is in resources/, ask if they want you to investigate there
4. If spec is incomplete → fix the spec first, then ask about resources
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing \${RULES_DIR}/commits/README.md ..."
cat > "\${RULES_DIR}/commits/README.md" << 'HEREDOC'
# Commit Discipline Rules

## Spec and resources must always be separate commits

| Commit type | Files it may touch | Message prefix |
|---|---|---|
| Spec | \`README.md\`, \`.archui/index.yaml\` only | \`spec:\` |
| Resources (web) | \`web-development-release/**/resources/**\` only | \`web:\` |
| Resources (iOS) | \`ios-development-release/**/resources/**\` only | \`ios:\` |
| Resources (Android) | \`android-development-release/**/resources/**\` only | \`android:\` |
| Resources (CLI) | \`cli/resources/**\` only | \`cli:\` |

**Mixed commits are not allowed.** If you find yourself staging both spec and resources files, split them into two separate commits before proceeding.

## How to check before committing

\`\`\`bash
git diff --cached --name-only
\`\`\`

If the output contains both README.md / \`.archui/index.yaml\` files AND files under \`resources/\`, unstage and split.

## Ordering

When both spec and resources need to change for the same feature:
- Spec commit first (defines the contract)
- Resources commit second (implements the contract)
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing \${RULES_DIR}/sync/README.md ..."
cat > "\${RULES_DIR}/sync/README.md" << 'HEREDOC'
# Spec ↔ Resources Sync Workflow

## When to use

After any \`resources/\` code change has passed acceptance testing, the corresponding ArchUI spec modules must be synchronized. This is a mandatory step — do not skip it.

## Workflow

1. **Check what changed**
   \`\`\`bash
   git diff HEAD~1 --name-only | grep resources/
   git log --oneline -5
   \`\`\`

2. **Find the smallest affected modules**
   Start from the innermost modules whose spec is affected by the change. Do not start from the root.

3. **Update from the bottom up**
   - Update the leaf module's README.md body and \`.archui/index.yaml\` (links/submodules) first
   - After each leaf, check its parent — if the parent's description or links no longer match, update it too
   - Continue upward until all affected ancestors are updated

4. **Delegate per platform to sub-agents**
   For platform-specific resources (e.g. \`web-development-release/\`, \`ios-development-release/\`), spawn a sub-agent scoped to that platform's module tree. The sub-agent starts from the smallest changed module and works upward.

5. **Run validation**
   \`\`\`bash
   archui validate .
   \`\`\`

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
echo "==> Writing \${RULES_DIR}/context-loading/README.md ..."
cat > "\${RULES_DIR}/context-loading/README.md" << 'HEREDOC'
# Module Context Loading

## Rule

When reading any module's identity document (\`README.md\`, \`SPEC.md\`, \`SKILL.md\`, \`HARNESS.md\`, \`MEMORY.md\`), you **must also read** \`.archui/index.yaml\` in the same directory. A module's context is not complete until both files have been read.

## Why

Identity documents contain only \`name\` and \`description\`. The structural half of a module — its \`uuid\`, \`submodules\` (child modules), and \`links\` (cross-module dependencies) — lives exclusively in \`.archui/index.yaml\`. Skipping it means you are missing:

- **uuid** — needed to identify this module in links from other modules
- **submodules** — the list of child modules this module contains
- **links** — what other modules this module depends on, implements, or extends

## When this applies

Every time you read a module to understand it, modify it, or reason about its relationships. There are no exceptions.

## Common violations

- Reading \`SPEC.md\` and starting to edit without checking what the module links to
- Answering "what does this module depend on?" from the identity document body alone
- Creating a new link without first reading \`index.yaml\` to check existing links
HEREDOC

# ---------------------------------------------------------------------------
echo "==> Writing \${SKILL_DIR}/commands/convert-project.md ..."
mkdir -p "\${SKILL_DIR}/commands"
cat > "\${SKILL_DIR}/commands/convert-project.md" << 'HEREDOC'
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

- Pure implementation detail folders that are not meaningful on their own: \`utils/\`, \`helpers/\`, \`types/\`, \`constants/\` — unless they represent a distinct library boundary
- Build artifacts: \`dist/\`, \`build/\`, \`out/\`, \`.next/\`, \`coverage/\`
- Dependency folders: \`node_modules/\`, \`vendor/\`
- Hidden infrastructure: \`.git/\`, \`.cache/\`, \`__pycache__/\`
- The \`resources/\` folder inside any ArchUI module (reserved by ArchUI)

### Naming rules

- \`name\`: Human-readable, 2–4 words, Title Case — e.g. "CLI Init Command", "Auth Service", "User Profile API"
- \`description\`: One sentence, present tense, describes **purpose** not implementation — e.g. "Handles user authentication and session management." NOT "Contains auth.ts and session.ts."

### Depth guidance

- **Depth 1 first**: Start by making every meaningful top-level directory a module. These are your primary boundaries.
- **Go deeper selectively**: Only create child modules inside a top-level module if that module is large enough that its subdirectories are themselves independently meaningful. Rule of thumb: if you'd describe a subdirectory to a new team member as "the X part of Y", it deserves its own module.
- **Avoid over-splitting**: A module with only one or two source files rarely needs child modules.

### Link inference rules

After creating all modules, look for relationships:
- If module A imports from module B → \`A depends-on B\`
- If module A is the test suite for module B → \`A implements B\`  
- If module A is built on top of module B's API → \`A extends B\`
- If module A just references module B for documentation → \`A references B\`
- Loose coupling without clear direction → \`related-to\`

Only add links you are confident about. Do not fabricate links.

---

## Execution Workflow

### Step 1: Read the Conversion Plan

Read \`.archui/conversion-plan.yaml\` from the project root. This file was generated by the CLI pre-scan and lists candidate folders with inferred names, descriptions, and README states. Use it as a starting point, but read actual folder contents to improve quality.

### Step 2: For Each Candidate Module

#### 2a. Determine Final Name and Description

- Read the actual folder (README.md, package.json, key source files) to understand what it does
- Apply the naming rules above
- Improve the pre-scan's \`inferred_name\` and \`inferred_description\` based on real content

#### 2b. Apply the README Merge Rule

Based on \`readme_state\` in the conversion plan:

| \`readme_state\` | Action |
|---|---|
| \`"missing"\` | Create \`README.md\` with frontmatter only (\`name\` + \`description\`) |
| \`"no-frontmatter"\` | Prepend the frontmatter block; preserve existing body verbatim |
| \`"partial"\` | Patch only the missing field(s); preserve everything else |
| \`"complete"\` | Leave the file completely untouched |

**Prepend format** (for \`no-frontmatter\`):
\`\`\`
---
name: <name>
description: <description>
---

<original README body, unchanged>
\`\`\`

The description when prepending must be derived from the actual content — read the file to write a quality sentence.

#### 2c. Write \`.archui/index.yaml\`

\`\`\`yaml
schema_version: 1
uuid: "<generate a new 8-hex UUID>"
submodules: {}
links: []
\`\`\`

Generate: \`openssl rand -hex 4\`
Verify uniqueness: \`grep -r "<uuid>" . --include="*.yaml"\` — if found, regenerate.

#### 2d. Write \`.archui/layout.yaml\`

\`\`\`yaml
nodes: {}
viewport:
  zoom: 1
  pan: {x: 0, y: 0}
\`\`\`

### Step 3: Register Child Modules in Parent

For each module created, add it to the parent's \`.archui/index.yaml\` submodules map:

\`\`\`yaml
submodules:
  <folder-name>: <child-uuid>
\`\`\`

Update the parent's \`.archui/layout.yaml\` to the parent form:
\`\`\`yaml
layout:
  <parent-uuid>:
    x: "0"
    y: "0"
\`\`\`
(The GUI will update positions when first opened.)

### Step 4: Infer and Write Cross-Module Links

After all modules are created, scan for dependencies (see link inference rules above). For each confident link, add to the source module's \`.archui/index.yaml\`:

\`\`\`yaml
links:
  - uuid: <target-uuid>
    relation: depends-on
    description: <one-sentence explanation>
\`\`\`

### Step 5: Archive Non-Spec Files into Resources

After all modules are created, every non-natural-language file in the project must live inside a module's \`resources/\` directory. Natural-language files are identity documents (\`README.md\`, \`SPEC.md\`, \`HARNESS.md\`, \`MEMORY.md\`, \`SKILL.md\`) and \`.archui/\` metadata — everything else is a resource.

#### 5a. Scan for Unarchived Files

Walk the entire project tree. For each file that is NOT one of:
- An identity document (\`README.md\`, \`SPEC.md\`, \`HARNESS.md\`, \`MEMORY.md\`, \`SKILL.md\`)
- An \`.archui/\` metadata file (\`index.yaml\`, \`layout.yaml\`, \`commands/*.md\`)
- Inside a \`resources/\` directory already
- Inside a skip directory (\`node_modules\`, \`.git\`, \`dist\`, \`build\`, \`.next\`, \`__pycache__\`, \`vendor\`, \`.cache\`, \`coverage\`, \`out\`, \`tmp\`)

...flag it as an unarchived resource.

#### 5b. Match Each File to Its Owning Module

For each unarchived file, determine which module it belongs to:
- A file at \`<module-path>/foo.ts\` belongs to the module at \`<module-path>/\`
- A file in a non-module subdirectory (e.g. \`<module-path>/utils/helper.ts\`) belongs to the nearest ancestor module

#### 5c. Relocate into Resources

Move each unarchived file into its owning module's \`resources/\` directory, preserving the relative path within the module:
- \`my-module/src/index.ts\` → \`my-module/resources/src/index.ts\`
- \`my-module/package.json\` → \`my-module/resources/package.json\`
- \`my-module/utils/helper.ts\` → \`my-module/resources/utils/helper.ts\`

Use \`git mv\` if inside a git repository to preserve history.

#### 5d. Handle Orphan Files — Refine Module Decomposition

If a file has no suitable owning module (it sits at a level where the nearest module is the project root and the file clearly belongs to a more specific domain):

1. **Do not dump it into the root module's \`resources/\`.** This means the earlier decomposition missed a boundary.
2. Create a new module for the orphan's directory — apply the same module creation rules from Step 2 (name, description, UUID, \`index.yaml\`, \`layout.yaml\`, register in parent).
3. Then archive the file into the new module's \`resources/\`.

Repeat until every non-spec file is inside some module's \`resources/\`.

#### 5e. Promote Identity Document Type

Once a module has a \`resources/\` directory, its identity document type must match the nature of those resources. A \`README.md\` (generic fallback) is only correct for modules with no resources or with purely generic content.

| Resources content | Correct identity type | Required submodules |
|---|---|---|
| Source code, configs, implementation files | \`SPEC.md\` | Must create \`<name>-harness/\` with \`HARNESS.md\` (one link → parent SPEC). May create \`<name>-memory/\` with \`MEMORY.md\`. |
| Test code, test fixtures, test configs | \`HARNESS.md\` | None (HARNESS is a leaf with exactly one link to its parent SPEC) |
| Logs, session records, accumulated knowledge | \`MEMORY.md\` | None (MEMORY links only to its parent SPEC) |
| Mixed or unclear | \`SPEC.md\` | Same as source code row — default to SPEC when in doubt |

**Promotion workflow:**

1. For each module that now has \`resources/\`, classify its resource content using the table above.
2. If the module currently has \`README.md\` but should be a different type:
   - Rename the identity document: \`git mv README.md SPEC.md\` (or \`HARNESS.md\`, \`MEMORY.md\`)
   - Preserve all frontmatter and body content — only the filename changes.
3. If promoted to \`SPEC.md\`, create the required HARNESS submodule:
   - Create \`<module-name>-harness/\` directory
   - Write \`HARNESS.md\` with frontmatter (\`name\`, \`description\`)
   - Write \`.archui/index.yaml\` with a new UUID, empty submodules, and exactly one link to the parent SPEC's UUID with \`relation: implements\`
   - Write \`.archui/layout.yaml\` (leaf form)
   - Register the harness in the parent SPEC's \`.archui/index.yaml\` submodules map
4. Optionally create \`<module-name>-memory/\` submodule (same pattern, with \`MEMORY.md\` and a link to parent SPEC).

### Step 6: Validate and Fix

\`\`\`bash
archui validate .
\`\`\`

Read all ERROR lines. Fix each one:

| Error | Fix |
|---|---|
| \`links/dangling-uuid\` | Remove the link or add the missing target module |
| \`archui/undeclared-subfolder\` | Add the folder to its parent's \`submodules\` map |
| \`frontmatter/missing-field\` | Add missing \`name\` or \`description\` to the identity document |
| \`archui/missing-file\` | Create \`.archui/index.yaml\` in the folder |

Re-run after each fix round. Continue until zero ERRORs.

### Step 7: Clean Up

Delete \`.archui/conversion-plan.yaml\` — it is a temporary file and should not be committed.

---

## Hard Constraints

- **Never** modify files that are already inside an existing \`resources/\` directory — only move new files in
- **Never** change an existing UUID in any \`.archui/index.yaml\`
- **Never** add \`uuid\`, \`submodules\`, or \`links\` to README.md frontmatter — these belong only in \`.archui/index.yaml\`
- \`description\` must be a single sentence with no line breaks
- All UUIDs must be 8 lowercase hex characters (e.g., \`a3f2b1c9\`) — never RFC 4122 format
- Use \`README.md\` as the initial identity document for all modules. After resource archival, promote to \`SPEC.md\`, \`HARNESS.md\`, or \`MEMORY.md\` per Step 5e — never leave a module with \`resources/\` as a generic \`README.md\`
HEREDOC

echo "==> Deployment complete."
`

const CURSOR_DEPLOY_SH = ''

// ---------------------------------------------------------------------------
// Inline conversion agent prompt
// ---------------------------------------------------------------------------

const CONVERT_PROJECT_PROMPT = `# Convert Project to ArchUI Structure

You are converting an existing project into a valid ArchUI-compliant structure. Work autonomously and completely — do not pause to ask questions.

## Step 1: Scan the Project Tree

Scan the project tree directly, starting from \`{{project.root}}\`, to understand its structure. Candidate folders: any folder not in the skip list (\`node_modules\`, \`.git\`, \`.archui\`, \`resources\`, \`dist\`, \`build\`, \`.next\`, \`__pycache__\`, \`vendor\`, \`.cache\`, \`coverage\`, \`out\`, \`tmp\`).

## Step 2: Process Each Candidate Module

For each entry in \`candidates\`:

### 2a. Determine Final Name and Description

- Read the actual folder contents (README.md, package.json, source files) to understand what the module does.
- Improve the \`inferred_name\` and \`inferred_description\` from the pre-scan if you can do better based on actual content.
- \`name\`: Human-readable title (2–4 words), Title Case.
- \`description\`: One sentence, present tense, describes purpose not implementation.

### 2b. Apply the README Merge Rule

Based on \`readme_state\`:

| \`readme_state\` | Action |
|---|---|
| \`"missing"\` | Create \`README.md\` with frontmatter only: \`name\` and \`description\` |
| \`"no-frontmatter"\` | Prepend frontmatter block to the existing file; preserve body verbatim |
| \`"partial"\` | Patch only the missing field(s) into existing frontmatter; preserve everything else |
| \`"complete"\` | Leave the file untouched |

**Prepend format:**
\`\`\`
---
name: <name>
description: <description>
---

<original README body, unchanged>
\`\`\`

### 2c. Write \`.archui/index.yaml\`

\`\`\`yaml
schema_version: 1
uuid: "<generate a new 8-hex UUID>"
submodules: {}
links: []
\`\`\`

Generate UUIDs with: \`openssl rand -hex 4\`
Verify uniqueness: search all existing \`.archui/index.yaml\` files for the generated UUID before using it.

### 2d. Write \`.archui/layout.yaml\`

Leaf form (no children):
\`\`\`yaml
nodes: {}
viewport:
  zoom: 1
  pan: {x: 0, y: 0}
\`\`\`

## Step 3: Update Parent Submodules Maps

For each module you created, register it in its parent's \`.archui/index.yaml\` \`submodules\` map:

\`\`\`yaml
submodules:
  <folder-name>: <child-uuid>
\`\`\`

Update the parent's \`.archui/layout.yaml\` to parent form if it now has children:
\`\`\`yaml
layout:
  <parent-uuid>:
    x: "0"
    y: "0"
\`\`\`

## Step 4: Infer Cross-Module Links

For each module, scan for obvious dependencies:
- Import statements referencing other module paths
- \`package.json\` dependencies that map to other modules in the project
- Clear conceptual relationships (e.g., a test module implements a spec module)

For each inferred link, add to the source module's \`.archui/index.yaml\`:
\`\`\`yaml
links:
  - uuid: <target-uuid>
    relation: depends-on   # depends-on | implements | extends | references | related-to
    description: <one-sentence explanation>
\`\`\`

Only add links you are confident about. Do not fabricate links.

## Step 5: Archive Non-Spec Files into Resources

After all modules are created, every non-natural-language file in the project must live inside a module's \`resources/\` directory. Natural-language files are identity documents (\`README.md\`, \`SPEC.md\`, \`HARNESS.md\`, \`MEMORY.md\`, \`SKILL.md\`) and \`.archui/\` metadata — everything else is a resource.

### 5a. Scan for Unarchived Files

Walk the entire project tree. For each file that is NOT one of:
- An identity document (\`README.md\`, \`SPEC.md\`, \`HARNESS.md\`, \`MEMORY.md\`, \`SKILL.md\`)
- An \`.archui/\` metadata file (\`index.yaml\`, \`layout.yaml\`, \`commands/*.md\`)
- Inside a \`resources/\` directory already
- Inside a skip directory (\`node_modules\`, \`.git\`, \`dist\`, \`build\`, \`.next\`, \`__pycache__\`, \`vendor\`, \`.cache\`, \`coverage\`, \`out\`, \`tmp\`)

...flag it as an unarchived resource.

### 5b. Match Each File to Its Owning Module

For each unarchived file, determine which module it belongs to:
- A file at \`<module-path>/foo.ts\` belongs to the module at \`<module-path>/\`
- A file in a non-module subdirectory (e.g. \`<module-path>/utils/helper.ts\`) belongs to the nearest ancestor module

### 5c. Relocate into Resources

Move each unarchived file into its owning module's \`resources/\` directory, preserving the relative path within the module:
- \`my-module/src/index.ts\` → \`my-module/resources/src/index.ts\`
- \`my-module/package.json\` → \`my-module/resources/package.json\`
- \`my-module/utils/helper.ts\` → \`my-module/resources/utils/helper.ts\`

Use \`git mv\` if inside a git repository to preserve history.

### 5d. Handle Orphan Files — Refine Module Decomposition

If a file has no suitable owning module (it sits at a level where the nearest module is the project root and the file clearly belongs to a more specific domain):

1. **Do not dump it into the root module's \`resources/\`.** This means the earlier decomposition missed a boundary.
2. Create a new module for the orphan's directory — apply the same module creation rules from Step 2 (name, description, UUID, \`index.yaml\`, \`layout.yaml\`, register in parent).
3. Then archive the file into the new module's \`resources/\`.

Repeat until every non-spec file is inside some module's \`resources/\`.

### 5e. Promote Identity Document Type

Once a module has a \`resources/\` directory, its identity document type must match the nature of those resources. A \`README.md\` (generic fallback) is only correct for modules with no resources or with purely generic content.

| Resources content | Correct identity type | Required submodules |
|---|---|---|
| Source code, configs, implementation files | \`SPEC.md\` | Must create \`<name>-harness/\` with \`HARNESS.md\` (one link → parent SPEC). May create \`<name>-memory/\` with \`MEMORY.md\`. |
| Test code, test fixtures, test configs | \`HARNESS.md\` | None (HARNESS is a leaf with exactly one link to its parent SPEC) |
| Logs, session records, accumulated knowledge | \`MEMORY.md\` | None (MEMORY links only to its parent SPEC) |
| Mixed or unclear | \`SPEC.md\` | Same as source code row — default to SPEC when in doubt |

**Promotion workflow:**

1. For each module that now has \`resources/\`, classify its resource content using the table above.
2. If the module currently has \`README.md\` but should be a different type:
   - Rename the identity document: \`git mv README.md SPEC.md\` (or \`HARNESS.md\`, \`MEMORY.md\`)
   - Preserve all frontmatter and body content — only the filename changes.
3. If promoted to \`SPEC.md\`, create the required HARNESS submodule:
   - Create \`<module-name>-harness/\` directory
   - Write \`HARNESS.md\` with frontmatter (\`name\`, \`description\`)
   - Write \`.archui/index.yaml\` with a new UUID, empty submodules, and exactly one link to the parent SPEC's UUID with \`relation: implements\`
   - Write \`.archui/layout.yaml\` (leaf form)
   - Register the harness in the parent SPEC's \`.archui/index.yaml\` submodules map
4. Optionally create \`<module-name>-memory/\` submodule (same pattern, with \`MEMORY.md\` and a link to parent SPEC).

## Step 6: Validate and Fix

Run the validator:
\`\`\`bash
archui validate .
\`\`\`

Read all ERROR lines in the output. Fix each error:

| Error code | Fix |
|---|---|
| \`links/dangling-uuid\` | Remove the link or add the missing target module |
| \`archui/undeclared-subfolder\` | Add the folder to its parent's \`submodules\` map |
| \`frontmatter/missing-field\` | Add the missing \`name\` or \`description\` to the identity document |
| \`archui/missing-file\` | Create \`.archui/index.yaml\` in the folder |
| \`spec/missing-harness\` | SPEC module is missing its required HARNESS submodule — create \`<name>-harness/\` with \`HARNESS.md\` and link to parent SPEC |

Re-run validate after each round of fixes. Continue until there are zero ERRORs.


## Constraints

- Never modify files that are already inside an existing \`resources/\` directory — only move new files in.
- Never change a UUID that already exists in any \`.archui/index.yaml\`.
- Never add \`uuid\`, \`submodules\`, or \`links\` to README.md frontmatter — these belong only in \`.archui/index.yaml\`.
- The \`description\` field must be a single sentence (no line breaks).
- All UUIDs must be 8 lowercase hex characters (e.g., \`a3f2b1c9\`), not RFC 4122 format.
- Use \`README.md\` as the initial identity document for all modules. After resource archival, promote to \`SPEC.md\`, \`HARNESS.md\`, or \`MEMORY.md\` per Step 5e — never leave a module with \`resources/\` as a generic \`README.md\`.
`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentInfo {
  name: string
  detected: boolean
  installed: boolean
  deployScript: string
  sentinelCheck: (targetPath: string) => boolean
}

// ---------------------------------------------------------------------------
// Agent detection helpers
// ---------------------------------------------------------------------------

function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function detectCursor(): boolean {
  if (process.platform === 'darwin' && fs.existsSync('/Applications/Cursor.app')) return true
  return commandExists('cursor')
}

function detectClaudeCode(): boolean {
  return commandExists('claude')
}

function detectCodex(): boolean {
  if (commandExists('codex')) return true
  try {
    const result = spawnSync('npm', ['list', '-g', '@openai/codex'], { stdio: 'pipe', shell: true })
    return result.status === 0
  } catch {
    return false
  }
}

function detectCopilot(): boolean {
  try {
    const result = spawnSync('code', ['--list-extensions'], { stdio: 'pipe', shell: true })
    if (result.status !== 0) return false
    const output = (result.stdout?.toString() ?? '').toLowerCase()
    return output.includes('github.copilot')
  } catch {
    return false
  }
}

function checkCursorInstalled(targetPath: string): boolean {
  return fs.existsSync(path.join(targetPath, '.cursor', 'skills', 'archui-spec', 'SKILL.md'))
}

function checkClaudeCodeInstalled(targetPath: string): boolean {
  return fs.existsSync(path.join(targetPath, '.claude', 'skills', 'archui-spec', 'SKILL.md'))
}

function checkCodexInstalled(targetPath: string): boolean {
  const agentsFile = path.join(targetPath, 'AGENTS.md')
  if (!fs.existsSync(agentsFile)) return false
  try {
    const content = fs.readFileSync(agentsFile, 'utf8')
    return content.trimStart().startsWith('# ArchUI Agent Instructions')
  } catch {
    return false
  }
}

function checkCopilotInstalled(targetPath: string): boolean {
  const instructionsFile = path.join(targetPath, '.github', 'copilot-instructions.md')
  if (!fs.existsSync(instructionsFile)) return false
  try {
    const content = fs.readFileSync(instructionsFile, 'utf8')
    return content.trimStart().startsWith('# ArchUI Project Instructions')
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// UUID helpers
// ---------------------------------------------------------------------------

function generateUuid(): string {
  return crypto.randomBytes(4).toString('hex')
}

function isUuidUnique(uuid: string, targetPath: string): boolean {
  const found = findIndexYamls(targetPath)
  for (const f of found) {
    try {
      const content = fs.readFileSync(f, 'utf8')
      const parsed = parseYaml(content)
      if (parsed?.uuid === uuid) return false
    } catch {
      // ignore parse errors
    }
  }
  return true
}

function findIndexYamls(dir: string): string[] {
  const results: string[] = []
  function walk(current: string) {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name === 'index.yaml' && current.endsWith('.archui')) {
        results.push(fullPath)
      }
    }
  }
  walk(dir)
  return results
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function kebabToTitle(name: string): string {
  return name
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function mergeReadme(filePath: string, name: string, description: string): void {
  const frontmatter = `---\nname: ${name}\ndescription: ${description}\n---\n`

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, frontmatter, 'utf8')
    return
  }

  const existing = fs.readFileSync(filePath, 'utf8')

  if (!existing.trimStart().startsWith('---')) {
    fs.writeFileSync(filePath, frontmatter + '\n' + existing, 'utf8')
    return
  }

  const hasName = /^name:/m.test(existing)
  const hasDescription = /^description:/m.test(existing)

  if (hasName && hasDescription) {
    // complete — leave untouched
    return
  }

  // partial — patch missing fields
  let patched = existing
  if (!hasName) {
    patched = patched.replace(/^---/, `---\nname: ${name}`)
  }
  if (!hasDescription) {
    patched = patched.replace(/^---/, `---\ndescription: ${description}`)
  }
  fs.writeFileSync(filePath, patched, 'utf8')
}

function writeLayoutYaml(dotArchUiDir: string, form: 'leaf' | 'parent', uuid?: string): void {
  const layoutPath = path.join(dotArchUiDir, 'layout.yaml')
  let content: string
  if (form === 'leaf') {
    content = `nodes: {}\nviewport:\n  zoom: 1\n  pan: {x: 0, y: 0}\n`
  } else {
    if (!uuid) throw new Error('uuid required for parent layout form')
    content = `layout:\n  ${uuid}:\n    x: "0"\n    y: "0"\n`
  }
  fs.writeFileSync(layoutPath, content, 'utf8')
}

// ---------------------------------------------------------------------------
// Prompt helpers (readline-based, no new deps)
// ---------------------------------------------------------------------------

function isInteractiveTTY(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY)
}

async function promptLine(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function promptMultiSelect(
  message: string,
  choices: Array<{ label: string; value: string; selected: boolean }>
): Promise<string[]> {
  console.log(message)
  choices.forEach((c, i) => {
    const marker = c.selected ? '(pre-selected)' : ''
    console.log(`  ${i + 1}) ${c.label} ${marker}`)
  })
  const answer = await promptLine('Enter numbers to install (comma-separated, or Enter to skip): ')
  if (!answer) return []
  const indices = answer.split(',').map((s) => parseInt(s.trim(), 10) - 1)
  return indices
    .filter((i) => i >= 0 && i < choices.length)
    .map((i) => choices[i].value)
}

// ---------------------------------------------------------------------------
// Agent setup phase
// ---------------------------------------------------------------------------

async function runAgentSetup(targetPath: string): Promise<void> {
  console.log('\nDetecting AI agents...')

  const agents: AgentInfo[] = [
    {
      name: 'Cursor',
      detected: false,
      installed: false,
      deployScript: CURSOR_DEPLOY_SH,
      sentinelCheck: checkCursorInstalled,
    },
    {
      name: 'Claude Code',
      detected: false,
      installed: false,
      deployScript: CLAUDE_CODE_DEPLOY_SH,
      sentinelCheck: checkClaudeCodeInstalled,
    },
    {
      name: 'Codex',
      detected: false,
      installed: false,
      deployScript: '',
      sentinelCheck: checkCodexInstalled,
    },
    {
      name: 'Copilot',
      detected: false,
      installed: false,
      deployScript: '',
      sentinelCheck: checkCopilotInstalled,
    },
  ]

  // Detection (errors are never fatal)
  try { agents[0].detected = detectCursor() } catch { /* skip */ }
  try { agents[1].detected = detectClaudeCode() } catch { /* skip */ }
  try { agents[2].detected = detectCodex() } catch { /* skip */ }
  try { agents[3].detected = detectCopilot() } catch { /* skip */ }

  // Plugin status check
  for (const agent of agents) {
    if (agent.detected) {
      try { agent.installed = agent.sentinelCheck(targetPath) } catch { /* skip */ }
    }
  }

  // Print summary
  console.log('\nDetected AI agents:')
  for (const agent of agents) {
    if (agent.detected) {
      const pluginStatus = agent.installed ? 'ArchUI plugin installed' : 'ArchUI plugin not installed'
      console.log(`  [✓] ${agent.name.padEnd(12)} — ${pluginStatus}`)
    } else {
      console.log(`  [ ] ${agent.name.padEnd(12)} — not detected, skipping`)
    }
  }

  const detectedNotInstalled = agents.filter((a) => a.detected && !a.installed)

  if (detectedNotInstalled.length === 0) {
    if (agents.some((a) => a.detected)) {
      console.log('\nAll detected agents already have the ArchUI plugin installed.')
    }
    return
  }

  const choices = detectedNotInstalled.map((a) => ({
    label: a.name,
    value: a.name,
    selected: false,
  }))

  const selected = await promptMultiSelect(
    '\nInstall ArchUI plugin for (enter numbers, comma-separated, or Enter to skip):',
    choices
  )

  for (const agentName of selected) {
    const agent = agents.find((a) => a.name === agentName)
    if (!agent) continue

    if (!agent.deployScript) {
      console.log(`  ⚠ No deploy script for ${agent.name}, skipping`)
      continue
    }

    try {
      console.log(`  → Installing ArchUI plugin for ${agent.name}...`)
      execSync('bash -s', {
        input: agent.deployScript,
        cwd: targetPath,
        stdio: ['pipe', 'inherit', 'inherit'],
      })
      console.log(`  ✓ ${agent.name} plugin installed`)
    } catch (err) {
      console.log(`  ⚠ Failed to install ${agent.name} plugin (non-fatal): ${(err as Error).message}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Conversion agent
// ---------------------------------------------------------------------------

async function runConversionAgent(rootPath: string): Promise<number> {
  let prompt = CONVERT_PROJECT_PROMPT
  prompt = prompt.replace(/\{\{project\.root\}\}/g, rootPath)

  // Detect agent CLI
  const hasClaudeCode = commandExists('claude')
  const hasCodex = detectCodex()

  if (!hasClaudeCode && !hasCodex) {
    console.log('\nNo supported agent CLI detected (claude / codex).')
    console.log('To complete conversion manually, run:')
    console.log(`  claude --dangerously-skip-permissions --add-dir "${rootPath}" -p "<prompt>"`)
    return 0
  }

  return new Promise<number>((resolve) => {
    let child: ReturnType<typeof spawn>

    if (hasClaudeCode) {
      console.log('\nInvoking Claude Code (autonomous mode)...')
      child = spawn('claude', [
        '--dangerously-skip-permissions',
        '--verbose',
        '--add-dir', rootPath,
        '-p', prompt,
        '--output-format', 'stream-json',
      ], {
        cwd: rootPath,
        stdio: ['inherit', 'pipe', 'inherit'],
        shell: false,
      })

      // Parse NDJSON stream and forward only assistant text blocks to stdout
      let buffer = ''
      child.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const event = JSON.parse(trimmed)
            if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
              for (const block of event.message.content) {
                if (block.type === 'text') process.stdout.write(block.text)
              }
            }
          } catch {
            // Non-JSON line — forward as-is
            process.stdout.write(line + '\n')
          }
        }
      })

      child.stdout?.on('end', () => {
        // Flush any remaining partial line in the buffer
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer.trim())
            if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
              for (const block of event.message.content) {
                if (block.type === 'text') process.stdout.write(block.text)
              }
            }
          } catch {
            process.stdout.write(buffer + '\n')
          }
        }
      })
    } else {
      console.log('\nInvoking Codex (autonomous mode)...')
      child = spawn('codex', ['--full-auto', prompt], {
        cwd: rootPath,
        stdio: 'inherit',
        shell: false,
      })
    }

    child.on('close', (code) => {
      resolve(code ?? 0)
    })

    child.on('error', (err) => {
      console.error(`Agent CLI error: ${err.message}`)
      resolve(1)
    })
  })
}

// ---------------------------------------------------------------------------
// Main init function
// ---------------------------------------------------------------------------

export interface InitOptions {
  name?: string
  description?: string
  skipAgents?: boolean
  convert?: boolean
}

export async function runInit(targetPath: string, options: InitOptions): Promise<void> {
  const resolvedPath = path.resolve(targetPath)

  // 1. Verify path is a writable directory
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: path does not exist: ${resolvedPath}`)
    process.exit(1)
  }

  const stat = fs.statSync(resolvedPath)
  if (!stat.isDirectory()) {
    console.error(`Error: path is not a directory: ${resolvedPath}`)
    process.exit(1)
  }

  try {
    fs.accessSync(resolvedPath, fs.constants.W_OK)
  } catch {
    console.error(`Error: path is not writable: ${resolvedPath}`)
    process.exit(1)
  }

  // 2. Agent setup phase
  if (!options.skipAgents && isInteractiveTTY()) {
    try {
      await runAgentSetup(resolvedPath)
    } catch (err) {
      // Agent setup is never fatal
      console.log(`\nAgent setup encountered an error (non-fatal): ${(err as Error).message}`)
    }
    console.log()
  }

  // 3. Check for existing .archui/index.yaml (idempotent)
  const archUiDir = path.join(resolvedPath, '.archui')
  const indexYamlPath = path.join(archUiDir, 'index.yaml')

  if (fs.existsSync(indexYamlPath)) {
    try {
      const content = fs.readFileSync(indexYamlPath, 'utf8')
      const parsed = parseYaml(content)
      const existingUuid = parsed?.uuid ?? 'unknown'
      console.log(`Already an ArchUI project (uuid: ${existingUuid}). Nothing to do.`)
    } catch {
      console.log('Already an ArchUI project. Nothing to do.')
    }
    process.exit(0)
  }

  // Determine name
  const name = options.name ?? path.basename(resolvedPath)

  // 4. Prompt for description if missing
  let description = options.description ?? ''
  if (!description) {
    if (!isInteractiveTTY()) {
      description = ''
    } else {
      description = await promptLine(`Describe this project's purpose (press Enter to skip — an agent can fill this in later): `)
    }
  }

  // 5–6. Generate unique UUID
  let uuid = generateUuid()
  let attempts = 0
  while (!isUuidUnique(uuid, resolvedPath) && attempts < 20) {
    uuid = generateUuid()
    attempts++
  }

  // 7. Write README.md (apply merge rule — never overwrite existing content)
  const readmePath = path.join(resolvedPath, 'README.md')
  mergeReadme(readmePath, name, description)

  // 8. Write .archui/index.yaml
  fs.mkdirSync(archUiDir, { recursive: true })
  const indexYamlContent = `schema_version: 1\nuuid: "${uuid}"\nsubmodules: {}\nlinks: []\n`
  fs.writeFileSync(indexYamlPath, indexYamlContent, 'utf8')
  writeLayoutYaml(archUiDir, 'leaf')

  // 9. Stage files if inside a git repo
  const gitDir = path.join(resolvedPath, '.git')
  if (fs.existsSync(gitDir)) {
    try {
      execSync('git add README.md .archui/index.yaml .archui/layout.yaml', { cwd: resolvedPath, stdio: 'ignore' })
    } catch {
      // Not fatal — git may not be configured
    }
  }

  // 10. Print success
  console.log(`Initialized ArchUI project: ${name} (uuid: ${uuid})`)

  // 11. Conversion phase (--convert)
  if (options.convert) {
    console.log('\nInvoking conversion agent...')
    const agentExitCode = await runConversionAgent(resolvedPath)
    if (agentExitCode !== 0) {
      console.error(`\nAgent invocation failed (exit code ${agentExitCode}).`)
      process.exit(3)
    }
  }
}
