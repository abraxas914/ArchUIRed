import fs from 'fs'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import type { Violation, IndexYaml } from '../types.js'

const ROOT_HIDDEN_WHITELIST = new Set(['.claude', '.cursor', '.aider', '.windsurf', '.github', '.vscode', '.git'])

export function validateStructure(rootPath: string, isRoot = true): Violation[] {
  const violations: Violation[] = []
  const abs = path.resolve(rootPath)

  // Check README.md exists
  const readmePath = path.join(abs, 'README.md')
  const skillPath  = path.join(abs, 'SKILL.md')
  if (!fs.existsSync(readmePath) && !fs.existsSync(skillPath)) {
    violations.push({ ruleId: 'missing-readme', filePath: rootPath, message: 'Module folder has no README.md or SKILL.md' })
  }

  // Check .archui/index.yaml exists
  const indexPath = path.join(abs, '.archui', 'index.yaml')
  if (!fs.existsSync(indexPath)) {
    violations.push({ ruleId: 'missing-index', filePath: rootPath, message: 'Module folder has no .archui/index.yaml' })
    return violations // can't check submodule consistency without index
  }

  // Read index.yaml to get declared submodules
  let index: IndexYaml = {}
  try {
    index = parseYaml(fs.readFileSync(indexPath, 'utf8')) as IndexYaml ?? {}
  } catch {
    violations.push({ ruleId: 'invalid-index-yaml', filePath: indexPath, message: 'Failed to parse .archui/index.yaml as YAML' })
    return violations
  }

  const declaredSubmodules = new Set(Object.keys(index.submodules ?? {}))

  // Check each subfolder
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true })
  } catch {
    return violations
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const name = entry.name
    if (name === 'resources') continue    // allowed
    if (name === '.archui') continue      // always allowed
    if (isRoot && ROOT_HIDDEN_WHITELIST.has(name)) continue  // root whitelist

    if (!declaredSubmodules.has(name)) {
      violations.push({
        ruleId: 'undeclared-subfolder',
        filePath: path.join(rootPath, name),
        message: `Subfolder "${name}" is not declared in .archui/index.yaml submodules and is not resources/`,
      })
    }
  }

  // Check declared submodules actually exist on disk
  for (const folderName of declaredSubmodules) {
    const childAbs = path.join(abs, folderName)
    if (!fs.existsSync(childAbs) || !fs.statSync(childAbs).isDirectory()) {
      violations.push({
        ruleId: 'missing-submodule-folder',
        filePath: indexPath,
        message: `Declared submodule "${folderName}" does not exist as a directory on disk`,
      })
    }
  }

  // Recurse into declared submodules
  for (const folderName of declaredSubmodules) {
    const childPath = path.join(rootPath, folderName)
    const childAbs2 = path.join(abs, folderName)
    if (fs.existsSync(childAbs2) && fs.statSync(childAbs2).isDirectory()) {
      violations.push(...validateStructure(childPath, false))
    }
  }

  return violations
}
