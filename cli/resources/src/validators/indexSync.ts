import fs from 'fs'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import type { Violation, IndexYaml } from '../types.js'

export function validateIndexSync(rootPath: string): Violation[] {
  const violations: Violation[] = []
  const abs = path.resolve(rootPath)
  const indexPath = path.join(abs, '.archui', 'index.yaml')

  if (!fs.existsSync(indexPath)) return violations

  let index: IndexYaml = {}
  try {
    index = parseYaml(fs.readFileSync(indexPath, 'utf8')) as IndexYaml ?? {}
  } catch { return violations }

  const declaredFolders = new Set(Object.keys(index.submodules ?? {}))

  // Find actual submodule directories on disk
  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(abs, { withFileTypes: true }) } catch { return violations }

  const IGNORE = new Set(['resources', '.archui', '.claude', '.cursor', '.aider', '.windsurf', '.github', '.vscode', '.git'])
  const actualFolders = new Set(entries.filter(e => e.isDirectory() && !IGNORE.has(e.name)).map(e => e.name))

  // Declared but not on disk
  for (const f of declaredFolders) {
    if (!actualFolders.has(f)) {
      violations.push({
        ruleId: 'index-submodule-missing-on-disk',
        filePath: indexPath,
        message: `submodules declares "${f}" but that directory does not exist`,
      })
    }
  }

  // On disk but not declared
  for (const f of actualFolders) {
    if (!declaredFolders.has(f)) {
      violations.push({
        ruleId: 'undeclared-directory-in-index',
        filePath: path.join(rootPath, f),
        message: `Directory "${f}" exists but is not declared in .archui/index.yaml submodules`,
      })
    }
  }

  // Recurse
  for (const folderName of declaredFolders) {
    const childAbs = path.join(abs, folderName)
    if (fs.existsSync(childAbs) && fs.statSync(childAbs).isDirectory()) {
      violations.push(...validateIndexSync(path.join(rootPath, folderName)))
    }
  }

  return violations
}
