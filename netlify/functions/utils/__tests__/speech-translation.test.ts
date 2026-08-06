/**
 * @jest-environment node
 */

const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

describe('speech-translation', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    process.env.GEMINI_TRANSLATION_MODEL = 'gemini-2.5-flash'
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_TRANSLATION_MODEL
  })

  it('parses a Gemini translation response and keeps the opposite language', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      detectedSourceLanguage: 'en',
                      targetLanguage: 'es',
                      translatedText: 'Gracias a todos por venir hoy.',
                    }),
                  },
                ],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    )

    const { translateSpeechContentWithGemini } = await import('../speech-translation')
    const result = await translateSpeechContentWithGemini('Hello everyone.', 'en')

    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.translatedText).toBe('Gracias a todos por venir hoy.')
      expect(result.detectedSourceLanguage).toBe('en')
      expect(result.targetLanguage).toBe('es')
      expect(result.provider).toBe('gemini')
    }
  })

  it('returns skipped when Gemini api key is missing', async () => {
    delete process.env.GEMINI_API_KEY

    const { translateSpeechContentWithGemini } = await import('../speech-translation')
    const result = await translateSpeechContentWithGemini('Hello everyone.', 'en')

    expect(result.status).toBe('skipped')
    if (result.status !== 'success') {
      expect(result.error).toMatch(/not configured/i)
    }
  })

  it('returns failed when Gemini responds with non-ok status', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('rate limited', {
        status: 429,
        headers: { 'content-type': 'text/plain' },
      })
    )

    const { translateSpeechContentWithGemini } = await import('../speech-translation')
    const result = await translateSpeechContentWithGemini('Hello everyone.', 'en')

    expect(result.status).toBe('failed')
    if (result.status !== 'success') {
      expect(result.error).toMatch(/429/)
    }
  })

  it('returns a model hint when Gemini responds with 404', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Not Found', {
        status: 404,
        headers: { 'content-type': 'text/plain' },
      })
    )

    const { translateSpeechContentWithGemini } = await import('../speech-translation')
    const result = await translateSpeechContentWithGemini('Hello everyone.', 'en')

    expect(result.status).toBe('failed')
    if (result.status !== 'success') {
      expect(result.error).toMatch(/model not found/i)
      expect(result.error).toMatch(/GEMINI_TRANSLATION_MODEL/i)
    }
  })

  it('sends long speeches as chunked content in one Gemini call', async () => {
    const longSpeech = Array.from({ length: 160 }, (_, index) => `Paragraph ${index + 1}. Thank you all for coming together tonight.`).join(
      '\n\n'
    )

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      detectedSourceLanguage: 'en',
                      targetLanguage: 'es',
                      chunks: [
                        { index: 0, translatedText: 'Párrafo 1.' },
                        { index: 1, translatedText: 'Párrafo 2.' },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    )

    const { translateSpeechContentWithGemini } = await import('../speech-translation')
    const result = await translateSpeechContentWithGemini(longSpeech, 'en')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [, requestInit] = mockFetch.mock.calls[0] || []
    expect(String((requestInit as { body?: string } | undefined)?.body || '')).toMatch(/CHUNK 1\//)
    expect(String((requestInit as { body?: string } | undefined)?.body || '')).toMatch(/CHUNK 2\//)
    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.translatedText).toContain('Párrafo 1.')
      expect(result.translatedText).toContain('Párrafo 2.')
    }
  })
})
