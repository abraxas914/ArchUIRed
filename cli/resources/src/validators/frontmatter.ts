import fs from 'fs'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import type { Violation, IndexYaml } from '../types.js'

const FORBIDDEN_IN_README = ['uuid', 'submodules', 'links']

function extractFrontmatter(content: string): Record<string, unknown> | null {
  if (!content.startsWith('---')) return null
  const end = content.indexOf('\n---', 3)
  if (end === -1) return null
  try {
    return parseYaml(content.slice(3, end).trim()) as Record<string, unknown>
  } catch {
    return null
  }
}

export function validateFrontmatter(rootPath: string): Violation[] {
  const violations: Violation[] = []
  const abs = path.resolve(rootPath)

  // Check index.yaml has uuid
  const indexPath = path.join(abs, '.archui', 'index.yaml')
  if (fs.existsSync(indexPath)) {
    let index: IndexYaml = {}
    try {
      index = parseYaml(fs.readFileSync(indexPath, 'utf8')) as IndexYaml ?? {}
    } catch { /* already caught by structure */ }
    if (!index.uuid) {
      violations.push({ ruleId: 'missing-uuid', filePath: indexPath, message: '.archui/index.yaml is missing the required uuid field' })
    }
  }

  // Check README.md frontmatter
  const readmePath = path.join(abs, 'README.md')
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8')
    const fm = extractFrontmatter(content)
    if (!fm) {
      violations.push({ ruleId: 'invalid-frontmatter', filePath: readmePath, message: 'README.md has no valid YAML frontmatter block' })
    } else {
      if (typeof fm['name'] !== 'string' || !fm['name'].trim()) {
        violations.push({ ruleId: 'missing-name', filePath: readmePath, message: 'README.md frontmatter is missing required field: name' })
      }
      if (typeof fm['description'] !== 'string' || !fm['description'].trim()) {
        violations.push({ ruleId: 'missing-description', filePath: readmePath, message: 'README.md frontmatter is missing required field: description' })
      }
      for (const forbidden of FORBIDDEN_IN_README) {
        if (Object.prototype.hasOwnProperty.call(fm, forbidden)) {
          violations.push({
            ruleId: 'forbidden-frontmatter-field',
            filePath: readmePath,
            message: `README.md frontmatter must not contain "${forbidden}" — move it to .archui/index.yaml`,
          })
        }
      }
    }
  }

  // Recurse
  const indexForRecurse = fs.existsSync(indexPath)
    ? (parseYaml(fs.readFileSync(indexPath, 'utf8')) as IndexYaml)
    : {}
  for (const folderName of Object.keys(indexForRecurse?.submodules ?? {})) {
    const childAbs = path.join(abs, folderName)
    if (fs.existsSync(childAbs) && fs.statSync(childAbs).isDirectory()) {
      violations.push(...validateFrontmatter(path.join(rootPath, folderName)))
    }
  }

  return violations
}
