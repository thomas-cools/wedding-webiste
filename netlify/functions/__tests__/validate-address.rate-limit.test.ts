/**
 * @jest-environment node
 */

import type { HandlerEvent } from '@netlify/functions'

describe('validate-address rate limiting', () => {
  beforeEach(() => {
    jest.resetModules()
    delete process.env.GOOGLE_MAPS_API_KEY
    process.env.RATE_LIMIT_VALIDATE_ADDRESS_MAX = '2'
    process.env.RATE_LIMIT_VALIDATE_ADDRESS_WINDOW_SECONDS = '600'
  })

  it('returns 429 after exceeding the per-IP limit', async () => {
    const mod = await import('../validate-address')

    const event = {
      httpMethod: 'POST',
      headers: { 'x-nf-client-connection-ip': '203.0.113.10' },
      body: JSON.stringify({ address: '123 Main St' }),
    } as unknown as HandlerEvent

    const r1 = await mod.handler(event, {} as any)
    expect(r1.statusCode).toBe(500) // missing GOOGLE_MAPS_API_KEY

    const r2 = await mod.handler(event, {} as any)
    expect(r2.statusCode).toBe(500)

    const r3 = await mod.handler(event, {} as any)
    expect(r3.statusCode).toBe(429)

    expect(r3.headers?.['Access-Control-Allow-Origin']).toBe('*')
    expect(r3.headers?.['Retry-After']).toBeDefined()
    expect(r3.headers?.['X-RateLimit-Limit']).toBe('2')
    expect(r3.headers?.['X-RateLimit-Remaining']).toBe('0')
    expect(r3.headers?.['X-RateLimit-Reset']).toBeDefined()

    const body = JSON.parse(String(r3.body || '{}'))
    expect(body.ok).toBe(false)
  })
})
