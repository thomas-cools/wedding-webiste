import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import { getSpeechDocumentById, saveSpeechDocument } from './utils/speech-documents'
import { isSpeechSpeakerKey } from '../../src/config/speeches'

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

  let id: string
  let speakerKey: string

  try {
    const body = JSON.parse(event.body || '{}') as Record<string, unknown>
    id = typeof body.id === 'string' ? body.id.trim() : ''
    speakerKey = typeof body.speakerKey === 'string' ? body.speakerKey.trim() : ''
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  if (!id) {
    return adminJson(400, { ok: false, error: 'Missing document id' })
  }

  if (!speakerKey || !isSpeechSpeakerKey(speakerKey)) {
    return adminJson(400, { ok: false, error: 'Invalid speakerKey' })
  }

  const doc = await getSpeechDocumentById(id)
  if (!doc) {
    return adminJson(404, { ok: false, error: 'Document not found' })
  }

  const updated = { ...doc, speakerKey }
  await saveSpeechDocument(updated)

  return adminJson(200, { ok: true, document: updated })
}
