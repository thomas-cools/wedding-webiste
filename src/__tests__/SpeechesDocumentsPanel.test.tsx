import { ChakraProvider } from '@chakra-ui/react'
import { render, screen, waitFor } from '../test-utils'
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
})
