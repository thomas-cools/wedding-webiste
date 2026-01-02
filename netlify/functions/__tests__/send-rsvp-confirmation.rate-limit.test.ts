/**
 * @jest-environment node
 */

import type { HandlerEvent } from '@netlify/functions'

describe('send-rsvp-confirmation rate limiting', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.RATE_LIMIT_RSVP_CONFIRM_MAX = '2'
    process.env.RATE_LIMIT_RSVP_CONFIRM_WINDOW_SECONDS = '600'
  })

  it('returns 429 after exceeding the per-IP limit', async () => {
    const mod = await import('../send-rsvp-confirmation')

    const event = {
      httpMethod: 'POST',
      headers: { 'x-nf-client-connection-ip': '203.0.113.20' },
      body: JSON.stringify({}),
    } as unknown as HandlerEvent

    const r1 = await mod.handler(event, {} as any)
    if (!r1) throw new Error('No response')
    expect(r1.statusCode).toBe(400) // missing required fields

    const r2 = await mod.handler(event, {} as any)
    if (!r2) throw new Error('No response')
    expect(r2.statusCode).toBe(400)

    const r3 = await mod.handler(event, {} as any)
    if (!r3) throw new Error('No response')
    expect(r3.statusCode).toBe(429)

    expect(r3.headers?.['Content-Type']).toContain('application/json')
    expect(r3.headers?.['Retry-After']).toBeDefined()
    expect(r3.headers?.['X-RateLimit-Limit']).toBe('2')
    expect(r3.headers?.['X-RateLimit-Remaining']).toBe('0')
    expect(r3.headers?.['X-RateLimit-Reset']).toBeDefined()

    const body = JSON.parse(String(r3.body || '{}'))
    expect(body.error).toMatch(/rate limit/i)
  })
})
