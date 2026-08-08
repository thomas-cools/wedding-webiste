import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import {
  deleteSpeechDocument,
  deleteSpeechDocumentFile,
  getSpeechDocumentById,
} from './utils/speech-documents'

interface DeleteBody {
  id?: unknown
}

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

  let body: DeleteBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) {
    return adminJson(400, { ok: false, error: 'id is required' })
  }

  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) {
    return adminJson(400, { ok: false, error: 'id format is invalid' })
  }

  try {
    const document = await getSpeechDocumentById(id)
    if (!document) {
      return adminJson(404, { ok: false, error: 'Document not found' })
    }

    if (document.storageKey) {
      await deleteSpeechDocumentFile(document.storageKey)
    }

    const deleted = await deleteSpeechDocument(id)
    if (!deleted) {
      return adminJson(404, { ok: false, error: 'Document not found' })
    }

    return adminJson(200, {
      ok: true,
      id,
      deletedBy: payload.sub,
    })
  } catch (error) {
    console.error('Failed to delete speech document:', error)
    return adminJson(500, { ok: false, error: 'Failed to delete speech document' })
  }
}
