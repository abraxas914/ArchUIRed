import fs from 'fs'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import type { Violation, IndexYaml } from '../types.js'

export function validateLinks(rootPath: string): Violation[] {
  const violations: Violation[] = []
  const abs = path.resolve(rootPath)
  const indexPath = path.join(abs, '.archui', 'index.yaml')

  if (fs.existsSync(indexPath)) {
    let index: IndexYaml = {}
    try {
      index = parseYaml(fs.readFileSync(indexPath, 'utf8')) as IndexYaml ?? {}
    } catch { return violations }

    for (const [i, link] of (index.links ?? []).entries()) {
      if (!link.uuid) {
        violations.push({
          ruleId: 'link-missing-uuid',
          filePath: indexPath,
          message: `links[${i}] is missing the required uuid field`,
        })
      }
    }

    for (const folderName of Object.keys(index.submodules ?? {})) {
      const childAbs = path.join(abs, folderName)
      if (fs.existsSync(childAbs) && fs.statSync(childAbs).isDirectory()) {
        violations.push(...validateLinks(path.join(rootPath, folderName)))
      }
    }
  }

  return violations
}
