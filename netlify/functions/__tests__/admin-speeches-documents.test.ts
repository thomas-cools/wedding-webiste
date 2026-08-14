/**
 * @jest-environment node
 */

import type { HandlerContext, HandlerEvent, HandlerResponse } from '@netlify/functions'
import type { SpeechDocument } from '../utils/speech-documents'

const mockFetch = jest.fn()
global.fetch = mockFetch as typeof fetch

const mockGetAllSpeechDocuments = jest.fn<Promise<SpeechDocument[]>, []>()
const mockBackfillSpeechDocumentSpeakerKeys = jest.fn<Promise<{ total: number; backfilled: number; documents: SpeechDocument[] }>, []>()
const mockSaveSpeechDocument = jest.fn<Promise<void>, [SpeechDocument]>()
const mockDeleteSpeechDocument = jest.fn<Promise<boolean>, [string]>()
const mockGetSpeechDocumentById = jest.fn<Promise<SpeechDocument | null>, [string]>()
const mockSaveSpeechDocumentFile = jest.fn<Promise<void>, [string, Uint8Array]>()
const mockGetSpeechDocumentFile = jest.fn<Promise<Uint8Array | null>, [string]>()
const mockDeleteSpeechDocumentFile = jest.fn<Promise<boolean>, [string]>()
const mockExtractSpeechTextFromUrl =
  jest.fn<
    Promise<{ ok: true; text: string; detectedLanguage: 'en' | 'es' | null } | { ok: false; error: string }>,
    [{ sourceUrl: string; docType: 'pdf' | 'docx' | 'google-doc'; maxFileSizeBytes?: number }]
  >()
const mockExtractSpeechTextFromDocxBytes =
  jest.fn<
    Promise<{ ok: true; text: string; detectedLanguage: 'en' | 'es' | null } | { ok: false; error: string }>,
    [Uint8Array]
  >()
const mockTranslateSpeechContentWithGemini =
  jest.fn<
    Promise<
      | {
          status: 'success'
          translatedText: string
          detectedSourceLanguage: 'en' | 'es'
          targetLanguage: 'en' | 'es'
          provider: 'gemini'
          translatedAt: string
        }
      | { status: 'failed' | 'skipped'; error: string }
    >,
    [string, 'en' | 'es' | null]
  >()

jest.mock('../utils/speech-documents', () => ({
  getAllSpeechDocuments: () => mockGetAllSpeechDocuments(),
  backfillSpeechDocumentSpeakerKeys: () => mockBackfillSpeechDocumentSpeakerKeys(),
  saveSpeechDocument: (document: SpeechDocument) => mockSaveSpeechDocument(document),
  deleteSpeechDocument: (id: string) => mockDeleteSpeechDocument(id),
  getSpeechDocumentById: (id: string) => mockGetSpeechDocumentById(id),
  saveSpeechDocumentFile: (storageKey: string, bytes: Uint8Array) =>
    mockSaveSpeechDocumentFile(storageKey, bytes),
  getSpeechDocumentFile: (storageKey: string) => mockGetSpeechDocumentFile(storageKey),
  deleteSpeechDocumentFile: (storageKey: string) => mockDeleteSpeechDocumentFile(storageKey),
  buildSpeechDocumentStorageKey: (id: string) => `files/${id}.docx`,
}))

jest.mock('../utils/speech-document-content', () => ({
  extractSpeechTextFromUrl: (...args: Parameters<typeof mockExtractSpeechTextFromUrl>) =>
    mockExtractSpeechTextFromUrl(...args),
  extractSpeechTextFromDocxBytes: (...args: Parameters<typeof mockExtractSpeechTextFromDocxBytes>) =>
    mockExtractSpeechTextFromDocxBytes(...args),
}))

jest.mock('../utils/speech-translation', () => ({
  translateSpeechContentWithGemini: (
    ...args: Parameters<typeof mockTranslateSpeechContentWithGemini>
  ) => mockTranslateSpeechContentWithGemini(...args),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-speeches-documents-add',
    rawQuery: '',
    path: '/.netlify/functions/admin-speeches-documents-add',
    httpMethod: 'POST',
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
    ...overrides,
  }
}

function createAdminHeaders() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createToken } = require('../utils/jwt')
  return { authorization: `Bearer ${createToken('admin', 3600)}` }
}

const mockContext = {} as HandlerContext

async function createUploadEvent(
  overrides: Partial<HandlerEvent> = {},
  options: {
    fileName?: string
    speakerKey?: string
    fileBytes?: Uint8Array
    uploadedFileName?: string
    mimeType?: string
  } = {}
): Promise<HandlerEvent> {
  const formData = new FormData()
  formData.append('fileName', options.fileName || 'Uploaded Speech')
  formData.append('speakerKey', options.speakerKey || 'guy-karin')

  const bytes = options.fileBytes || new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01, 0x02])
  const file = new File([bytes], options.uploadedFileName || 'speech.docx', {
    type:
      options.mimeType ||
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  formData.append('file', file)

  const request = new Request('https://example.com/upload', {
    method: 'POST',
    body: formData,
  })

  const contentType = request.headers.get('content-type') || ''
  const bodyBuffer = Buffer.from(await request.arrayBuffer())

  return createEvent({
    headers: {
      ...createAdminHeaders(),
      'content-type': contentType,
    },
    body: bodyBuffer.toString('base64'),
    isBase64Encoded: true,
    ...overrides,
  })
}

describe('admin-speeches-documents handlers', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    mockFetch.mockReset()
    mockExtractSpeechTextFromUrl.mockReset()
    mockExtractSpeechTextFromDocxBytes.mockReset()
    mockTranslateSpeechContentWithGemini.mockReset()
    mockBackfillSpeechDocumentSpeakerKeys.mockReset()
    process.env.JWT_SECRET = 'test-jwt-secret'
    delete process.env.SPEECH_DOC_ALLOWED_HOSTS

    mockExtractSpeechTextFromUrl.mockResolvedValue({
      ok: true,
      text: 'Thank you everyone for being here today.',
      detectedLanguage: 'en',
    })
    mockExtractSpeechTextFromDocxBytes.mockResolvedValue({
      ok: true,
      text: 'Thank you everyone for being here today.',
      detectedLanguage: 'en',
    })
    mockTranslateSpeechContentWithGemini.mockResolvedValue({
      status: 'success',
      translatedText: 'Gracias a todos por estar aqui hoy.',
      detectedSourceLanguage: 'en',
      targetLanguage: 'es',
      provider: 'gemini',
      translatedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.SPEECH_DOC_ALLOWED_HOSTS
  })

  it('adds a valid Google Docs URL', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('', {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '128000',
        },
      })
    )

    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: '  Welcome Speech  ',
        sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    expect(mockSaveSpeechDocument).toHaveBeenCalledTimes(1)
    const firstCall = mockSaveSpeechDocument.mock.calls[0]
    expect(firstCall).toBeDefined()
    const savedDocument = firstCall![0]
    expect(savedDocument.fileName).toBe('Welcome Speech')
    expect(savedDocument.speakerKey).toBe('guy-karin')
    expect(savedDocument.docType).toBe('google-doc')
    expect(savedDocument.sourceHost).toBe('docs.google.com')
    expect(savedDocument.fileSizeBytes).toBe(128000)
    expect(savedDocument.translationStatus).toBe('success')
    expect(savedDocument.detectedLanguage).toBe('en')
    expect(savedDocument.translatedLanguage).toBe('es')
    expect(mockExtractSpeechTextFromUrl).toHaveBeenCalledTimes(1)
    expect(mockTranslateSpeechContentWithGemini).toHaveBeenCalledTimes(1)

    const body = JSON.parse(result.body || '{}')
    expect(body.ok).toBe(true)
    expect(body.document.id).toBeTruthy()
  })

  it('rejects non-HTTPS URLs', async () => {
    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'Unsafe URL',
        sourceUrl: 'http://docs.google.com/document/d/abc123/edit',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body || '{}').error).toMatch(/https/i)
    expect(mockSaveSpeechDocument).not.toHaveBeenCalled()
  })

  it('rejects unsupported hosts by default', async () => {
    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'Random Host',
        sourceUrl: 'https://example.com/speech.pdf',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body || '{}').error).toMatch(/allowlist/i)
    expect(mockSaveSpeechDocument).not.toHaveBeenCalled()
  })

  it('accepts allowlisted hosts via SPEECH_DOC_ALLOWED_HOSTS', async () => {
    process.env.SPEECH_DOC_ALLOWED_HOSTS = 'example.com'
    mockFetch.mockResolvedValueOnce(
      new Response('', {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '333000',
        },
      })
    )
    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'Local PDF',
        sourceUrl: 'https://example.com/files/final-speech.pdf',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const firstCall = mockSaveSpeechDocument.mock.calls[0]
    expect(firstCall).toBeDefined()
    const savedDocument = firstCall![0]
    expect(savedDocument.docType).toBe('pdf')
    expect(savedDocument.sourceHost).toBe('example.com')
  })

  it('rejects localhost URLs even if allowlisted', async () => {
    process.env.SPEECH_DOC_ALLOWED_HOSTS = 'localhost'
    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'Loopback',
        sourceUrl: 'https://localhost/speech.pdf',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body || '{}').error).toMatch(/blocked/i)
    expect(mockSaveSpeechDocument).not.toHaveBeenCalled()
  })

  it('rejects files larger than 1 MB based on probed size', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('', {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': String(1024 * 1024 + 1),
        },
      })
    )

    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'Large file',
        sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body || '{}').error).toMatch(/exceeds/i)
    expect(mockSaveSpeechDocument).not.toHaveBeenCalled()
  })

  it('rejects private Google Docs links', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('', {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'content-length': '1024',
        },
      })
    )

    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'Private doc',
        sourceUrl: 'https://docs.google.com/document/d/private-doc-id/edit',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body || '{}').error).toMatch(/anyone with the link/i)
    expect(mockSaveSpeechDocument).not.toHaveBeenCalled()
  })

  it('computes size from response body when size headers are missing', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response('', {
          status: 200,
          headers: {
            'content-type': 'application/pdf',
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1]), {
          status: 200,
          headers: {
            'content-type': 'application/pdf',
          },
        })
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array(4096), {
          status: 200,
          headers: {
            'content-type': 'application/pdf',
          },
        })
      )

    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'No size headers',
        sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const firstCall = mockSaveSpeechDocument.mock.calls[0]
    expect(firstCall).toBeDefined()
    const savedDocument = firstCall![0]
    expect(savedDocument.fileSizeBytes).toBe(4096)
  })

  it('lists stored documents with limits and allowed hosts', async () => {
    mockGetAllSpeechDocuments.mockResolvedValueOnce([
      {
        id: '11111111-1111-1111-1111-111111111111',
        fileName: 'Speech PDF',
        sourceUrl: 'https://example.com/speech.pdf',
        sourceHost: 'example.com',
        fileSizeBytes: 200000,
        docType: 'pdf',
        createdAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'admin',
      },
    ])
    process.env.SPEECH_DOC_ALLOWED_HOSTS = 'example.com'

    const { handler } = await import('../admin-speeches-documents-list')
    const event = createEvent({
      httpMethod: 'GET',
      path: '/.netlify/functions/admin-speeches-documents-list',
      rawUrl: 'https://example.com/.netlify/functions/admin-speeches-documents-list',
      headers: createAdminHeaders(),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body || '{}')
    expect(body.ok).toBe(true)
    expect(body.documents).toHaveLength(1)
    expect(body.limits.maxFileSizeBytes).toBe(1024 * 1024)
    expect(body.allowedHosts).toContain('example.com')
  })

  it('returns an empty list when the store is not initialized yet', async () => {
    mockGetAllSpeechDocuments.mockRejectedValueOnce(new Error('404 Not Found'))

    const { handler } = await import('../admin-speeches-documents-list')
    const event = createEvent({
      httpMethod: 'GET',
      path: '/.netlify/functions/admin-speeches-documents-list',
      rawUrl: 'https://example.com/.netlify/functions/admin-speeches-documents-list',
      headers: createAdminHeaders(),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body || '{}')
    expect(body.ok).toBe(true)
    expect(body.documents).toEqual([])
  })

  it('backfills legacy speaker keys when requested', async () => {
    mockBackfillSpeechDocumentSpeakerKeys.mockResolvedValueOnce({
      total: 2,
      backfilled: 1,
      documents: [],
    })

    const { handler } = await import('../admin-speeches-documents-backfill')
    const event = createEvent({
      httpMethod: 'POST',
      path: '/.netlify/functions/admin-speeches-documents-backfill',
      rawUrl: 'https://example.com/.netlify/functions/admin-speeches-documents-backfill',
      headers: createAdminHeaders(),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)
    expect(mockBackfillSpeechDocumentSpeakerKeys).toHaveBeenCalledTimes(1)

    const body = JSON.parse(result.body || '{}')
    expect(body.ok).toBe(true)
    expect(body.total).toBe(2)
    expect(body.backfilled).toBe(1)
  })

  it('deletes known documents and returns 404 for missing entries', async () => {
    const { handler } = await import('../admin-speeches-documents-delete')

    mockGetSpeechDocumentById.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      fileName: 'Speech PDF',
      sourceKind: 'url',
      sourceUrl: 'https://example.com/speech.pdf',
      sourceHost: 'example.com',
      fileSizeBytes: 200000,
      docType: 'pdf',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'admin',
    })

    mockDeleteSpeechDocument.mockResolvedValueOnce(true)
    const successEvent = createEvent({
      path: '/.netlify/functions/admin-speeches-documents-delete',
      rawUrl: 'https://example.com/.netlify/functions/admin-speeches-documents-delete',
      headers: createAdminHeaders(),
      body: JSON.stringify({ id: '11111111-1111-1111-1111-111111111111' }),
    })
    const successResult = assertResponse(await handler(successEvent, mockContext))
    expect(successResult.statusCode).toBe(200)

    mockDeleteSpeechDocument.mockResolvedValueOnce(false)
    mockGetSpeechDocumentById.mockResolvedValueOnce({
      id: '11111111-1111-1111-1111-111111111111',
      fileName: 'Speech PDF',
      sourceKind: 'url',
      sourceUrl: 'https://example.com/speech.pdf',
      sourceHost: 'example.com',
      fileSizeBytes: 200000,
      docType: 'pdf',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'admin',
    })
    const missingEvent = createEvent({
      path: '/.netlify/functions/admin-speeches-documents-delete',
      rawUrl: 'https://example.com/.netlify/functions/admin-speeches-documents-delete',
      headers: createAdminHeaders(),
      body: JSON.stringify({ id: '11111111-1111-1111-1111-111111111111' }),
    })
    const missingResult = assertResponse(await handler(missingEvent, mockContext))
    expect(missingResult.statusCode).toBe(404)
  })

  it('uploads a valid DOCX file', async () => {
    const { handler } = await import('../admin-speeches-documents-upload')
    const event = await createUploadEvent()

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)
    expect(mockSaveSpeechDocumentFile).toHaveBeenCalledTimes(1)
    expect(mockSaveSpeechDocument).toHaveBeenCalledTimes(1)

    const body = JSON.parse(result.body || '{}')
    expect(body.ok).toBe(true)
    expect(body.document.sourceKind).toBe('upload')
    expect(body.document.docType).toBe('docx')
    expect(body.document.translationStatus).toBe('success')
    expect(mockExtractSpeechTextFromDocxBytes).toHaveBeenCalledTimes(1)
    expect(mockTranslateSpeechContentWithGemini).toHaveBeenCalledTimes(1)
  })

  it('saves the document when translation fails', async () => {
    mockTranslateSpeechContentWithGemini.mockResolvedValueOnce({
      status: 'failed',
      error: 'Gemini request failed with HTTP 429',
    })
    mockFetch.mockResolvedValueOnce(
      new Response('', {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-length': '128000',
        },
      })
    )

    const { handler } = await import('../admin-speeches-documents-add')

    const event = createEvent({
      headers: createAdminHeaders(),
      body: JSON.stringify({
        fileName: 'Welcome Speech',
        sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
        speakerKey: 'guy-karin',
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const firstCall = mockSaveSpeechDocument.mock.calls[0]
    expect(firstCall).toBeDefined()
    const savedDocument = firstCall![0]
    expect(savedDocument.translationStatus).toBe('failed')
    expect(savedDocument.translationError).toMatch(/429/)
    expect(savedDocument.speakerKey).toBe('guy-karin')
    expect(savedDocument.sourceText).toBeTruthy()
    expect(savedDocument.translatedText).toBeUndefined()
  })

  it('rejects upload for wrong MIME type', async () => {
    const { handler } = await import('../admin-speeches-documents-upload')
    const event = await createUploadEvent({}, { mimeType: 'text/plain' })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body || '{}').error).toMatch(/docx/i)
    expect(mockSaveSpeechDocumentFile).not.toHaveBeenCalled()
  })

  it('returns uploaded file bytes for authorized admin', async () => {
    const { handler } = await import('../admin-speeches-documents-file')
    const fileBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x10])

    mockGetSpeechDocumentById.mockResolvedValueOnce({
      id: '11111111-1111-1111-1111-111111111111',
      fileName: 'Speech DOCX',
      sourceKind: 'upload',
      storageKey: 'files/11111111-1111-1111-1111-111111111111.docx',
      fileSizeBytes: 5,
      docType: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      originalFileName: 'speech.docx',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'admin',
    })
    mockGetSpeechDocumentFile.mockResolvedValueOnce(fileBytes)

    const result = assertResponse(
      await handler(
        createEvent({
          httpMethod: 'GET',
          headers: createAdminHeaders(),
          queryStringParameters: { id: '11111111-1111-1111-1111-111111111111' },
        }),
        mockContext
      )
    )

    expect(result.statusCode).toBe(200)
    expect(result.isBase64Encoded).toBe(true)
    expect(Buffer.from(result.body || '', 'base64')).toEqual(Buffer.from(fileBytes))
  })

  it('downloads a stored Pages file with the correct fallback extension', async () => {
    const { handler } = await import('../admin-speeches-documents-file')
    const fileBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x10])
    mockGetSpeechDocumentById.mockResolvedValueOnce({
      id: 'gmail-carlos',
      fileName: 'Carlos Speech',
      speakerKey: 'carlos',
      sourceKind: 'gmail',
      sourceSubtype: 'pages',
      storageKey: 'files/gmail-carlos-version.pages',
      fileSizeBytes: 5,
      docType: 'pages',
      mimeType: 'application/vnd.apple.pages',
      createdAt: '2026-08-14T12:00:00.000Z',
      createdBy: 'gmail-import',
    })
    mockGetSpeechDocumentFile.mockResolvedValueOnce(fileBytes)

    const result = assertResponse(await handler(
      createEvent({
        httpMethod: 'GET',
        headers: createAdminHeaders(),
        queryStringParameters: { id: 'gmail-carlos' },
      }),
      mockContext
    ))

    expect(result.statusCode).toBe(200)
    expect(result.headers?.['Content-Type']).toBe('application/vnd.apple.pages')
    expect(result.headers?.['Content-Disposition']).toContain('Carlos%20Speech.pages')
  })

  it('deletes uploaded file payload before deleting metadata', async () => {
    const { handler } = await import('../admin-speeches-documents-delete')

    mockGetSpeechDocumentById.mockResolvedValueOnce({
      id: '11111111-1111-1111-1111-111111111111',
      fileName: 'Speech DOCX',
      sourceKind: 'upload',
      storageKey: 'files/11111111-1111-1111-1111-111111111111.docx',
      fileSizeBytes: 200,
      docType: 'docx',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'admin',
    })
    mockDeleteSpeechDocumentFile.mockResolvedValueOnce(true)
    mockDeleteSpeechDocument.mockResolvedValueOnce(true)

    const result = assertResponse(
      await handler(
        createEvent({
          path: '/.netlify/functions/admin-speeches-documents-delete',
          rawUrl: 'https://example.com/.netlify/functions/admin-speeches-documents-delete',
          headers: createAdminHeaders(),
          body: JSON.stringify({ id: '11111111-1111-1111-1111-111111111111' }),
        }),
        mockContext
      )
    )

    expect(result.statusCode).toBe(200)
    expect(mockDeleteSpeechDocumentFile).toHaveBeenCalledWith(
      'files/11111111-1111-1111-1111-111111111111.docx'
    )
  })
})
