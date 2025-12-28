/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext } from '@netlify/functions'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/send-rsvp-confirmation',
    rawQuery: '',
    path: '/.netlify/functions/send-rsvp-confirmation',
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-nf-client-connection-ip': '192.0.2.100',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: JSON.stringify({
      firstName: 'John',
      email: 'john@example.com',
      mailingAddress: '123 Main St, City, Country',
      likelihood: 'definitely',
      events: { welcome: 'yes', ceremony: 'yes', brunch: 'yes' },
      accommodation: 'venue',
      travelPlan: 'rent_car',
      guests: [{ name: 'Jane Doe', dietary: 'vegetarian' }],
      dietary: 'No nuts',
      franceTips: true,
      additionalNotes: 'Looking forward to it!',
      locale: 'en',
    }),
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext = {} as HandlerContext

describe('send-rsvp-confirmation handler', () => {
  let handler: typeof import('../send-rsvp-confirmation').handler
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Set up environment
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.FROM_EMAIL = 'wedding@example.com'
    process.env.RATE_LIMIT_RSVP_CONFIRM_MAX = '100'
    process.env.RATE_LIMIT_RSVP_CONFIRM_WINDOW_SECONDS = '60'
    
    // Import fresh module
    const mod = await import('../send-rsvp-confirmation')
    handler = mod.handler
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    delete process.env.RESEND_API_KEY
    delete process.env.FROM_EMAIL
    delete process.env.NETLIFY_DEV
    delete process.env.RATE_LIMIT_RSVP_CONFIRM_MAX
    delete process.env.RATE_LIMIT_RSVP_CONFIRM_WINDOW_SECONDS
  })

  describe('HTTP method handling', () => {
    it('returns 405 for GET requests', async () => {
      const event = createEvent({ httpMethod: 'GET' })
      const response = await handler(event, mockContext)

      expect(response).toBeDefined()
      expect(response!.statusCode).toBe(405)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Method not allowed')
    })

    it('returns 405 for PUT requests', async () => {
      const event = createEvent({ httpMethod: 'PUT' })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(405)
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
      expect(body.error).toBe('Invalid JSON body')
    })

    it('returns 400 for missing email', async () => {
      const event = createEvent({
        body: JSON.stringify({ firstName: 'John' }),
      })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Missing required fields: email and firstName')
    })

    it('returns 400 for missing firstName', async () => {
      const event = createEvent({
        body: JSON.stringify({ email: 'john@example.com' }),
      })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Missing required fields: email and firstName')
    })

    it('returns 400 for empty body', async () => {
      const event = createEvent({ body: '{}' })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
    })
  })

  describe('API key configuration', () => {
    it('returns 500 when RESEND_API_KEY is not set', async () => {
      delete process.env.RESEND_API_KEY
      
      jest.resetModules()
      const mod = await import('../send-rsvp-confirmation')
      
      const event = createEvent()
      const response = await mod.handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Email service not configured')
    })
  })

  describe('successful email sending', () => {
    it('sends email with correct data and returns success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123456' }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(200)
      const body = JSON.parse(response!.body || '{}')
      expect(body.success).toBe(true)
      expect(body.messageId).toBe('msg_123456')
    })

    it('calls Resend API with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      await handler(createEvent(), mockContext)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-resend-key',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('uses FROM_EMAIL environment variable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      await handler(createEvent(), mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.from).toBe('wedding@example.com')
    })

    it('uses default from email when FROM_EMAIL not set', async () => {
      delete process.env.FROM_EMAIL
      jest.resetModules()
      const mod = await import('../send-rsvp-confirmation')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      await mod.handler(createEvent(), mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.from).toBe('Wedding RSVP <onboarding@resend.dev>')
    })

    it('sends to correct recipient email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'Jane',
          email: 'jane@test.com',
          likelihood: 'maybe',
          guests: [],
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.to).toEqual(['jane@test.com'])
    })

    it('includes HTML and plain text versions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      await handler(createEvent(), mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.html).toBeDefined()
      expect(callBody.text).toBeDefined()
      expect(callBody.html).toContain('<!DOCTYPE html>')
      expect(callBody.text).toContain('Carolina & Thomas')
    })
  })

  describe('Resend API error handling', () => {
    it('handles Resend API error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid email address' }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(400)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Failed to send email')
      expect(body.details).toBeDefined()
    })

    it('handles Resend API 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(401)
    })

    it('handles Resend API 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Too many requests' }),
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(429)
    })

    it('handles network/fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(500)
      const body = JSON.parse(response!.body || '{}')
      expect(body.error).toBe('Failed to send email')
    })
  })

  describe('localization', () => {
    it('uses English strings by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'definitely',
          guests: [],
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.subject).toContain('RSVP Confirmation')
      expect(callBody.html).toContain('Thank you for your RSVP')
    })

    it('uses French strings when locale is fr', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'Jean',
          email: 'jean@example.com',
          likelihood: 'definitely',
          guests: [],
          locale: 'fr',
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.subject).toContain('Confirmation RSVP')
      expect(callBody.html).toContain('Merci pour votre RSVP')
    })

    it('uses Spanish strings when locale is es', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'Juan',
          email: 'juan@example.com',
          likelihood: 'definitely',
          guests: [],
          locale: 'es',
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.subject).toContain('Confirmación de RSVP')
      expect(callBody.html).toContain('Gracias por tu RSVP')
    })

    it('uses Dutch strings when locale is nl', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'Jan',
          email: 'jan@example.com',
          likelihood: 'definitely',
          guests: [],
          locale: 'nl',
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.subject).toContain('RSVP-bevestiging')
      expect(callBody.html).toContain('Bedankt voor je RSVP')
    })

    it('normalizes locale with region code (en-US becomes en)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'definitely',
          guests: [],
          locale: 'en-US',
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.subject).toContain('RSVP Confirmation')
    })

    it('falls back to English for unsupported locales', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'User',
          email: 'user@example.com',
          likelihood: 'definitely',
          guests: [],
          locale: 'de', // German not supported
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.subject).toContain('RSVP Confirmation')
    })
  })

  describe('email content generation', () => {
    it('includes all RSVP data in email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          mailingAddress: '123 Test Street',
          likelihood: 'definitely',
          events: { welcome: 'yes', ceremony: 'arriving_late', brunch: 'no' },
          accommodation: 'venue',
          travelPlan: 'rent_car',
          guests: [{ name: 'Jane', dietary: 'vegan' }],
          dietary: 'No shellfish',
          franceTips: true,
          additionalNotes: 'Special request',
          locale: 'en',
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      
      // Check HTML content
      expect(callBody.html).toContain('John')
      expect(callBody.html).toContain('123 Test Street')
      expect(callBody.html).toContain('Jane')
      expect(callBody.html).toContain('vegan')
      expect(callBody.html).toContain('No shellfish')
      expect(callBody.html).toContain('Special request')
      
      // Check plain text content
      expect(callBody.text).toContain('John')
      expect(callBody.text).toContain('123 Test Street')
      expect(callBody.text).toContain('Jane')
    })

    it('escapes HTML in user input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: '<script>alert("xss")</script>',
          email: 'test@example.com',
          likelihood: 'maybe',
          guests: [],
          additionalNotes: '<img src=x onerror=alert(1)>',
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // Script tags are escaped
      expect(callBody.html).not.toContain('<script>')
      expect(callBody.html).toContain('&lt;script&gt;')
      // Image tag is escaped (< and > become entities)
      expect(callBody.html).not.toContain('<img')
      expect(callBody.html).toContain('&lt;img')
    })

    it('handles empty guests array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'maybe',
          guests: [],
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.html).toContain('No additional guests')
    })

    it('handles missing optional fields gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'no',
          guests: [],
          // No mailingAddress, events, accommodation, etc.
        }),
      })
      const response = await handler(event, mockContext)

      expect(response!.statusCode).toBe(200)
    })

    it('displays France tips as Yes/No correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'definitely',
          guests: [],
          franceTips: false,
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.html).toContain('France Tips')
      expect(callBody.html).toContain('No')
    })
  })

  describe('preview mode', () => {
    it('returns preview data in dev mode with preview param', async () => {
      process.env.NETLIFY_DEV = 'true'
      jest.resetModules()
      const mod = await import('../send-rsvp-confirmation')

      const event = createEvent({
        queryStringParameters: { preview: '1' },
      })
      const response = await mod.handler(event, mockContext)

      expect(response!.statusCode).toBe(200)
      const body = JSON.parse(response!.body || '{}')
      expect(body.preview).toBe(true)
      expect(body.html).toBeDefined()
      expect(body.text).toBeDefined()
      expect(body.subject).toBeDefined()
      expect(body.localeNormalized).toBe('en')
      
      // Should not call Resend API
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does not enable preview mode without NETLIFY_DEV', async () => {
      delete process.env.NETLIFY_DEV
      jest.resetModules()
      const mod = await import('../send-rsvp-confirmation')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        queryStringParameters: { preview: '1' },
      })
      await mod.handler(event, mockContext)

      // Should still call Resend API
      expect(mockFetch).toHaveBeenCalled()
    })

    it('shows correct locale info in preview', async () => {
      process.env.NETLIFY_DEV = 'true'
      jest.resetModules()
      const mod = await import('../send-rsvp-confirmation')

      const event = createEvent({
        queryStringParameters: { preview: '1' },
        body: JSON.stringify({
          firstName: 'Jean',
          email: 'jean@example.com',
          likelihood: 'definitely',
          guests: [],
          locale: 'fr-FR',
        }),
      })
      const response = await mod.handler(event, mockContext)

      const body = JSON.parse(response!.body || '{}')
      expect(body.localeRequested).toBe('fr-FR')
      expect(body.localeNormalized).toBe('fr')
    })
  })

  describe('likelihood translations', () => {
    it('translates definitely likelihood correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'definitely',
          guests: [],
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // Apostrophe is HTML-escaped as &#39;
      expect(callBody.html).toContain("We&#39;ll definitely be there!")
    })

    it('translates highly_likely likelihood correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'highly_likely',
          guests: [],
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.html).toContain("highly likely to attend")
    })

    it('translates maybe likelihood correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'maybe',
          guests: [],
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.html).toContain("not sure yet")
    })

    it('translates no likelihood correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'msg_123' }),
      })

      const event = createEvent({
        body: JSON.stringify({
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'no',
          guests: [],
        }),
      })
      await handler(event, mockContext)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // Apostrophe is HTML-escaped as &#39;
      expect(callBody.html).toContain("can&#39;t make it")
    })
  })
})
