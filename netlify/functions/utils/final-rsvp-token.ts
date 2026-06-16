/**
 * Simple base64url encoding/decoding for final RSVP invitation tokens.
 * Not a security mechanism — the page is already password-gated.
 * This just carries guest identity for pre-population convenience.
 */

export interface FinalRsvpTokenData {
  name: string
  email: string
  partyNames: string[]
}

export function encodeFinalRsvpToken(data: FinalRsvpTokenData): string {
  const json = JSON.stringify({
    n: data.name,
    e: data.email,
    p: data.partyNames,
  })
  return Buffer.from(json).toString('base64url')
}

export function decodeFinalRsvpToken(token: string): FinalRsvpTokenData | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf-8')
    const parsed = JSON.parse(json)
    if (
      typeof parsed.n !== 'string' ||
      typeof parsed.e !== 'string' ||
      !Array.isArray(parsed.p)
    ) {
      return null
    }
    return {
      name: parsed.n,
      email: parsed.e,
      partyNames: parsed.p.filter((v: unknown) => typeof v === 'string'),
    }
  } catch {
    return null
  }
}
