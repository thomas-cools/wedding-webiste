import type { SpeechDocumentLanguage } from './speech-documents'

type TranslationProvider = 'gemini'
const MAX_CHUNK_CHARS = 3500
const MAX_CHUNK_COUNT = 12

interface TranslationSuccess {
  status: 'success'
  translatedText: string
  detectedSourceLanguage: SpeechDocumentLanguage
  targetLanguage: SpeechDocumentLanguage
  provider: TranslationProvider
  translatedAt: string
}

interface TranslationFailure {
  status: 'failed' | 'skipped'
  error: string
}

export type SpeechTranslationResult = TranslationSuccess | TranslationFailure

function formatGeminiError(response: Response, model: string, errorBody: string): string {
  const trimmedBody = errorBody.trim().slice(0, 180)

  if (response.status === 404) {
    return `Gemini model not found for ${model}. Check GEMINI_TRANSLATION_MODEL and verify the API key/project has access to that model. ${trimmedBody}`.trim()
  }

  return `Gemini request failed with HTTP ${response.status}: ${trimmedBody}`
}

function oppositeLanguage(language: SpeechDocumentLanguage): SpeechDocumentLanguage {
  return language === 'en' ? 'es' : 'en'
}

function parseModelResponseText(payload: unknown): string {
  const record = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>
      }
    }>
  }

  const parts = record.candidates?.[0]?.content?.parts || []
  const combined = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()

  if (!combined) {
    throw new Error('Gemini returned an empty translation payload')
  }

  return combined
}

function stripCodeFences(rawText: string): string {
  const trimmed = rawText.trim()
  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function splitSpeechTextIntoChunks(sourceText: string): string[] {
  const paragraphs = sourceText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return [sourceText.trim()]
  }

  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    const nextChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph
    if (nextChunk.length <= MAX_CHUNK_CHARS) {
      currentChunk = nextChunk
      continue
    }

    if (currentChunk) {
      chunks.push(currentChunk)
    }

    if (paragraph.length <= MAX_CHUNK_CHARS) {
      currentChunk = paragraph
      continue
    }

    const words = paragraph.split(/\s+/).filter(Boolean)
    let longChunk = ''

    for (const word of words) {
      const candidate = longChunk ? `${longChunk} ${word}` : word
      if (candidate.length <= MAX_CHUNK_CHARS) {
        longChunk = candidate
        continue
      }

      if (longChunk) {
        chunks.push(longChunk)
      }
      longChunk = word
    }

    currentChunk = longChunk
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks.slice(0, MAX_CHUNK_COUNT)
}

function parseStructuredTranslation(
  rawText: string,
  sourceLanguageHint: SpeechDocumentLanguage | null
): Omit<TranslationSuccess, 'status' | 'provider' | 'translatedAt'> {
  let parsed: {
    translatedText?: unknown
    detectedSourceLanguage?: unknown
    targetLanguage?: unknown
    chunks?: unknown
  }

  try {
    parsed = JSON.parse(stripCodeFences(rawText))
  } catch {
    throw new Error('Gemini response was not valid JSON')
  }

  const translatedText = typeof parsed.translatedText === 'string' ? parsed.translatedText.trim() : ''
  const chunkTranslations = Array.isArray(parsed.chunks)
    ? parsed.chunks
        .map((chunk) => {
          if (!chunk || typeof chunk !== 'object') return ''
          const record = chunk as { translatedText?: unknown }
          return typeof record.translatedText === 'string' ? record.translatedText.trim() : ''
        })
        .filter(Boolean)
    : []

  const finalTranslatedText = translatedText || chunkTranslations.join('\n\n').trim()
  if (!finalTranslatedText) {
    throw new Error('Gemini response did not include translatedText')
  }

  const detectedSourceLanguage =
    parsed.detectedSourceLanguage === 'en' || parsed.detectedSourceLanguage === 'es'
      ? parsed.detectedSourceLanguage
      : sourceLanguageHint

  if (!detectedSourceLanguage) {
    throw new Error('Could not determine source language as English or Spanish')
  }

  const parsedTargetLanguage = parsed.targetLanguage === 'en' || parsed.targetLanguage === 'es'
    ? parsed.targetLanguage
    : null

  const targetLanguage = parsedTargetLanguage || oppositeLanguage(detectedSourceLanguage)
  if (targetLanguage === detectedSourceLanguage) {
    throw new Error('Gemini returned the same source and target language')
  }

  return {
    translatedText: finalTranslatedText,
    detectedSourceLanguage,
    targetLanguage,
  }
}

function buildPrompt(sourceText: string, sourceLanguageHint: SpeechDocumentLanguage | null): string {
  const hintText = sourceLanguageHint ? `Source language hint: ${sourceLanguageHint}.` : 'No source language hint.'
  const chunks = splitSpeechTextIntoChunks(sourceText)
  const isChunked = chunks.length > 1

  if (!isChunked) {
    return [
      'You are a professional translator for wedding speeches.',
      'Translate the full speech text between English and Spanish.',
      'Detect whether the source is English or Spanish and translate to the opposite language only.',
      'Preserve paragraph breaks, names, URLs, numbers, and punctuation.',
      'Do not summarize or omit content.',
      'Return strict JSON only with this schema:',
      '{"detectedSourceLanguage":"en|es","targetLanguage":"en|es","translatedText":"..."}',
      hintText,
      'Speech text follows:',
      sourceText,
    ].join('\n')
  }

  return [
    'You are a professional translator for wedding speeches.',
    'Translate the full speech text between English and Spanish.',
    'Detect whether the source is English or Spanish and translate to the opposite language only.',
    'Preserve paragraph breaks, names, URLs, numbers, and punctuation.',
    'Do not summarize or omit content.',
    'Return strict JSON only with this schema:',
    '{"detectedSourceLanguage":"en|es","targetLanguage":"en|es","chunks":[{"index":0,"translatedText":"..."}]}',
    hintText,
    'The speech has been split into ordered chunks for reliability. Keep the order exactly the same.',
    'Translate every chunk completely and return one translatedText per chunk.',
    `Chunk count: ${chunks.length}`,
    ...chunks.map((chunk, index) => `CHUNK ${index + 1}/${chunks.length}\n${chunk}`),
  ].join('\n')
}

export async function translateSpeechContentWithGemini(
  sourceText: string,
  sourceLanguageHint: SpeechDocumentLanguage | null
): Promise<SpeechTranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      status: 'skipped',
      error: 'GEMINI_API_KEY is not configured',
    }
  }

  const model = process.env.GEMINI_TRANSLATION_MODEL || 'gemini-2.5-flash'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(sourceText, sourceLanguageHint) }],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return {
        status: 'failed',
        error: formatGeminiError(response, model, errorBody),
      }
    }

    const payload = await response.json()
    const rawText = parseModelResponseText(payload)
    const parsed = parseStructuredTranslation(rawText, sourceLanguageHint)

    return {
      status: 'success',
      provider: 'gemini',
      translatedAt: new Date().toISOString(),
      ...parsed,
    }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Gemini translation failed',
    }
  }
}
