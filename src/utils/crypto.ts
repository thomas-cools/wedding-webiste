/**
 * Cryptographic utilities for password handling.
 * Uses the Web Crypto API (available in all modern browsers).
 */

/**
 * Compute SHA-256 hash of a string.
 * Returns lowercase hex string.
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Both strings are compared in constant time regardless of where they differ.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a dummy comparison to maintain constant-ish time
    // (length difference already leaks info, but we minimize further leakage)
    let result = 1
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ a.charCodeAt(i)
    }
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Hash a password and compare against an expected hash.
 * Uses timing-safe comparison.
 */
export async function verifyPassword(
  password: string,
  expectedHash: string
): Promise<boolean> {
  const inputHash = await sha256(password.toLowerCase())
  return timingSafeEqual(inputHash, expectedHash.toLowerCase())
}
