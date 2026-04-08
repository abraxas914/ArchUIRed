import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { validateStructure } from './validators/structure.js'
import { validateFrontmatter } from './validators/frontmatter.js'
import { validateLinks } from './validators/links.js'
import { validateIndexSync } from './validators/indexSync.js'
import type { Violation } from './types.js'

export function runValidate(targetPath: string, only?: string): { violations: Violation[]; exitCode: number } {
  let violations: Violation[] = []
  const projectRoot = resolve(targetPath)

  if (!only || only === 'structure') {
    violations.push(...validateStructure(targetPath))

    if (!existsSync(join(projectRoot, '.archui', 'layout.yaml'))) {
      violations.push({
        ruleId: 'structure/missing-layout',
        filePath: '.archui/layout.yaml',
        message: 'missing .archui/layout.yaml — canvas layout file is required at project root',
      })
    }
  }
  if (!only || only === 'frontmatter') violations.push(...validateFrontmatter(targetPath))
  if (!only || only === 'links')       violations.push(...validateLinks(targetPath))
  if (!only || only === 'index')       violations.push(...validateIndexSync(targetPath))

  for (const v of violations) {
    console.log(`ERROR  [${v.ruleId}]  ${v.filePath}  ${v.message}`)
  }

  if (violations.length === 0) {
    console.log('Validation complete: all checks passed.')
  } else {
    console.log(`Validation complete: ${violations.length} violation(s) found.`)
  }

  return { violations, exitCode: Math.min(violations.length, 127) }
}
