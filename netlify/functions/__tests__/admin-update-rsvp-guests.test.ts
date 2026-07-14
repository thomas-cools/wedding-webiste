/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const mockSaveGuestOverride = jest.fn()
const mockNormalizeOverrideKey = jest.fn((email: string) => email.trim().toLowerCase())

jest.mock('../utils/rsvp-guest-overrides', () => ({
  saveGuestOverride: (...args: unknown[]) => mockSaveGuestOverride(...args),
  normalizeOverrideKey: (...args: [string]) => mockNormalizeOverrideKey(...args),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-update-rsvp-guests',
    rawQuery: '',
    path: '/.netlify/functions/admin-update-rsvp-guests',
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

describe('admin-update-rsvp-guests handler', () => {
  let handler: typeof import('../admin-update-rsvp-guests').handler

  beforeEach(async () => {
    jest.resetModules()
    mockSaveGuestOverride.mockReset()
    mockNormalizeOverrideKey.mockClear()

    process.env.JWT_SECRET = 'test-jwt-secret'

    const mod = await import('../admin-update-rsvp-guests')
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
    const event = createEvent({ body: JSON.stringify({ email: 'a@b.com', guests: [] }) })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('rejects non-admin JWT', async () => {
    const { createToken } = require('../utils/jwt')
    const guestToken = createToken('wedding-guest', 3600)
    const event = createEvent({
      headers: { authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ email: 'a@b.com', guests: [] }),
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

  it('rejects a missing email', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ guests: [] }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/email/i)
  })

  it('rejects a non-array guests field', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: 'alice@example.com', guests: 'not-an-array' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/array/i)
  })

  it('rejects more than 30 guests', async () => {
    const token = makeAdminToken()
    const guests = Array.from({ length: 31 }, (_, i) => ({ name: `Guest ${i}` }))
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: 'alice@example.com', guests }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/30/)
  })

  it('drops blank-name entries and trims whitespace before saving', async () => {
    mockSaveGuestOverride.mockResolvedValue({
      guests: [{ name: 'Bob', age: '5' }],
      updatedAt: '2026-01-01T00:00:00.000Z',
      history: [],
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: '  Alice@Example.com  ',
        guests: [
          { name: '  Bob  ', age: ' 5 ', dietary: '' },
          { name: '   ' },
          { name: 42 },
        ],
      }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    expect(mockSaveGuestOverride).toHaveBeenCalledWith('alice@example.com', [{ name: 'Bob', age: '5' }])

    const body = JSON.parse(result.body!)
    expect(body.ok).toBe(true)
    expect(body.guests).toEqual([{ name: 'Bob', age: '5' }])
    expect(body.updatedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('returns 500 when saving fails', async () => {
    mockSaveGuestOverride.mockRejectedValue(new Error('blob store unavailable'))

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: 'alice@example.com', guests: [{ name: 'Bob' }] }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).ok).toBe(false)
  })
})
