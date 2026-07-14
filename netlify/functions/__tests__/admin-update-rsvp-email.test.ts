/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const mockSaveEmailOverride = jest.fn()
jest.mock('../utils/rsvp-email-overrides', () => ({
  saveEmailOverride: (...args: unknown[]) => mockSaveEmailOverride(...args),
}))

const mockMigrateGuestOverrideKey = jest.fn()
jest.mock('../utils/rsvp-guest-overrides', () => ({
  migrateGuestOverrideKey: (...args: unknown[]) => mockMigrateGuestOverrideKey(...args),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-update-rsvp-email',
    rawQuery: '',
    path: '/.netlify/functions/admin-update-rsvp-email',
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

describe('admin-update-rsvp-email handler', () => {
  let handler: typeof import('../admin-update-rsvp-email').handler

  beforeEach(async () => {
    jest.resetModules()
    mockSaveEmailOverride.mockReset()
    mockMigrateGuestOverrideKey.mockReset()

    process.env.JWT_SECRET = 'test-jwt-secret'

    const mod = await import('../admin-update-rsvp-email')
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
    const event = createEvent({ body: JSON.stringify({ id: 'sub-1', newEmail: 'a@b.com' }) })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('rejects non-admin JWT', async () => {
    const { createToken } = require('../utils/jwt')
    const guestToken = createToken('wedding-guest', 3600)
    const event = createEvent({
      headers: { authorization: `Bearer ${guestToken}` },
      body: JSON.stringify({ id: 'sub-1', newEmail: 'a@b.com' }),
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
      body: JSON.stringify({ newEmail: 'alice@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/id/i)
  })

  it('rejects a missing or invalid newEmail', async () => {
    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'sub-1', newEmail: 'not-an-email' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!).error).toMatch(/email/i)
  })

  it('trims/lowercases the email and saves the override', async () => {
    mockSaveEmailOverride.mockResolvedValue({
      email: 'alice@example.com',
      updatedAt: '2026-01-01T00:00:00.000Z',
      history: [],
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'sub-1', newEmail: '  Alice@Example.com  ' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    expect(mockSaveEmailOverride).toHaveBeenCalledWith('sub-1', 'alice@example.com')

    const body = JSON.parse(result.body!)
    expect(body.ok).toBe(true)
    expect(body.email).toBe('alice@example.com')
    expect(body.updatedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('migrates any existing guest override when oldEmail differs from newEmail', async () => {
    mockSaveEmailOverride.mockResolvedValue({
      email: 'alice@example.com',
      updatedAt: '2026-01-01T00:00:00.000Z',
      history: [],
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'sub-1', oldEmail: 'alcie@example.com', newEmail: 'alice@example.com' }),
    })
    await handler(event, mockContext)

    expect(mockMigrateGuestOverrideKey).toHaveBeenCalledWith('alcie@example.com', 'alice@example.com')
  })

  it('does not attempt a migration when oldEmail matches newEmail', async () => {
    mockSaveEmailOverride.mockResolvedValue({
      email: 'alice@example.com',
      updatedAt: '2026-01-01T00:00:00.000Z',
      history: [],
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'sub-1', oldEmail: 'Alice@Example.com', newEmail: 'alice@example.com' }),
    })
    await handler(event, mockContext)

    expect(mockMigrateGuestOverrideKey).not.toHaveBeenCalled()
  })

  it('returns 500 when saving fails', async () => {
    mockSaveEmailOverride.mockRejectedValue(new Error('blob store unavailable'))

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'sub-1', newEmail: 'alice@example.com' }),
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).ok).toBe(false)
  })
})
