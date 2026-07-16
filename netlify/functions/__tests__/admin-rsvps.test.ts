/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockGetAllGuestOverrides = jest.fn()
jest.mock('../utils/rsvp-guest-overrides', () => ({
  getAllGuestOverrides: () => mockGetAllGuestOverrides(),
}))

const mockGetAllEmailOverrides = jest.fn()
jest.mock('../utils/rsvp-email-overrides', () => ({
  getAllEmailOverrides: () => mockGetAllEmailOverrides(),
}))

const mockGetAllManualParties = jest.fn()
jest.mock('../utils/manual-rsvp-parties', () => ({
  getAllManualParties: () => mockGetAllManualParties(),
}))

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-rsvps',
    rawQuery: '',
    path: '/.netlify/functions/admin-rsvps',
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
  // Import createToken inside the function so env vars are set
  const { createToken } = require('../utils/jwt')
  return createToken('admin', 3600)
}

const MOCK_FORMS = [
  { id: 'form-123', name: 'rsvp', submission_count: 3 },
  { id: 'form-456', name: 'contact', submission_count: 1 },
]

const MOCK_SUBMISSIONS = [
  {
    id: 'sub-1',
    created_at: '2024-06-01T12:00:00Z',
    data: {
      firstName: 'Alice',
      email: 'alice@example.com',
      likelihood: 'definitely',
      events: JSON.stringify({ welcome: 'yes', ceremony: 'yes', brunch: 'no' }),
      accommodation: 'venue',
      travelPlan: 'rent_car',
      guests: JSON.stringify([{ name: 'Bob', dietary: 'vegan' }]),
      dietary: 'none',
      franceTips: 'true',
      additionalNotes: 'Excited!',
    },
  },
  {
    id: 'sub-2',
    created_at: '2024-06-02T12:00:00Z',
    data: {
      firstName: 'Charlie',
      email: 'charlie@example.com',
      likelihood: 'maybe',
      events: JSON.stringify({ welcome: 'yes', ceremony: 'no', brunch: '' }),
      accommodation: '',
      travelPlan: '',
      guests: '[]',
      dietary: '',
      franceTips: 'false',
      additionalNotes: '',
    },
  },
  {
    id: 'sub-3',
    created_at: '2024-06-03T12:00:00Z',
    data: {
      firstName: 'Alice',
      email: 'alice@example.com',
      likelihood: 'definitely',
      events: JSON.stringify({ welcome: 'yes', ceremony: 'yes', brunch: 'yes' }),
      accommodation: 'venue',
      travelPlan: 'rent_car',
      guests: JSON.stringify([{ name: 'Bob', dietary: 'none' }, { name: 'Eve', age: '5' }]),
      dietary: 'vegetarian',
      franceTips: 'true',
      additionalNotes: 'Updated!',
    },
  },
]

function mockNetlifyApi() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/submissions')) {
      // Submissions endpoint
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_SUBMISSIONS),
      })
    }
    if (url.includes('/forms')) {
      // Forms list endpoint
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_FORMS),
      })
    }
    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
  })
}

describe('admin-rsvps handler', () => {
  let handler: typeof import('../admin-rsvps').handler

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()
    mockGetAllGuestOverrides.mockReset()
    mockGetAllGuestOverrides.mockResolvedValue(new Map())
    mockGetAllEmailOverrides.mockReset()
    mockGetAllEmailOverrides.mockResolvedValue(new Map())
    mockGetAllManualParties.mockReset()
    mockGetAllManualParties.mockResolvedValue([])

    process.env.JWT_SECRET = 'test-jwt-secret'
    process.env.NETLIFY_API_TOKEN = 'test-netlify-token'
    process.env.SITE_ID = 'test-site-id'

    const mod = await import('../admin-rsvps')
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

  it('rejects non-admin JWT', async () => {
    const { createToken } = require('../utils/jwt')
    const guestToken = createToken('wedding-guest', 3600)
    const event = createEvent({
      headers: { authorization: `Bearer ${guestToken}` },
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(401)
  })

  it('returns 500 if env vars missing', async () => {
    delete process.env.NETLIFY_API_TOKEN
    jest.resetModules()
    const mod = await import('../admin-rsvps')

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
    })
    const result = assertResponse(await mod.handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).error).toBe('Server configuration error')
  })

  it('fetches and normalizes RSVP submissions', async () => {
    mockNetlifyApi()
    const token = makeAdminToken()

    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body!)
    expect(body.ok).toBe(true)
    expect(body.rsvps).toHaveLength(2) // Deduplicated: Alice appears twice, keep latest

    // Alice should be the latest submission (sub-3)
    const alice = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Alice')
    expect(alice).toBeDefined()
    expect(alice.id).toBe('sub-3')
    expect(alice.email).toBe('alice@example.com')
    expect(alice.likelihood).toBe('definitely')
    expect(alice.events).toEqual({ welcome: 'yes', ceremony: 'yes', brunch: 'yes' })
    expect(alice.guests).toEqual([
      { name: 'Bob', dietary: 'none' },
      { name: 'Eve', age: '5' },
    ])
    expect(alice.dietary).toBe('vegetarian')
    expect(alice.franceTips).toBe(true)
    expect(alice.additionalNotes).toBe('Updated!')

    // Charlie
    const charlie = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Charlie')
    expect(charlie).toBeDefined()
    expect(charlie.likelihood).toBe('maybe')
  })

  it('computes correct stats', async () => {
    mockNetlifyApi()
    const token = makeAdminToken()

    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
    })
    const result = assertResponse(await handler(event, mockContext))
    const body = JSON.parse(result.body!)

    expect(body.stats.total).toBe(2)
    expect(body.stats.definitely).toBe(1) // Alice
    expect(body.stats.maybe).toBe(1)     // Charlie
    expect(body.stats.declined).toBe(0)
    // Alice (1 + 2 guests) + Charlie (1 + 0 guests) = 4
    expect(body.stats.totalAttendees).toBe(4)
  })

  it('handles Netlify API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body!).ok).toBe(false)
  })

  it('handles submissions with malformed JSON fields', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/submissions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 'sub-bad',
                created_at: '2024-06-01T12:00:00Z',
                data: {
                  firstName: 'Mallory',
                  email: 'mallory@example.com',
                  likelihood: 'definitely',
                  events: 'not-json',
                  guests: '{broken',
                },
              },
            ]),
        })
      }
      if (url.includes('/forms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_FORMS),
        })
      }
      return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
    })

    const token = makeAdminToken()
    const event = createEvent({
      headers: { authorization: `Bearer ${token}` },
    })
    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body!)
    const mallory = body.rsvps[0]
    // Gracefully falls back to defaults for malformed JSON
    expect(mallory.events).toEqual({ welcome: '', ceremony: '', brunch: '' })
    expect(mallory.guests).toEqual([])
  })

  describe('duplicate person detection', () => {
    function mockDuplicateScenario(
      submissions: Array<{ id: string; created_at: string; data: Record<string, string> }>
    ) {
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

    it('flags a guest who also submitted their own RSVP separately, and excludes them from headcount', async () => {
      mockDuplicateScenario([
        {
          id: 'sub-alice',
          created_at: '2024-06-01T12:00:00Z',
          data: {
            firstName: 'Alice Dupont',
            email: 'alice@example.com',
            likelihood: 'definitely',
            events: JSON.stringify({ welcome: 'yes', ceremony: 'yes', brunch: 'yes' }),
            guests: JSON.stringify([{ name: 'Bob Smith' }]),
          },
        },
        {
          id: 'sub-bob',
          created_at: '2024-06-02T12:00:00Z',
          data: {
            firstName: 'Bob Smith',
            email: 'bob@example.com',
            likelihood: 'definitely',
            events: JSON.stringify({ welcome: 'yes', ceremony: 'yes', brunch: 'no' }),
            guests: '[]',
          },
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      expect(body.rsvps).toHaveLength(2)

      const alice = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Alice Dupont')
      const bob = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Bob Smith')

      expect(alice.guests[0].isDuplicate).toBe(true)
      expect(alice.guests[0].duplicateOfEmail).toBe('bob@example.com')
      expect(bob.matchedAsGuestIn).toEqual(['sub-alice'])

      // Alice (1, since Bob-as-guest is excluded) + Bob (1) = 2, not 3
      expect(body.stats.totalAttendees).toBe(2)
      expect(body.stats.possibleDuplicates).toBe(2)
    })

    it('fuzzy-matches names with minor typos', async () => {
      mockDuplicateScenario([
        {
          id: 'sub-carol',
          created_at: '2024-06-01T12:00:00Z',
          data: {
            firstName: 'Carol',
            email: 'carol@example.com',
            likelihood: 'definitely',
            events: JSON.stringify({ welcome: 'yes', ceremony: 'yes', brunch: 'yes' }),
            // Typo: "Smyth" vs "Smith" (edit distance 1)
            guests: JSON.stringify([{ name: 'Dave Smyth' }]),
          },
        },
        {
          id: 'sub-dave',
          created_at: '2024-06-02T12:00:00Z',
          data: {
            firstName: 'Dave Smith',
            email: 'dave@example.com',
            likelihood: 'definitely',
            events: JSON.stringify({ welcome: 'yes', ceremony: 'yes', brunch: 'yes' }),
            guests: '[]',
          },
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      const carol = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Carol')
      expect(carol.guests[0].isDuplicate).toBe(true)
      expect(carol.guests[0].duplicateOfEmail).toBe('dave@example.com')
    })

    it('does not flag unrelated guests, and computes per-event headcounts', async () => {
      mockDuplicateScenario([
        {
          id: 'sub-erin',
          created_at: '2024-06-01T12:00:00Z',
          data: {
            firstName: 'Erin',
            email: 'erin@example.com',
            likelihood: 'definitely',
            events: JSON.stringify({ welcome: 'yes', ceremony: 'yes', brunch: 'no' }),
            guests: JSON.stringify([{ name: 'Frank' }]),
          },
        },
        {
          id: 'sub-grace',
          created_at: '2024-06-02T12:00:00Z',
          data: {
            firstName: 'Grace',
            email: 'grace@example.com',
            likelihood: 'maybe',
            events: JSON.stringify({ welcome: 'no', ceremony: 'yes', brunch: 'yes' }),
            guests: '[]',
          },
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      const erin = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Erin')
      expect(erin.guests[0].isDuplicate).toBeFalsy()
      expect(body.stats.possibleDuplicates).toBe(0)

      // Erin's party (2 people) attends welcome + ceremony; Grace (1 person) attends ceremony + brunch
      expect(body.stats.attendingWelcome).toBe(2)
      expect(body.stats.attendingCeremony).toBe(3)
      expect(body.stats.attendingBrunch).toBe(1)
    })
  })

  describe('guest overrides merge', () => {
    it('fully replaces guests and stamps guestsManuallyEditedAt when an override exists', async () => {
      mockNetlifyApi()
      mockGetAllGuestOverrides.mockResolvedValue(
        new Map([
          [
            'alice@example.com',
            {
              guests: [{ name: 'Newly Added 1' }, { name: 'Newly Added 2' }],
              updatedAt: '2026-02-01T00:00:00.000Z',
              history: [],
            },
          ],
        ])
      )

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      const alice = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Alice')
      expect(alice.guests).toEqual([{ name: 'Newly Added 1' }, { name: 'Newly Added 2' }])
      expect(alice.guestsManuallyEditedAt).toBe('2026-02-01T00:00:00.000Z')

      // Party size stats reflect the overridden guest list (1 primary + 2 added = 3)
      expect(body.stats.totalAttendees).toBe(3 + 1) // Alice's 3 + Charlie's 1

      // Parties without an override are untouched
      const charlie = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Charlie')
      expect(charlie.guestsManuallyEditedAt).toBeUndefined()
    })

    it('runs duplicate-detection against the post-override guest list', async () => {
      mockNetlifyApi()
      // Override Alice's guests to include a name matching Charlie's first name,
      // which should now be flagged as a possible duplicate.
      mockGetAllGuestOverrides.mockResolvedValue(
        new Map([
          [
            'alice@example.com',
            {
              guests: [{ name: 'Charlie' }],
              updatedAt: '2026-02-01T00:00:00.000Z',
              history: [],
            },
          ],
        ])
      )

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      const alice = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Alice')
      expect(alice.guests[0].isDuplicate).toBe(true)
      expect(alice.guests[0].duplicateOfEmail).toBe('charlie@example.com')
    })
  })

  describe('email overrides merge', () => {
    it('applies an email correction before dedup, keyed by the stable submission id', async () => {
      mockNetlifyApi()
      mockGetAllEmailOverrides.mockResolvedValue(
        new Map([
          ['sub-3', { email: 'alice-fixed@example.com', updatedAt: '2026-03-01T00:00:00.000Z', history: [] }],
        ])
      )

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      const corrected = body.rsvps.find((r: { email: string }) => r.email === 'alice-fixed@example.com')
      expect(corrected).toBeDefined()
      expect(corrected.firstName).toBe('Alice')
      expect(corrected.emailCorrectedAt).toBe('2026-03-01T00:00:00.000Z')

      // sub-1 (the other, un-corrected Alice submission) still dedupes under
      // the original email since only sub-3 was corrected.
      const original = body.rsvps.find((r: { email: string }) => r.email === 'alice@example.com')
      expect(original).toBeDefined()
      expect(original.firstName).toBe('Alice')
      expect(original.emailCorrectedAt).toBeUndefined()
    })

    it('continues without email overrides if the Blobs lookup fails', async () => {
      mockNetlifyApi()
      mockGetAllEmailOverrides.mockRejectedValue(new Error('blob store unavailable'))

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))

      expect(result.statusCode).toBe(200)
      const body = JSON.parse(result.body!)
      expect(body.rsvps.length).toBeGreaterThan(0)
    })
  })

  describe('manual parties merge', () => {
    it('surfaces a manually-added party as a confirmed ("definitely") row', async () => {
      mockNetlifyApi()
      mockGetAllManualParties.mockResolvedValue([
        {
          id: 'manual-id-1',
          firstName: 'Dana',
          email: 'dana@example.com',
          guests: [{ name: 'Extra Guest' }],
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      const dana = body.rsvps.find((r: { firstName: string }) => r.firstName === 'Dana')
      expect(dana).toBeDefined()
      expect(dana.id).toBe('manual:manual-id-1')
      expect(dana.email).toBe('dana@example.com')
      expect(dana.likelihood).toBe('definitely')
      expect(dana.guests).toEqual([{ name: 'Extra Guest' }])
      expect(dana.isManuallyAdded).toBe(true)

      // Included in confirmed-guest stats
      expect(body.stats.definitely).toBeGreaterThanOrEqual(1)
    })

    it('lets a real submission with the same email win over a manual stub', async () => {
      mockNetlifyApi()
      mockGetAllManualParties.mockResolvedValue([
        {
          id: 'manual-id-2',
          firstName: 'Manual Alice',
          email: 'alice@example.com', // collides with a real submission
          guests: [],
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ])

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))
      const body = JSON.parse(result.body!)

      const alice = body.rsvps.find((r: { email: string }) => r.email === 'alice@example.com')
      expect(alice.firstName).toBe('Alice') // real submission's name, not "Manual Alice"
      expect(alice.isManuallyAdded).toBeUndefined()
      expect(body.rsvps.filter((r: { email: string }) => r.email === 'alice@example.com')).toHaveLength(1)
    })

    it('continues without manual parties if the Blobs lookup fails', async () => {
      mockNetlifyApi()
      mockGetAllManualParties.mockRejectedValue(new Error('blob store unavailable'))

      const token = makeAdminToken()
      const event = createEvent({ headers: { authorization: `Bearer ${token}` } })
      const result = assertResponse(await handler(event, mockContext))

      expect(result.statusCode).toBe(200)
      const body = JSON.parse(result.body!)
      expect(body.rsvps.length).toBeGreaterThan(0)
    })
  })
})
