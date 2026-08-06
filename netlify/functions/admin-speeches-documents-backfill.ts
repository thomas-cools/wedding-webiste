import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import { backfillSpeechDocumentSpeakerKeys } from './utils/speech-documents'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'POST') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const payload = verifyAdminRequest(event.headers as Record<string, string | undefined>)
  if (!payload) {
    return adminUnauthorized()
  }

  try {
    const result = await backfillSpeechDocumentSpeakerKeys()
    return adminJson(200, {
      ok: true,
      total: result.total,
      backfilled: result.backfilled,
      requestedBy: payload.sub,
    })
  } catch (error) {
    console.error('Failed to backfill speech speaker keys:', error)
    return adminJson(500, { ok: false, error: 'Failed to backfill speech speaker keys' })
  }
}
