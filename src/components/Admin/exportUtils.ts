/** Shared helpers for exporting tabular admin data (RSVP dashboards) as CSV or Markdown. */

/** Triggers a browser download of `content` as a file named `filename`. */
export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Converts a header + data row matrix into a quoted, comma-separated CSV string. */
export function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

/** Converts a header + data row matrix into a GitHub-flavored Markdown table string. */
export function rowsToMarkdownTable(rows: string[][]): string {
  if (rows.length === 0) return ''

  const escapeCell = (cell: string) =>
    String(cell).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')

  const [header, ...dataRows] = rows as [string[], ...string[][]]
  const headerLine = `| ${header.map(escapeCell).join(' | ')} |`
  const separatorLine = `| ${header.map(() => '---').join(' | ')} |`
  const dataLines = dataRows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)

  return [headerLine, separatorLine, ...dataLines].join('\n')
}
