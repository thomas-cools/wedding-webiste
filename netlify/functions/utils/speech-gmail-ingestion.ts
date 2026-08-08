import { randomUUID } from 'node:crypto'

import {
  getSpeechSpeakerByKey,
  type SpeechSpeakerKey,
} from '../../../src/config/speeches'
import {
  buildSpeechDocumentStorageKey,
  deleteSpeechDocumentFile,
  getSpeechDocumentById,
  saveSpeechDocument,
  saveSpeechDocumentFile,
  type SpeechDocument,
} from './speech-documents'
import {
  extractSpeechTextFromDocxBytes,
  extractSpeechTextFromPdfBytes,
  extractSpeechTextFromPlainText,
  type SpeechTextExtractionResult,
} from './speech-document-content'
import { validateSpeechDocumentBinary } from './speech-documents-security'
import { translateSpeechContentWithGemini } from './speech-translation'

export type GmailSpeechIngestionSource =
  | {
      kind: 'attachment'
      fileName: string
      mimeType: string
      bytes: Uint8Array
    }
  | {
      kind: 'google-doc'
      text: string
    }
  | {
      kind: 'body'
      text: string
    }

export interface GmailSpeechIngestionInput {
  messageId: string
  speakerKey: SpeechSpeakerKey
  source: GmailSpeechIngestionSource
}

interface PreparedSource {
  extraction: SpeechTextExtractionResult
  docType: 'docx' | 'pdf' | 'google-doc' | 'text'
  sourceSubtype: 'docx' | 'pdf' | 'google-doc' | 'body'
  bytes?: Uint8Array
  mimeType?: string
  originalFileName?: string
  fileSizeBytes: number
}

function stableDocumentId(speakerKey: SpeechSpeakerKey): string {
  return `gmail-${speakerKey}`
}

function prepareSource(
  input: GmailSpeechIngestionInput,
  displayName: string
): PreparedSource {
  if (input.source.kind === 'body') {
    return {
      extraction: extractSpeechTextFromPlainText(input.source.text),
      docType: 'text',
      sourceSubtype: 'body',
      fileSizeBytes: Buffer.byteLength(input.source.text, 'utf-8'),
    }
  }

  if (input.source.kind === 'google-doc') {
    return {
      extraction: extractSpeechTextFromPlainText(input.source.text),
      docType: 'google-doc',
      sourceSubtype: 'google-doc',
      fileSizeBytes: Buffer.byteLength(input.source.text, 'utf-8'),
    }
  }

  const validation = validateSpeechDocumentBinary({
    fileName: `${displayName} Speech`,
    speakerKey: input.speakerKey,
    originalFileName: input.source.fileName,
    mimeType: input.source.mimeType,
    fileSizeBytes: input.source.bytes.byteLength,
    fileBytes: input.source.bytes,
  })
  if (!validation.ok) {
    throw new Error(validation.error)
  }

  return {
    extraction:
      validation.docType === 'docx'
        ? extractSpeechTextFromDocxBytes(input.source.bytes)
        : extractSpeechTextFromPdfBytes(input.source.bytes),
    docType: validation.docType,
    sourceSubtype: validation.docType,
    bytes: input.source.bytes,
    mimeType: validation.mimeType,
    originalFileName: validation.originalFileName,
    fileSizeBytes: validation.fileSizeBytes,
  }
}

export async function ingestGmailSpeech(
  input: GmailSpeechIngestionInput
): Promise<SpeechDocument> {
  const speaker = getSpeechSpeakerByKey(input.speakerKey)
  if (!speaker) {
    throw new Error('Speech speaker is not configured')
  }

  const prepared = prepareSource(input, speaker.label)
  const extraction = await prepared.extraction
  if (!extraction.ok) {
    throw new Error(extraction.error)
  }

  const translation = await translateSpeechContentWithGemini(
    extraction.text,
    extraction.detectedLanguage
  )
  const id = stableDocumentId(input.speakerKey)
  const previous = await getSpeechDocumentById(id)
  const version = randomUUID()
  const storageKey = prepared.bytes
    ? buildSpeechDocumentStorageKey(id, prepared.docType as 'docx' | 'pdf', version)
    : undefined
  const now = new Date().toISOString()

  const document: SpeechDocument = {
    id,
    fileName: `${speaker.label} Speech`,
    speakerKey: input.speakerKey,
    sourceKind: 'gmail',
    sourceSubtype: prepared.sourceSubtype,
    storageKey,
    fileSizeBytes: prepared.fileSizeBytes,
    mimeType: prepared.mimeType,
    originalFileName: prepared.originalFileName,
    docType: prepared.docType,
    sourceText: extraction.text,
    translatedText: translation.status === 'success' ? translation.translatedText : undefined,
    detectedLanguage:
      translation.status === 'success'
        ? translation.detectedSourceLanguage
        : extraction.detectedLanguage || undefined,
    translatedLanguage: translation.status === 'success' ? translation.targetLanguage : undefined,
    translationStatus: translation.status,
    translationProvider: translation.status === 'success' ? translation.provider : undefined,
    translatedAt: translation.status === 'success' ? translation.translatedAt : undefined,
    translationError: translation.status === 'success' ? undefined : translation.error,
    gmailMessageId: input.messageId,
    ingestedAt: now,
    createdAt: now,
    createdBy: 'gmail-import',
  }

  if (storageKey && prepared.bytes) {
    await saveSpeechDocumentFile(storageKey, prepared.bytes)
  }

  try {
    await saveSpeechDocument(document)
  } catch (error) {
    if (storageKey) {
      try {
        await deleteSpeechDocumentFile(storageKey)
      } catch {
        // Preserve the metadata write failure; staged cleanup is best effort.
      }
    }
    throw error
  }

  if (previous?.storageKey && previous.storageKey !== storageKey) {
    try {
      await deleteSpeechDocumentFile(previous.storageKey)
    } catch {
      // The new record is committed; orphan cleanup can be retried operationally.
    }
  }

  return document
}
