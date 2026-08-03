import type { Handler } from '@netlify/functions'
import { createToken } from './utils/jwt'
import { adminCorsResponse, adminJson, adminUnauthorized, verifyAdminRequest } from './utils/admin-auth'

const SPEECHES_LINK_EXPIRY_SECONDS = 72 * 60 * 60

function getBaseUrl(headers: Record<string, string | undefined>, rawUrl?: string): string {
  const proto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || 'https'
  const host = headers.host || headers.Host

  if (host) {
    return `${proto}://${host}`
  }

  if (rawUrl) {
    return new URL(rawUrl).origin
  }

  return 'https://example.com'
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'POST') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const payload = verifyAdminRequest(event.headers || {})
  if (!payload) {
    return adminUnauthorized()
  }

  const token = createToken('wedding-guest', SPEECHES_LINK_EXPIRY_SECONDS)
  const expiresAt = new Date(Date.now() + SPEECHES_LINK_EXPIRY_SECONDS * 1000).toISOString()
  const baseUrl = getBaseUrl(event.headers || {}, event.rawUrl)
  const url = new URL('/speeches', baseUrl)
  url.searchParams.set('t', token)

  return adminJson(200, {
    ok: true,
    url: url.toString(),
    expiresIn: SPEECHES_LINK_EXPIRY_SECONDS,
    expiresAt,
    issuedBy: payload.sub,
  })
}