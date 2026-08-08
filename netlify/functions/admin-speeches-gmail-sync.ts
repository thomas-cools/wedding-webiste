import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import {
  getGmailSpeechSyncStatus,
  retryFailedGmailSpeeches,
} from './utils/gmail-speeches'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return adminCorsResponse()
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const payload = verifyAdminRequest(event.headers as Record<string, string | undefined>)
  if (!payload) return adminUnauthorized()

  try {
    if (event.httpMethod === 'POST') {
      const sync = await retryFailedGmailSpeeches()
      return adminJson(200, { ok: true, sync, requestedBy: payload.sub })
    }

    const status = await getGmailSpeechSyncStatus()
    return adminJson(200, { ok: true, status, requestedBy: payload.sub })
  } catch (error) {
    console.error('Failed to manage Gmail speech sync', {
      error: error instanceof Error ? error.message : 'Unknown sync error',
    })
    return adminJson(500, { ok: false, error: 'Failed to manage Gmail speech sync' })
  }
}