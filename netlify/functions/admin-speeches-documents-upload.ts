import { randomUUID } from 'node:crypto'
import type { Handler } from '@netlify/functions'

import {
  adminCorsResponse,
  adminJson,
  adminUnauthorized,
  verifyAdminRequest,
} from './utils/admin-auth'
import {
  buildSpeechDocumentStorageKey,
  deleteSpeechDocumentFile,
  saveSpeechDocument,
  saveSpeechDocumentFile,
} from './utils/speech-documents'
import { validateSpeechDocumentUpload } from './utils/speech-documents-security'

function getHeader(headers: Record<string, string | undefined>, name: string): string {
  const needle = name.toLowerCase()
  const matchedKey = Object.keys(headers).find((key) => key.toLowerCase() === needle)
  if (!matchedKey) return ''
  return headers[matchedKey] || ''
}

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

  const headers = event.headers as Record<string, string | undefined>
  const contentType = getHeader(headers, 'content-type')
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return adminJson(400, { ok: false, error: 'Expected multipart/form-data payload' })
  }

  let formData: FormData
  try {
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf-8')

    const request = new Request('https://example.local/upload', {
      method: 'POST',
      headers: {
        'content-type': contentType,
      },
      body: bodyBuffer,
    })

    formData = await request.formData()
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid multipart request body' })
  }

  const uploadedFile = formData.get('file')
  const fileNameValue = formData.get('fileName')

  if (!(uploadedFile instanceof File)) {
    return adminJson(400, { ok: false, error: 'file is required' })
  }

  const bytes = new Uint8Array(await uploadedFile.arrayBuffer())
  const validation = validateSpeechDocumentUpload({
    fileName: fileNameValue,
    originalFileName: uploadedFile.name,
    mimeType: uploadedFile.type,
    fileSizeBytes: uploadedFile.size,
    fileBytes: bytes,
  })

  if (!validation.ok) {
    console.warn('Rejected speech document upload', {
      reason: validation.error,
    })
    return adminJson(400, { ok: false, error: validation.error })
  }

  const id = randomUUID()
  const storageKey = buildSpeechDocumentStorageKey(id)
  const document = {
    id,
    fileName: validation.fileName,
    sourceKind: 'upload' as const,
    storageKey,
    fileSizeBytes: validation.fileSizeBytes,
    mimeType: validation.mimeType,
    originalFileName: validation.originalFileName,
    docType: 'docx' as const,
    createdAt: new Date().toISOString(),
    createdBy: payload.sub,
  }

  try {
    await saveSpeechDocumentFile(storageKey, bytes)
    await saveSpeechDocument(document)
  } catch (error) {
    try {
      await deleteSpeechDocumentFile(storageKey)
    } catch {
      // Best effort cleanup; preserve original error response.
    }

    console.error('Failed to save uploaded speech document:', error)
    return adminJson(500, { ok: false, error: 'Failed to save uploaded speech document' })
  }

  console.info('Accepted speech document upload', {
    type: document.docType,
    sizeBucket: sizeBucket(document.fileSizeBytes),
    sourceKind: document.sourceKind,
  })

  return adminJson(200, {
    ok: true,
    document,
  })
}
