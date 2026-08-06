import { ChakraProvider } from '@chakra-ui/react'
import { fireEvent, render, screen, waitFor } from '../test-utils'
import theme from '../theme'
import { SpeechesDocumentsPanel } from '../components/Admin/SpeechesDocumentsPanel'

jest.mock('../utils/adminAuth', () => ({
  getAdminAuthHeaders: () => ({ authorization: 'Bearer test-token' }),
}))

describe('SpeechesDocumentsPanel', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  function renderPanel() {
    return render(
      <ChakraProvider theme={theme}>
        <SpeechesDocumentsPanel />
      </ChakraProvider>
    )
  }

  it('shows the detected speech language in the documents table', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        documents: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            fileName: 'Welcome Speech',
            sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
            sourceHost: 'docs.google.com',
            sourceKind: 'url',
            fileSizeBytes: 2048,
            docType: 'google-doc',
            translationStatus: 'success',
            detectedLanguage: 'en',
            translatedLanguage: 'es',
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'admin',
          },
        ],
        limits: {
          maxFileSizeBytes: 1024 * 1024,
          maxFileNameLength: 120,
        },
        allowedHosts: ['docs.google.com'],
      }),
    } as never)

    renderPanel()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin-speeches-documents-list',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    expect(await screen.findByText('English')).toBeInTheDocument()
    expect(screen.getByText('EN -> ES')).toBeInTheDocument()
  })

  it('opens the translated content for a successful document', async () => {
    jest.spyOn(global, 'fetch' as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        documents: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            fileName: 'Welcome Speech',
            sourceUrl: 'https://docs.google.com/document/d/abc123/edit',
            sourceHost: 'docs.google.com',
            sourceKind: 'url',
            fileSizeBytes: 2048,
            docType: 'google-doc',
            sourceText: 'Hola a todos.',
            translatedText: 'Hello everyone.',
            translationStatus: 'success',
            translationProvider: 'gemini',
            translationError: undefined,
            detectedLanguage: 'es',
            translatedLanguage: 'en',
            createdAt: '2026-01-01T00:00:00.000Z',
            createdBy: 'admin',
          },
        ],
        limits: {
          maxFileSizeBytes: 1024 * 1024,
          maxFileNameLength: 120,
        },
        allowedHosts: ['docs.google.com'],
      }),
    } as never)

    renderPanel()

    const translationButton = await screen.findByRole('button', { name: 'Translation' })
    fireEvent.click(translationButton)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Hello everyone.')).toBeInTheDocument()
    expect(screen.getByText('Hola a todos.')).toBeInTheDocument()
  })

  it('runs the speaker backfill action', async () => {
    const fetchMock = jest.spyOn(global, 'fetch' as never).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url === '/api/admin-speeches-documents-list') {
        return new Response(
          JSON.stringify({
            ok: true,
            documents: [],
            limits: {
              maxFileSizeBytes: 1024 * 1024,
              maxFileNameLength: 120,
            },
            allowedHosts: ['docs.google.com'],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        ) as never
      }

      if (url === '/api/admin-speeches-documents-backfill') {
        return new Response(JSON.stringify({ ok: true, total: 2, backfilled: 1 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }) as never
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    })

    renderPanel()

    const button = await screen.findByRole('button', { name: 'Backfill speakers' })
    fireEvent.click(button)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin-speeches-documents-backfill',
        expect.objectContaining({ method: 'POST' })
      )
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin-speeches-documents-list',
      expect.objectContaining({ method: 'GET' })
    )
  })
})
