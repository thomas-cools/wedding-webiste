/**
 * @jest-environment node
 */

const mockSetCredentials = jest.fn()
const mockGetAccessToken = jest.fn()
const mockOAuth2 = jest.fn(() => ({
  setCredentials: mockSetCredentials,
  getAccessToken: mockGetAccessToken,
}))
const mockMessagesList = jest.fn()
const mockMessagesGet = jest.fn()
const mockAttachmentsGet = jest.fn()
const mockLabelsList = jest.fn()
const mockLabelsCreate = jest.fn()
const mockMessagesModify = jest.fn()
const mockFilesExport = jest.fn()
const mockGmail = jest.fn(() => ({
  users: {
    messages: {
      list: mockMessagesList,
      get: mockMessagesGet,
      attachments: { get: mockAttachmentsGet },
      modify: mockMessagesModify,
    },
    labels: {
      list: mockLabelsList,
      create: mockLabelsCreate,
    },
  },
}))
const mockDrive = jest.fn(() => ({
  files: { export: mockFilesExport },
}))

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: function (...args: unknown[]) {
        return mockOAuth2(...args)
      },
    },
    gmail: (...args: unknown[]) => mockGmail(...args),
    drive: (...args: unknown[]) => mockDrive(...args),
  },
}))

import {
  ensureGmailLabel,
  exportGoogleDocText,
  getGmailAttachment,
  getGmailMessage,
  getGoogleAccessToken,
  GoogleApiError,
  listGmailMessageIds,
  modifyGmailMessageLabels,
} from '../google-mail-api'

describe('Google mail API client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GMAIL_CLIENT_ID = 'client-id'
    process.env.GMAIL_CLIENT_SECRET = 'client-secret'
    process.env.GMAIL_REFRESH_TOKEN = 'refresh-token'
  })

  afterAll(() => {
    delete process.env.GMAIL_CLIENT_ID
    delete process.env.GMAIL_CLIENT_SECRET
    delete process.env.GMAIL_REFRESH_TOKEN
  })

  it('exchanges the configured refresh token through OAuth2', async () => {
    mockGetAccessToken.mockResolvedValueOnce({ token: 'access-token' })

    await expect(getGoogleAccessToken()).resolves.toBe('access-token')
    expect(mockOAuth2).toHaveBeenCalledWith('client-id', 'client-secret')
    expect(mockSetCredentials).toHaveBeenCalledWith({ refresh_token: 'refresh-token' })
  })

  it('rejects missing configuration and missing access tokens', async () => {
    delete process.env.GMAIL_CLIENT_SECRET
    await expect(getGoogleAccessToken()).rejects.toThrow('GMAIL_CLIENT_SECRET is not configured')

    process.env.GMAIL_CLIENT_SECRET = 'client-secret'
    mockGetAccessToken.mockResolvedValueOnce({ token: null })
    await expect(getGoogleAccessToken()).rejects.toMatchObject({
      message: 'Google OAuth response did not include an access token',
      status: 502,
    })
  })

  it('lists and retrieves Gmail messages using the official client', async () => {
    mockMessagesList.mockResolvedValueOnce({
      data: { messages: [{ id: 'message-1' }, {}, { id: 'message-2' }] },
    })
    mockMessagesGet.mockResolvedValueOnce({
      data: { id: 'message-1', payload: { mimeType: 'text/plain' } },
    })

    await expect(listGmailMessageIds('token', 'from:"speaker@example.com"', 2)).resolves.toEqual([
      'message-1',
      'message-2',
    ])
    await expect(getGmailMessage('token', 'message-1')).resolves.toMatchObject({ id: 'message-1' })
    expect(mockMessagesList).toHaveBeenCalledWith({
      userId: 'me',
      q: 'from:"speaker@example.com"',
      maxResults: 2,
    })
    expect(mockMessagesGet).toHaveBeenCalledWith({
      userId: 'me',
      id: 'message-1',
      format: 'full',
    })
  })

  it('decodes base64url attachments and rejects empty payloads', async () => {
    const expected = Buffer.from('speech bytes')
    mockAttachmentsGet.mockResolvedValueOnce({ data: { data: expected.toString('base64url') } })

    await expect(getGmailAttachment('token', 'message-1', 'attachment-1')).resolves.toEqual(
      new Uint8Array(expected)
    )
    expect(mockAttachmentsGet).toHaveBeenCalledWith({
      userId: 'me',
      messageId: 'message-1',
      id: 'attachment-1',
    })

    mockAttachmentsGet.mockResolvedValueOnce({ data: {} })
    await expect(getGmailAttachment('token', 'message-1', 'attachment-2')).rejects.toMatchObject({
      message: 'Gmail attachment payload is missing',
      status: 502,
    })
  })

  it('reuses or creates labels and mutates only requested message labels', async () => {
    mockLabelsList.mockResolvedValueOnce({
      data: { labels: [{ id: 'existing-id', name: 'Wedding Speech/Processed' }] },
    })
    await expect(ensureGmailLabel('token', 'wedding speech/processed')).resolves.toBe('existing-id')
    expect(mockLabelsCreate).not.toHaveBeenCalled()

    mockLabelsList.mockResolvedValueOnce({ data: { labels: [] } })
    mockLabelsCreate.mockResolvedValueOnce({ data: { id: 'created-id' } })
    await expect(ensureGmailLabel('token', 'Wedding Speech/Error')).resolves.toBe('created-id')
    expect(mockLabelsCreate).toHaveBeenCalledWith({
      userId: 'me',
      requestBody: {
        name: 'Wedding Speech/Error',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    })

    mockMessagesModify.mockResolvedValueOnce({ data: {} })
    await modifyGmailMessageLabels('token', 'message-1', ['processed'], ['error'])
    expect(mockMessagesModify).toHaveBeenCalledWith({
      userId: 'me',
      id: 'message-1',
      requestBody: { addLabelIds: ['processed'], removeLabelIds: ['error'] },
    })
  })

  it('exports Google Docs as text and preserves Google response status codes', async () => {
    mockFilesExport.mockResolvedValueOnce({ data: 'Complete speech' })
    await expect(exportGoogleDocText('token', 'document-1')).resolves.toBe('Complete speech')
    expect(mockFilesExport).toHaveBeenCalledWith(
      { fileId: 'document-1', mimeType: 'text/plain' },
      { responseType: 'text' }
    )

    mockMessagesList.mockRejectedValueOnce({ response: { status: 403 } })
    const request = listGmailMessageIds('token', 'from:"speaker@example.com"', 2)
    await expect(request).rejects.toBeInstanceOf(GoogleApiError)
    await expect(request).rejects.toMatchObject({
      message: 'Failed to list Gmail messages',
      status: 403,
    })
  })
})