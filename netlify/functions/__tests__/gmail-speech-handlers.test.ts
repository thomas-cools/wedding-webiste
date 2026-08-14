/**
 * @jest-environment node
 */

import type { HandlerContext, HandlerEvent, HandlerResponse } from '@netlify/functions'
import * as jwt from '../utils/jwt'

const mockGetGmailSpeechSyncStatus = jest.fn()
const mockRetryFailedGmailSpeeches = jest.fn()
const mockSyncGmailSpeeches = jest.fn()

jest.mock('../utils/gmail-speeches', () => ({
  getGmailSpeechSyncStatus: (...args: unknown[]) => mockGetGmailSpeechSyncStatus(...args),
  retryFailedGmailSpeeches: (...args: unknown[]) => mockRetryFailedGmailSpeeches(...args),
  syncGmailSpeeches: (...args: unknown[]) => mockSyncGmailSpeeches(...args),
}))

import { handler as adminHandler } from '../admin-speeches-gmail-sync'
import { handler as scheduledHandler } from '../sync-gmail-speeches'

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-speeches-gmail-sync',
    rawQuery: '',
    path: '/.netlify/functions/admin-speeches-gmail-sync',
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

describe('Gmail speech sync handlers', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'test-jwt-secret' }
    jest.clearAllMocks()
    mockGetGmailSpeechSyncStatus.mockResolvedValue({
      processing: 0,
      processed: 2,
      failed: 1,
      failures: [{
        speakerKey: 'carlos',
        errorCode: 'processing_failed',
        error: 'Speech message could not be processed',
        updatedAt: '2026-08-08T12:00:00.000Z',
      }],
    })
    mockRetryFailedGmailSpeeches.mockResolvedValue({
      found: 1,
      processed: 1,
      failed: 0,
      skipped: 0,
    })
    mockSyncGmailSpeeches.mockResolvedValue({
      found: 2,
      processed: 1,
      failed: 1,
      skipped: 0,
    })
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  function adminHeaders(): Record<string, string> {
    return { authorization: `Bearer ${jwt.createToken('admin', 3600)}` }
  }

  it('requires admin authentication and rejects unsupported methods', async () => {
    const unauthorized = assertResponse(await adminHandler(createEvent(), mockContext))
    expect(unauthorized.statusCode).toBe(401)
    expect(mockGetGmailSpeechSyncStatus).not.toHaveBeenCalled()

    const unsupported = assertResponse(await adminHandler(
      createEvent({ httpMethod: 'DELETE', headers: adminHeaders() }),
      mockContext
    ))
    expect(unsupported.statusCode).toBe(405)
  })

  it('returns sanitized status and retries failed imports for an admin', async () => {
    const statusResponse = assertResponse(await adminHandler(
      createEvent({ headers: adminHeaders() }),
      mockContext
    ))
    expect(statusResponse.statusCode).toBe(200)
    expect(JSON.parse(statusResponse.body || '{}')).toMatchObject({
      ok: true,
      requestedBy: 'admin',
      status: { processed: 2, failed: 1 },
    })

    const retryResponse = assertResponse(await adminHandler(
      createEvent({ httpMethod: 'POST', headers: adminHeaders() }),
      mockContext
    ))
    expect(retryResponse.statusCode).toBe(200)
    expect(JSON.parse(retryResponse.body || '{}')).toEqual({
      ok: true,
      sync: { found: 1, processed: 1, failed: 0, skipped: 0 },
      requestedBy: 'admin',
    })
    expect(mockRetryFailedGmailSpeeches).toHaveBeenCalledTimes(1)
  })

  it('runs an on-demand mailbox sync for an admin', async () => {
    const response = assertResponse(await adminHandler(
      createEvent({
        httpMethod: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ action: 'sync' }),
      }),
      mockContext
    ))

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body || '{}')).toEqual({
      ok: true,
      sync: { found: 2, processed: 1, failed: 1, skipped: 0 },
      requestedBy: 'admin',
    })
    expect(mockSyncGmailSpeeches).toHaveBeenCalledTimes(1)
    expect(mockRetryFailedGmailSpeeches).not.toHaveBeenCalled()
  })

  it('rejects invalid sync commands', async () => {
    const invalidJson = assertResponse(await adminHandler(
      createEvent({ httpMethod: 'POST', headers: adminHeaders(), body: '{' }),
      mockContext
    ))
    expect(invalidJson.statusCode).toBe(400)

    const invalidAction = assertResponse(await adminHandler(
      createEvent({
        httpMethod: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ action: 'delete' }),
      }),
      mockContext
    ))
    expect(invalidAction.statusCode).toBe(400)
    expect(mockSyncGmailSpeeches).not.toHaveBeenCalled()
    expect(mockRetryFailedGmailSpeeches).not.toHaveBeenCalled()
  })

  it('returns only aggregate counts from the scheduled function', async () => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined)
    const response = assertResponse(await scheduledHandler(createEvent(), mockContext))

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body || '{}')).toEqual({
      ok: true,
      found: 2,
      processed: 1,
      failed: 1,
      skipped: 0,
    })
  })

  it('does not expose upstream errors from either handler', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mockGetGmailSpeechSyncStatus.mockRejectedValueOnce(new Error('secret upstream detail'))
    const adminResponse = assertResponse(await adminHandler(
      createEvent({ headers: adminHeaders() }),
      mockContext
    ))
    expect(adminResponse.statusCode).toBe(500)
    expect(JSON.parse(adminResponse.body || '{}')).toEqual({
      ok: false,
      error: 'Failed to manage Gmail speech sync',
    })

    mockSyncGmailSpeeches.mockRejectedValueOnce(new Error('secret upstream detail'))
    const scheduledResponse = assertResponse(await scheduledHandler(createEvent(), mockContext))
    expect(scheduledResponse.statusCode).toBe(500)
    expect(JSON.parse(scheduledResponse.body || '{}')).toEqual({
      ok: false,
      error: 'Gmail speech sync failed',
    })
  })
})