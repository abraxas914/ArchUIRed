# Validation Rules

## Mandatory after every change — no exceptions

```bash
node cli/resources/dist/index.js validate .
```

If the built CLI is unavailable, rebuild first:

```bash
cd cli/resources && npm run build
node cli/resources/dist/index.js validate .
```

## Reading output

- `ERROR` — blocking, fix all before proceeding
- `WARN` — advisory, acceptable but note them

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
| `spec/missing-memory` | SPEC module has no MEMORY submodule | Add a `<name>-memory/` subfolder with a `MEMORY.md` identity document |
| `spec/multiple-memory` | SPEC module has more than one MEMORY submodule | Keep exactly one MEMORY submodule |

## If validation fails

Return to the relevant step and fix. Never proceed past a failing validation.
