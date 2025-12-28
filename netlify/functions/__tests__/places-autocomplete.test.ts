/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext } from '@netlify/functions'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/places-autocomplete',
    rawQuery: '',
    path: '/.netlify/functions/places-autocomplete',
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-nf-client-connection-ip': '192.0.2.1',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: JSON.stringify({ input: '123 Main Street' }),
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext = {} as HandlerContext

describe('places-autocomplete handler', () => {
  let handler: typeof import('../places-autocomplete').handler
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Set up environment
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'
    process.env.RATE_LIMIT_PLACES_AUTOCOMPLETE_MAX = '100'
    process.env.RATE_LIMIT_PLACES_AUTOCOMPLETE_WINDOW_SECONDS = '60'
    
    // Import fresh module
    const mod = await import('../places-autocomplete')
    handler = mod.handler
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    delete process.env.GOOGLE_MAPS_API_KEY
    delete process.env.VITE_GOOGLE_MAPS_API_KEY
    delete process.env.RATE_LIMIT_PLACES_AUTOCOMPLETE_MAX
    delete process.env.RATE_LIMIT_PLACES_AUTOCOMPLETE_WINDOW_SECONDS
  })

  describe('HTTP method handling', () => {
    it('returns 204 for OPTIONS requests (CORS preflight)', async () => {
      const event = createEvent({ httpMethod: 'OPTIONS' })
      const response = await handler(event, mockContext)

      expect(response).toBeDefined()
      expect(response!.statusCode).toBe(204)
      expect(response!.headers?.['Access-Control-Allow-Origin']).toBe('*')
      expect(response!.headers?.['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
    })

    it('returns 405 for GET requests', async () => {
      const event = createEvent({ httpMethod: 'GET' })
      const response = await handler(event, mockContext)

      expect(response).toBeDefined()
      expect(response!.statusCode).toBe(405)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Method not allowed')
    })

    it('returns 405 for PUT requests', async () => {
      const event = createEvent({ httpMethod: 'PUT' })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(405)
    })
  })

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const event = createEvent({ body: 'not-json' })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Invalid JSON body')
    })

    it('returns 400 for empty body', async () => {
      const event = createEvent({ body: '' })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
    })

    it('returns 400 for input shorter than 3 characters', async () => {
      const event = createEvent({ body: JSON.stringify({ input: 'ab' }) })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Input must be at least 3 characters')
    })

    it('returns 400 for input with only whitespace', async () => {
      const event = createEvent({ body: JSON.stringify({ input: '   ' }) })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Input must be at least 3 characters')
    })

    it('trims whitespace from input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', predictions: [] }),
      })

      const event = createEvent({ body: JSON.stringify({ input: '  123 Main  ' }) })
      await handler(event, mockContext)

      expect(mockFetch).toHaveBeenCalled()
      const url = mockFetch.mock.calls[0][0] as string
      // URLSearchParams encodes spaces as +
      expect(url).toContain('input=123+Main')
    })
  })

  describe('API key configuration', () => {
    it('returns 500 when no API key is configured', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY
      delete process.env.VITE_GOOGLE_MAPS_API_KEY
      
      jest.resetModules()
      const mod = await import('../places-autocomplete')
      
      const event = createEvent()
      const response = await mod.handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toContain('missing GOOGLE_MAPS_API_KEY')
    })

    it('falls back to VITE_GOOGLE_MAPS_API_KEY when GOOGLE_MAPS_API_KEY is not set', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY
      process.env.VITE_GOOGLE_MAPS_API_KEY = 'vite-fallback-key'
      
      jest.resetModules()
      const mod = await import('../places-autocomplete')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', predictions: [] }),
      })

      const event = createEvent()
      await mod.handler(event, mockContext)

      expect(mockFetch).toHaveBeenCalled()
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('key=vite-fallback-key')
    })
  })

  describe('successful Google Places API calls', () => {
    it('returns predictions from Google Places API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          predictions: [
            { description: '123 Main St, City, State', place_id: 'place_123' },
            { description: '123 Main Ave, Town, State', place_id: 'place_456' },
          ],
        }),
      })

      const event = createEvent({ body: JSON.stringify({ input: '123 Main' }) })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(200)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(true)
      expect(body.predictions).toHaveLength(2)
      expect(body.predictions[0]).toEqual({
        description: '123 Main St, City, State',
        placeId: 'place_123',
      })
    })

    it('returns empty predictions for ZERO_RESULTS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'ZERO_RESULTS',
          predictions: [],
        }),
      })

      const event = createEvent({ body: JSON.stringify({ input: 'xyznonexistent' }) })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(200)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(true)
      expect(body.predictions).toEqual([])
    })

    it('filters out predictions with missing description or place_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          predictions: [
            { description: '123 Main St', place_id: 'place_123' },
            { description: '', place_id: 'place_456' },
            { description: '789 Oak Ave', place_id: '' },
            { description: 'Valid Address', place_id: 'place_789' },
          ],
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      const body = JSON.parse(response!.body || '{}')
      expect(body.predictions).toHaveLength(2)
      expect(body.predictions.map((p: any) => p.placeId)).toEqual(['place_123', 'place_789'])
    })

    it('passes language parameter to Google API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', predictions: [] }),
      })

      const event = createEvent({
        body: JSON.stringify({ input: '123 Main', language: 'fr' }),
      })
      await handler(event, mockContext)

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('language=fr')
    })

    it('passes country restriction to Google API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', predictions: [] }),
      })

      const event = createEvent({
        body: JSON.stringify({ input: '123 Main', country: 'US' }),
      })
      await handler(event, mockContext)

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('components=country%3AUS')
    })

    it('passes session token to Google API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', predictions: [] }),
      })

      const event = createEvent({
        body: JSON.stringify({ input: '123 Main', sessionToken: 'session_abc123' }),
      })
      await handler(event, mockContext)

      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('sessiontoken=session_abc123')
    })
  })

  describe('Google Places API error handling', () => {
    it('handles INVALID_REQUEST status from Google', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'INVALID_REQUEST',
          error_message: 'The input is invalid',
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('The input is invalid')
      expect(body.status).toBe('INVALID_REQUEST')
    })

    it('handles REQUEST_DENIED status from Google', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'REQUEST_DENIED',
          error_message: 'API key invalid',
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(403)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.status).toBe('REQUEST_DENIED')
    })

    it('handles OVER_QUERY_LIMIT status from Google', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OVER_QUERY_LIMIT',
          error_message: 'Quota exceeded',
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(429)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
    })

    it('handles UNKNOWN_ERROR status from Google', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'UNKNOWN_ERROR',
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(502)
    })

    it('handles HTTP error from Google API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          status: 'UNKNOWN_ERROR',
          error_message: 'Internal server error',
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
    })

    it('handles network/fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'))

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Network timeout')
    })

    it('handles non-Error exceptions gracefully', async () => {
      mockFetch.mockRejectedValueOnce('string error')

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Unknown error')
    })
  })

  describe('response headers', () => {
    it('includes CORS headers in all responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', predictions: [] }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.headers?.['Access-Control-Allow-Origin']).toBe('*')
      expect(response!.headers?.['Content-Type']).toBe('application/json')
    })

    it('includes rate limit headers in responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'OK', predictions: [] }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.headers?.['X-RateLimit-Limit']).toBeDefined()
      expect(response!.headers?.['X-RateLimit-Remaining']).toBeDefined()
      expect(response!.headers?.['X-RateLimit-Reset']).toBeDefined()
    })
  })
})
