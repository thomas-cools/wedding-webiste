/**
 * Admin authentication middleware.
 * Verifies admin JWT tokens for protected admin endpoints.
 */

import { verifyToken, extractToken, type JwtPayload } from './jwt'

/**
 * Verify that a request has a valid admin JWT.
 * Returns the JWT payload if valid, null if not.
 */
export function verifyAdminRequest(
  headers: Record<string, string | undefined>
): JwtPayload | null {
  const token = extractToken(headers)
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // Must be an admin token
  if (payload.sub !== 'admin') return null

  return payload
}

/**
 * Standard JSON response helper for admin endpoints.
 */
export function adminJson(
  statusCode: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {}
) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

/**
 * Return 401 for unauthorized admin requests.
 */
export function adminUnauthorized(message: string = 'Unauthorized') {
  return adminJson(401, { ok: false, error: message })
}

/**
 * Handle CORS preflight for admin endpoints.
 */
export function adminCorsResponse() {
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
    body: '',
  }
}
