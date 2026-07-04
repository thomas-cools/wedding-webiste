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
    rawUrl: 'https://example.com/.netlify/functions/send-final-rsvp-invitations',
    rawQuery: '',
    path: '/.netlify/functions/send-final-rsvp-invitations',
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

describe('send-final-rsvp-invitations', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    mockFetch.mockReset()
    process.env = { ...OLD_ENV, ADMIN_API_KEY: 'test-admin-key', URL: 'https://example.com' }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('generates a per-guest previewUrl that respects each guest\'s stored locale in dry run mode', async () => {
    const { handler } = require('../send-final-rsvp-invitations')

    const event = createEvent({
      headers: { 'x-admin-key': 'test-admin-key' },
      body: JSON.stringify({
        dryRun: true,
        locale: 'en',
        guests: [
          { name: 'Alice', email: 'alice@example.com', partySize: 1, partyNames: [], locale: 'es' },
          { name: 'Bob', email: 'bob@example.com', partySize: 2, partyNames: ['Carol'], locale: 'nl' },
          { name: 'Dave', email: 'dave@example.com', partySize: 1, partyNames: [] }, // no stored locale
        ],
      }),
    })

    const result = assertResponse(await handler(event, mockContext))
    expect(result.statusCode).toBe(200)
    const body = JSON.parse(result.body as string)

    expect(body.confirmedGuests).toHaveLength(3)
    expect(body.confirmedGuests[0].previewUrl).toContain('lang=es')
    expect(body.confirmedGuests[1].previewUrl).toContain('lang=nl')
    // Falls back to the dropdown-selected locale ("en") when the guest has none stored
    expect(body.confirmedGuests[2].previewUrl).toContain('lang=en')

    // No external calls should happen during a dry run with provided guests
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
