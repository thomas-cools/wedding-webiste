/**
 * @jest-environment node
 */

const mockGetSpeechDocumentById = jest.fn()
const mockSaveSpeechDocument = jest.fn()
const mockSaveSpeechDocumentFile = jest.fn()
const mockDeleteSpeechDocumentFile = jest.fn()
const mockExtractDocx = jest.fn()
const mockExtractPdf = jest.fn()
const mockTranslate = jest.fn()

jest.mock('../speech-documents', () => ({
  buildSpeechDocumentStorageKey: (id: string, extension: string, version: string) =>
    `files/${id}-${version}.${extension}`,
  getSpeechDocumentById: (...args: unknown[]) => mockGetSpeechDocumentById(...args),
  saveSpeechDocument: (...args: unknown[]) => mockSaveSpeechDocument(...args),
  saveSpeechDocumentFile: (...args: unknown[]) => mockSaveSpeechDocumentFile(...args),
  deleteSpeechDocumentFile: (...args: unknown[]) => mockDeleteSpeechDocumentFile(...args),
}))

jest.mock('../speech-document-content', () => ({
  extractSpeechTextFromDocxBytes: (...args: unknown[]) => mockExtractDocx(...args),
  extractSpeechTextFromPdfBytes: (...args: unknown[]) => mockExtractPdf(...args),
  extractSpeechTextFromPlainText: (text: string) => ({
    ok: true,
    text: text.trim(),
    detectedLanguage: 'en',
  }),
}))

jest.mock('../speech-translation', () => ({
  translateSpeechContentWithGemini: (...args: unknown[]) => mockTranslate(...args),
}))

describe('Gmail speech ingestion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSpeechDocumentById.mockResolvedValue(null)
    mockSaveSpeechDocument.mockResolvedValue(undefined)
    mockSaveSpeechDocumentFile.mockResolvedValue(undefined)
    mockDeleteSpeechDocumentFile.mockResolvedValue(true)
    mockExtractDocx.mockResolvedValue({ ok: true, text: 'Speech text', detectedLanguage: 'en' })
    mockExtractPdf.mockResolvedValue({ ok: true, text: 'PDF speech', detectedLanguage: 'en' })
    mockTranslate.mockResolvedValue({
      status: 'success',
      translatedText: 'Texto del discurso',
      detectedSourceLanguage: 'en',
      targetLanguage: 'es',
      provider: 'gemini',
      translatedAt: '2026-08-08T12:00:00.000Z',
    })
  })

  it('stages a PDF and saves it under the stable speaker record', async () => {
    const { ingestGmailSpeech } = await import('../speech-gmail-ingestion')
    const result = await ingestGmailSpeech({
      messageId: 'message-1',
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        fileName: 'speech.pdf',
        mimeType: 'application/pdf',
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]),
      },
    })

    expect(result.id).toBe('gmail-carlos')
    expect(result.sourceKind).toBe('gmail')
    expect(result.sourceSubtype).toBe('pdf')
    expect(result.gmailMessageId).toBe('message-1')
    expect(mockSaveSpeechDocumentFile).toHaveBeenCalledTimes(1)
    expect(mockSaveSpeechDocument).toHaveBeenCalledWith(result)
  })

  it('extracts, translates, and stages a DOCX attachment', async () => {
    const { ingestGmailSpeech } = await import('../speech-gmail-ingestion')
    const result = await ingestGmailSpeech({
      messageId: 'message-docx',
      speakerKey: 'ellen',
      source: {
        kind: 'attachment',
        fileName: 'speech.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        bytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x10]),
      },
    })

    expect(result.id).toBe('gmail-ellen')
    expect(result.docType).toBe('docx')
    expect(result.sourceSubtype).toBe('docx')
    expect(mockExtractDocx).toHaveBeenCalledTimes(1)
    expect(mockTranslate).toHaveBeenCalledWith('Speech text', 'en')
    expect(mockSaveSpeechDocumentFile).toHaveBeenCalledTimes(1)
  })

  it('does not stage or save a document when text extraction fails', async () => {
    mockExtractPdf.mockResolvedValueOnce({ ok: false, error: 'Could not extract text from PDF' })

    const { ingestGmailSpeech } = await import('../speech-gmail-ingestion')
    await expect(ingestGmailSpeech({
      messageId: 'message-invalid-pdf',
      speakerKey: 'carlos',
      source: {
        kind: 'attachment',
        fileName: 'speech.pdf',
        mimeType: 'application/pdf',
        bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]),
      },
    })).rejects.toThrow('Could not extract text from PDF')

    expect(mockTranslate).not.toHaveBeenCalled()
    expect(mockSaveSpeechDocumentFile).not.toHaveBeenCalled()
    expect(mockSaveSpeechDocument).not.toHaveBeenCalled()
  })

  it('leaves the prior speech active and deletes staged bytes when metadata save fails', async () => {
    mockGetSpeechDocumentById.mockResolvedValue({
      id: 'gmail-carlos',
      storageKey: 'files/old.pdf',
    })
    mockSaveSpeechDocument.mockRejectedValueOnce(new Error('store unavailable'))

    const { ingestGmailSpeech } = await import('../speech-gmail-ingestion')
    await expect(
      ingestGmailSpeech({
        messageId: 'message-2',
        speakerKey: 'carlos',
        source: {
          kind: 'attachment',
          fileName: 'speech.pdf',
          mimeType: 'application/pdf',
          bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]),
        },
      })
    ).rejects.toThrow('store unavailable')

    expect(mockDeleteSpeechDocumentFile).toHaveBeenCalledTimes(1)
    expect(mockDeleteSpeechDocumentFile).not.toHaveBeenCalledWith('files/old.pdf')
  })

  it('replaces body text and deletes the prior binary only after metadata is saved', async () => {
    mockGetSpeechDocumentById.mockResolvedValue({
      id: 'gmail-edith',
      storageKey: 'files/old.docx',
    })

    const { ingestGmailSpeech } = await import('../speech-gmail-ingestion')
    const result = await ingestGmailSpeech({
      messageId: 'message-3',
      speakerKey: 'edith',
      source: { kind: 'body', text: 'My complete speech.' },
    })

    expect(result.docType).toBe('text')
    expect(result.storageKey).toBeUndefined()
    expect(mockSaveSpeechDocument).toHaveBeenCalledTimes(1)
    expect(mockDeleteSpeechDocumentFile).toHaveBeenCalledWith('files/old.docx')
  })
})
