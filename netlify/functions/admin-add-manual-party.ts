import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'
import { createManualParty, type ManualRsvpPartyGuest } from './utils/manual-rsvp-parties'

/**
 * Admin endpoint to manually add a party that never submitted the real RSVP
 * form, so it can be selected and sent a Final RSVP invitation like any
 * other confirmed guest.
 *
 * POST /api/admin-add-manual-party — Protected by admin JWT
 *
 * Body: { firstName: string; email: string; guests?: Array<{ name: string }> }
 */

const MAX_GUESTS = 30
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AddManualPartyBody {
  firstName?: unknown
  email?: unknown
  guests?: Array<{ name?: unknown }>
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

  let body: AddManualPartyBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { firstName, email, guests } = body

  if (typeof firstName !== 'string' || !firstName.trim()) {
    return adminJson(400, { ok: false, error: 'firstName is required' })
  }

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return adminJson(400, { ok: false, error: 'A valid email is required' })
  }

  if (guests !== undefined && !Array.isArray(guests)) {
    return adminJson(400, { ok: false, error: 'guests must be an array' })
  }

  if (Array.isArray(guests) && guests.length > MAX_GUESTS) {
    return adminJson(400, { ok: false, error: `guests cannot exceed ${MAX_GUESTS} entries` })
  }

  const sanitizedGuests: ManualRsvpPartyGuest[] = (guests || [])
    .filter((g) => typeof g.name === 'string' && g.name.trim())
    .map((g) => ({ name: (g.name as string).trim() }))

  try {
    const party = await createManualParty(
      firstName.trim(),
      email.trim().toLowerCase(),
      sanitizedGuests
    )
    return adminJson(200, { ok: true, party })
  } catch (error) {
    console.error('Failed to create manual party:', error)
    return adminJson(500, { ok: false, error: 'Failed to add party' })
  }
}
