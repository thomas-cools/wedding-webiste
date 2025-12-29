import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  extractToken,
  verifyRequest,
  getPasswordHash,
} from '../jwt'

describe('JWT utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    // Set required env vars for tests
    process.env.SITE_PASSWORD_HASH = 'abc123def456'
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('hashPassword', () => {
    it('produces consistent hashes for same input', () => {
      const hash1 = hashPassword('testpassword')
      const hash2 = hashPassword('testpassword')
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different inputs', () => {
      const hash1 = hashPassword('password1')
      const hash2 = hashPassword('password2')
      expect(hash1).not.toBe(hash2)
    })

    it('is case-insensitive', () => {
      const hash1 = hashPassword('TestPassword')
      const hash2 = hashPassword('testpassword')
      expect(hash1).toBe(hash2)
    })

    it('returns hex string of correct length', () => {
      const hash = hashPassword('anypassword')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })
  })

  describe('verifyPassword', () => {
    it('returns true for matching password', () => {
      const password = 'mysecretpassword'
      const hash = hashPassword(password)
      expect(verifyPassword(password, hash)).toBe(true)
    })

    it('returns false for non-matching password', () => {
      const hash = hashPassword('correctpassword')
      expect(verifyPassword('wrongpassword', hash)).toBe(false)
    })

    it('handles case-insensitive comparison', () => {
      const hash = hashPassword('MyPassword')
      expect(verifyPassword('mypassword', hash)).toBe(true)
      expect(verifyPassword('MYPASSWORD', hash)).toBe(true)
    })

    it('handles hash case-insensitively', () => {
      const password = 'testpass'
      const hash = hashPassword(password)
      expect(verifyPassword(password, hash.toUpperCase())).toBe(true)
    })
  })

  describe('getPasswordHash', () => {
    it('returns hash from environment', () => {
      process.env.SITE_PASSWORD_HASH = 'envhash123'
      expect(getPasswordHash()).toBe('envhash123')
    })

    it('throws if SITE_PASSWORD_HASH not set', () => {
      delete process.env.SITE_PASSWORD_HASH
      expect(() => getPasswordHash()).toThrow('SITE_PASSWORD_HASH environment variable is required')
    })

    it('returns lowercase hash', () => {
      process.env.SITE_PASSWORD_HASH = 'ABC123DEF'
      expect(getPasswordHash()).toBe('abc123def')
    })
  })

  describe('createToken', () => {
    it('creates valid JWT format', () => {
      const token = createToken()
      const parts = token.split('.')
      expect(parts).toHaveLength(3)
    })

    it('includes subject in payload', () => {
      const token = createToken('test-subject')
      const [, payloadB64] = token.split('.')
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
      expect(payload.sub).toBe('test-subject')
    })

    it('includes expiration timestamp', () => {
      const token = createToken()
      const [, payloadB64] = token.split('.')
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000)
    })

    it('defaults subject to wedding-guest', () => {
      const token = createToken()
      const [, payloadB64] = token.split('.')
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
      expect(payload.sub).toBe('wedding-guest')
    })
  })

  describe('verifyToken', () => {
    it('verifies valid token', () => {
      const token = createToken('test-user')
      const payload = verifyToken(token)
      expect(payload).not.toBeNull()
      expect(payload?.sub).toBe('test-user')
    })

    it('returns null for invalid signature', () => {
      const token = createToken()
      const tamperedToken = token.slice(0, -5) + 'xxxxx'
      expect(verifyToken(tamperedToken)).toBeNull()
    })

    it('returns null for expired token', () => {
      // Create a token that's already expired
      const now = Math.floor(Date.now() / 1000)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      const payload = Buffer.from(
        JSON.stringify({ sub: 'test', iat: now - 1000, exp: now - 100 })
      ).toString('base64')
      const fakeToken = `${header}.${payload}.fakesignature`
      expect(verifyToken(fakeToken)).toBeNull()
    })

    it('returns null for malformed token', () => {
      expect(verifyToken('not.a.valid.token')).toBeNull()
      expect(verifyToken('invalid')).toBeNull()
      expect(verifyToken('')).toBeNull()
    })

    it('returns null for token signed with different secret', () => {
      const token = createToken()
      process.env.JWT_SECRET = 'different-secret'
      expect(verifyToken(token)).toBeNull()
    })
  })

  describe('extractToken', () => {
    it('extracts from Authorization Bearer header', () => {
      const headers = { authorization: 'Bearer mytoken123' }
      expect(extractToken(headers)).toBe('mytoken123')
    })

    it('extracts from Authorization header (capitalized)', () => {
      const headers = { Authorization: 'Bearer mytoken456' }
      expect(extractToken(headers)).toBe('mytoken456')
    })

    it('extracts from cookie', () => {
      const headers = { cookie: 'other=value; wedding_auth=cookietoken; another=x' }
      expect(extractToken(headers)).toBe('cookietoken')
    })

    it('extracts from Cookie header (capitalized)', () => {
      const headers = { Cookie: 'wedding_auth=cookietoken2' }
      expect(extractToken(headers)).toBe('cookietoken2')
    })

    it('prefers Authorization header over cookie', () => {
      const headers = {
        authorization: 'Bearer headertoken',
        cookie: 'wedding_auth=cookietoken',
      }
      expect(extractToken(headers)).toBe('headertoken')
    })

    it('returns null if no token found', () => {
      expect(extractToken({})).toBeNull()
      expect(extractToken({ cookie: 'other=value' })).toBeNull()
      expect(extractToken({ authorization: 'Basic xyz' })).toBeNull()
    })
  })

  describe('verifyRequest', () => {
    it('verifies request with valid Bearer token', () => {
      const token = createToken('guest')
      const headers = { authorization: `Bearer ${token}` }
      const payload = verifyRequest(headers)
      expect(payload).not.toBeNull()
      expect(payload?.sub).toBe('guest')
    })

    it('verifies request with valid cookie token', () => {
      const token = createToken('guest')
      const headers = { cookie: `wedding_auth=${token}` }
      const payload = verifyRequest(headers)
      expect(payload).not.toBeNull()
      expect(payload?.sub).toBe('guest')
    })

    it('returns null for request without token', () => {
      expect(verifyRequest({})).toBeNull()
    })

    it('returns null for request with invalid token', () => {
      const headers = { authorization: 'Bearer invalid-token' }
      expect(verifyRequest(headers)).toBeNull()
    })
  })
})
