import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import { getAllSpeechDocuments } from './utils/speech-documents'
import {
  getSpeechDocumentLimits,
  resolveAllowedSpeechDocumentHosts,
} from './utils/speech-documents-security'

function isMissingSpeechDocumentsStoreError(error: unknown): boolean {
  const maybeObject = error as { status?: unknown; statusCode?: unknown; message?: unknown }
  const status = Number(maybeObject?.status ?? maybeObject?.statusCode)
  if (status === 404) return true

  const message = String(maybeObject?.message ?? '').toLowerCase()
  return (
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('does not exist') ||
    message.includes('no such')
  )
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'GET') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const payload = verifyAdminRequest(event.headers as Record<string, string | undefined>)
  if (!payload) {
    return adminUnauthorized()
  }

  try {
    const documents = await getAllSpeechDocuments()
    return adminJson(200, {
      ok: true,
      documents,
      limits: getSpeechDocumentLimits(),
      allowedHosts: resolveAllowedSpeechDocumentHosts(),
      requestedBy: payload.sub,
    })
  } catch (error) {
    if (isMissingSpeechDocumentsStoreError(error)) {
      return adminJson(200, {
        ok: true,
        documents: [],
        limits: getSpeechDocumentLimits(),
        allowedHosts: resolveAllowedSpeechDocumentHosts(),
        requestedBy: payload.sub,
      })
    }

    console.error('Failed to load speech documents:', error)
    return adminJson(500, { ok: false, error: 'Failed to load speech documents' })
  }
}
