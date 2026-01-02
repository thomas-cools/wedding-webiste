import { handler } from '../auth'
import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import * as jwt from '../utils/jwt'

// Mock the rate limiter
jest.mock('../utils/rate-limiter', () => ({
  consumeRateLimit: jest.fn(() => ({
    allowed: true,
    limit: 10,
    remaining: 9,
    resetTime: Date.now() + 600000,
  })),
  getClientIp: jest.fn(() => '127.0.0.1'),
  rateLimitHeaders: jest.fn(() => ({
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': '9',
  })),
  rateLimitKey: jest.fn((prefix: string, ip: string) => `${prefix}:${ip}`),
}))

const { consumeRateLimit } = jest.requireMock('../utils/rate-limiter')

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/auth',
    rawQuery: '',
    path: '/.netlify/functions/auth',
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: JSON.stringify({ password: 'testpassword' }),
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext: HandlerContext = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'auth',
  functionVersion: '1',
  invokedFunctionArn: '',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '',
  logStreamName: '',
  getRemainingTimeInMillis: () => 5000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
}

describe('auth function', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    // Set up required environment variables
    process.env.SITE_PASSWORD_HASH = jwt.hashPassword('correctpassword')
    process.env.JWT_SECRET = 'test-jwt-secret'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('CORS', () => {
    it('handles OPTIONS preflight request', async () => {
      const event = createEvent({ httpMethod: 'OPTIONS' })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(204)
      expect(response.headers?.['Access-Control-Allow-Origin']).toBe('*')
      expect(response.headers?.['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
    })
  })

  describe('HTTP method validation', () => {
    it('rejects GET requests', async () => {
      const event = createEvent({ httpMethod: 'GET' })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(405)
      const body = JSON.parse(response.body || '')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Method not allowed')
    })

    it('rejects PUT requests', async () => {
      const event = createEvent({ httpMethod: 'PUT' })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(405)
    })
  })

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      consumeRateLimit.mockReturnValueOnce({
        allowed: false,
        limit: 10,
        remaining: 0,
        resetTime: Date.now() + 600000,
        retryAfterSeconds: 300,
      })

      const event = createEvent()
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(429)
      const body = JSON.parse(response.body || '')
      expect(body.ok).toBe(false)
      expect(body.error).toContain('Too many attempts')
    })
  })

  describe('input validation', () => {
    it('rejects invalid JSON body', async () => {
      const event = createEvent({ body: 'not valid json' })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body || '')
      expect(body.error).toBe('Invalid JSON body')
    })

    it('rejects missing password', async () => {
      const event = createEvent({ body: JSON.stringify({}) })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body || '')
      expect(body.error).toBe('Password is required')
    })

    it('rejects non-string password', async () => {
      const event = createEvent({ body: JSON.stringify({ password: 12345 }) })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body || '')
      expect(body.error).toBe('Password is required')
    })

    it('rejects empty password', async () => {
      const event = createEvent({ body: JSON.stringify({ password: '' }) })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body || '')
      expect(body.error).toBe('Password is required')
    })
  })

  describe('authentication', () => {
    it('returns 401 for incorrect password', async () => {
      const event = createEvent({
        body: JSON.stringify({ password: 'wrongpassword' }),
      })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body || '')
      expect(body.ok).toBe(false)
      expect(body.error).toBe('Invalid password')
      expect(body.token).toBeUndefined()
    })

    it('returns token for correct password', async () => {
      const event = createEvent({
        body: JSON.stringify({ password: 'correctpassword' }),
      })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body || '')
      expect(body.ok).toBe(true)
      expect(body.token).toBeDefined()
      expect(body.expiresIn).toBe(86400)
    })

    it('password comparison is case-insensitive', async () => {
      const event = createEvent({
        body: JSON.stringify({ password: 'CORRECTPASSWORD' }),
      })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body || '')
      expect(body.ok).toBe(true)
    })

    it('sets HttpOnly cookie with token', async () => {
      const event = createEvent({
        body: JSON.stringify({ password: 'correctpassword' }),
      })
      const response = await handler(event, mockContext)

      expect(response.statusCode).toBe(200)
      const setCookie = response.headers?.['Set-Cookie']
      expect(setCookie).toContain('wedding_auth=')
      expect(setCookie).toContain('HttpOnly')
      expect(setCookie).toContain('SameSite=Strict')
    })

    it('returns valid JWT token', async () => {
      const event = createEvent({
        body: JSON.stringify({ password: 'correctpassword' }),
      })
      const response = await handler(event, mockContext)

      const body = JSON.parse(response.body || '')
      expect(body.token).toBeDefined()

      // Verify the token is valid
      const payload = jwt.verifyToken(body.token)
      expect(payload).not.toBeNull()
      expect(payload?.sub).toBe('wedding-guest')
    })
  })

  describe('server configuration', () => {
    it('returns 500 if SITE_PASSWORD_HASH not set', async () => {
      const originalConsoleError = console.error
      console.error = jest.fn()
      delete process.env.SITE_PASSWORD_HASH

      try {
        const event = createEvent({
          body: JSON.stringify({ password: 'anypassword' }),
        })
        const response = await handler(event, mockContext)

        expect(response.statusCode).toBe(500)
        const body = JSON.parse(response.body || '')
        expect(body.error).toBe('Server configuration error')
        expect(console.error).toHaveBeenCalledWith('Auth configuration error:', expect.any(Error))
      } finally {
        console.error = originalConsoleError
      }
    })
  })
})
