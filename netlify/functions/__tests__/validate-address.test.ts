/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext } from '@netlify/functions'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/validate-address',
    rawQuery: '',
    path: '/.netlify/functions/validate-address',
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-nf-client-connection-ip': '192.0.2.50',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: JSON.stringify({ address: '1600 Amphitheatre Parkway, Mountain View, CA' }),
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext = {} as HandlerContext

describe('validate-address handler', () => {
  let handler: typeof import('../validate-address').handler
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Set up environment
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'
    process.env.RATE_LIMIT_VALIDATE_ADDRESS_MAX = '100'
    process.env.RATE_LIMIT_VALIDATE_ADDRESS_WINDOW_SECONDS = '60'
    
    // Import fresh module
    const mod = await import('../validate-address')
    handler = mod.handler
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    delete process.env.GOOGLE_MAPS_API_KEY
    delete process.env.VITE_GOOGLE_MAPS_API_KEY
    delete process.env.RATE_LIMIT_VALIDATE_ADDRESS_MAX
    delete process.env.RATE_LIMIT_VALIDATE_ADDRESS_WINDOW_SECONDS
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

    it('returns 405 for DELETE requests', async () => {
      const event = createEvent({ httpMethod: 'DELETE' })
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

    it('returns 400 for missing address', async () => {
      const event = createEvent({ body: JSON.stringify({}) })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Missing address')
    })

    it('returns 400 for empty address string', async () => {
      const event = createEvent({ body: JSON.stringify({ address: '' }) })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Missing address')
    })

    it('returns 400 for whitespace-only address', async () => {
      const event = createEvent({ body: JSON.stringify({ address: '   ' }) })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Missing address')
    })
  })

  describe('API key configuration', () => {
    it('returns 500 when no API key is configured', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY
      delete process.env.VITE_GOOGLE_MAPS_API_KEY
      
      jest.resetModules()
      const mod = await import('../validate-address')
      
      const event = createEvent()
      const response = await mod.handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toContain('missing GOOGLE_MAPS_API_KEY')
    })

    it('uses VITE_GOOGLE_MAPS_API_KEY as fallback', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY
      process.env.VITE_GOOGLE_MAPS_API_KEY = 'vite-fallback-key'
      
      jest.resetModules()
      const mod = await import('../validate-address')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: { addressComplete: true },
            address: { formattedAddress: '1600 Amphitheatre Pkwy' },
          },
        }),
      })

      const event = createEvent()
      await mod.handler(event, mockContext)

      expect(mockFetch).toHaveBeenCalled()
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('key=vite-fallback-key')
    })
  })

  describe('successful address validation', () => {
    it('returns validated address with verdict', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: true,
              hasUnconfirmedComponents: false,
              hasInferredComponents: false,
            },
            address: {
              formattedAddress: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
            },
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(200)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(true)
      expect(body.formattedAddress).toBe('1600 Amphitheatre Parkway, Mountain View, CA 94043, USA')
      expect(body.verdict.addressComplete).toBe(true)
    })

    it('returns null for missing formatted address', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: { addressComplete: false },
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(200)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(true)
      expect(body.formattedAddress).toBeNull()
    })

    it('returns null verdict when not present in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            address: { formattedAddress: 'Some Address' },
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      const body = JSON.parse(response!.body || '{}')
      expect(body.verdict).toBeNull()
    })

    it('passes regionCode to Google API when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: { addressComplete: true },
            address: { formattedAddress: 'Test Address' },
          },
        }),
      })

      const event = createEvent({
        body: JSON.stringify({ address: '123 Main St', regionCode: 'US' }),
      })
      await handler(event, mockContext)

      expect(mockFetch).toHaveBeenCalled()
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.address.regionCode).toBe('US')
    })

    it('sends address in addressLines format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: { addressComplete: true },
            address: { formattedAddress: 'Test' },
          },
        }),
      })

      const event = createEvent({
        body: JSON.stringify({ address: '123 Main St, City, State' }),
      })
      await handler(event, mockContext)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.address.addressLines).toEqual(['123 Main St, City, State'])
    })
  })

  describe('Google Address Validation API error handling', () => {
    it('handles HTTP error from Google API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid request',
            status: 'INVALID_ARGUMENT',
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Invalid request')
      expect(body.status).toBe('INVALID_ARGUMENT')
    })

    it('handles 403 Forbidden from Google API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            message: 'API key not authorized',
            status: 'PERMISSION_DENIED',
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(403)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
    })

    it('handles network/fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Connection refused')
    })

    it('handles non-Error exceptions gracefully', async () => {
      mockFetch.mockRejectedValueOnce({ message: 'weird error' })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Unknown error')
    })

    it('handles missing error message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Address validation failed')
    })
  })

  describe('response headers', () => {
    it('includes CORS headers in all responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: { verdict: {}, address: {} },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.headers?.['Access-Control-Allow-Origin']).toBe('*')
      expect(response!.headers?.['Content-Type']).toBe('application/json')
    })
  })

  describe('address verdict scenarios', () => {
    it('handles address with unconfirmed components', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: false,
              hasUnconfirmedComponents: true,
            },
            address: { formattedAddress: 'Partial Address' },
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      const body = JSON.parse(response!.body || '{}')
      expect(body.ok).toBe(true)
      expect(body.verdict.hasUnconfirmedComponents).toBe(true)
    })

    it('handles address with inferred components', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: true,
              hasInferredComponents: true,
            },
            address: { formattedAddress: 'Inferred Address' },
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      const body = JSON.parse(response!.body || '{}')
      expect(body.verdict.hasInferredComponents).toBe(true)
    })

    it('handles address with replaced components', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: true,
              hasReplacedComponents: true,
            },
            address: { formattedAddress: 'Corrected Address' },
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      const body = JSON.parse(response!.body || '{}')
      expect(body.verdict.hasReplacedComponents).toBe(true)
    })

    it('handles address with missing component types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: false,
              missingComponentTypes: ['postal_code', 'street_number'],
            },
            address: { formattedAddress: 'Incomplete Address' },
          },
        }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      const body = JSON.parse(response!.body || '{}')
      expect(body.verdict.missingComponentTypes).toContain('postal_code')
    })
  })
})
