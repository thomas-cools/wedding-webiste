/**
 * @jest-environment node
 */

import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const mockSetJSON = jest.fn()
const mockSet = jest.fn()
const mockGet = jest.fn()
const mockDelete = jest.fn()
const mockList = jest.fn()

jest.mock('@netlify/blobs', () => ({
  getStore: jest.fn(() => ({
    setJSON: (...args: unknown[]) => mockSetJSON(...args),
    set: (...args: unknown[]) => mockSet(...args),
    get: (...args: unknown[]) => mockGet(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    list: (...args: unknown[]) => mockList(...args),
  })),
}))

describe('speech-documents local fallback', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv, NETLIFY_DEV: 'true' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('saves to local file when blob set fails in netlify dev', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'speech-docs-test-'))
    const localPath = path.join(tempDir, 'speech-documents.json')
    process.env.SPEECH_DOC_LOCAL_STORE_PATH = localPath

    mockSetJSON.mockRejectedValueOnce(new Error('blob unavailable'))

    const { saveSpeechDocument } = await import('../speech-documents')

    await saveSpeechDocument({
      id: '11111111-1111-1111-1111-111111111111',
      fileName: 'Test Doc',
      sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
      sourceHost: 'docs.google.com',
      fileSizeBytes: 12345,
      docType: 'google-doc',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'admin',
    })

    const content = await readFile(localPath, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed.documents).toHaveLength(1)
    expect(parsed.documents[0].fileName).toBe('Test Doc')
  })

  it('reads from local file when blob list fails in netlify dev', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'speech-docs-test-'))
    const localPath = path.join(tempDir, 'speech-documents.json')
    process.env.SPEECH_DOC_LOCAL_STORE_PATH = localPath

    const documents = {
      documents: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          fileName: 'Stored Doc',
          sourceUrl: 'https://docs.google.com/document/d/xyz/edit',
          sourceHost: 'docs.google.com',
          fileSizeBytes: 2500,
          docType: 'google-doc',
          createdAt: '2026-02-01T00:00:00.000Z',
          createdBy: 'admin',
        },
      ],
    }

    await import('node:fs/promises').then(({ writeFile }) =>
      writeFile(localPath, JSON.stringify(documents), 'utf-8')
    )

    mockList.mockRejectedValueOnce(new Error('blob unavailable'))

    const { getAllSpeechDocuments } = await import('../speech-documents')
    const result = await getAllSpeechDocuments()

    expect(result).toHaveLength(1)
    expect(result[0]).toBeDefined()
    expect(result[0]!.fileName).toBe('Stored Doc')
  })

  it('does not parse stored document files as JSON metadata', async () => {
    process.env.NETLIFY_DEV = 'false'
    mockList.mockResolvedValueOnce({
      blobs: [
        { key: 'gmail-carlos' },
        { key: 'files/gmail-carlos-version.pages' },
      ],
    })
    mockGet.mockImplementationOnce(async (key: string) => {
      if (key !== 'gmail-carlos') throw new Error('Binary file was requested as JSON')
      return {
        id: 'gmail-carlos',
        fileName: 'Carlos Speech',
        speakerKey: 'carlos',
        sourceKind: 'gmail',
        sourceSubtype: 'pages',
        storageKey: 'files/gmail-carlos-version.pages',
        fileSizeBytes: 1024,
        docType: 'pages',
        translationStatus: 'success',
        translatedText: 'Translated speech',
        createdAt: '2026-08-14T12:00:00.000Z',
        createdBy: 'gmail-import',
      }
    })

    const { getAllSpeechDocuments } = await import('../speech-documents')
    const result = await getAllSpeechDocuments()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'gmail-carlos', docType: 'pages' })
    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledWith('gmail-carlos', { type: 'json' })
  })

  it('saves and reads uploaded file bytes locally when blob operations fail', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'speech-docs-upload-test-'))
    const localPath = path.join(tempDir, 'speech-documents.json')
    process.env.SPEECH_DOC_LOCAL_STORE_PATH = localPath

    mockSet.mockRejectedValueOnce(new Error('blob unavailable'))
    mockGet.mockRejectedValueOnce(new Error('blob unavailable'))

    const { getSpeechDocumentFile, saveSpeechDocumentFile } = await import('../speech-documents')

    const key = 'files/abc.docx'
    const payload = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x10])

    await saveSpeechDocumentFile(key, payload)
    const loaded = await getSpeechDocumentFile(key)

    expect(loaded).toEqual(payload)
  })
})
