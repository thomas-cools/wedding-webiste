import { randomUUID } from 'node:crypto'
import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import { saveSpeechDocument } from './utils/speech-documents'
import {
  probeSpeechDocumentSource,
  type SpeechDocumentInput,
  resolveAllowedSpeechDocumentHosts,
  validateSpeechDocumentInput,
} from './utils/speech-documents-security'

function sizeBucket(bytes: number): string {
  if (bytes < 250 * 1024) return '<250KB'
  if (bytes < 500 * 1024) return '250KB-499KB'
  if (bytes < 750 * 1024) return '500KB-749KB'
  return '750KB-1MB'
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

  let body: SpeechDocumentInput
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const allowedHosts = resolveAllowedSpeechDocumentHosts()
  const validation = validateSpeechDocumentInput(body, allowedHosts)
  if (!validation.ok) {
    console.warn('Rejected speech document submission', {
      reason: validation.error,
    })
    return adminJson(400, { ok: false, error: validation.error })
  }

  const probeResult = await probeSpeechDocumentSource(validation.normalizedUrl, validation.docType)
  if (!probeResult.ok) {
    console.warn('Rejected speech document submission', {
      reason: probeResult.error,
      sourceHost: validation.sourceHost,
      type: validation.docType,
    })
    return adminJson(400, { ok: false, error: probeResult.error })
  }

  const document = {
    id: randomUUID(),
    fileName: validation.fileName,
    sourceKind: 'url' as const,
    sourceUrl: validation.normalizedUrl,
    sourceHost: validation.sourceHost,
    fileSizeBytes: probeResult.fileSizeBytes,
    docType: validation.docType,
    createdAt: new Date().toISOString(),
    createdBy: payload.sub,
  }

  try {
    await saveSpeechDocument(document)
    console.info('Accepted speech document submission', {
      type: document.docType,
      sizeBucket: sizeBucket(document.fileSizeBytes),
      sourceHost: document.sourceHost,
    })

    return adminJson(200, {
      ok: true,
      document,
    })
  } catch (error) {
    console.error('Failed to save speech document:', error)
    return adminJson(500, { ok: false, error: 'Failed to save speech document' })
  }
}
