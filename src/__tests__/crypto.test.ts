import { sha256, timingSafeEqual, verifyPassword } from '../utils/crypto'

describe('crypto utilities', () => {
  describe('sha256', () => {
    it('computes correct SHA-256 hash', async () => {
      // Known test vector
      const hash = await sha256('hello')
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    })

    it('produces lowercase hex output', async () => {
      const hash = await sha256('test')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('produces different hashes for different inputs', async () => {
      const hash1 = await sha256('password1')
      const hash2 = await sha256('password2')
      expect(hash1).not.toBe(hash2)
    })

    it('produces same hash for same input', async () => {
      const hash1 = await sha256('consistent')
      const hash2 = await sha256('consistent')
      expect(hash1).toBe(hash2)
    })

    it('handles empty string', async () => {
      const hash = await sha256('')
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it('handles unicode characters', async () => {
      const hash = await sha256('café ☕')
      expect(hash).toHaveLength(64)
    })

    it('handles special characters', async () => {
      const hash = await sha256('carolina&thomas2026')
      expect(hash).toBe('2a3938a72e797aa7e55f16da649805749b74e4670cbd802758a457502f952277')
    })
  })

  describe('timingSafeEqual', () => {
    it('returns true for equal strings', () => {
      expect(timingSafeEqual('abc', 'abc')).toBe(true)
    })

    it('returns false for different strings of same length', () => {
      expect(timingSafeEqual('abc', 'abd')).toBe(false)
    })

    it('returns false for strings of different lengths', () => {
      expect(timingSafeEqual('abc', 'abcd')).toBe(false)
    })

    it('returns false for empty vs non-empty', () => {
      expect(timingSafeEqual('', 'a')).toBe(false)
    })

    it('returns true for two empty strings', () => {
      expect(timingSafeEqual('', '')).toBe(true)
    })

    it('handles long strings', () => {
      const longStr = 'a'.repeat(1000)
      expect(timingSafeEqual(longStr, longStr)).toBe(true)
      expect(timingSafeEqual(longStr, longStr + 'b')).toBe(false)
    })

    it('is case sensitive', () => {
      expect(timingSafeEqual('ABC', 'abc')).toBe(false)
    })
  })

  describe('verifyPassword', () => {
    // SHA-256 of 'carolina&thomas2026'
    const expectedHash = '2a3938a72e797aa7e55f16da649805749b74e4670cbd802758a457502f952277'

    it('returns true for correct password', async () => {
      const result = await verifyPassword('carolina&thomas2026', expectedHash)
      expect(result).toBe(true)
    })

    it('returns true for correct password (case insensitive)', async () => {
      const result = await verifyPassword('Carolina&Thomas2026', expectedHash)
      expect(result).toBe(true)
    })

    it('returns true for uppercase password', async () => {
      const result = await verifyPassword('CAROLINA&THOMAS2026', expectedHash)
      expect(result).toBe(true)
    })

    it('returns false for incorrect password', async () => {
      const result = await verifyPassword('wrongpassword', expectedHash)
      expect(result).toBe(false)
    })

    it('returns false for empty password', async () => {
      const result = await verifyPassword('', expectedHash)
      expect(result).toBe(false)
    })

    it('returns false for similar but incorrect password', async () => {
      const result = await verifyPassword('carolina&thomas2025', expectedHash)
      expect(result).toBe(false)
    })

    it('handles hash comparison case-insensitively', async () => {
      const uppercaseHash = expectedHash.toUpperCase()
      const result = await verifyPassword('carolina&thomas2026', uppercaseHash)
      expect(result).toBe(true)
    })
  })
})
