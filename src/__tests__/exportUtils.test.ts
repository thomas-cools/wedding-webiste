import { rowsToCsv, rowsToMarkdownTable, triggerDownload } from '../components/Admin/exportUtils'

describe('rowsToCsv', () => {
  it('joins cells with commas and rows with newlines, quoting every cell', () => {
    const csv = rowsToCsv([
      ['Name', 'Email'],
      ['Alice', 'alice@example.com'],
    ])

    expect(csv).toBe('"Name","Email"\n"Alice","alice@example.com"')
  })

  it('escapes embedded double quotes by doubling them', () => {
    const csv = rowsToCsv([['Note'], ['She said "hi"']])

    expect(csv).toBe('"Note"\n"She said ""hi"""')
  })

  it('does not need to escape embedded commas since cells are always quoted', () => {
    const csv = rowsToCsv([['Address'], ['123 Main St, Paris']])

    expect(csv).toBe('"Address"\n"123 Main St, Paris"')
  })
})

describe('rowsToMarkdownTable', () => {
  it('returns an empty string for an empty row matrix', () => {
    expect(rowsToMarkdownTable([])).toBe('')
  })

  it('builds a header row, separator row, and data rows', () => {
    const md = rowsToMarkdownTable([
      ['Name', 'Email'],
      ['Alice', 'alice@example.com'],
      ['Bob', 'bob@example.com'],
    ])

    expect(md).toBe(
      '| Name | Email |\n' +
      '| --- | --- |\n' +
      '| Alice | alice@example.com |\n' +
      '| Bob | bob@example.com |'
    )
  })

  it('escapes pipe characters in cell values', () => {
    const md = rowsToMarkdownTable([
      ['Note'],
      ['Options: yes|no'],
    ])

    expect(md).toBe('| Note |\n| --- |\n| Options: yes\\|no |')
  })

  it('replaces embedded newlines with <br> to keep a single table row', () => {
    const md = rowsToMarkdownTable([
      ['Note'],
      ['Line one\nLine two'],
    ])

    expect(md).toBe('| Note |\n| --- |\n| Line one<br>Line two |')
  })
})

describe('triggerDownload', () => {
  it('creates a Blob download link, clicks it, and revokes the object URL', () => {
    const createObjectURL = jest.fn(() => 'blob:mock-url')
    const revokeObjectURL = jest.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL

    const clickSpy = jest.fn()
    const appendSpy = jest.spyOn(document.body, 'appendChild')
    const removeSpy = jest.spyOn(document.body, 'removeChild')
    const realCreateElement = document.createElement.bind(document)
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = realCreateElement(tagName)
      el.click = clickSpy
      return el
    })

    triggerDownload('content', 'file.csv', 'text/csv;charset=utf-8;')

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    createElementSpy.mockRestore()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
