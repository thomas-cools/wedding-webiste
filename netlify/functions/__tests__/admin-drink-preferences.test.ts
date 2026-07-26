/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const mockFetch = jest.fn()
global.fetch = mockFetch

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-drink-preferences',
    rawQuery: '',
    path: '/.netlify/functions/admin-drink-preferences',
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

function makeAdminToken(): string {
  const { createToken } = require('../utils/jwt')
  return createToken('admin', 3600)
}

const MOCK_FORMS = [
  { id: 'form-789', name: 'drink-preferences', submission_count: 2 },
  { id: 'form-456', name: 'contact', submission_count: 1 },
]

function mockNetlifyApi(submissions: unknown[]) {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/submissions')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(submissions) })
    }
    if (url.includes('/forms')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_FORMS) })
    }
    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
  })
}

describe('admin-drink-preferences handler', () => {
  let handler: typeof import('../admin-drink-preferences').handler

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()

    process.env.JWT_SECRET = 'test-jwt-secret'
    process.env.NETLIFY_API_TOKEN = 'test-netlify-token'
    process.env.SITE_ID = 'test-site-id'

    const mod = await import('../admin-drink-preferences')
    handler = mod.handler
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.NETLIFY_API_TOKEN
    delete process.env.SITE_ID
  })

  it('handles CORS preflight', async () => {
    const event = createEvent({ httpMethod: 'OPTIONS' })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(204)
  })

  it('rejects non-GET requests', async () => {
    const event = createEvent({ httpMethod: 'POST' })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(405)
  })

  it('rejects requests without admin JWT', async () => {
    const event = createEvent()
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('returns 500 if env vars missing', async () => {
    delete process.env.NETLIFY_API_TOKEN
    jest.resetModules()
    const mod = await import('../admin-drink-preferences')

    const token = makeAdminToken()
    const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
    const result = assertResponse(await mod.handler(event, mockContext))
    expect(result.statusCode).toBe(500)
  })

  it('returns an empty list when the drink-preferences form has not been detected yet', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/forms')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'x', name: 'rsvp', submission_count: 1 }]) })
      }
      return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
    })

    const token = makeAdminToken()
    const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
    const result = assertResponse(await handler(event, mockContext))
    const body = JSON.parse(result.body!)
    expect(body.ok).toBe(true)
    expect(body.drinkPrefs).toEqual([])
  })

  it('normalizes a submission and passes through favoriteCocktail', async () => {
    mockNetlifyApi([
      {
        id: 'sub-1',
        created_at: '2026-01-01T12:00:00Z',
        data: {
          firstName: 'Alice',
          guestName: 'Alice',
          submissionId: 'batch-1',
          email: 'Alice@Example.com',
          wine: JSON.stringify(['red']),
          beer: JSON.stringify(['no_beer']),
          cocktail: JSON.stringify(['whiskey']),
          favoriteCocktail: 'Old Fashioned',
          nonAlcoholic: JSON.stringify([]),
          comments: 'Excited!',
        },
      },
    ])

    const token = makeAdminToken()
    const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body!)
    expect(body.ok).toBe(true)
    expect(body.drinkPrefs).toHaveLength(1)
    const alice = body.drinkPrefs[0]
    expect(alice.email).toBe('alice@example.com')
    expect(alice.wine).toEqual(['red'])
    expect(alice.favoriteCocktail).toBe('Old Fashioned')
    expect(alice.comments).toBe('Excited!')
  })

  it('falls back to snake_case field names for favoriteCocktail and guestName', async () => {
    mockNetlifyApi([
      {
        id: 'sub-1',
        created_at: '2026-01-01T12:00:00Z',
        data: {
          first_name: 'Bob',
          guest_name: 'Bob',
          email: 'bob@example.com',
          favorite_cocktail: 'Negroni',
        },
      },
    ])

    const token = makeAdminToken()
    const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
    const result = assertResponse(await handler(event, mockContext))
    const body = JSON.parse(result.body!)

    expect(body.drinkPrefs[0].favoriteCocktail).toBe('Negroni')
    expect(body.drinkPrefs[0].guestName).toBe('Bob')
  })

  it('discards submissions with no email', async () => {
    mockNetlifyApi([
      { id: 'sub-1', created_at: '2026-01-01T12:00:00Z', data: { firstName: 'NoEmail' } },
    ])

    const token = makeAdminToken()
    const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
    const result = assertResponse(await handler(event, mockContext))
    const body = JSON.parse(result.body!)
    expect(body.drinkPrefs).toEqual([])
  })

  describe('submission batch dedup', () => {
    it('keeps only the guests from the latest submissionId batch for a household', async () => {
      mockNetlifyApi([
        // Older batch: Alice + Bob submitted together
        {
          id: 'sub-1',
          created_at: '2026-01-01T12:00:00Z',
          data: {
            firstName: 'Alice',
            guestName: 'Alice',
            submissionId: 'batch-1',
            email: 'household@example.com',
            favoriteCocktail: 'Old Fashioned',
          },
        },
        {
          id: 'sub-2',
          created_at: '2026-01-01T12:00:05Z',
          data: {
            firstName: 'Alice',
            guestName: 'Bob',
            submissionId: 'batch-1',
            email: 'household@example.com',
            favoriteCocktail: 'Negroni',
          },
        },
        // Newer batch: only Alice resubmits (e.g. correcting her own answers)
        {
          id: 'sub-3',
          created_at: '2026-01-02T12:00:00Z',
          data: {
            firstName: 'Alice',
            guestName: 'Alice',
            submissionId: 'batch-2',
            email: 'household@example.com',
            favoriteCocktail: 'Espresso Martini',
          },
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      // Only the latest batch (batch-2) survives — Bob's entry from batch-1 is dropped entirely
      expect(body.drinkPrefs).toHaveLength(1)
      expect(body.drinkPrefs[0].guestName).toBe('Alice')
      expect(body.drinkPrefs[0].favoriteCocktail).toBe('Espresso Martini')
    })

    it('keeps all guests sharing the same (latest) submissionId', async () => {
      mockNetlifyApi([
        {
          id: 'sub-1',
          created_at: '2026-01-01T12:00:00Z',
          data: {
            firstName: 'Alice',
            guestName: 'Alice',
            submissionId: 'batch-1',
            email: 'household@example.com',
            favoriteCocktail: 'Old Fashioned',
          },
        },
        {
          id: 'sub-2',
          created_at: '2026-01-01T12:00:05Z',
          data: {
            firstName: 'Alice',
            guestName: 'Bob',
            submissionId: 'batch-1',
            email: 'household@example.com',
            favoriteCocktail: 'Negroni',
          },
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      expect(body.drinkPrefs).toHaveLength(2)
      const names = body.drinkPrefs.map((p: { guestName: string }) => p.guestName).sort()
      expect(names).toEqual(['Alice', 'Bob'])
    })

    it('falls back to per-guestName dedup for legacy entries without a submissionId', async () => {
      mockNetlifyApi([
        {
          id: 'sub-1',
          created_at: '2026-01-01T12:00:00Z',
          data: { firstName: 'Carol', guestName: 'Carol', email: 'carol@example.com', favoriteCocktail: 'Mojito' },
        },
        {
          id: 'sub-2',
          created_at: '2026-01-02T12:00:00Z',
          data: { firstName: 'Carol', guestName: 'Carol', email: 'carol@example.com', favoriteCocktail: 'Margarita' },
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      expect(body.drinkPrefs).toHaveLength(1)
      expect(body.drinkPrefs[0].favoriteCocktail).toBe('Margarita')
    })
  })

  it('handles Netlify API errors gracefully', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve('Forbidden') })

    const token = makeAdminToken()
    const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).ok).toBe(false)
  })
})
