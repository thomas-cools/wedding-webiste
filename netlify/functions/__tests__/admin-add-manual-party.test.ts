/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const mockCreateManualParty = jest.fn()

jest.mock('../utils/manual-rsvp-parties', () => ({
  createManualParty: (...args: unknown[]) => mockCreateManualParty(...args),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-add-manual-party',
    rawQuery: '',
    path: '/.netlify/functions/admin-add-manual-party',
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

describe('admin-add-manual-party handler', () => {
  let handler: typeof import('../admin-add-manual-party').handler

  beforeEach(async () => {
    jest.resetModules()
    mockCreateManualParty.mockReset()

    process.env.JWT_SECRET = 'test-jwt-secret'

    const mod = await import('../admin-add-manual-party')
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
    const event = createEvent({ body: JSON.stringify({ firstName: 'Dana', email: 'dana@example.com' }) })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('rejects non-admin JWT', async () => {
    const { createToken } = require('../utils/jwt')
    const guestToken = createToken('wedding-guest', 3600)
    const event = createEvent({
      headers: { authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ firstName: 'Dana', email: 'dana@example.com' }),
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

  it('rejects a missing firstName', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: 'dana@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/firstName/i)
  })

  it('rejects an invalid email', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: 'Dana', email: 'not-an-email' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/email/i)
  })

  it('rejects a non-array guests field', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: 'Dana', email: 'dana@example.com', guests: 'not-an-array' }),
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
      body: JSON.stringify({ firstName: 'Dana', email: 'dana@example.com', guests }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/30/)
  })

  it('trims fields, drops blank guest names, and creates the party', async () => {
    mockCreateManualParty.mockResolvedValue({
      id: 'manual-id-1',
      firstName: 'Dana',
      email: 'dana@example.com',
      guests: [{ name: 'Extra Guest' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: '  Dana  ',
        email: '  Dana@Example.com  ',
        guests: [{ name: '  Extra Guest  ' }, { name: '   ' }, { name: 42 }],
      }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    expect(mockCreateManualParty).toHaveBeenCalledWith('Dana', 'dana@example.com', [{ name: 'Extra Guest' }])

    const body = JSON.parse(result.body!)
    expect(body.ok).toBe(true)
    expect(body.party.id).toBe('manual-id-1')
  })

  it('returns 500 when saving fails', async () => {
    mockCreateManualParty.mockRejectedValue(new Error('blob store unavailable'))

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: 'Dana', email: 'dana@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).ok).toBe(false)
  })
})
