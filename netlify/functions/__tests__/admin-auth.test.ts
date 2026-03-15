/**
 * @jest-environment node
 */

import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'
import { generateTotp, generateSecret } from '../utils/totp'

const mockFetch = jest.fn()
global.fetch = mockFetch

function assertResponse(result: void | HandlerResponse): HandlerResponse {
  expect(result).toBeDefined()
  return result as HandlerResponse
}

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-auth',
    rawQuery: '',
    path: '/.netlify/functions/admin-auth',
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    multiValueHeaders: {},
    queryStringParameters: { action: 'login' },
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext = {} as HandlerContext

describe('admin-auth handler', () => {
  let handler: typeof import('../admin-auth').handler

  beforeEach(async () => {
    jest.resetModules()
    mockFetch.mockReset()

    process.env.ADMIN_PASSWORD_HASH = '7c1d075e6d6278eab2e2b2a44c749e569b95a16eb0714b2c00afaee38b0a4fbe'
    process.env.JWT_SECRET = 'test-jwt-secret'
    delete process.env.ADMIN_TOTP_SECRET

    const mod = await import('../admin-auth')
    handler = mod.handler
  })

  afterEach(() => {
    delete process.env.ADMIN_PASSWORD_HASH
    delete process.env.JWT_SECRET
    delete process.env.ADMIN_TOTP_SECRET
  })

  describe('login action', () => {
    it('rejects non-POST requests', async () => {
      const event = createEvent({ httpMethod: 'GET' })
      const result = assertResponse(await handler(event, mockContext))
      expect(result.statusCode).toBe(405)
    })

    it('rejects invalid action', async () => {
      const event = createEvent({
        queryStringParameters: { action: 'invalid' },
        body: '{}',
      })
      const result = assertResponse(await handler(event, mockContext))
      expect(result.statusCode).toBe(400)
    })

    it('returns 500 if ADMIN_PASSWORD_HASH not configured', async () => {
      delete process.env.ADMIN_PASSWORD_HASH
      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        body: JSON.stringify({ password: 'anything' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(500)
      expect(JSON.parse(result.body!)).toMatchObject({ error: 'Admin authentication not configured' })
    })

    it('rejects wrong password', async () => {
      const event = createEvent({
        body: JSON.stringify({ password: 'wrong-password' }),
      })
      const result = assertResponse(await handler(event, mockContext))
      expect(result.statusCode).toBe(401)
      expect(JSON.parse(result.body!)).toMatchObject({ error: 'Invalid password' })
    })

    it('returns pending token on correct password', async () => {
      // The hash above is for "admin-test-password" (hashed with wedding-site-salt)
      const { hashPassword } = await import('../utils/jwt')
      const hash = hashPassword('admin-test-password')
      process.env.ADMIN_PASSWORD_HASH = hash

      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        body: JSON.stringify({ password: 'admin-test-password' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(200)

      const body = JSON.parse(result.body!)
      expect(body.ok).toBe(true)
      expect(body.requiresMfa).toBe(true)
      expect(body.pendingToken).toBeDefined()
      expect(typeof body.pendingToken).toBe('string')
    })

    it('indicates whether MFA is configured', async () => {
      const { hashPassword } = await import('../utils/jwt')
      process.env.ADMIN_PASSWORD_HASH = hashPassword('testpass')
      process.env.ADMIN_TOTP_SECRET = 'SOME_SECRET'

      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        body: JSON.stringify({ password: 'testpass' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      const body = JSON.parse(result.body!)

      expect(body.mfaConfigured).toBe(true)
    })
  })

  describe('verify-mfa action', () => {
    async function getPendingToken(): Promise<string> {
      const { hashPassword } = await import('../utils/jwt')
      process.env.ADMIN_PASSWORD_HASH = hashPassword('testpass')

      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        body: JSON.stringify({ password: 'testpass' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      return JSON.parse(result.body!).pendingToken
    }

    it('rejects without pending token', async () => {
      const secret = generateSecret()
      process.env.ADMIN_TOTP_SECRET = secret

      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        queryStringParameters: { action: 'verify-mfa' },
        body: JSON.stringify({ code: '123456' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(400)
    })

    it('rejects with invalid pending token', async () => {
      const secret = generateSecret()
      process.env.ADMIN_TOTP_SECRET = secret

      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        queryStringParameters: { action: 'verify-mfa' },
        body: JSON.stringify({ pendingToken: 'invalid-token', code: '123456' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(401)
    })

    it('rejects invalid TOTP code', async () => {
      const secret = generateSecret()
      process.env.ADMIN_TOTP_SECRET = secret
      const pendingToken = await getPendingToken()

      jest.resetModules()
      process.env.ADMIN_TOTP_SECRET = secret
      const mod = await import('../admin-auth')

      const event = createEvent({
        queryStringParameters: { action: 'verify-mfa' },
        body: JSON.stringify({ pendingToken, code: '000000' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(401)
      expect(JSON.parse(result.body!)).toMatchObject({ error: 'Invalid MFA code' })
    })

    it('returns admin token on valid TOTP code', async () => {
      const secret = generateSecret()
      process.env.ADMIN_TOTP_SECRET = secret
      const pendingToken = await getPendingToken()

      jest.resetModules()
      process.env.ADMIN_TOTP_SECRET = secret
      const mod = await import('../admin-auth')

      const validCode = generateTotp(secret)

      const event = createEvent({
        queryStringParameters: { action: 'verify-mfa' },
        body: JSON.stringify({ pendingToken, code: validCode }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(200)

      const body = JSON.parse(result.body!)
      expect(body.ok).toBe(true)
      expect(body.token).toBeDefined()
      expect(body.expiresIn).toBe(8 * 60 * 60)

      // Verify the Set-Cookie header is set
      const cookie = result.headers?.['Set-Cookie'] || result.headers?.['set-cookie']
      expect(cookie).toContain('admin_auth=')
      expect(cookie).toContain('HttpOnly')
    })
  })

  describe('enroll-mfa action', () => {
    async function getPendingToken(): Promise<string> {
      const { hashPassword } = await import('../utils/jwt')
      process.env.ADMIN_PASSWORD_HASH = hashPassword('testpass')

      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        body: JSON.stringify({ password: 'testpass' }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      return JSON.parse(result.body!).pendingToken
    }

    it('rejects without pending token', async () => {
      const event = createEvent({
        queryStringParameters: { action: 'enroll-mfa' },
        body: JSON.stringify({}),
      })
      const result = assertResponse(await handler(event, mockContext))
      expect(result.statusCode).toBe(400)
    })

    it('rejects if MFA already configured', async () => {
      process.env.ADMIN_TOTP_SECRET = 'EXISTING_SECRET'
      const pendingToken = await getPendingToken()

      jest.resetModules()
      process.env.ADMIN_TOTP_SECRET = 'EXISTING_SECRET'
      const mod = await import('../admin-auth')

      const event = createEvent({
        queryStringParameters: { action: 'enroll-mfa' },
        body: JSON.stringify({ pendingToken }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.body!).error).toContain('already configured')
    })

    it('generates secret and URI when no code provided', async () => {
      const pendingToken = await getPendingToken()

      jest.resetModules()
      const mod = await import('../admin-auth')

      const event = createEvent({
        queryStringParameters: { action: 'enroll-mfa' },
        body: JSON.stringify({ pendingToken }),
      })
      const result = assertResponse(await mod.handler(event, mockContext))
      expect(result.statusCode).toBe(200)

      const body = JSON.parse(result.body!)
      expect(body.enrollment).toBe(true)
      expect(body.secret).toMatch(/^[A-Z2-7]+$/)
      expect(body.totpUri).toContain('otpauth://totp/')
    })

    it('verifies enrollment code and returns admin token', async () => {
      const pendingToken = await getPendingToken()

      jest.resetModules()
      delete process.env.ADMIN_TOTP_SECRET
      const mod = await import('../admin-auth')

      // First call: get enrollment secret
      const enrollEvent = createEvent({
        queryStringParameters: { action: 'enroll-mfa' },
        body: JSON.stringify({ pendingToken }),
      })
      const enrollResult = assertResponse(await mod.handler(enrollEvent, mockContext))
      const { secret } = JSON.parse(enrollResult.body!)

      // Generate a valid code for this secret
      const validCode = generateTotp(secret)

      // Second call: verify with code
      const verifyEvent = createEvent({
        queryStringParameters: { action: 'enroll-mfa' },
        body: JSON.stringify({ pendingToken, secret, code: validCode }),
      })
      const verifyResult = assertResponse(await mod.handler(verifyEvent, mockContext))
      expect(verifyResult.statusCode).toBe(200)

      const body = JSON.parse(verifyResult.body!)
      expect(body.verified).toBe(true)
      expect(body.token).toBeDefined()
      expect(body.secret).toBe(secret)
      expect(body.message).toContain('ADMIN_TOTP_SECRET')
    })
  })

  describe('CORS', () => {
    it('handles OPTIONS preflight', async () => {
      const event = createEvent({ httpMethod: 'OPTIONS' })
      const result = assertResponse(await handler(event, mockContext))
      expect(result.statusCode).toBe(204)
      expect(result.headers?.['Access-Control-Allow-Methods']).toContain('POST')
    })
  })
})
