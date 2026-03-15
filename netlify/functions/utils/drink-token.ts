/**
 * Simple base64url encoding/decoding for drink invitation tokens.
 * Not a security mechanism — the page is already password-gated.
 * This just carries guest identity for pre-population convenience.
 */

export interface DrinkTokenData {
  name: string
  email: string
  partyNames: string[]
}

export function encodeDrinkToken(data: DrinkTokenData): string {
  const json = JSON.stringify({
    n: data.name,
    e: data.email,
    p: data.partyNames,
  })
  return Buffer.from(json).toString('base64url')
}

export function decodeDrinkToken(token: string): DrinkTokenData | null {
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
