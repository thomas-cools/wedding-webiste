import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'
import { saveEmailOverride } from './utils/rsvp-email-overrides'
import { migrateGuestOverrideKey } from './utils/rsvp-guest-overrides'

/**
 * Admin endpoint to correct an RSVP party's email address (e.g. a typo made
 * at submission time).
 *
 * POST /api/admin-update-rsvp-email — Protected by admin JWT
 *
 * Body: { id: string; oldEmail?: string; newEmail: string }
 *
 * Netlify Forms submissions are read-only, so this persists the correction to
 * Netlify Blobs, keyed by the submission's stable id. `admin-rsvps.ts` applies
 * it before deduplicating submissions by email. If `oldEmail` is provided and
 * differs from `newEmail`, any existing guest-list override tied to the old
 * email is migrated to the new one so it isn't orphaned.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface UpdateRsvpEmailBody {
  id?: string
  oldEmail?: string
  newEmail?: string
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

  let body: UpdateRsvpEmailBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { id, oldEmail, newEmail } = body

  if (!id || typeof id !== 'string' || !id.trim()) {
    return adminJson(400, { ok: false, error: 'id is required' })
  }

  if (!newEmail || typeof newEmail !== 'string' || !EMAIL_REGEX.test(newEmail.trim())) {
    return adminJson(400, { ok: false, error: 'A valid newEmail is required' })
  }

  const normalizedNewEmail = newEmail.trim().toLowerCase()

  try {
    const override = await saveEmailOverride(id.trim(), normalizedNewEmail)

    if (typeof oldEmail === 'string' && oldEmail.trim()) {
      const normalizedOldEmail = oldEmail.trim().toLowerCase()
      if (normalizedOldEmail !== normalizedNewEmail) {
        await migrateGuestOverrideKey(normalizedOldEmail, normalizedNewEmail)
      }
    }

    return adminJson(200, {
      ok: true,
      email: override.email,
      updatedAt: override.updatedAt,
    })
  } catch (error) {
    console.error('Failed to save email override:', error)
    return adminJson(500, { ok: false, error: 'Failed to save email changes' })
  }
}
