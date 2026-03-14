/**
 * Admin authentication utilities for the frontend.
 * Handles login, MFA verification, enrollment, and session management.
 */

const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_TOKEN_EXP_KEY = 'admin_token_exp'

interface LoginResult {
  ok: boolean
  requiresMfa: boolean
  mfaConfigured: boolean
  pendingToken: string
  error?: string
}

interface MfaVerifyResult {
  ok: boolean
  token?: string
  error?: string
}

interface MfaEnrollResult {
  ok: boolean
  secret?: string
  totpUri?: string
  error?: string
}

export async function adminLogin(password: string): Promise<LoginResult> {
  const res = await fetch('/api/admin-auth?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false, requiresMfa: false, mfaConfigured: false, pendingToken: '', error: data.error }
  }

  return {
    ok: true,
    requiresMfa: data.requiresMfa,
    mfaConfigured: data.mfaConfigured ?? false,
    pendingToken: data.pendingToken,
  }
}

export async function adminVerifyMfa(
  pendingToken: string,
  code: string
): Promise<MfaVerifyResult> {
  const res = await fetch('/api/admin-auth?action=verify-mfa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pendingToken, code }),
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false, error: data.error }
  }

  // Store the admin token (8h expiry)
  const expiry = Date.now() + 8 * 60 * 60 * 1000
  sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
  sessionStorage.setItem(ADMIN_TOKEN_EXP_KEY, String(expiry))

  return { ok: true, token: data.token }
}

export async function adminEnrollMfa(
  pendingToken: string,
  code?: string,
  secret?: string
): Promise<MfaEnrollResult> {
  const res = await fetch('/api/admin-auth?action=enroll-mfa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pendingToken, code, secret }),
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false, error: data.error }
  }

  return {
    ok: true,
    secret: data.secret,
    totpUri: data.totpUri,
  }
}

export function isAdminAuthenticated(): boolean {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
  const expiry = sessionStorage.getItem(ADMIN_TOKEN_EXP_KEY)

  if (!token || !expiry) return false
  if (Date.now() > Number(expiry)) {
    adminLogout()
    return false
  }

  return true
}

export function getAdminToken(): string | null {
  if (!isAdminAuthenticated()) return null
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  sessionStorage.removeItem(ADMIN_TOKEN_EXP_KEY)
}
