import {
  isSpeechSpeakerKey,
  type SpeechSpeakerKey,
} from '../../../src/config/speeches'

const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PDF_MIME_TYPE = 'application/pdf'
const EMAIL_PATTERN = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/
const GOOGLE_DOC_URL_PATTERN = /https:\/\/docs\.google\.com\/document\/d\/([^\s/?#<>]+)/gi

export interface GmailMessageHeader {
  name?: string
  value?: string
}

export interface GmailMessagePart {
  mimeType?: string
  filename?: string
  headers?: GmailMessageHeader[]
  body?: {
    attachmentId?: string
    data?: string
    size?: number
  }
  parts?: GmailMessagePart[]
}

export interface GmailMessage {
  id?: string
  payload?: GmailMessagePart
}

export type GmailSpeechSource =
  | {
      kind: 'attachment'
      attachmentId: string
      fileName: string
      mimeType: string
      size: number
      docType: 'docx' | 'pdf'
    }
  | {
      kind: 'google-doc'
      documentId: string
      sourceUrl: string
      docType: 'google-doc'
    }
  | {
      kind: 'body'
      text: string
      docType: 'text'
    }

export type GmailSpeechMessageResult =
  | {
      ok: true
      messageId: string
      speakerKey: SpeechSpeakerKey
      source: GmailSpeechSource
    }
  | {
      ok: false
      code:
        | 'invalid_message'
        | 'sender_not_allowed'
        | 'ambiguous_sources'
        | 'no_supported_source'
      error: string
    }

export function parseGmailSpeakerMap(raw: string): Map<string, SpeechSpeakerKey> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Gmail speaker map must be valid JSON')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Gmail speaker map must be an email-to-speaker-key object')
  }

  const result = new Map<string, SpeechSpeakerKey>()
  for (const [rawEmail, speakerKey] of Object.entries(parsed)) {
    const email = rawEmail.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error('Gmail speaker map contains an invalid email address')
    }
    if (!isSpeechSpeakerKey(speakerKey)) {
      throw new Error('Gmail speaker map contains an invalid speaker key')
    }
    if (result.has(email)) {
      throw new Error('Gmail speaker map contains a duplicate email address')
    }
    result.set(email, speakerKey)
  }

  if (result.size === 0) {
    throw new Error('Gmail speaker map must contain at least one speaker')
  }

  return result
}

function decodeBase64Url(value: string): string {
  try {
    return Buffer.from(value, 'base64url').toString('utf-8')
  } catch {
    return ''
  }
}

function extractFromAddress(value: string): string | null {
  const angleMatch = value.match(/<([^<>]+)>/)
  const candidate = (angleMatch?.[1] || value).trim().toLowerCase()
  return EMAIL_PATTERN.test(candidate) ? candidate : null
}

function getHeader(headers: GmailMessageHeader[] | undefined, name: string): string {
  const header = headers?.find(
    (entry) => typeof entry.name === 'string' && entry.name.toLowerCase() === name.toLowerCase()
  )
  return typeof header?.value === 'string' ? header.value : ''
}

interface MessageCandidates {
  attachments: Extract<GmailSpeechSource, { kind: 'attachment' }>[]
  googleDocs: Extract<GmailSpeechSource, { kind: 'google-doc' }>[]
  plainTextBodies: string[]
}

function collectGoogleDocs(text: string, candidates: MessageCandidates): void {
  for (const match of text.matchAll(GOOGLE_DOC_URL_PATTERN)) {
    const documentId = match[1]
    const sourceUrl = match[0]
    if (!documentId || !sourceUrl) continue
    if (candidates.googleDocs.some((candidate) => candidate.documentId === documentId)) continue
    candidates.googleDocs.push({
      kind: 'google-doc',
      documentId,
      sourceUrl,
      docType: 'google-doc',
    })
  }
}

function collectCandidates(part: GmailMessagePart, candidates: MessageCandidates): void {
  const mimeType = (part.mimeType || '').toLowerCase()
  const fileName = (part.filename || '').trim()
  const attachmentId = part.body?.attachmentId

  if (attachmentId && fileName) {
    const lowerName = fileName.toLowerCase()
    if (mimeType === DOCX_MIME_TYPE && lowerName.endsWith('.docx')) {
      candidates.attachments.push({
        kind: 'attachment',
        attachmentId,
        fileName,
        mimeType: DOCX_MIME_TYPE,
        size: part.body?.size || 0,
        docType: 'docx',
      })
    } else if (mimeType === PDF_MIME_TYPE && lowerName.endsWith('.pdf')) {
      candidates.attachments.push({
        kind: 'attachment',
        attachmentId,
        fileName,
        mimeType: PDF_MIME_TYPE,
        size: part.body?.size || 0,
        docType: 'pdf',
      })
    }
  }

  if (mimeType === 'text/plain' && part.body?.data) {
    const text = decodeBase64Url(part.body.data).trim()
    if (text) {
      candidates.plainTextBodies.push(text)
      collectGoogleDocs(text, candidates)
    }
  }

  for (const child of part.parts || []) {
    collectCandidates(child, candidates)
  }
}

export function parseSpeechMessage(
  message: GmailMessage,
  speakerMap: ReadonlyMap<string, SpeechSpeakerKey>
): GmailSpeechMessageResult {
  const messageId = typeof message.id === 'string' ? message.id.trim() : ''
  if (!messageId || !message.payload) {
    return { ok: false, code: 'invalid_message', error: 'Gmail message payload is invalid' }
  }

  const fromAddress = extractFromAddress(getHeader(message.payload.headers, 'from'))
  const speakerKey = fromAddress ? speakerMap.get(fromAddress) : undefined
  if (!speakerKey) {
    return {
      ok: false,
      code: 'sender_not_allowed',
      error: 'Message sender is not configured as a speech speaker',
    }
  }

  const candidates: MessageCandidates = {
    attachments: [],
    googleDocs: [],
    plainTextBodies: [],
  }
  collectCandidates(message.payload, candidates)

  const primarySources: GmailSpeechSource[] = [
    ...candidates.attachments,
    ...candidates.googleDocs,
  ]
  if (primarySources.length > 1) {
    return {
      ok: false,
      code: 'ambiguous_sources',
      error: 'Message contains multiple supported speech sources',
    }
  }

  const source = primarySources[0]
  if (source) {
    return { ok: true, messageId, speakerKey, source }
  }

  const bodyText = candidates.plainTextBodies.join('\n\n').trim()
  if (!bodyText) {
    return {
      ok: false,
      code: 'no_supported_source',
      error: 'Message does not contain a supported speech source',
    }
  }

  return {
    ok: true,
    messageId,
    speakerKey,
    source: {
      kind: 'body',
      text: bodyText,
      docType: 'text',
    },
  }
}
