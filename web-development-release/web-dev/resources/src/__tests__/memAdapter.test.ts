import { createMemAdapter } from '../filesystem/memAdapter'

describe('memAdapter', () => {
  it('reads files it was initialized with', async () => {
    const adapter = createMemAdapter({ '/foo/bar.txt': 'hello' })
    expect(await adapter.readFile('/foo/bar.txt')).toBe('hello')
  })

  it('throws on missing file', async () => {
    const adapter = createMemAdapter({})
    await expect(adapter.readFile('/missing')).rejects.toThrow('ENOENT')
  })

  it('writes and reads back', async () => {
    const adapter = createMemAdapter({})
    await adapter.writeFile('/a/b.txt', 'world')
    expect(await adapter.readFile('/a/b.txt')).toBe('world')
  })

  it('listDir returns correct entries', async () => {
    const adapter = createMemAdapter({
      '/root/a/file1.txt': 'x',
      '/root/b/file2.txt': 'y',
      '/root/c.txt': 'z',
    })
    const entries = await adapter.listDir('/root')
    const names = entries.map(e => e.name).sort()
    expect(names).toEqual(['a', 'b', 'c.txt'])
  })

  it('exists returns true for files and false for missing', async () => {
    const adapter = createMemAdapter({ '/x/y.txt': 'v' })
    expect(await adapter.exists('/x/y.txt')).toBe(true)
    expect(await adapter.exists('/x/z.txt')).toBe(false)
  })

  it('exists returns true for implicit directories', async () => {
    const adapter = createMemAdapter({ '/a/b/c.txt': 'v' })
    expect(await adapter.exists('/a/b')).toBe(true)
    expect(await adapter.exists('/a')).toBe(true)
  })
})
