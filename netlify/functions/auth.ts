import type { Handler } from '@netlify/functions'
import { consumeRateLimit, getClientIp, rateLimitHeaders, rateLimitKey } from './utils/rate-limiter'
import { verifyPassword, getPasswordHash, createToken } from './utils/jwt'

interface AuthRequest {
  password: string
}

interface AuthResponse {
  ok: boolean
  token?: string
  error?: string
  expiresIn?: number
}

function json(
  statusCode: number,
  body: AuthResponse,
  extraHeaders: Record<string, string> = {}
) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// Token expiration (24 hours in seconds)
const TOKEN_EXPIRES_IN = 24 * 60 * 60

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  // Rate limiting - stricter for auth endpoint (10 attempts per 10 minutes)
  const ip = getClientIp(event.headers || {})
  const limit = numberFromEnv(process.env.RATE_LIMIT_AUTH_MAX, 10)
  const windowSeconds = numberFromEnv(process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS, 600)
  const rl = consumeRateLimit(rateLimitKey('auth', ip), {
    max: limit,
    windowMs: windowSeconds * 1000,
  })

  if (!rl.allowed) {
    return json(
      429,
      { ok: false, error: 'Too many attempts. Please try again later.' },
      rateLimitHeaders(rl)
    )
  }

  // Parse request body
  let body: AuthRequest
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' }, rateLimitHeaders(rl))
  }

  // Validate password field exists
  if (!body.password || typeof body.password !== 'string') {
    return json(400, { ok: false, error: 'Password is required' }, rateLimitHeaders(rl))
  }

  // Get password hash from environment
  let passwordHash: string
  try {
    passwordHash = getPasswordHash()
  } catch (err) {
    console.error('Auth configuration error:', err)
    return json(500, { ok: false, error: 'Server configuration error' }, rateLimitHeaders(rl))
  }

  // Verify password
  const isValid = verifyPassword(body.password, passwordHash)

  if (!isValid) {
    return json(
      401,
      { ok: false, error: 'Invalid password' },
      rateLimitHeaders(rl)
    )
  }

  // Create JWT token
  const token = createToken('wedding-guest')

  return json(
    200,
    {
      ok: true,
      token,
      expiresIn: TOKEN_EXPIRES_IN,
    },
    {
      ...rateLimitHeaders(rl),
      // Also set as HttpOnly cookie for automatic inclusion in requests
      'Set-Cookie': `wedding_auth=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TOKEN_EXPIRES_IN}`,
    }
  )
}
