import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import { getSpeechDocumentById, getSpeechDocumentFile } from './utils/speech-documents'

function sanitizeDownloadFileName(name: string): string {
  return name.replace(/[\r\n]/g, ' ').replace(/["\\]/g, '').trim() || 'speech-document.docx'
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

  const id = (event.queryStringParameters?.id || '').trim()
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

    if (document.sourceKind !== 'upload' || !document.storageKey) {
      return adminJson(400, { ok: false, error: 'Document is not an uploaded file' })
    }

    const bytes = await getSpeechDocumentFile(document.storageKey)
    if (!bytes) {
      return adminJson(404, { ok: false, error: 'Uploaded file payload not found' })
    }

    const fallbackName = `${document.fileName || 'speech-document'}.docx`
    const downloadName = sanitizeDownloadFileName(document.originalFileName || fallbackName)

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': document.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${downloadName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: Buffer.from(bytes).toString('base64'),
    }
  } catch (error) {
    console.error('Failed to read uploaded speech document file:', error)
    return adminJson(500, { ok: false, error: 'Failed to read uploaded speech document file' })
  }
}
