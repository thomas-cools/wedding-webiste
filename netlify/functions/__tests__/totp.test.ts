/**
 * @jest-environment node
 */

import {
  base32Encode,
  base32Decode,
  generateSecret,
  generateTotpUri,
  generateTotp,
  verifyTotp,
} from '../utils/totp'

describe('TOTP utilities', () => {
  describe('base32Encode / base32Decode', () => {
    it('round-trips arbitrary bytes', () => {
      const original = Buffer.from('Hello, TOTP!')
      const encoded = base32Encode(original)
      const decoded = base32Decode(encoded)
      expect(decoded.toString()).toBe(original.toString())
    })

    it('handles empty buffer', () => {
      const encoded = base32Encode(Buffer.alloc(0))
      expect(encoded).toBe('')
      expect(base32Decode('').length).toBe(0)
    })

    it('produces only valid base32 characters', () => {
      const encoded = base32Encode(Buffer.from('test data 123'))
      expect(encoded).toMatch(/^[A-Z2-7]+$/)
    })
  })

  describe('generateSecret', () => {
    it('returns a base32 string of valid length', () => {
      const secret = generateSecret()
      // 20 bytes → 32 base32 characters
      expect(secret).toMatch(/^[A-Z2-7]+$/)
      expect(secret.length).toBe(32)
    })

    it('generates unique secrets', () => {
      const a = generateSecret()
      const b = generateSecret()
      expect(a).not.toBe(b)
    })
  })

  describe('generateTotpUri', () => {
    it('produces a valid otpauth URI', () => {
      const uri = generateTotpUri('JBSWY3DPEHPK3PXP', 'admin@example.com', 'MyApp')
      expect(uri).toContain('otpauth://totp/')
      expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
      expect(uri).toContain('issuer=MyApp')
      expect(uri).toContain('digits=6')
      expect(uri).toContain('period=30')
    })

    it('URL-encodes special characters', () => {
      const uri = generateTotpUri('ABC', 'user@test.com', 'My App & Co')
      expect(uri).toContain('My%20App%20%26%20Co')
    })
  })

  describe('generateTotp + verifyTotp', () => {
    const secret = generateSecret()

    it('generates a 6-digit code', () => {
      const code = generateTotp(secret)
      expect(code).toMatch(/^\d{6}$/)
    })

    it('verifies a code generated at the same time', () => {
      const now = Date.now()
      const code = generateTotp(secret, now)
      expect(verifyTotp(code, secret, 1, now)).toBe(true)
    })

    it('verifies a code within the window', () => {
      const now = Date.now()
      // Code from 30 seconds ago (1 step back)
      const code = generateTotp(secret, now - 30_000)
      expect(verifyTotp(code, secret, 1, now)).toBe(true)
    })

    it('rejects a code outside the window', () => {
      const now = Date.now()
      // Code from 90 seconds ago (3 steps back, window=1)
      const code = generateTotp(secret, now - 90_000)
      expect(verifyTotp(code, secret, 1, now)).toBe(false)
    })

    it('rejects non-numeric codes', () => {
      expect(verifyTotp('abcdef', secret)).toBe(false)
    })

    it('rejects wrong-length codes', () => {
      expect(verifyTotp('12345', secret)).toBe(false)
      expect(verifyTotp('1234567', secret)).toBe(false)
    })

    it('rejects empty string', () => {
      expect(verifyTotp('', secret)).toBe(false)
    })

    it('produces different codes at different time steps', () => {
      const t1 = 1000000 * 30 * 1000 // step 1000000
      const t2 = 1000001 * 30 * 1000 // step 1000001
      const code1 = generateTotp(secret, t1)
      const code2 = generateTotp(secret, t2)
      // Could theoretically collide, but extremely unlikely
      expect(code1 === code2).toBe(false)
    })
  })

  describe('RFC 6238 test vectors', () => {
    // Test with a known secret: "12345678901234567890" (ASCII)
    // base32("12345678901234567890") = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
    const rfc6238Secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

    it('generates correct code for time step 1 (T=30s)', () => {
      const code = generateTotp(rfc6238Secret, 59 * 1000) // T=59s → counter=1
      // RFC 6238 Table 1: SHA1, T=59 → 287082
      expect(code).toBe('287082')
    })

    it('generates correct code for time step 37037036 (T=1111111109)', () => {
      const code = generateTotp(rfc6238Secret, 1111111109 * 1000)
      // RFC 6238 Table 1: SHA1, T=1111111109 → 081804
      expect(code).toBe('081804')
    })
  })
})
