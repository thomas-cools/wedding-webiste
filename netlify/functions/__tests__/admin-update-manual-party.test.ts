/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const mockUpdateManualParty = jest.fn()

jest.mock('../utils/manual-rsvp-parties', () => ({
  updateManualParty: (...args: unknown[]) => mockUpdateManualParty(...args),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-update-manual-party',
    rawQuery: '',
    path: '/.netlify/functions/admin-update-manual-party',
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

describe('admin-update-manual-party handler', () => {
  let handler: typeof import('../admin-update-manual-party').handler

  beforeEach(async () => {
    jest.resetModules()
    mockUpdateManualParty.mockReset()

    process.env.JWT_SECRET = 'test-jwt-secret'

    const mod = await import('../admin-update-manual-party')
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
    const event = createEvent({
      body: JSON.stringify({ id: 'manual-id-1', firstName: 'Dana', email: 'dana@example.com' }),
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
      body: JSON.stringify({ firstName: 'Dana', email: 'dana@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/id/i)
  })

  it('rejects a missing firstName', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'manual-id-1', email: 'dana@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/firstName/i)
  })

  it('rejects an invalid email', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'manual-id-1', firstName: 'Dana', email: 'not-an-email' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/email/i)
  })

  it('returns 404 when the party does not exist', async () => {
    mockUpdateManualParty.mockResolvedValue(null)

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'missing-id', firstName: 'Dana', email: 'dana@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(404)
  })

  it('trims fields and updates the party', async () => {
    mockUpdateManualParty.mockResolvedValue({
      id: 'manual-id-1',
      firstName: 'Dana',
      email: 'dana@example.com',
      guests: [{ name: 'Extra Guest' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id: 'manual-id-1',
        firstName: '  Dana  ',
        email: '  Dana@Example.com  ',
        guests: [{ name: '  Extra Guest  ' }, { name: '   ' }],
      }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    expect(mockUpdateManualParty).toHaveBeenCalledWith('manual-id-1', 'Dana', 'dana@example.com', [
      { name: 'Extra Guest' },
    ])

    const body = JSON.parse(result.body!)
    expect(body.ok).toBe(true)
    expect(body.party.updatedAt).toBe('2026-01-02T00:00:00.000Z')
  })

  it('returns 500 when saving fails', async () => {
    mockUpdateManualParty.mockRejectedValue(new Error('blob store unavailable'))

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'manual-id-1', firstName: 'Dana', email: 'dana@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).ok).toBe(false)
  })
})
