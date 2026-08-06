/**
 * @jest-environment node
 */

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
