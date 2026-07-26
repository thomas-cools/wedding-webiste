/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const mockDeleteManualParty = jest.fn()

jest.mock('../utils/manual-rsvp-parties', () => ({
  deleteManualParty: (...args: unknown[]) => mockDeleteManualParty(...args),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-delete-manual-party',
    rawQuery: '',
    path: '/.netlify/functions/admin-delete-manual-party',
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

const mockContext = {} as HandlerContext

function makeAdminToken(): string {
  const { createToken } = require('../utils/jwt')
  return createToken('admin', 3600)
}

describe('admin-delete-manual-party handler', () => {
  let handler: typeof import('../admin-delete-manual-party').handler

  beforeEach(async () => {
    jest.resetModules()
    mockDeleteManualParty.mockReset()

    process.env.JWT_SECRET = 'test-jwt-secret'

    const mod = await import('../admin-delete-manual-party')
    handler = mod.handler
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  it('handles CORS preflight', async () => {
    const event = createEvent({ httpMethod: 'OPTIONS' })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(204)
  })

  it('rejects non-POST requests', async () => {
    const event = createEvent({ httpMethod: 'GET' })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(405)
  })

  it('rejects requests without admin JWT', async () => {
    const event = createEvent({ body: JSON.stringify({ id: 'manual-id-1' }) })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('rejects non-admin JWT', async () => {
    const { createToken } = require('../utils/jwt')
    const guestToken = createToken('wedding-guest', 3600)
    const event = createEvent({
      headers: { authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ id: 'manual-id-1' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('rejects invalid JSON bodies', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: '{not json',
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
  })

  it('rejects a missing id', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/id/i)
  })

  it('deletes the party', async () => {
    mockDeleteManualParty.mockResolvedValue(undefined)

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'manual-id-1' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)
    expect(mockDeleteManualParty).toHaveBeenCalledWith('manual-id-1')
    expect(JSON.parse(result.body!).ok).toBe(true)
  })

  it('returns 500 when deletion fails', async () => {
    mockDeleteManualParty.mockRejectedValue(new Error('blob store unavailable'))

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'manual-id-1' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).ok).toBe(false)
  })
})
