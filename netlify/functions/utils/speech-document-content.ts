import mammoth from 'mammoth'

import type { SpeechDocumentLanguage, SpeechDocumentType } from './speech-documents'

const EXTRACTION_TIMEOUT_MS = 12000
const DEFAULT_MAX_EXTRACTED_CHARS = 14000
const DEFAULT_MAX_FETCH_BYTES = 1024 * 1024
type PdfParseModule = typeof import('pdf-parse')
let pdfParseModulePromise: Promise<PdfParseModule> | null = null

const EN_MARKERS = [
  ' the ',
  ' and ',
  ' for ',
  ' with ',
  ' you ',
  ' your ',
  ' love ',
]

const ES_MARKERS = [
  ' el ',
  ' la ',
  ' de ',
  ' y ',
  ' para ',
  ' con ',
  ' que ',
  ' los ',
  ' las ',
]

export interface SpeechTextExtractionSuccess {
  ok: true
  text: string
  detectedLanguage: SpeechDocumentLanguage | null
}

export interface SpeechTextExtractionFailure {
  ok: false
  error: string
}

export type SpeechTextExtractionResult =
  | SpeechTextExtractionSuccess
  | SpeechTextExtractionFailure

interface UrlExtractionOptions {
  sourceUrl: string
  docType: SpeechDocumentType
  maxFileSizeBytes?: number
}

function withTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal
  cleanup: () => void
} {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  }
}

function getMaxExtractedChars(): number {
  const raw = Number.parseInt(process.env.SPEECH_DOC_MAX_EXTRACTED_CHARS || '', 10)
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_MAX_EXTRACTED_CHARS
  }
  return Math.min(raw, 50000)
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()
}

async function loadPdfParseModule(): Promise<PdfParseModule> {
  const globalScope = globalThis as typeof globalThis & {
    DOMMatrix?: typeof DOMMatrix
    DOMPoint?: typeof DOMPoint
    DOMRect?: typeof DOMRect
  }

  if (
    typeof globalScope.DOMMatrix === 'undefined' ||
    typeof globalScope.DOMPoint === 'undefined' ||
    typeof globalScope.DOMRect === 'undefined'
  ) {
    class PolyfillDOMPoint {
      x: number
      y: number
      z: number
      w: number

      constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
      }
    }

    class PolyfillDOMRect {
      x: number
      y: number
      width: number
      height: number

      constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
      }
    }

    class PolyfillDOMMatrix {
      a = 1
      b = 0
      c = 0
      d = 1
      e = 0
      f = 0

      constructor(init?: unknown) {
        if (Array.isArray(init) && init.length >= 6) {
          ;[this.a, this.b, this.c, this.d, this.e, this.f] = init.slice(0, 6).map((value) => Number(value)) as [number, number, number, number, number, number]
        }
      }

      multiplySelf(): PolyfillDOMMatrix {
        return this
      }

      preMultiplySelf(): PolyfillDOMMatrix {
        return this
      }

      translateSelf(): PolyfillDOMMatrix {
        return this
      }

      scaleSelf(): PolyfillDOMMatrix {
        return this
      }

      rotateSelf(): PolyfillDOMMatrix {
        return this
      }

      skewXSelf(): PolyfillDOMMatrix {
        return this
      }

      skewYSelf(): PolyfillDOMMatrix {
        return this
      }

      invertSelf(): PolyfillDOMMatrix {
        return this
      }

      multiply(): PolyfillDOMMatrix {
        return new PolyfillDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f])
      }

      translate(): PolyfillDOMMatrix {
        return this.multiply()
      }

      scale(): PolyfillDOMMatrix {
        return this.multiply()
      }

      rotate(): PolyfillDOMMatrix {
        return this.multiply()
      }

      skewX(): PolyfillDOMMatrix {
        return this.multiply()
      }

      skewY(): PolyfillDOMMatrix {
        return this.multiply()
      }

      flipX(): PolyfillDOMMatrix {
        return this.multiply()
      }

      flipY(): PolyfillDOMMatrix {
        return this.multiply()
      }

      transformPoint(point?: { x?: number; y?: number; z?: number; w?: number }): PolyfillDOMPoint {
        return new PolyfillDOMPoint(point?.x || 0, point?.y || 0, point?.z || 0, point?.w || 1)
      }
    }

    globalScope.DOMPoint = PolyfillDOMPoint as unknown as typeof DOMPoint
    globalScope.DOMRect = PolyfillDOMRect as unknown as typeof DOMRect
    globalScope.DOMMatrix = PolyfillDOMMatrix as unknown as typeof DOMMatrix
  }

  pdfParseModulePromise ??= import('pdf-parse')
  return pdfParseModulePromise
}

function enforceLengthLimit(text: string): SpeechTextExtractionResult {
  const maxChars = getMaxExtractedChars()
  if (text.length > maxChars) {
    return {
      ok: false,
      error: `Extracted content exceeds ${maxChars} characters. Use a shorter speech document.`,
    }
  }

  return {
    ok: true,
    text,
    detectedLanguage: detectEnglishOrSpanish(text),
  }
}

function scoreMarkers(text: string, markers: string[]): number {
  return markers.reduce((score, marker) => {
    const escaped = marker.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'g')
    const matches = text.match(regex)
    return score + (matches?.length || 0)
  }, 0)
}

function detectEnglishOrSpanish(text: string): SpeechDocumentLanguage | null {
  const normalized = ` ${text.toLowerCase()} `
  const enScore = scoreMarkers(normalized, EN_MARKERS)
  const esScore = scoreMarkers(normalized, ES_MARKERS)

  if (enScore === 0 && esScore === 0) {
    return null
  }

  if (enScore === esScore) {
    return null
  }

  return enScore > esScore ? 'en' : 'es'
}

function extractGoogleDocId(sourceUrl: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(sourceUrl)
  } catch {
    return null
  }

  const host = parsed.hostname.toLowerCase()
  const path = parsed.pathname

  if (host === 'docs.google.com') {
    const docMatch = path.match(/^\/document\/d\/([^/]+)/)
    if (docMatch?.[1]) return docMatch[1]
  }

  if (host === 'drive.google.com') {
    const fileMatch = path.match(/^\/file\/d\/([^/]+)/)
    if (fileMatch?.[1]) return fileMatch[1]
    const id = parsed.searchParams.get('id')
    if (id) return id
  }

  return null
}

async function fetchBytes(url: string, maxBytes: number): Promise<Uint8Array> {
  const timeout = withTimeoutSignal(EXTRACTION_TIMEOUT_MS)
  const response = await (async () => {
    try {
      return await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: timeout.signal,
      })
    } finally {
      timeout.cleanup()
    }
  })()

  if (!response.ok) {
    throw new Error(`Document source returned HTTP ${response.status}`)
  }

  const contentLengthRaw = response.headers.get('content-length')
  if (contentLengthRaw) {
    const contentLength = Number.parseInt(contentLengthRaw, 10)
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error(`Document exceeds the ${maxBytes} byte limit`)
    }
  }

  const buffer = new Uint8Array(await response.arrayBuffer())
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Document exceeds the ${maxBytes} byte limit`)
  }

  return buffer
}

async function fetchGoogleDocText(sourceUrl: string): Promise<string> {
  const docId = extractGoogleDocId(sourceUrl)
  if (!docId) {
    throw new Error('Google Docs URL format is invalid')
  }

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`
  const timeout = withTimeoutSignal(EXTRACTION_TIMEOUT_MS)
  const response = await (async () => {
    try {
      return await fetch(exportUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: timeout.signal,
      })
    } finally {
      timeout.cleanup()
    }
  })()

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Google Doc is not accessible. Set sharing to "Anyone with the link can view".')
    }

    throw new Error(`Google Doc export returned HTTP ${response.status}`)
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('text/html')) {
    throw new Error('Google Doc appears private. Ensure sharing is set to "Anyone with the link".')
  }

  return response.text()
}

export async function extractSpeechTextFromPdfBytes(
  bytes: Uint8Array
): Promise<SpeechTextExtractionResult> {
  try {
    const { PDFParse } = await loadPdfParseModule()
    const parser = new PDFParse({ data: Buffer.from(bytes) })
    const result = await parser.getText()
    await parser.destroy()

    const text = normalizeExtractedText(result.text || '')
    if (!text) {
      return { ok: false, error: 'Could not extract readable text from PDF' }
    }
    return enforceLengthLimit(text)
  } catch {
    return { ok: false, error: 'Could not extract text from PDF document' }
  }
}

export async function extractSpeechTextFromDocxBytes(
  bytes: Uint8Array
): Promise<SpeechTextExtractionResult> {
  try {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(bytes),
    })
    const text = normalizeExtractedText(result.value || '')
    if (!text) {
      return { ok: false, error: 'Could not extract readable text from DOCX' }
    }
    return enforceLengthLimit(text)
  } catch {
    return { ok: false, error: 'Could not extract text from DOCX document' }
  }
}

export async function extractSpeechTextFromUrl(
  options: UrlExtractionOptions
): Promise<SpeechTextExtractionResult> {
  const { sourceUrl, docType } = options
  const maxFetchBytes = options.maxFileSizeBytes || DEFAULT_MAX_FETCH_BYTES

  if (docType === 'google-doc') {
    try {
      const text = normalizeExtractedText(await fetchGoogleDocText(sourceUrl))
      if (!text) {
        return { ok: false, error: 'Google Doc did not contain extractable text' }
      }
      return enforceLengthLimit(text)
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not extract text from Google Doc',
      }
    }
  }

  let bytes: Uint8Array
  try {
    bytes = await fetchBytes(sourceUrl, maxFetchBytes)
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : 'Could not fetch document for text extraction',
    }
  }

  if (docType === 'pdf') {
    return extractSpeechTextFromPdfBytes(bytes)
  }

  if (docType === 'docx') {
    return extractSpeechTextFromDocxBytes(bytes)
  }

  return { ok: false, error: 'Unsupported document type for extraction' }
}
