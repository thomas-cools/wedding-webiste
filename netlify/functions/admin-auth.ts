/**
 * Admin authentication endpoint with two-phase login (password + TOTP MFA).
 *
 * Routes (via query param `action`):
 *   POST /api/admin-auth?action=login       — Verify password, return MFA pending token
 *   POST /api/admin-auth?action=verify-mfa  — Verify TOTP code + pending token, return admin JWT
 *   POST /api/admin-auth?action=enroll-mfa  — Generate TOTP secret + verify initial code
 */

import type { Handler } from '@netlify/functions'
import { consumeRateLimit, getClientIp, rateLimitHeaders, rateLimitKey } from './utils/rate-limiter'
import { hashPassword, verifyPassword, createToken, verifyToken } from './utils/jwt'
import { generateSecret, generateTotpUri, verifyTotp } from './utils/totp'
import { adminJson, adminCorsResponse } from './utils/admin-auth'

// Token expiry constants
const MFA_PENDING_EXPIRY = 5 * 60 // 5 minutes
const ADMIN_TOKEN_EXPIRY = 8 * 60 * 60 // 8 hours

function getAdminPasswordHash(): string | null {
  return process.env.ADMIN_PASSWORD_HASH || null
}

function getAdminTotpSecret(): string | null {
  return process.env.ADMIN_TOTP_SECRET || null
}

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'POST') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const action = event.queryStringParameters?.action || ''
  const ip = getClientIp(event.headers || {})

  switch (action) {
    case 'login':
      return handleLogin(event.body, ip)
    case 'verify-mfa':
      return handleVerifyMfa(event.body, ip)
    case 'enroll-mfa':
      return handleEnrollMfa(event.body, ip)
    default:
      return adminJson(400, { ok: false, error: 'Invalid action. Use: login, verify-mfa, enroll-mfa' })
  }
}

/**
 * Phase 1: Verify admin password, return short-lived MFA pending token.
 */
async function handleLogin(body: string | null, ip: string) {
  // Rate limit: 5 attempts per 10 minutes
  const limit = numberFromEnv(process.env.RATE_LIMIT_ADMIN_LOGIN_MAX, 5)
  const windowSeconds = numberFromEnv(process.env.RATE_LIMIT_ADMIN_LOGIN_WINDOW_SECONDS, 600)
  const rl = consumeRateLimit(rateLimitKey('admin-login', ip), {
    max: limit,
    windowMs: windowSeconds * 1000,
  })

  if (!rl.allowed) {
    return adminJson(429, { ok: false, error: 'Too many attempts. Please try again later.' }, rateLimitHeaders(rl))
  }

  const passwordHash = getAdminPasswordHash()
  if (!passwordHash) {
    return adminJson(500, { ok: false, error: 'Admin authentication not configured' }, rateLimitHeaders(rl))
  }

  let parsed: { password?: string }
  try {
    parsed = JSON.parse(body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' }, rateLimitHeaders(rl))
  }

  if (!parsed.password || typeof parsed.password !== 'string') {
    return adminJson(400, { ok: false, error: 'Password is required' }, rateLimitHeaders(rl))
  }

  if (!verifyPassword(parsed.password, passwordHash)) {
    return adminJson(401, { ok: false, error: 'Invalid password' }, rateLimitHeaders(rl))
  }

  // Password verified — check if MFA is configured
  const totpSecret = getAdminTotpSecret()
  const mfaConfigured = !!totpSecret

  // Return short-lived pending token for MFA step
  const pendingToken = createToken('admin-mfa-pending', MFA_PENDING_EXPIRY)

  return adminJson(200, {
    ok: true,
    requiresMfa: true,
    mfaConfigured,
    pendingToken,
  }, rateLimitHeaders(rl))
}

/**
 * Phase 2: Verify TOTP code + pending token, return full admin JWT.
 */
async function handleVerifyMfa(body: string | null, ip: string) {
  // Rate limit: 5 attempts per 5 minutes
  const limit = numberFromEnv(process.env.RATE_LIMIT_ADMIN_MFA_MAX, 5)
  const windowSeconds = numberFromEnv(process.env.RATE_LIMIT_ADMIN_MFA_WINDOW_SECONDS, 300)
  const rl = consumeRateLimit(rateLimitKey('admin-mfa', ip), {
    max: limit,
    windowMs: windowSeconds * 1000,
  })

  if (!rl.allowed) {
    return adminJson(429, { ok: false, error: 'Too many MFA attempts. Please try again later.' }, rateLimitHeaders(rl))
  }

  let parsed: { pendingToken?: string; code?: string }
  try {
    parsed = JSON.parse(body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' }, rateLimitHeaders(rl))
  }

  if (!parsed.pendingToken || !parsed.code) {
    return adminJson(400, { ok: false, error: 'pendingToken and code are required' }, rateLimitHeaders(rl))
  }

  // Verify the pending token
  const payload = verifyToken(parsed.pendingToken)
  if (!payload || payload.sub !== 'admin-mfa-pending') {
    return adminJson(401, { ok: false, error: 'Invalid or expired pending token' }, rateLimitHeaders(rl))
  }

  // Verify TOTP code
  const totpSecret = getAdminTotpSecret()
  if (!totpSecret) {
    return adminJson(400, { ok: false, error: 'MFA not configured. Please enroll first.' }, rateLimitHeaders(rl))
  }

  if (!verifyTotp(parsed.code, totpSecret)) {
    return adminJson(401, { ok: false, error: 'Invalid MFA code' }, rateLimitHeaders(rl))
  }

  // Issue full admin JWT (8 hours)
  const adminToken = createToken('admin', ADMIN_TOKEN_EXPIRY)

  return adminJson(200, {
    ok: true,
    token: adminToken,
    expiresIn: ADMIN_TOKEN_EXPIRY,
  }, {
    ...rateLimitHeaders(rl),
    'Set-Cookie': `admin_auth=${adminToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_TOKEN_EXPIRY}`,
  })
}

/**
 * Enroll MFA: Generate a new TOTP secret and verify it with an initial code.
 * Only works if ADMIN_TOTP_SECRET is not yet set (or with a pending token to re-enroll).
 */
async function handleEnrollMfa(body: string | null, ip: string) {
  // Rate limit: 5 attempts per 10 minutes
  const rl = consumeRateLimit(rateLimitKey('admin-enroll', ip), {
    max: 5,
    windowMs: 600_000,
  })

  if (!rl.allowed) {
    return adminJson(429, { ok: false, error: 'Too many attempts. Please try again later.' }, rateLimitHeaders(rl))
  }

  let parsed: { pendingToken?: string; code?: string; secret?: string }
  try {
    parsed = JSON.parse(body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' }, rateLimitHeaders(rl))
  }

  // Must have a valid MFA pending token (proves password was verified)
  if (!parsed.pendingToken) {
    return adminJson(400, { ok: false, error: 'pendingToken is required' }, rateLimitHeaders(rl))
  }

  const payload = verifyToken(parsed.pendingToken)
  if (!payload || payload.sub !== 'admin-mfa-pending') {
    return adminJson(401, { ok: false, error: 'Invalid or expired pending token' }, rateLimitHeaders(rl))
  }

  // If MFA is already configured, prevent re-enrollment via this endpoint
  if (getAdminTotpSecret()) {
    return adminJson(400, { ok: false, error: 'MFA is already configured. To change it, update the ADMIN_TOTP_SECRET environment variable.' }, rateLimitHeaders(rl))
  }

  // Step 1: Generate secret (no code provided yet)
  if (!parsed.code) {
    const secret = generateSecret()
    const uri = generateTotpUri(secret, 'Admin', 'Wedding Admin')

    return adminJson(200, {
      ok: true,
      enrollment: true,
      secret,
      totpUri: uri,
      message: 'Scan the QR code with your authenticator app, then submit the code to verify.',
    }, rateLimitHeaders(rl))
  }

  // Step 2: Verify the code against the provided secret
  if (!parsed.secret) {
    return adminJson(400, { ok: false, error: 'secret is required when verifying enrollment' }, rateLimitHeaders(rl))
  }

  if (!verifyTotp(parsed.code, parsed.secret)) {
    return adminJson(401, { ok: false, error: 'Invalid code. Please try again with the code from your authenticator app.' }, rateLimitHeaders(rl))
  }

  // Enrollment verified — issue full admin token
  const adminToken = createToken('admin', ADMIN_TOKEN_EXPIRY)

  return adminJson(200, {
    ok: true,
    verified: true,
    secret: parsed.secret,
    token: adminToken,
    expiresIn: ADMIN_TOKEN_EXPIRY,
    message: `MFA enrollment successful. Save this secret as ADMIN_TOTP_SECRET environment variable: ${parsed.secret}`,
  }, {
    ...rateLimitHeaders(rl),
    'Set-Cookie': `admin_auth=${adminToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_TOKEN_EXPIRY}`,
  })
}
