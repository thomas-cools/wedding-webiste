import { google } from 'googleapis'

import type { GmailMessage } from './gmail-speech-message'

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    requiredEnv('GMAIL_CLIENT_ID'),
    requiredEnv('GMAIL_CLIENT_SECRET')
  )
}

function createAccessTokenClient(accessToken: string) {
  const auth = createOAuthClient()
  auth.setCredentials({ access_token: accessToken })
  return auth
}

function googleApiError(error: unknown, message: string): GoogleApiError {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response
    if (typeof response === 'object' && response !== null && 'status' in response) {
      const status = response.status
      if (typeof status === 'number') return new GoogleApiError(message, status)
    }
  }
  return new GoogleApiError(message, 502)
}

export async function getGoogleAccessToken(): Promise<string> {
  const auth = createOAuthClient()
  auth.setCredentials({ refresh_token: requiredEnv('GMAIL_REFRESH_TOKEN') })

  try {
    const { token } = await auth.getAccessToken()
    if (token) return token
    throw new GoogleApiError('Google OAuth response did not include an access token', 502)
  } catch (error) {
    if (error instanceof GoogleApiError) throw error
    throw googleApiError(error, 'Google OAuth token refresh failed')
  }
}

function gmailClient(accessToken: string) {
  return google.gmail({ version: 'v1', auth: createAccessTokenClient(accessToken) })
}

function driveClient(accessToken: string) {
  return google.drive({ version: 'v3', auth: createAccessTokenClient(accessToken) })
}

export async function listGmailMessageIds(
  accessToken: string,
  query: string,
  maxResults: number
): Promise<string[]> {
  try {
    const { data } = await gmailClient(accessToken).users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    })
    return (data.messages || [])
      .map((entry) => entry.id)
      .filter((id): id is string => typeof id === 'string' && Boolean(id))
  } catch (error) {
    throw googleApiError(error, 'Failed to list Gmail messages')
  }
}

export function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  return gmailClient(accessToken).users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  }).then(({ data }) => data as GmailMessage)
    .catch((error: unknown) => {
      throw googleApiError(error, 'Failed to load Gmail message')
    })
}

export async function getGmailAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Uint8Array> {
  try {
    const { data } = await gmailClient(accessToken).users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    })
    if (!data.data) {
      throw new GoogleApiError('Gmail attachment payload is missing', 502)
    }
    return new Uint8Array(Buffer.from(data.data, 'base64url'))
  } catch (error) {
    if (error instanceof GoogleApiError) throw error
    throw googleApiError(error, 'Failed to load Gmail attachment')
  }
}

export async function ensureGmailLabel(
  accessToken: string,
  labelName: string
): Promise<string> {
  const gmail = gmailClient(accessToken)
  try {
    const { data } = await gmail.users.labels.list({ userId: 'me' })
    const existing = data.labels?.find(
      (label) => label.name?.toLowerCase() === labelName.toLowerCase()
    )
    if (existing?.id) return existing.id

    const { data: created } = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    })
    if (!created.id) throw new GoogleApiError('Gmail label creation returned no ID', 502)
    return created.id
  } catch (error) {
    if (error instanceof GoogleApiError) throw error
    throw googleApiError(error, 'Failed to resolve Gmail label')
  }
}

export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[] = []
): Promise<void> {
  try {
    await gmailClient(accessToken).users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: { addLabelIds, removeLabelIds },
    })
  } catch (error) {
    throw googleApiError(error, 'Failed to update Gmail message labels')
  }
}

export async function exportGoogleDocText(
  accessToken: string,
  documentId: string
): Promise<string> {
  try {
    const { data } = await driveClient(accessToken).files.export(
      {
        fileId: documentId,
        mimeType: 'text/plain',
      },
      { responseType: 'text' }
    )
    if (typeof data !== 'string') {
      throw new GoogleApiError('Google Doc export returned invalid content', 502)
    }
    return data
  } catch (error) {
    if (error instanceof GoogleApiError) throw error
    throw googleApiError(error, 'Google Doc export failed')
  }
}
