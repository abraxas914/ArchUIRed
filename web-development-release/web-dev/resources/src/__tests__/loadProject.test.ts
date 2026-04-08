import { loadModule, discoverRoot } from '../filesystem/loadProject'
import { createMemAdapter } from '../filesystem/memAdapter'

const ROOT_README = `---\nname: Root Module\ndescription: The root\n---\n`
const ROOT_INDEX  = `schema_version: "1"\nuuid: aaaabbbb\nsubmodules:\n  child-a: 11112222\n  child-b: 33334444\nlinks: []\n`
const CHILD_A_README = `---\nname: Child A\ndescription: First child\n---\n`
const CHILD_A_INDEX  = `schema_version: "1"\nuuid: 11112222\nsubmodules: {}\nlinks: []\n`
const CHILD_B_README = `---\nname: Child B\ndescription: Second child\n---\n`
const CHILD_B_INDEX  = `schema_version: "1"\nuuid: 33334444\nsubmodules: {}\nlinks: []\n`

function makeAdapter() {
  return createMemAdapter({
    '/project/README.md': ROOT_README,
    '/project/.archui/index.yaml': ROOT_INDEX,
    '/project/child-a/README.md': CHILD_A_README,
    '/project/child-a/.archui/index.yaml': CHILD_A_INDEX,
    '/project/child-b/README.md': CHILD_B_README,
    '/project/child-b/.archui/index.yaml': CHILD_B_INDEX,
  })
}

describe('loadModule', () => {
  it('loads root module with correct name and uuid', async () => {
    const adapter = makeAdapter()
    const mod = await loadModule(adapter, '/project')
    expect(mod.name).toBe('Root Module')
    expect(mod.uuid).toBe('aaaabbbb')
  })

  it('loads correct number of children', async () => {
    const mod = await loadModule(makeAdapter(), '/project')
    expect(mod.children).toHaveLength(2)
  })

  it('children have correct names', async () => {
    const mod = await loadModule(makeAdapter(), '/project')
    const names = mod.children.map(c => c.name).sort()
    expect(names).toEqual(['Child A', 'Child B'])
  })

  it('children paths are correct', async () => {
    const mod = await loadModule(makeAdapter(), '/project')
    const paths = mod.children.map(c => c.path).sort()
    expect(paths).toEqual(['/project/child-a', '/project/child-b'])
  })
})

describe('discoverRoot', () => {
  it('finds modules with both README and index.yaml', async () => {
    const adapter = createMemAdapter({
      '/project/mod-a/README.md': `---\nname: A\ndescription: A\n---\n`,
      '/project/mod-a/.archui/index.yaml': `schema_version: "1"\nuuid: aa000001\n`,
      '/project/mod-b/README.md': `---\nname: B\ndescription: B\n---\n`,
      '/project/mod-b/.archui/index.yaml': `schema_version: "1"\nuuid: bb000001\n`,
      '/project/not-a-module/somefile.txt': 'x',
    })
    const found = await discoverRoot(adapter, '/project')
    expect(found.sort()).toEqual(['mod-a', 'mod-b'])
  })
})
