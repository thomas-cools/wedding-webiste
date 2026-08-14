/**
 * @jest-environment node
 */

import JSZip from 'jszip'
import snappy from 'snappyjs'

const mockPdfParse = jest.fn()
const mockMammothExtractRawText = jest.fn()
const mockFetch = jest.fn()

global.fetch = mockFetch as typeof fetch

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: (...args: unknown[]) => mockPdfParse(...args),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}))
jest.mock('mammoth', () => ({
  extractRawText: (...args: unknown[]) => mockMammothExtractRawText(...args),
}))

describe('speech-document-content', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    delete process.env.SPEECH_DOC_MAX_EXTRACTED_CHARS
  })

  it('extracts and normalizes DOCX text', async () => {
    mockMammothExtractRawText.mockResolvedValueOnce({
      value: 'Hello   there\n\n\nHow are you?',
    })

    const { extractSpeechTextFromDocxBytes } = await import('../speech-document-content')
    const result = await extractSpeechTextFromDocxBytes(new Uint8Array([1, 2, 3]))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.text).toBe('Hello there\n\nHow are you?')
      expect(result.detectedLanguage).toBe('en')
    }
  })

  it('extracts text from PDF bytes', async () => {
    mockPdfParse.mockResolvedValueOnce({ text: 'Gracias   a todos y celebrar con nosotros.' })

    const { extractSpeechTextFromPdfBytes } = await import('../speech-document-content')
    const result = await extractSpeechTextFromPdfBytes(new Uint8Array([1, 2, 3]))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.text).toBe('Gracias a todos y celebrar con nosotros.')
      expect(result.detectedLanguage).toBe('es')
    }
  })

  it('extracts an embedded PDF preview from an Apple Pages package', async () => {
    mockPdfParse.mockResolvedValueOnce({ text: 'Thank you all for being here with us today.' })
    const archive = new JSZip()
    archive.file('QuickLook/Preview.pdf', Buffer.from('%PDF-1.7 preview'))
    const bytes = await archive.generateAsync({ type: 'uint8array' })

    const { extractSpeechTextFromPagesBytes } = await import('../speech-document-content')
    const result = await extractSpeechTextFromPagesBytes(bytes)

    expect(result).toMatchObject({
      ok: true,
      text: 'Thank you all for being here with us today.',
      detectedLanguage: 'en',
    })
    expect(mockPdfParse).toHaveBeenCalledTimes(1)
  })

  it('falls back to legacy XML text in an Apple Pages package', async () => {
    const archive = new JSZip()
    archive.file(
      'index.xml',
      '<document><paragraph>Hello everyone and thank you for sharing this day with us.</paragraph></document>'
    )
    const bytes = await archive.generateAsync({ type: 'uint8array' })

    const { extractSpeechTextFromPagesBytes } = await import('../speech-document-content')
    const result = await extractSpeechTextFromPagesBytes(bytes)

    expect(result).toMatchObject({
      ok: true,
      text: 'Hello everyone and thank you for sharing this day with us.',
      detectedLanguage: 'en',
    })
  })

  it('returns an actionable error when a Pages package has no extractable preview', async () => {
    const archive = new JSZip()
    archive.file('Index/Document.iwa', new Uint8Array([1, 2, 3]))
    const bytes = await archive.generateAsync({ type: 'uint8array' })

    const { extractSpeechTextFromPagesBytes } = await import('../speech-document-content')
    const result = await extractSpeechTextFromPagesBytes(bytes)

    expect(result).toEqual({
      ok: false,
      error: 'Could not extract text from this Apple Pages file. Export it as DOCX or PDF and resend it.',
    })
  })

  it('recovers best-effort text from modern Pages IWA content', async () => {
    const speech = [
      'Hello everyone and thank you for joining us for this wonderful celebration.',
      'Carolina and Thomas, your love has brought all of us together today.',
      'May your years ahead be filled with laughter, friendship, and adventure.',
    ].join('\n')
    const payload = Buffer.concat([
      Buffer.from([0x08, 0x96, 0x01, 0x12]),
      Buffer.from(speech, 'utf-8'),
      Buffer.from([0x18, 0x01]),
    ])
    const compressed = new Uint8Array(snappy.compress(payload))
    const frame = new Uint8Array(compressed.byteLength + 4)
    frame[0] = 0
    frame[1] = compressed.byteLength & 0xff
    frame[2] = (compressed.byteLength >> 8) & 0xff
    frame[3] = (compressed.byteLength >> 16) & 0xff
    frame.set(compressed, 4)
    const archive = new JSZip()
    archive.file('Index/Document.iwa', frame)
    const bytes = await archive.generateAsync({ type: 'uint8array' })

    const { extractSpeechTextFromPagesBytes } = await import('../speech-document-content')
    const result = await extractSpeechTextFromPagesBytes(bytes)

    expect(result).toMatchObject({ ok: true })
    if (result.ok) {
      expect(result.text).toContain('Carolina and Thomas')
      expect(result.text).toContain('laughter, friendship, and adventure')
    }
  })

  it('extracts text from a Google Docs URL', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Thank you all for coming today.', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      })
    )

    const { extractSpeechTextFromUrl } = await import('../speech-document-content')
    const result = await extractSpeechTextFromUrl({
      sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
      docType: 'google-doc',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.text).toBe('Thank you all for coming today.')
      expect(result.detectedLanguage).toBe('en')
    }
  })

  it('normalizes plain-text email body content', async () => {
    const { extractSpeechTextFromPlainText } = await import('../speech-document-content')
    const result = extractSpeechTextFromPlainText('Hello   everyone.\r\n\r\n\r\nThank you.')

    expect(result).toEqual({
      ok: true,
      text: 'Hello everyone.\n\nThank you.',
      detectedLanguage: 'en',
    })
  })

  it('rejects extracted content that exceeds the configured limit', async () => {
    process.env.SPEECH_DOC_MAX_EXTRACTED_CHARS = '10'
    mockMammothExtractRawText.mockResolvedValueOnce({
      value: 'Hello there friend',
    })

    const { extractSpeechTextFromDocxBytes } = await import('../speech-document-content')
    const result = await extractSpeechTextFromDocxBytes(new Uint8Array([1, 2, 3]))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/exceeds/i)
    }
  })
})
