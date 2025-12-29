/**
 * JWT utilities for server-side authentication.
 * Uses HMAC-SHA256 for signing - no external dependencies.
 */

import { createHmac, timingSafeEqual } from 'crypto'

// JWT expiration time (24 hours)
const JWT_EXPIRY_SECONDS = 24 * 60 * 60

export interface JwtPayload {
  /** Subject (user identifier) */
  sub: string
  /** Issued at (Unix timestamp) */
  iat: number
  /** Expiration (Unix timestamp) */
  exp: number
}

/**
 * Get the JWT secret from environment.
 * Falls back to a derived key from password hash if JWT_SECRET not set.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SITE_PASSWORD_HASH
  if (!secret) {
    throw new Error('JWT_SECRET or SITE_PASSWORD_HASH environment variable is required')
  }
  return secret
}

/**
 * Get the password hash from environment.
 */
export function getPasswordHash(): string {
  const hash = process.env.SITE_PASSWORD_HASH
  if (!hash) {
    throw new Error('SITE_PASSWORD_HASH environment variable is required')
  }
  return hash.toLowerCase()
}

/**
 * Base64url encode (URL-safe base64)
 */
function base64urlEncode(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Base64url decode
 */
function base64urlDecode(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

/**
 * Create HMAC-SHA256 signature
 */
function sign(data: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(data)
  return base64urlEncode(hmac.digest())
}

/**
 * Hash a password with SHA-256 (for verification)
 */
export function hashPassword(password: string): string {
  const hmac = createHmac('sha256', 'wedding-site-salt')
  hmac.update(password.toLowerCase())
  return hmac.digest('hex')
}

/**
 * Timing-safe string comparison
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * Verify a password against the stored hash
 */
export function verifyPassword(password: string, expectedHash: string): boolean {
  const inputHash = hashPassword(password)
  return safeCompare(inputHash, expectedHash.toLowerCase())
}

/**
 * Create a signed JWT token
 */
export function createToken(subject: string = 'wedding-guest'): string {
  const secret = getJwtSecret()
  const now = Math.floor(Date.now() / 1000)

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: JwtPayload = {
    sub: subject,
    iat: now,
    exp: now + JWT_EXPIRY_SECONDS,
  }

  const headerB64 = base64urlEncode(JSON.stringify(header))
  const payloadB64 = base64urlEncode(JSON.stringify(payload))
  const signature = sign(`${headerB64}.${payloadB64}`, secret)

  return `${headerB64}.${payloadB64}.${signature}`
}

/**
 * Verify and decode a JWT token.
 * Returns the payload if valid, null otherwise.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = getJwtSecret()
    const parts = token.split('.')

    if (parts.length !== 3) {
      return null
    }

    const [headerB64, payloadB64, signature] = parts

    // Verify signature
    const expectedSignature = sign(`${headerB64}.${payloadB64}`, secret)
    if (!safeCompare(signature, expectedSignature)) {
      return null
    }

    // Decode and validate payload
    const payload = JSON.parse(base64urlDecode(payloadB64)) as JwtPayload

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Extract JWT from Authorization header or cookie
 */
export function extractToken(headers: Record<string, string | undefined>): string | null {
  // Check Authorization header first (Bearer token)
  const authHeader = headers['authorization'] || headers['Authorization']
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Check cookie
  const cookie = headers['cookie'] || headers['Cookie']
  if (cookie) {
    const match = cookie.match(/wedding_auth=([^;]+)/)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Verify request has valid authentication.
 * Returns the payload if valid, null otherwise.
 */
export function verifyRequest(headers: Record<string, string | undefined>): JwtPayload | null {
  const token = extractToken(headers)
  if (!token) {
    return null
  }
  return verifyToken(token)
}
