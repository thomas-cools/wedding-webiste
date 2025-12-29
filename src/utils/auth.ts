/**
 * Authentication API client.
 * Handles server-side password verification and token management.
 */

const AUTH_ENDPOINT = '/.netlify/functions/auth'
const TOKEN_KEY = 'wedding_auth_token'
const AUTH_KEY = 'wedding_authenticated'

interface AuthResponse {
  ok: boolean
  token?: string
  error?: string
  expiresIn?: number
}

/**
 * Check if running in development mode (local dev server)
 */
function isDevelopment(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  )
}

/**
 * Authenticate with the server using password.
 * In production, calls the serverless function.
 * In development without the function, falls back to client-side validation.
 */
export async function authenticate(password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(AUTH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
      credentials: 'include', // Include cookies for HttpOnly token
    })

    const data: AuthResponse = await response.json()

    if (data.ok && data.token) {
      // Store token in localStorage as backup (cookie is HttpOnly and set by server)
      localStorage.setItem(TOKEN_KEY, data.token)
      sessionStorage.setItem(AUTH_KEY, 'true')
    }

    return data
  } catch (error) {
    // If fetch fails in development (function not running), fall back to client-side
    if (isDevelopment()) {
      console.warn('[Auth] Server auth failed, using development fallback')
      return authenticateLocal(password)
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }
  }
}

/**
 * Check if running in development mode.
 * Uses process.env which works in both Vite (via define) and Jest.
 */
function isDevMode(): boolean {
  return process.env.NODE_ENV !== 'production'
}

/**
 * Development-only fallback for local testing without Netlify functions.
 * Uses client-side hash verification.
 * 
 * NOTE: In production, if the auth endpoint is unavailable, users simply won't
 * be able to authenticate. This fallback only exists for local development.
 */
async function authenticateLocal(password: string): Promise<AuthResponse> {
  // In production, don't allow client-side fallback
  if (!isDevMode()) {
    return {
      ok: false,
      error: 'Authentication service unavailable',
    }
  }

  // Dynamic import to avoid bundling crypto utils when not needed
  const { verifyPassword } = await import('./crypto')

  // Development fallback hash for 'carolina&thomas2026'
  const devHash = '2a3938a72e797aa7e55f16da649805749b74e4670cbd802758a457502f952277'

  const isValid = await verifyPassword(password, devHash)

  if (isValid) {
    sessionStorage.setItem(AUTH_KEY, 'true')
    return {
      ok: true,
      token: 'dev-mode-token',
      expiresIn: 86400,
    }
  }

  return {
    ok: false,
    error: 'Invalid password',
  }
}

/**
 * Get the stored auth token (if any)
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === 'true'
}

/**
 * Clear authentication state (logout)
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(AUTH_KEY)
}

/**
 * Get headers with auth token for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  if (token && token !== 'dev-mode-token') {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}
