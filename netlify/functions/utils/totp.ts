/**
 * TOTP (Time-based One-Time Password) implementation per RFC 6238.
 * Uses Node.js crypto — no external dependencies.
 */

import { createHmac, randomBytes } from 'crypto'

/** TOTP configuration */
const TOTP_PERIOD = 30 // seconds
const TOTP_DIGITS = 6
const TOTP_ALGORITHM = 'sha1'

/**
 * Base32 alphabet (RFC 4648)
 */
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Base32 encode a buffer.
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      output += BASE32_CHARS[(value >>> bits) & 0x1f]
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 0x1f]
  }

  return output
}

/**
 * Base32 decode a string to a buffer.
 */
export function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/[\s=-]+/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >>> bits) & 0xff)
    }
  }

  return Buffer.from(bytes)
}

/**
 * Generate a random TOTP secret (20 bytes = 160 bits, per RFC 4226 recommendation).
 * Returns the base32-encoded secret.
 */
export function generateSecret(): string {
  return base32Encode(randomBytes(20))
}

/**
 * Generate an otpauth:// URI for QR code display.
 */
export function generateTotpUri(
  secret: string,
  accountName: string,
  issuer: string
): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedAccount = encodeURIComponent(accountName)
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`
}

/**
 * Generate HMAC-based OTP for a given counter.
 */
function generateHotp(secret: Buffer, counter: bigint): string {
  const counterBuf = Buffer.alloc(8)
  counterBuf.writeBigUInt64BE(counter)

  const hmac = createHmac(TOTP_ALGORITHM, secret)
  hmac.update(counterBuf)
  const digest = hmac.digest()

  // Dynamic truncation (RFC 4226 §5.3)
  const offset = digest[digest.length - 1]! & 0x0f
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff)

  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0')
}

/**
 * Generate a TOTP code for the current time.
 */
export function generateTotp(secret: string, timeMs: number = Date.now()): string {
  const secretBuf = base32Decode(secret)
  const counter = BigInt(Math.floor(timeMs / 1000 / TOTP_PERIOD))
  return generateHotp(secretBuf, counter)
}

/**
 * Verify a TOTP code against a secret.
 * Allows a configurable window (default: ±1 step = 30s each side).
 */
export function verifyTotp(
  token: string,
  secret: string,
  window: number = 1,
  timeMs: number = Date.now()
): boolean {
  if (!token || token.length !== TOTP_DIGITS || !/^\d+$/.test(token)) {
    return false
  }

  const secretBuf = base32Decode(secret)
  const currentCounter = BigInt(Math.floor(timeMs / 1000 / TOTP_PERIOD))

  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + BigInt(i)
    const expected = generateHotp(secretBuf, counter)
    if (token === expected) {
      return true
    }
  }

  return false
}
