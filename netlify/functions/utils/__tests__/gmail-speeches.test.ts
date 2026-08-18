/**
 * @jest-environment node
 */

const mockGetGoogleAccessToken = jest.fn()
const mockEnsureGmailLabel = jest.fn()
const mockListGmailMessageIds = jest.fn()
const mockGetGmailMessage = jest.fn()
const mockGetGmailAttachment = jest.fn()
const mockExportGoogleDocText = jest.fn()
const mockModifyGmailMessageLabels = jest.fn()
const mockParseGmailSpeakerMap = jest.fn()
const mockParseSpeechMessage = jest.fn()
const mockClaimGmailSpeechMessage = jest.fn()
const mockMarkGmailSpeechMessage = jest.fn()
const mockListGmailSpeechStates = jest.fn()
const mockClearFailedGmailSpeechStates = jest.fn()
const mockDeleteGmailSpeechState = jest.fn()
const mockIngestGmailSpeech = jest.fn()

jest.mock('../google-mail-api', () => ({
  getGoogleAccessToken: (...args: unknown[]) => mockGetGoogleAccessToken(...args),
  ensureGmailLabel: (...args: unknown[]) => mockEnsureGmailLabel(...args),
  listGmailMessageIds: (...args: unknown[]) => mockListGmailMessageIds(...args),
  getGmailMessage: (...args: unknown[]) => mockGetGmailMessage(...args),
  getGmailAttachment: (...args: unknown[]) => mockGetGmailAttachment(...args),
  exportGoogleDocText: (...args: unknown[]) => mockExportGoogleDocText(...args),
  modifyGmailMessageLabels: (...args: unknown[]) => mockModifyGmailMessageLabels(...args),
}))

jest.mock('../gmail-speech-message', () => ({
  GMAIL_SPEECH_CUTOFF_MS: Date.UTC(2026, 7, 1),
  parseGmailSpeakerMap: (...args: unknown[]) => mockParseGmailSpeakerMap(...args),
  parseSpeechMessage: (...args: unknown[]) => mockParseSpeechMessage(...args),
}))

jest.mock('../gmail-speech-state', () => ({
  claimGmailSpeechMessage: (...args: unknown[]) => mockClaimGmailSpeechMessage(...args),
  markGmailSpeechMessage: (...args: unknown[]) => mockMarkGmailSpeechMessage(...args),
  listGmailSpeechStates: (...args: unknown[]) => mockListGmailSpeechStates(...args),
  clearFailedGmailSpeechStates: (...args: unknown[]) => mockClearFailedGmailSpeechStates(...args),
  deleteGmailSpeechState: (...args: unknown[]) => mockDeleteGmailSpeechState(...args),
}))

jest.mock('../speech-gmail-ingestion', () => ({
  ingestGmailSpeech: (...args: unknown[]) => mockIngestGmailSpeech(...args),
}))

import {
  buildGmailSpeechQuery,
  getGmailSpeechSyncStatus,
  reprocessLatestGmailSpeech,
  retryFailedGmailSpeeches,
  syncGmailSpeeches,
} from '../gmail-speeches'

describe('Gmail speech synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GMAIL_SPEAKER_MAP_JSON = '{"speaker@example.com":"carlos"}'
    delete process.env.SPEECH_GMAIL_MAX_MESSAGES_PER_RUN
    delete process.env.SPEECH_GMAIL_PROCESSED_LABEL
    delete process.env.SPEECH_GMAIL_ERROR_LABEL

    mockParseGmailSpeakerMap.mockReturnValue(new Map([['speaker@example.com', 'carlos']]))
    mockGetGoogleAccessToken.mockResolvedValue('access-token')
    mockEnsureGmailLabel
      .mockResolvedValueOnce('processed-label')
      .mockResolvedValueOnce('error-label')
    mockListGmailMessageIds.mockResolvedValue([])
    mockClaimGmailSpeechMessage.mockResolvedValue(true)
    mockModifyGmailMessageLabels.mockResolvedValue(undefined)
    mockMarkGmailSpeechMessage.mockResolvedValue(undefined)
    mockIngestGmailSpeech.mockResolvedValue({ id: 'gmail-carlos' })
    mockListGmailSpeechStates.mockResolvedValue([])
    mockClearFailedGmailSpeechStates.mockResolvedValue([])
    mockDeleteGmailSpeechState.mockResolvedValue(undefined)
  })

  afterAll(() => {
    delete process.env.GMAIL_SPEAKER_MAP_JSON
    delete process.env.SPEECH_GMAIL_MAX_MESSAGES_PER_RUN
    delete process.env.SPEECH_GMAIL_PROCESSED_LABEL
    delete process.env.SPEECH_GMAIL_ERROR_LABEL
  })

  it('builds a sender-only query that excludes both terminal labels', () => {
    expect(
      buildGmailSpeechQuery(
        ['speaker@example.com', 'second@example.com'],
        'Wedding Speech/Processed',
        'Wedding Speech/Error'
      )
    ).toBe(
      '{from:"speaker@example.com" from:"second@example.com"} after:1785542399 ' +
        '-label:"Wedding Speech/Processed" -label:"Wedding Speech/Error"'
    )
    expect(buildGmailSpeechQuery(
      ['speaker@example.com'],
      'Wedding Speech/Processed',
      'Wedding Speech/Error'
    )).not.toContain('to:')
  })

  it('skips claimed messages and processes a valid body submission in order', async () => {
    mockListGmailMessageIds.mockResolvedValueOnce(['already-claimed', 'message-1'])
    mockClaimGmailSpeechMessage
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'message-1' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: true,
      speakerKey: 'carlos',
      source: { kind: 'body', text: 'Complete speech' },
    })

    await expect(syncGmailSpeeches()).resolves.toEqual({
      found: 2,
      processed: 1,
      failed: 0,
      skipped: 1,
    })
    expect(mockIngestGmailSpeech).toHaveBeenCalledWith({
      messageId: 'message-1',
      speakerKey: 'carlos',
      source: { kind: 'body', text: 'Complete speech' },
    })
    expect(mockMarkGmailSpeechMessage).toHaveBeenCalledWith('message-1', 'processed', {
      speakerKey: 'carlos',
    })
    expect(mockModifyGmailMessageLabels).toHaveBeenCalledWith(
      'access-token',
      'message-1',
      ['processed-label'],
      ['error-label']
    )
  })

  it('quarantines ambiguous messages without starting ingestion', async () => {
    mockListGmailMessageIds.mockResolvedValueOnce(['message-2'])
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'message-2' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: false,
      code: 'ambiguous_sources',
      error: 'Message contains multiple supported speech sources',
    })

    await expect(syncGmailSpeeches()).resolves.toMatchObject({ failed: 1, processed: 0 })
    expect(mockIngestGmailSpeech).not.toHaveBeenCalled()
    expect(mockMarkGmailSpeechMessage).toHaveBeenCalledWith('message-2', 'failed', {
      errorCode: 'ambiguous_sources',
      error: 'Message contains multiple supported speech sources',
    })
    expect(mockModifyGmailMessageLabels).toHaveBeenCalledWith(
      'access-token',
      'message-2',
      ['error-label'],
      ['processed-label']
    )
  })

  it('downloads attachment bytes before ingestion and exports private Google Docs', async () => {
    const attachmentBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
    mockListGmailMessageIds.mockResolvedValueOnce(['attachment-message', 'doc-message'])
    mockGetGmailMessage
      .mockResolvedValueOnce({ id: 'attachment-message' })
      .mockResolvedValueOnce({ id: 'doc-message' })
    mockParseSpeechMessage
      .mockReturnValueOnce({
        ok: true,
        speakerKey: 'carlos',
        source: {
          kind: 'attachment',
          attachmentId: 'attachment-1',
          fileName: 'speech.pdf',
          mimeType: 'application/pdf',
        },
      })
      .mockReturnValueOnce({
        ok: true,
        speakerKey: 'edith',
        source: { kind: 'google-doc', documentId: 'document-1' },
      })
    mockGetGmailAttachment.mockResolvedValueOnce(attachmentBytes)
    mockExportGoogleDocText.mockResolvedValueOnce('Private Google Doc speech')

    await expect(syncGmailSpeeches()).resolves.toMatchObject({ processed: 2, failed: 0 })
    expect(mockIngestGmailSpeech).toHaveBeenNthCalledWith(1, {
      messageId: 'attachment-message',
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        fileName: 'speech.pdf',
        mimeType: 'application/pdf',
        bytes: attachmentBytes,
      },
    })
    expect(mockExportGoogleDocText).toHaveBeenCalledWith('access-token', 'document-1')
    expect(mockIngestGmailSpeech).toHaveBeenNthCalledWith(2, {
      messageId: 'doc-message',
      speakerKey: 'edith',
      source: { kind: 'google-doc', text: 'Private Google Doc speech' },
    })
  })

  it('stores a sanitized failure when attachment retrieval or ingestion fails', async () => {
    mockListGmailMessageIds.mockResolvedValueOnce(['message-3'])
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'message-3' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: true,
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        attachmentId: 'attachment-1',
        fileName: 'speech.pdf',
        mimeType: 'application/pdf',
        size: 100,
      },
    })
    mockGetGmailAttachment.mockRejectedValueOnce(new Error('private upstream details'))

    await expect(syncGmailSpeeches()).resolves.toMatchObject({ failed: 1, processed: 0 })
    expect(mockMarkGmailSpeechMessage).toHaveBeenCalledWith('message-3', 'failed', {
      speakerKey: 'carlos',
      errorCode: 'processing_failed',
      error: 'Speech message could not be processed',
    })
  })

  it('preserves an actionable Pages extraction failure without exposing message data', async () => {
    mockListGmailMessageIds.mockResolvedValueOnce(['pages-message'])
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'pages-message' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: true,
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        attachmentId: 'pages-attachment',
        fileName: 'speech.pages',
        mimeType: 'application/vnd.apple.pages',
        size: 100,
      },
    })
    mockGetGmailAttachment.mockResolvedValueOnce(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))
    mockIngestGmailSpeech.mockRejectedValueOnce(
      new Error('Could not extract text from this Apple Pages file. Export it as DOCX or PDF and resend it.')
    )

    await expect(syncGmailSpeeches()).resolves.toMatchObject({ failed: 1, processed: 0 })
    expect(mockMarkGmailSpeechMessage).toHaveBeenCalledWith('pages-message', 'failed', {
      speakerKey: 'carlos',
      errorCode: 'pages_extraction_failed',
      error: 'Could not extract text from this Apple Pages file. Export it as DOCX or PDF and resend it.',
    })
  })

  it.each([
    [
      'PDF is password-protected. Remove the password and resend it.',
      'pdf_password_protected',
    ],
    [
      'PDF file is damaged or has an invalid structure. Re-export it and resend it.',
      'pdf_invalid',
    ],
  ])('preserves the sanitized PDF failure %s', async (error, errorCode) => {
    mockListGmailMessageIds.mockResolvedValueOnce(['pdf-message'])
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'pdf-message' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: true,
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        attachmentId: 'pdf-attachment',
        fileName: 'speech.pdf',
        mimeType: 'application/pdf',
        size: 100,
      },
    })
    mockGetGmailAttachment.mockResolvedValueOnce(new Uint8Array([0x25, 0x50, 0x44, 0x46]))
    mockIngestGmailSpeech.mockRejectedValueOnce(new Error(error))

    await expect(syncGmailSpeeches()).resolves.toMatchObject({ failed: 1, processed: 0 })
    expect(mockMarkGmailSpeechMessage).toHaveBeenCalledWith('pdf-message', 'failed', {
      speakerKey: 'carlos',
      errorCode,
      error,
    })
  })

  it('reports an attachment size limit without exposing upstream details', async () => {
    mockListGmailMessageIds.mockResolvedValueOnce(['large-message'])
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'large-message' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: true,
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        attachmentId: 'large-attachment',
        fileName: 'speech.pages',
        mimeType: 'application/vnd.apple.pages',
        size: 100,
      },
    })
    mockGetGmailAttachment.mockResolvedValueOnce(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))
    mockIngestGmailSpeech.mockRejectedValueOnce(new Error('Document exceeds the 1048576 byte limit'))

    await expect(syncGmailSpeeches()).resolves.toMatchObject({ failed: 1, processed: 0 })
    expect(mockMarkGmailSpeechMessage).toHaveBeenCalledWith('large-message', 'failed', {
      speakerKey: 'carlos',
      errorCode: 'attachment_too_large',
      error: 'Document exceeds the 1048576 byte limit',
    })
  })

  it('rejects an oversized attachment from Gmail metadata before downloading it', async () => {
    mockListGmailMessageIds.mockResolvedValueOnce(['oversized-message'])
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'oversized-message' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: true,
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        attachmentId: 'oversized-attachment',
        fileName: 'speech.pages',
        mimeType: 'application/vnd.apple.pages',
        size: 11 * 1024 * 1024,
        docType: 'pages',
      },
    })

    await expect(syncGmailSpeeches()).resolves.toMatchObject({ failed: 1, processed: 0 })
    expect(mockGetGmailAttachment).not.toHaveBeenCalled()
    expect(mockMarkGmailSpeechMessage).toHaveBeenCalledWith('oversized-message', 'failed', {
      speakerKey: 'carlos',
      errorCode: 'attachment_too_large',
      error: 'Document exceeds the 10485760 byte limit',
    })
  })

  it('returns sanitized status records and requeues failed Gmail messages', async () => {
    const failedState = {
      messageId: 'message-4',
      status: 'failed',
      speakerKey: 'carlos',
      errorCode: 'processing_failed',
      error: 'Speech message could not be processed',
      updatedAt: '2026-08-08T12:00:00.000Z',
      retryCount: 1,
    }
    mockListGmailSpeechStates.mockResolvedValueOnce([
      failedState,
      {
        messageId: 'message-5',
        status: 'processed',
        speakerKey: 'edith',
        updatedAt: '2026-08-08T12:00:00.000Z',
        retryCount: 0,
      },
    ])

    await expect(getGmailSpeechSyncStatus()).resolves.toEqual({
      processing: 0,
      processed: 1,
      failed: 1,
      processedSpeakers: ['edith'],
      failures: [{
        speakerKey: 'carlos',
        errorCode: 'processing_failed',
        error: 'Speech message could not be processed',
        updatedAt: '2026-08-08T12:00:00.000Z',
      }],
    })

    mockListGmailSpeechStates.mockResolvedValueOnce([failedState])
    mockEnsureGmailLabel
      .mockReset()
      .mockResolvedValueOnce('error-label')
      .mockResolvedValueOnce('processed-label')
      .mockResolvedValueOnce('error-label')
    mockListGmailMessageIds.mockResolvedValueOnce([])

    await expect(retryFailedGmailSpeeches()).resolves.toEqual({
      found: 0,
      processed: 0,
      failed: 0,
      skipped: 0,
    })
    expect(mockModifyGmailMessageLabels).toHaveBeenCalledWith(
      'access-token',
      'message-4',
      [],
      ['error-label']
    )
    expect(mockClearFailedGmailSpeechStates).toHaveBeenCalledTimes(1)
  })

  it('reprocesses only the newest processed message for a selected speaker', async () => {
    mockListGmailSpeechStates.mockResolvedValueOnce([
      {
        messageId: 'older-message',
        status: 'processed',
        speakerKey: 'carlos',
        updatedAt: '2026-08-08T10:00:00.000Z',
        retryCount: 0,
      },
      {
        messageId: 'newest-message',
        status: 'processed',
        speakerKey: 'carlos',
        updatedAt: '2026-08-08T12:00:00.000Z',
        retryCount: 0,
      },
      {
        messageId: 'other-speaker',
        status: 'processed',
        speakerKey: 'edith',
        updatedAt: '2026-08-08T13:00:00.000Z',
        retryCount: 0,
      },
    ])
    mockEnsureGmailLabel
      .mockReset()
      .mockResolvedValueOnce('processed-label')
      .mockResolvedValueOnce('error-label')
    mockGetGmailMessage.mockResolvedValueOnce({ id: 'newest-message' })
    mockParseSpeechMessage.mockReturnValueOnce({
      ok: true,
      speakerKey: 'carlos',
      source: { kind: 'body', text: 'Complete speech text' },
    })

    await expect(reprocessLatestGmailSpeech('carlos')).resolves.toEqual({
      found: 1,
      processed: 1,
      failed: 0,
      skipped: 0,
    })
    expect(mockModifyGmailMessageLabels).toHaveBeenNthCalledWith(
      1,
      'access-token',
      'newest-message',
      [],
      ['processed-label', 'error-label']
    )
    expect(mockDeleteGmailSpeechState).toHaveBeenCalledWith('newest-message')
    expect(mockDeleteGmailSpeechState).not.toHaveBeenCalledWith('older-message')
    expect(mockClaimGmailSpeechMessage).toHaveBeenCalledWith('newest-message')
    expect(mockIngestGmailSpeech).toHaveBeenCalledWith({
      messageId: 'newest-message',
      speakerKey: 'carlos',
      source: { kind: 'body', text: 'Complete speech text' },
    })
  })
})