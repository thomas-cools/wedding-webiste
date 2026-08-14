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
  syncGmailSpeeches,
} from './utils/gmail-speeches'

interface SyncBody {
  action?: unknown
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return adminCorsResponse()
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const payload = verifyAdminRequest(event.headers as Record<string, string | undefined>)
  if (!payload) return adminUnauthorized()

  try {
    if (event.httpMethod === 'POST') {
      let body: SyncBody = {}
      if (event.body) {
        try {
          body = JSON.parse(event.body) as SyncBody
        } catch {
          return adminJson(400, { ok: false, error: 'Invalid JSON body' })
        }
      }

      const action = body.action === undefined ? 'retry' : body.action
      if (action !== 'sync' && action !== 'retry') {
        return adminJson(400, { ok: false, error: 'action must be sync or retry' })
      }

      const sync = action === 'sync'
        ? await syncGmailSpeeches()
        : await retryFailedGmailSpeeches()
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