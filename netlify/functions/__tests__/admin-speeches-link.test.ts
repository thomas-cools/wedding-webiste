import type { HandlerContext, HandlerEvent } from '@netlify/functions'
import { handler } from '../admin-speeches-link'
import * as jwt from '../utils/jwt'

function createEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://example.com/.netlify/functions/admin-speeches-link',
    rawQuery: '',
    path: '/.netlify/functions/admin-speeches-link',
    httpMethod: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${jwt.createToken('admin', 3600)}`,
      host: 'example.com',
      'x-forwarded-proto': 'https',
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: '{}',
    isBase64Encoded: false,
    ...overrides,
  }
}

const mockContext: HandlerContext = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'admin-speeches-link',
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

describe('admin-speeches-link function', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.JWT_SECRET = 'test-jwt-secret'
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns a copyable speeches link with a 72 hour token', async () => {
    const response = await handler(createEvent(), mockContext)
    if (!response) throw new Error('No response')

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body || '')
    expect(body.ok).toBe(true)
    expect(body.url).toContain('/speeches?t=')
    expect(body.expiresIn).toBe(72 * 60 * 60)

    const url = new URL(body.url)
    const token = url.searchParams.get('t')
    expect(token).toBeTruthy()

    const payload = jwt.verifyToken(token as string)
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('wedding-guest')
    expect(payload?.exp - payload!.iat).toBe(72 * 60 * 60)
  })
})