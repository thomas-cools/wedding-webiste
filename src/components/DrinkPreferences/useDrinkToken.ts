import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface GuestData {
  primaryName: string
  email: string
  partyMembers: string[]  // includes primary guest as first element
}

function base64urlDecode(str: string): string {
  // Convert base64url to standard base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  // atob returns a raw byte string (one char per byte); decode as UTF-8 to
  // correctly handle multi-byte characters (e.g. accented letters).
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function useDrinkToken(): GuestData | null {
  const [searchParams] = useSearchParams()

  return useMemo(() => {
    const token = searchParams.get('t')
    if (!token) return null

    try {
      const json = base64urlDecode(token)
      const parsed = JSON.parse(json)

      if (
        typeof parsed.n !== 'string' ||
        typeof parsed.e !== 'string' ||
        !Array.isArray(parsed.p)
      ) {
        return null
      }

      const primaryName = parsed.n as string
      const email = parsed.e as string
      const partyNames: string[] = (parsed.p as unknown[]).filter(
        (v): v is string => typeof v === 'string'
      )

      return {
        primaryName,
        email,
        partyMembers: [primaryName, ...partyNames],
      }
    } catch {
      return null
    }
  }, [searchParams])
}
