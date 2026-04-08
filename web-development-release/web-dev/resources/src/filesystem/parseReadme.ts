import { parse as parseYaml } from 'yaml'
import type { ReadmeFrontmatter } from '../types'

/**
 * Extract YAML frontmatter from a README.md string.
 * Returns null if the file does not have a valid `---` block.
 */
export function parseReadme(content: string): ReadmeFrontmatter | null {
  if (!content.startsWith('---')) return null
  const end = content.indexOf('\n---', 3)
  if (end === -1) return null
  const yaml = content.slice(3, end).trim()
  try {
    const parsed = parseYaml(yaml) as Record<string, unknown>
    if (typeof parsed?.name !== 'string' || typeof parsed?.description !== 'string') return null
    return { name: parsed.name, description: parsed.description }
  } catch {
    return null
  }
}

/**
 * Serialize frontmatter + body back to a README.md string.
 */
export function serializeReadme(frontmatter: ReadmeFrontmatter, body = ''): string {
  return `---\nname: ${frontmatter.name}\ndescription: ${frontmatter.description}\n---\n${body}`
}
