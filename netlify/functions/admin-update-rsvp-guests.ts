import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'
import {
  saveGuestOverride,
  normalizeOverrideKey,
  type EditableGuest,
} from './utils/rsvp-guest-overrides'

/**
 * Admin endpoint to edit an RSVP party's guest (plus-ones) list.
 *
 * POST /api/admin-update-rsvp-guests — Protected by admin JWT
 *
 * Body: { email: string; guests: Array<{ name: string; age?: string; dietary?: string }> }
 *
 * Netlify Forms submissions are read-only, so this persists the edited guest
 * list to Netlify Blobs, keyed by the party's email. `admin-rsvps.ts` merges
 * it back in on every fetch, fully replacing the original submission's
 * `guests` array for that party.
 */

const MAX_GUESTS = 30

interface UpdateRsvpGuestsBody {
  email?: string
  guests?: Array<{ name?: unknown; age?: unknown; dietary?: unknown }>
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'POST') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const payload = verifyAdminRequest(
    event.headers as Record<string, string | undefined>
  )
  if (!payload) {
    return adminUnauthorized()
  }

  let body: UpdateRsvpGuestsBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { email, guests } = body

  if (!email || typeof email !== 'string' || !email.trim()) {
    return adminJson(400, { ok: false, error: 'email is required' })
  }

  if (!Array.isArray(guests)) {
    return adminJson(400, { ok: false, error: 'guests must be an array' })
  }

  if (guests.length > MAX_GUESTS) {
    return adminJson(400, { ok: false, error: `guests cannot exceed ${MAX_GUESTS} entries` })
  }

  const sanitizedGuests: EditableGuest[] = guests
    .filter((g) => typeof g.name === 'string' && g.name.trim())
    .map((g) => {
      const guest: EditableGuest = { name: (g.name as string).trim() }
      if (typeof g.age === 'string' && g.age.trim()) guest.age = g.age.trim()
      if (typeof g.dietary === 'string' && g.dietary.trim()) guest.dietary = g.dietary.trim()
      return guest
    })

  try {
    const override = await saveGuestOverride(normalizeOverrideKey(email), sanitizedGuests)
    return adminJson(200, {
      ok: true,
      guests: override.guests,
      updatedAt: override.updatedAt,
    })
  } catch (error) {
    console.error('Failed to save guest override:', error)
    return adminJson(500, { ok: false, error: 'Failed to save guest changes' })
  }
}
