/**
 * @jest-environment node
 */

describe('rate-limiter', () => {
  beforeEach(() => {
    // Isolate modules so the in-memory map is fresh for each test.
    jest.resetModules()
  })

  it('allows up to max requests within the window and blocks afterwards', async () => {
    const mod = await import('../rate-limiter')

    const key = mod.rateLimitKey('bucket', '1.2.3.4')
    const config = { max: 2, windowMs: 60_000 }

    const r1 = mod.consumeRateLimit(key, config)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(1)

    const r2 = mod.consumeRateLimit(key, config)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(0)

    const r3 = mod.consumeRateLimit(key, config)
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
    expect(typeof r3.retryAfterSeconds).toBe('number')
    expect(r3.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets after the window elapses', async () => {
    jest.useFakeTimers()

    const mod = await import('../rate-limiter')
    const key = mod.rateLimitKey('bucket', '1.2.3.4')
    const config = { max: 1, windowMs: 1_000 }

    expect(mod.consumeRateLimit(key, config).allowed).toBe(true)
    expect(mod.consumeRateLimit(key, config).allowed).toBe(false)

    jest.advanceTimersByTime(1_001)

    expect(mod.consumeRateLimit(key, config).allowed).toBe(true)

    jest.useRealTimers()
  })

  it('produces standard rate limit headers, including Retry-After when blocked', async () => {
    const mod = await import('../rate-limiter')

    const key = mod.rateLimitKey('bucket', '1.2.3.4')
    const config = { max: 1, windowMs: 60_000 }

    const allowed = mod.consumeRateLimit(key, config)
    const allowedHeaders = mod.rateLimitHeaders(allowed)
    expect(allowedHeaders['X-RateLimit-Limit']).toBe('1')
    expect(allowedHeaders['X-RateLimit-Remaining']).toBe('0')
    expect(Number(allowedHeaders['X-RateLimit-Reset'])).toBeGreaterThan(0)
    expect(allowedHeaders['Retry-After']).toBeUndefined()

    const blocked = mod.consumeRateLimit(key, config)
    expect(blocked.allowed).toBe(false)
    const blockedHeaders = mod.rateLimitHeaders(blocked)
    expect(blockedHeaders['Retry-After']).toBeDefined()
  })

  it('extracts client ip from Netlify and forwarded headers (case-insensitive)', async () => {
    const mod = await import('../rate-limiter')

    expect(mod.getClientIp({ 'x-nf-client-connection-ip': '10.0.0.1' })).toBe('10.0.0.1')
    expect(mod.getClientIp({ 'X-Nf-Client-Connection-Ip': '10.0.0.2' } as any)).toBe('10.0.0.2')
    expect(mod.getClientIp({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })).toBe('1.2.3.4')
    expect(mod.getClientIp({})).toBe('unknown')
  })

  it('builds stable per-endpoint keys', async () => {
    const mod = await import('../rate-limiter')

    expect(mod.rateLimitKey('validate-address', '1.2.3.4')).toBe('validate-address:1.2.3.4')
  })
})
