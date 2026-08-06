/**
 * @jest-environment node
 */

import type { HandlerContext, HandlerEvent, HandlerResponse } from '@netlify/functions'
import type { SpeechDocument } from '../utils/speech-documents'

const mockGetAllSpeechDocuments = jest.fn<Promise<SpeechDocument[]>, []>()

jest.mock('../utils/speech-documents', () => ({
  getAllSpeechDocuments: () => mockGetAllSpeechDocuments(),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/speeches-documents',
    rawQuery: '',
    path: '/.netlify/functions/speeches-documents',
    httpMethod: 'GET',
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext = {} as HandlerContext

describe('speeches-documents handler', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('returns only translated speeches with assigned speakers', async () => {
    mockGetAllSpeechDocuments.mockResolvedValueOnce([
      {
        id: '11111111-1111-1111-1111-111111111111',
        fileName: 'Assigned Speech',
        speakerKey: 'guy-karin',
        translatedText: 'Hello everyone.',
        translationStatus: 'success',
        createdAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'admin',
        docType: 'google-doc',
        fileSizeBytes: 1024,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        fileName: 'Unassigned Speech',
        translatedText: 'Should be hidden.',
        translationStatus: 'success',
        createdAt: '2026-01-02T00:00:00.000Z',
        createdBy: 'admin',
        docType: 'google-doc',
        fileSizeBytes: 1024,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        fileName: 'Failed Speech',
        speakerKey: 'ellen',
        translationStatus: 'failed',
        createdAt: '2026-01-03T00:00:00.000Z',
        createdBy: 'admin',
        docType: 'google-doc',
        fileSizeBytes: 1024,
      },
    ])

    const { handler } = await import('../speeches-documents')
    const result = assertResponse(await handler(createEvent(), mockContext))

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body || '{}')
    expect(body.ok).toBe(true)
    expect(body.documents).toHaveLength(1)
    expect(body.documents[0].speakerKey).toBe('guy-karin')
    expect(body.documents[0].translatedText).toBe('Hello everyone.')
  })
})
