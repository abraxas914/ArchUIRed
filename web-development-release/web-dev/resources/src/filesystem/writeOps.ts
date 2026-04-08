import { stringify as stringifyYaml, parse as parseYaml } from 'yaml'
import type { FsAdapter, IndexYaml, LayoutFile, ModuleLink } from '../types'
import { serializeReadme } from './parseReadme'

function join(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

function nanoid8(): string {
  return Math.random().toString(16).slice(2, 10).padEnd(8, '0')
}

/**
 * Create a new ArchUI module folder with README.md and .archui/index.yaml.
 */
export async function createModule(
  adapter: FsAdapter,
  parentPath: string,
  folderName: string,
  name: string,
  description: string,
): Promise<string> {
  const modulePath = join(parentPath, folderName)
  const archui     = join(modulePath, '.archui')
  const uuid       = nanoid8()

  await adapter.mkdir(modulePath)
  await adapter.mkdir(archui)

  await adapter.writeFile(
    join(modulePath, 'README.md'),
    serializeReadme({ name, description }),
  )

  const index: IndexYaml = { schema_version: '1', uuid, submodules: {}, links: [] }
  await adapter.writeFile(join(archui, 'index.yaml'), stringifyYaml(index))

  // Register in parent's index.yaml
  const parentIndexPath = join(parentPath, '.archui/index.yaml')
  const parentIndexContent = await adapter.readFile(parentIndexPath).catch(() => '')
  let parentIndex: IndexYaml = { schema_version: '1', uuid: '' }
  try { parentIndex = parseYaml(parentIndexContent) as IndexYaml } catch { /* empty */ }

  parentIndex.submodules = { ...(parentIndex.submodules ?? {}), [folderName]: uuid }
  await adapter.writeFile(parentIndexPath, stringifyYaml(parentIndex))

  return uuid
}

/**
 * Add a link from one module to another in the source module's index.yaml.
 */
export async function addLink(
  adapter: FsAdapter,
  modulePath: string,
  link: ModuleLink,
): Promise<void> {
  const indexPath = join(modulePath, '.archui/index.yaml')
  const content = await adapter.readFile(indexPath)
  const index = parseYaml(content) as IndexYaml
  index.links = [...(index.links ?? []), link]
  await adapter.writeFile(indexPath, stringifyYaml(index))
}

/**
 * Remove a link by target uuid from a module's index.yaml.
 */
export async function removeLink(
  adapter: FsAdapter,
  modulePath: string,
  targetUuid: string,
): Promise<void> {
  const indexPath = join(modulePath, '.archui/index.yaml')
  const content = await adapter.readFile(indexPath)
  const index = parseYaml(content) as IndexYaml
  index.links = (index.links ?? []).filter(l => l.uuid !== targetUuid)
  await adapter.writeFile(indexPath, stringifyYaml(index))
}

/**
 * Persist canvas layout positions into the centralized .archui/layout.yaml.
 * Merges the given module's positions into the existing layout file.
 */
export async function saveLayout(
  adapter: FsAdapter,
  moduleUuid: string,
  layout: Record<string, { x: number; y: number }>,
): Promise<void> {
  let existing: LayoutFile = {}
  try {
    const content = await adapter.readFile('.archui/layout.yaml')
    const parsed = parseYaml(content) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      existing = parsed as LayoutFile
    }
  } catch { /* file may not exist yet */ }
  existing[moduleUuid] = layout
  await adapter.writeFile('.archui/layout.yaml', stringifyYaml(existing))
}
