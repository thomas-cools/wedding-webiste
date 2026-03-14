/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/send-drink-invitations',
    rawQuery: '',
    path: '/.netlify/functions/send-drink-invitations',
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': 'test-admin-key',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: JSON.stringify({ dryRun: true }),
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext = {} as HandlerContext

// Sample Netlify Forms API responses
const mockForms = [
  { id: 'form-123', name: 'rsvp' },
  { id: 'form-456', name: 'drink-preferences' },
]

const mockSubmissions = [
  {
    data: {
      firstName: 'Alice',
      email: 'alice@example.com',
      likelihood: 'definitely',
    },
  },
  {
    data: {
      firstName: 'Bob',
      email: 'bob@example.com',
      likelihood: 'highly_likely',
    },
  },
  {
    data: {
      firstName: 'Charlie',
      email: 'charlie@example.com',
      likelihood: 'maybe',
    },
  },
  {
    data: {
      firstName: 'Dave',
      email: 'dave@example.com',
      likelihood: 'no',
    },
  },
]

describe('send-drink-invitations handler', () => {
  let handler: typeof import('../send-drink-invitations').handler
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()

    process.env.ADMIN_API_KEY = 'test-admin-key'
    process.env.NETLIFY_API_TOKEN = 'fake-netlify-token'
    process.env.SITE_ID = 'fake-site-id'
    process.env.RESEND_API_KEY = 'fake-resend-key'
    process.env.URL = 'https://our-wedding.netlify.app'

    const mod = await import('../send-drink-invitations')
    handler = mod.handler

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    delete process.env.ADMIN_API_KEY
    delete process.env.NETLIFY_API_TOKEN
    delete process.env.SITE_ID
    delete process.env.RESEND_API_KEY
    delete process.env.URL
  })

  it('rejects non-POST requests', async () => {
    const event = createEvent({ httpMethod: 'GET' })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(405)
  })

  it('rejects requests without admin key', async () => {
    const event = createEvent({
      headers: { 'content-type': 'application/json' },
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('rejects requests with wrong admin key', async () => {
    const event = createEvent({
      headers: { 'content-type': 'application/json', 'x-admin-key': 'wrong-key' },
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('returns 401 if neither admin JWT nor admin key is provided', async () => {
    delete process.env.ADMIN_API_KEY
    jest.resetModules()
    const mod = await import('../send-drink-invitations')

    const event = createEvent({ headers: {} })
    const result = assertResponse(await mod.handler(event, mockContext))
    expect(result.statusCode).toBe(401)
    expect(JSON.parse(result.body!)).toMatchObject({ error: 'Unauthorized' })
  })

  it('returns confirmed guests in dry run mode', async () => {
    // Mock: forms list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockForms,
    })
    // Mock: submissions
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissions,
    })

    const event = createEvent({ body: JSON.stringify({ dryRun: true }) })
    const result = assertResponse(await handler(event, mockContext))

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body!)
    expect(body.dryRun).toBe(true)
    expect(body.totalCount).toBe(2) // Alice (definitely) + Bob (highly_likely)
    expect(body.confirmedGuests).toEqual([
      { name: 'Alice', email: 'alice@example.com', partySize: 1, partyNames: [] },
      { name: 'Bob', email: 'bob@example.com', partySize: 1, partyNames: [] },
    ])
    expect(body.sampleHtml).toContain('Alice')
    expect(body.drinksUrl).toBe('https://our-wedding.netlify.app/drinks')
  })

  it('deduplicates guests by email', async () => {
    const dupeSubmissions = [
      { data: { firstName: 'Alice', email: 'alice@example.com', likelihood: 'definitely' } },
      { data: { firstName: 'Alice Again', email: 'ALICE@example.com', likelihood: 'definitely' } },
    ]

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockForms })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => dupeSubmissions })

    const event = createEvent({ body: JSON.stringify({ dryRun: true }) })
    const result = assertResponse(await handler(event, mockContext))

    const body = JSON.parse(result.body!)
    expect(body.totalCount).toBe(1)
  })

  it('sends emails in live mode', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockForms })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockSubmissions })
    // 2 confirmed guests → 2 Resend calls
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'msg-1' }) })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'msg-2' }) })

    const event = createEvent({ body: JSON.stringify({ dryRun: false }) })
    const result = assertResponse(await handler(event, mockContext))

    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body!)
    expect(body.sent).toBe(2)
    expect(body.failed).toBe(0)

    // Verify Resend was called with correct data
    const resendCalls = mockFetch.mock.calls.filter(
      (call: [string, ...unknown[]]) => call[0] === 'https://api.resend.com/emails'
    )
    expect(resendCalls).toHaveLength(2)
  })

  it('handles partial email failures gracefully', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockForms })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockSubmissions })
    // First email succeeds, second fails
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'msg-1' }) })
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429, text: async () => 'Rate limited' })

    const event = createEvent({ body: JSON.stringify({ dryRun: false }) })
    const result = assertResponse(await handler(event, mockContext))

    const body = JSON.parse(result.body!)
    expect(body.sent).toBe(1)
    expect(body.failed).toBe(1)
  })

  it('returns message when no confirmed guests found', async () => {
    const noConfirmed = [
      { data: { firstName: 'Eve', email: 'eve@example.com', likelihood: 'maybe' } },
    ]

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockForms })
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => noConfirmed })

    const event = createEvent()
    const result = assertResponse(await handler(event, mockContext))

    const body = JSON.parse(result.body!)
    expect(body.sent).toBe(0)
    expect(body.message).toContain('No confirmed guests')
  })

  it('handles Netlify API errors', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'Forbidden' })

    const event = createEvent()
    const result = assertResponse(await handler(event, mockContext))

    expect(result.statusCode).toBe(500)
    const body = JSON.parse(result.body!)
    expect(body.error).toContain('Failed to fetch')
  })

  it('supports locale override', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockForms })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { data: { firstName: 'Ana', email: 'ana@example.com', likelihood: 'definitely' } },
      ],
    })

    const event = createEvent({ body: JSON.stringify({ dryRun: true, locale: 'es' }) })
    const result = assertResponse(await handler(event, mockContext))

    const body = JSON.parse(result.body!)
    expect(body.locale).toBe('es')
    expect(body.sampleHtml).toContain('¡Hola Ana!')
  })
})
