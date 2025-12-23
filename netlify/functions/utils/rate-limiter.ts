export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfterSeconds?: number
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Note: In a serverless environment like Netlify, this state is not shared across instances
// and may be lost when the function cold starts. For strict rate limiting, use an external
// store like Redis (e.g., Upstash).
const hits = new Map<string, RateLimitRecord>()

// Clean up expired entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60000 // 1 minute
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, record] of hits.entries()) {
    if (now > record.resetTime) {
      hits.delete(key)
    }
  }
  lastCleanup = now
}

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup()

  const now = Date.now()
  const record = hits.get(key)

  if (!record || now > record.resetTime) {
    const resetTime = now + config.windowMs
    hits.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      limit: config.max,
      remaining: Math.max(0, config.max - 1),
      resetTime,
    }
  }

  if (record.count >= config.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
    return {
      allowed: false,
      limit: config.max,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds,
    }
  }

  record.count++
  return {
    allowed: true,
    limit: config.max,
    remaining: Math.max(0, config.max - record.count),
    resetTime: record.resetTime,
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    // seconds since epoch, to match common conventions
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
  }

  if (!result.allowed && result.retryAfterSeconds) {
    headers['Retry-After'] = String(result.retryAfterSeconds)
  }

  return headers
}

function getHeader(headers: Record<string, string | undefined>, name: string): string | undefined {
  const direct = headers[name]
  if (direct) return direct

  const lowerName = name.toLowerCase()
  if (headers[lowerName]) return headers[lowerName]

  // Netlify sometimes passes through mixed-case keys; do a small fallback scan.
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue
    if (key.toLowerCase() === lowerName) return value
  }
  return undefined
}

export function getClientIp(headers: Record<string, string | undefined>): string {
  const netlifyIp = getHeader(headers, 'x-nf-client-connection-ip')
  if (netlifyIp) return netlifyIp.trim()

  const clientIp = getHeader(headers, 'client-ip')
  if (clientIp) return clientIp.trim()

  const xff = getHeader(headers, 'x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()

  return 'unknown'
}

export function rateLimitKey(bucket: string, ip: string): string {
  return `${bucket}:${ip}`
}
