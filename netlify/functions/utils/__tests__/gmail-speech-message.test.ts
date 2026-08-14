import {
  parseGmailSpeakerMap,
  parseSpeechMessage,
  type GmailMessage,
} from '../gmail-speech-message'

function message(
  payload: GmailMessage['payload'],
  internalDate = String(Date.UTC(2026, 7, 1))
): GmailMessage {
  return {
    id: 'opaque-message-id',
    internalDate,
    payload,
  }
}

describe('gmail speech message parsing', () => {
  it('validates and normalizes the secret speaker map', () => {
    expect(
      parseGmailSpeakerMap(JSON.stringify({
        'SPEAKER@example.com': 'carlos',
        'second@example.com': 'edith',
      }))
    ).toEqual(new Map([
      ['speaker@example.com', 'carlos'],
      ['second@example.com', 'edith'],
    ]))

    expect(() => parseGmailSpeakerMap('{"speaker@example.com":"unknown"}')).toThrow(
      /speaker key/i
    )
    expect(() => parseGmailSpeakerMap('{"not-an-email":"carlos"}')).toThrow(/email/i)
  })

  it('exact-matches a decoded From address and selects one nested DOCX attachment', () => {
    const result = parseSpeechMessage(
      message({
        headers: [{ name: 'From', value: 'Speaker Name <SPEAKER@example.com>' }],
        mimeType: 'multipart/mixed',
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: Buffer.from('Please find my speech attached.').toString('base64url') },
          },
          {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename: 'speech.docx',
            body: { attachmentId: 'attachment-1', size: 123 },
          },
        ],
      }),
      new Map([['speaker@example.com', 'carlos']])
    )

    expect(result).toEqual({
      ok: true,
      messageId: 'opaque-message-id',
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        attachmentId: 'attachment-1',
        fileName: 'speech.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 123,
        docType: 'docx',
      },
    })
  })

  it('uses the complete plain-text body only when no file or Google Doc exists', () => {
    const result = parseSpeechMessage(
      message({
        headers: [{ name: 'From', value: 'speaker@example.com' }],
        mimeType: 'text/plain',
        body: { data: Buffer.from('Hello everyone.\n\nThis is my speech.').toString('base64url') },
      }),
      new Map([['speaker@example.com', 'carlos']])
    )

    expect(result).toMatchObject({
      ok: true,
      speakerKey: 'carlos',
      source: {
        kind: 'body',
        text: 'Hello everyone.\n\nThis is my speech.',
        docType: 'text',
      },
    })
  })

  it('extracts one Google Docs URL and rejects multiple primary candidates', () => {
    const speakerMap = new Map([['speaker@example.com', 'carlos'] as const])
    const oneDoc = parseSpeechMessage(
      message({
        headers: [{ name: 'From', value: 'speaker@example.com' }],
        mimeType: 'text/plain',
        body: {
          data: Buffer.from(
            'My speech: https://docs.google.com/document/d/document-id/edit?usp=sharing'
          ).toString('base64url'),
        },
      }),
      speakerMap
    )

    expect(oneDoc).toMatchObject({
      ok: true,
      source: {
        kind: 'google-doc',
        documentId: 'document-id',
        docType: 'google-doc',
      },
    })

    const ambiguous = parseSpeechMessage(
      message({
        headers: [{ name: 'From', value: 'speaker@example.com' }],
        mimeType: 'multipart/mixed',
        parts: [
          {
            mimeType: 'application/pdf',
            filename: 'one.pdf',
            body: { attachmentId: 'pdf-1', size: 100 },
          },
          {
            mimeType: 'application/pdf',
            filename: 'two.pdf',
            body: { attachmentId: 'pdf-2', size: 100 },
          },
        ],
      }),
      speakerMap
    )

    expect(ambiguous).toEqual({
      ok: false,
      code: 'ambiguous_sources',
      error: 'Message contains multiple supported speech sources',
    })
  })

  it('rejects unknown senders and HTML-only messages', () => {
    const speakerMap = new Map([['speaker@example.com', 'carlos'] as const])

    expect(
      parseSpeechMessage(
        message({
          headers: [{ name: 'From', value: 'other@example.com' }],
          mimeType: 'text/plain',
          body: { data: Buffer.from('Speech').toString('base64url') },
        }),
        speakerMap
      )
    ).toMatchObject({ ok: false, code: 'sender_not_allowed' })

    expect(
      parseSpeechMessage(
        message({
          headers: [{ name: 'From', value: 'speaker@example.com' }],
          mimeType: 'text/html',
          body: { data: Buffer.from('<p>Speech</p>').toString('base64url') },
        }),
        speakerMap
      )
    ).toMatchObject({ ok: false, code: 'no_supported_source' })
  })

  it('rejects messages received before August 1, 2026', () => {
    const result = parseSpeechMessage(
      message(
        {
          headers: [{ name: 'From', value: 'speaker@example.com' }],
          mimeType: 'text/plain',
          body: { data: Buffer.from('Old unrelated message').toString('base64url') },
        },
        String(Date.UTC(2026, 6, 31, 23, 59, 59, 999))
      ),
      new Map([['speaker@example.com', 'carlos']])
    )

    expect(result).toEqual({
      ok: false,
      code: 'message_before_cutoff',
      error: 'Message was received before August 1, 2026',
    })
  })

  it('requires the configured speaker to be the sender, not a recipient', () => {
    const result = parseSpeechMessage(
      message({
        headers: [
          { name: 'From', value: 'other@example.com' },
          { name: 'To', value: 'speaker@example.com' },
        ],
        mimeType: 'text/plain',
        body: { data: Buffer.from('Email sent to a speaker').toString('base64url') },
      }),
      new Map([['speaker@example.com', 'carlos']])
    )

    expect(result).toMatchObject({ ok: false, code: 'sender_not_allowed' })
  })

  it('detects Apple Pages attachments instead of falling back to the email body', () => {
    const result = parseSpeechMessage(
      message({
        headers: [{ name: 'From', value: 'speaker@example.com' }],
        mimeType: 'multipart/mixed',
        parts: [
          {
            mimeType: 'text/plain',
            body: { data: Buffer.from('My speech is attached.').toString('base64url') },
          },
          {
            mimeType: 'application/vnd.apple.pages',
            filename: 'speech.pages',
            body: { attachmentId: 'pages-1', size: 512 },
          },
        ],
      }),
      new Map([['speaker@example.com', 'carlos']])
    )

    expect(result).toEqual({
      ok: false,
      code: 'unsupported_format',
      error: 'Apple Pages files are not supported. Export the speech as DOCX or PDF and resend it.',
    })
  })
})
