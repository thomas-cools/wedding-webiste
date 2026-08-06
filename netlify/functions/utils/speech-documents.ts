import { getStore } from '@netlify/blobs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { inferSpeechSpeakerKeyFromLabel, type SpeechSpeakerKey } from '../../../src/config/speeches'

const STORE_NAME = 'speech-documents'
const FILES_PREFIX = 'files/'

export type SpeechDocumentType = 'pdf' | 'docx' | 'google-doc'
export type SpeechDocumentSourceKind = 'url' | 'upload'
export type SpeechDocumentLanguage = 'en' | 'es'
export type SpeechTranslationStatus = 'success' | 'failed' | 'skipped'

export interface SpeechDocument {
  id: string
  fileName: string
  speakerKey?: SpeechSpeakerKey
  sourceUrl?: string
  sourceHost?: string
  sourceKind?: SpeechDocumentSourceKind
  storageKey?: string
  mimeType?: string
  originalFileName?: string
  fileSizeBytes: number
  docType: SpeechDocumentType
  sourceText?: string
  translatedText?: string
  detectedLanguage?: SpeechDocumentLanguage
  translatedLanguage?: SpeechDocumentLanguage
  translationStatus?: SpeechTranslationStatus
  translationProvider?: 'gemini'
  translatedAt?: string
  translationError?: string
  createdAt: string
  createdBy: string
}

interface LocalSpeechDocumentsStore {
  documents: SpeechDocument[]
}

function getSpeechDocumentsStore() {
  const siteID = process.env.SITE_ID
  const token = process.env.NETLIFY_API_TOKEN
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token })
  }
  return getStore(STORE_NAME)
}

function isNetlifyDev(): boolean {
  return process.env.NETLIFY_DEV === 'true'
}

function getLocalStorePath(): string {
  if (process.env.SPEECH_DOC_LOCAL_STORE_PATH) {
    return process.env.SPEECH_DOC_LOCAL_STORE_PATH
  }

  return path.join(process.cwd(), '.netlify', 'state', 'speech-documents.json')
}

function getLocalFilesDirectory(): string {
  const localStorePath = getLocalStorePath()
  return path.join(path.dirname(localStorePath), 'speech-documents-files')
}

function getLocalFilePath(storageKey: string): string {
  const normalized = storageKey.replace(/^\/+/, '')
  return path.join(getLocalFilesDirectory(), normalized)
}

async function readLocalStore(): Promise<LocalSpeechDocumentsStore> {
  const localPath = getLocalStorePath()
  try {
    const content = await readFile(localPath, 'utf-8')
    const parsed = JSON.parse(content) as LocalSpeechDocumentsStore
    if (!Array.isArray(parsed.documents)) {
      return { documents: [] }
    }
    return { documents: parsed.documents }
  } catch {
    return { documents: [] }
  }
}

async function writeLocalStore(store: LocalSpeechDocumentsStore): Promise<void> {
  const localPath = getLocalStorePath()
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, JSON.stringify(store, null, 2), 'utf-8')
}

function sortDocuments(documents: SpeechDocument[]): SpeechDocument[] {
  return documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function normalizeDocument(entry: SpeechDocument): SpeechDocument {
  return {
    ...entry,
    sourceKind: entry.sourceKind || 'url',
  }
}

function withLegacySpeakerKey(entry: SpeechDocument): SpeechDocument {
  if (entry.speakerKey) {
    return entry
  }

  const inferredSpeakerKey = inferSpeechSpeakerKeyFromLabel(entry.fileName)
  if (!inferredSpeakerKey) {
    return entry
  }

  return {
    ...entry,
    speakerKey: inferredSpeakerKey,
  }
}

export interface SpeechSpeakerBackfillResult {
  total: number
  backfilled: number
  documents: SpeechDocument[]
}

async function persistSpeakerKeyBackfill(document: SpeechDocument): Promise<void> {
  await saveSpeechDocument(document)
}

async function backfillDocuments(documents: SpeechDocument[]): Promise<SpeechSpeakerBackfillResult> {
  const normalized = documents.map(normalizeDocument)
  const backfilledDocuments = normalized.map(withLegacySpeakerKey)

  const documentsToPersist = backfilledDocuments.filter(
    (document, index) => document.speakerKey && normalized[index]?.speakerKey !== document.speakerKey
  )

  await Promise.all(documentsToPersist.map((document) => persistSpeakerKeyBackfill(document)))

  return {
    total: normalized.length,
    backfilled: documentsToPersist.length,
    documents: sortDocuments(backfilledDocuments),
  }
}

export function buildSpeechDocumentStorageKey(documentId: string): string {
  return `${FILES_PREFIX}${documentId}.docx`
}

export async function getAllSpeechDocuments(): Promise<SpeechDocument[]> {
  const store = getSpeechDocumentsStore()

  try {
    const { blobs } = await store.list()

    const entries = await Promise.all(
      blobs.map(async (blob) => {
        const data = await store.get(blob.key, { type: 'json' })
        return data as SpeechDocument | null
      })
    )

    const { documents } = await backfillDocuments(entries.filter((entry): entry is SpeechDocument => entry != null))
    return documents
  } catch (error) {
    if (!isNetlifyDev()) throw error
    const localStore = await readLocalStore()
    const { documents, backfilled } = await backfillDocuments(localStore.documents)

    if (backfilled > 0) {
      await writeLocalStore({
        documents,
      })
    }

    return documents
  }
}

export async function backfillSpeechDocumentSpeakerKeys(): Promise<SpeechSpeakerBackfillResult> {
  const store = getSpeechDocumentsStore()

  try {
    const { blobs } = await store.list()
    const entries = await Promise.all(
      blobs.map(async (blob) => {
        const data = await store.get(blob.key, { type: 'json' })
        return data as SpeechDocument | null
      })
    )

    return backfillDocuments(entries.filter((entry): entry is SpeechDocument => entry != null))
  } catch (error) {
    if (!isNetlifyDev()) throw error

    const localStore = await readLocalStore()
    const result = await backfillDocuments(localStore.documents)
    if (result.backfilled > 0) {
      await writeLocalStore({ documents: result.documents })
    }
    return result
  }
}

export async function getSpeechDocumentById(id: string): Promise<SpeechDocument | null> {
  const store = getSpeechDocumentsStore()

  try {
    const data = await store.get(id, { type: 'json' })
    if (!data) return null
    return normalizeDocument(data as SpeechDocument)
  } catch (error) {
    if (!isNetlifyDev()) throw error
    const localStore = await readLocalStore()
    return localStore.documents.find((entry) => entry.id === id) || null
  }
}

export async function saveSpeechDocument(document: SpeechDocument): Promise<void> {
  const store = getSpeechDocumentsStore()

  try {
    await store.setJSON(document.id, document)
  } catch (error) {
    if (!isNetlifyDev()) throw error

    const localStore = await readLocalStore()
    const withoutExisting = localStore.documents.filter((entry) => entry.id !== document.id)
    await writeLocalStore({ documents: [...withoutExisting, document] })
  }
}

export async function deleteSpeechDocument(id: string): Promise<boolean> {
  const store = getSpeechDocumentsStore()

  try {
    const existing = await store.get(id, { type: 'json' })
    if (existing == null) {
      return false
    }

    await store.delete(id)
    return true
  } catch (error) {
    if (!isNetlifyDev()) throw error

    const localStore = await readLocalStore()
    const nextDocuments = localStore.documents.filter((entry) => entry.id !== id)
    const wasDeleted = nextDocuments.length !== localStore.documents.length
    if (wasDeleted) {
      await writeLocalStore({ documents: nextDocuments })
    }
    return wasDeleted
  }
}

export async function saveSpeechDocumentFile(storageKey: string, bytes: Uint8Array): Promise<void> {
  const store = getSpeechDocumentsStore()

  try {
    const arrayBuffer = Uint8Array.from(bytes).buffer
    await store.set(storageKey, arrayBuffer, {
      metadata: {
        kind: 'speech-document-file',
      },
    })
  } catch (error) {
    if (!isNetlifyDev()) throw error

    const localFilePath = getLocalFilePath(storageKey)
    await mkdir(path.dirname(localFilePath), { recursive: true })
    await writeFile(localFilePath, bytes)
  }
}

export async function getSpeechDocumentFile(storageKey: string): Promise<Uint8Array | null> {
  const store = getSpeechDocumentsStore()

  try {
    const payload = await store.get(storageKey, { type: 'arrayBuffer' })
    if (!payload) return null
    return new Uint8Array(payload)
  } catch (error) {
    if (!isNetlifyDev()) throw error

    try {
      const localFilePath = getLocalFilePath(storageKey)
      return await readFile(localFilePath)
    } catch {
      return null
    }
  }
}

export async function deleteSpeechDocumentFile(storageKey: string): Promise<boolean> {
  const store = getSpeechDocumentsStore()

  try {
    const existing = await store.get(storageKey)
    if (!existing) return false
    await store.delete(storageKey)
    return true
  } catch (error) {
    if (!isNetlifyDev()) throw error

    try {
      const localFilePath = getLocalFilePath(storageKey)
      await unlink(localFilePath)
      return true
    } catch {
      return false
    }
  }
}
