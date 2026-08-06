import type { Handler } from '@netlify/functions'

import { adminCorsResponse, adminJson } from './utils/admin-auth'
import { getAllSpeechDocuments } from './utils/speech-documents'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'GET') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  try {
    const documents = (await getAllSpeechDocuments()).filter(
      (document) =>
        Boolean(document.speakerKey) &&
        document.translationStatus === 'success' &&
        Boolean(document.translatedText)
    )

    return adminJson(200, {
      ok: true,
      documents,
    })
  } catch (error) {
    console.error('Failed to load public speech documents:', error)
    return adminJson(500, { ok: false, error: 'Failed to load public speech documents' })
  }
}
