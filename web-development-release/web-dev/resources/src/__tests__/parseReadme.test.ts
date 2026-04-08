import { parseReadme, serializeReadme } from '../filesystem/parseReadme'

describe('parseReadme', () => {
  it('parses valid frontmatter', () => {
    const content = `---\nname: My Module\ndescription: Does something useful\n---\n\nBody text`
    const result = parseReadme(content)
    expect(result).toEqual({ name: 'My Module', description: 'Does something useful' })
  })

  it('returns null for missing frontmatter', () => {
    expect(parseReadme('# No frontmatter')).toBeNull()
  })

  it('returns null for incomplete frontmatter (missing description)', () => {
    const content = `---\nname: Only Name\n---\n`
    expect(parseReadme(content)).toBeNull()
  })

  it('handles CRLF line endings', () => {
    const content = `---\r\nname: Module\r\ndescription: Desc\r\n---\r\n`
    const result = parseReadme(content)
    expect(result?.name).toBe('Module')
  })
})

describe('serializeReadme', () => {
  it('produces valid frontmatter', () => {
    const out = serializeReadme({ name: 'Test', description: 'A test module' })
    expect(out).toContain('name: Test')
    expect(out).toContain('description: A test module')
    expect(out.startsWith('---')).toBe(true)
  })

  it('round-trips through parseReadme', () => {
    const fm = { name: 'Round Trip', description: 'Round trip test' }
    const serialized = serializeReadme(fm)
    expect(parseReadme(serialized)).toEqual(fm)
  })
})
