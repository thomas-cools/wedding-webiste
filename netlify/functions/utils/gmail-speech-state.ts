import { getStore } from '@netlify/blobs'

import type { SpeechSpeakerKey } from '../../../src/config/speeches'

const STORE_NAME = 'gmail-speech-ingestion'
const PROCESSING_LEASE_MS = 15 * 60 * 1000

export type GmailSpeechStateStatus = 'processing' | 'processed' | 'failed'

export interface GmailSpeechState {
  messageId: string
  status: GmailSpeechStateStatus
  speakerKey?: SpeechSpeakerKey
  updatedAt: string
  retryCount: number
  errorCode?: string
  error?: string
}

function getStateStore() {
  const siteID = process.env.SITE_ID
  const token = process.env.NETLIFY_API_TOKEN
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token })
  }
  return getStore(STORE_NAME)
}

function stateKey(messageId: string): string {
  return `messages/${messageId}`
}

export async function claimGmailSpeechMessage(messageId: string): Promise<boolean> {
  const store = getStateStore()
  const key = stateKey(messageId)
  const existing = (await store.get(key, { type: 'json' })) as GmailSpeechState | null
  if (existing?.status === 'processed') return false
  if (existing?.status === 'processing') {
    const age = Date.now() - new Date(existing.updatedAt).getTime()
    if (Number.isFinite(age) && age < PROCESSING_LEASE_MS) return false
  }

  await store.setJSON(key, {
    messageId,
    status: 'processing',
    updatedAt: new Date().toISOString(),
    retryCount: existing?.retryCount || 0,
  } satisfies GmailSpeechState)
  return true
}

export async function markGmailSpeechMessage(
  messageId: string,
  status: 'processed' | 'failed',
  options: {
    speakerKey?: SpeechSpeakerKey
    errorCode?: string
    error?: string
  } = {}
): Promise<void> {
  const store = getStateStore()
  const key = stateKey(messageId)
  const existing = (await store.get(key, { type: 'json' })) as GmailSpeechState | null
  await store.setJSON(key, {
    messageId,
    status,
    speakerKey: options.speakerKey,
    updatedAt: new Date().toISOString(),
    retryCount: (existing?.retryCount || 0) + (status === 'failed' ? 1 : 0),
    errorCode: options.errorCode,
    error: options.error,
  } satisfies GmailSpeechState)
}

export async function listGmailSpeechStates(): Promise<GmailSpeechState[]> {
  const store = getStateStore()
  const { blobs } = await store.list({ prefix: 'messages/' })
  const states = await Promise.all(
    blobs.map((blob) => store.get(blob.key, { type: 'json' }) as Promise<GmailSpeechState | null>)
  )
  return states.filter((state): state is GmailSpeechState => Boolean(state))
}

export async function clearFailedGmailSpeechStates(): Promise<string[]> {
  const store = getStateStore()
  const failed = (await listGmailSpeechStates()).filter((state) => state.status === 'failed')
  await Promise.all(failed.map((state) => store.delete(stateKey(state.messageId))))
  return failed.map((state) => state.messageId)
}

export async function deleteGmailSpeechState(messageId: string): Promise<void> {
  await getStateStore().delete(stateKey(messageId))
}
