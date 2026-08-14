/**
 * @jest-environment node
 */

const records = new Map<string, unknown>()
const mockGet = jest.fn(async (key: string) => records.get(key) ?? null)
const mockSetJSON = jest.fn(async (key: string, value: unknown) => {
  records.set(key, value)
})
const mockDelete = jest.fn(async (key: string) => records.delete(key))
const mockList = jest.fn(async ({ prefix }: { prefix?: string } = {}) => ({
  blobs: Array.from(records.keys())
    .filter((key) => !prefix || key.startsWith(prefix))
    .map((key) => ({ key })),
}))
const mockGetStore = jest.fn(() => ({
  get: mockGet,
  setJSON: mockSetJSON,
  delete: mockDelete,
  list: mockList,
}))

jest.mock('@netlify/blobs', () => ({
  getStore: (...args: unknown[]) => mockGetStore(...args),
}))

import {
  claimGmailSpeechMessage,
  clearFailedGmailSpeechStates,
  deleteGmailSpeechState,
  listGmailSpeechStates,
  markGmailSpeechMessage,
} from '../gmail-speech-state'

describe('Gmail speech ingestion state', () => {
  beforeEach(() => {
    records.clear()
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-08-08T12:00:00.000Z'))
    delete process.env.SITE_ID
    delete process.env.NETLIFY_API_TOKEN
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('claims a new message and preserves its retry count when reclaiming a stale lease', async () => {
    await expect(claimGmailSpeechMessage('message-1')).resolves.toBe(true)
    expect(records.get('messages/message-1')).toEqual({
      messageId: 'message-1',
      status: 'processing',
      updatedAt: '2026-08-08T12:00:00.000Z',
      retryCount: 0,
    })

    records.set('messages/message-1', {
      messageId: 'message-1',
      status: 'processing',
      updatedAt: '2026-08-08T11:44:59.000Z',
      retryCount: 2,
    })

    await expect(claimGmailSpeechMessage('message-1')).resolves.toBe(true)
    expect(records.get('messages/message-1')).toMatchObject({
      status: 'processing',
      retryCount: 2,
      updatedAt: '2026-08-08T12:00:00.000Z',
    })
  })

  it('does not reclaim processed messages or active processing leases', async () => {
    records.set('messages/processed', {
      messageId: 'processed',
      status: 'processed',
      updatedAt: '2026-08-08T11:00:00.000Z',
      retryCount: 0,
    })
    records.set('messages/active', {
      messageId: 'active',
      status: 'processing',
      updatedAt: '2026-08-08T11:50:00.000Z',
      retryCount: 1,
    })

    await expect(claimGmailSpeechMessage('processed')).resolves.toBe(false)
    await expect(claimGmailSpeechMessage('active')).resolves.toBe(false)
    expect(mockSetJSON).not.toHaveBeenCalled()
  })

  it('increments retries on failure and preserves the speaker on success', async () => {
    records.set('messages/message-2', {
      messageId: 'message-2',
      status: 'processing',
      updatedAt: '2026-08-08T11:59:00.000Z',
      retryCount: 1,
    })

    await markGmailSpeechMessage('message-2', 'failed', {
      speakerKey: 'edith',
      errorCode: 'processing_failed',
      error: 'Speech message could not be processed',
    })
    expect(records.get('messages/message-2')).toMatchObject({
      status: 'failed',
      speakerKey: 'edith',
      retryCount: 2,
    })

    await markGmailSpeechMessage('message-2', 'processed', { speakerKey: 'edith' })
    expect(records.get('messages/message-2')).toEqual({
      messageId: 'message-2',
      status: 'processed',
      speakerKey: 'edith',
      updatedAt: '2026-08-08T12:00:00.000Z',
      retryCount: 2,
      errorCode: undefined,
      error: undefined,
    })
  })

  it('lists ingestion records and clears only failed messages', async () => {
    records.set('messages/failed', {
      messageId: 'failed',
      status: 'failed',
      updatedAt: '2026-08-08T12:00:00.000Z',
      retryCount: 1,
    })
    records.set('messages/processed', {
      messageId: 'processed',
      status: 'processed',
      updatedAt: '2026-08-08T12:00:00.000Z',
      retryCount: 0,
    })
    records.set('unrelated', { value: true })

    await expect(listGmailSpeechStates()).resolves.toHaveLength(2)
    await expect(clearFailedGmailSpeechStates()).resolves.toEqual(['failed'])
    expect(records.has('messages/failed')).toBe(false)
    expect(records.has('messages/processed')).toBe(true)
    expect(records.has('unrelated')).toBe(true)
  })

  it('deletes only the requested Gmail message state', async () => {
    records.set('messages/target', { messageId: 'target', status: 'processed' })
    records.set('messages/sibling', { messageId: 'sibling', status: 'processed' })

    await deleteGmailSpeechState('target')

    expect(records.has('messages/target')).toBe(false)
    expect(records.has('messages/sibling')).toBe(true)
  })
})