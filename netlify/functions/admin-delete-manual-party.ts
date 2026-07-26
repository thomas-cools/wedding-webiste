import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'
import { deleteManualParty } from './utils/manual-rsvp-parties'

/**
 * Admin endpoint to remove a manually-added party.
 *
 * POST /api/admin-delete-manual-party — Protected by admin JWT
 *
 * Body: { id: string }
 */

interface DeleteManualPartyBody {
  id?: unknown
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

  let body: DeleteManualPartyBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { id } = body

  if (typeof id !== 'string' || !id.trim()) {
    return adminJson(400, { ok: false, error: 'id is required' })
  }

  try {
    await deleteManualParty(id.trim())
    return adminJson(200, { ok: true })
  } catch (error) {
    console.error('Failed to delete manual party:', error)
    return adminJson(500, { ok: false, error: 'Failed to delete party' })
  }
}
