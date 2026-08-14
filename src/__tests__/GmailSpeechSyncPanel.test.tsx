import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'

import { GmailSpeechSyncPanel } from '../components/Admin/GmailSpeechSyncPanel'

jest.mock('../utils/adminAuth', () => ({
  getAdminAuthHeaders: () => ({ authorization: 'Bearer test-token' }),
}))

describe('GmailSpeechSyncPanel', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('loads sanitized status and runs a fresh mailbox sync on demand', async () => {
    const user = userEvent.setup()
    let getCount = 0
    const fetchMock = jest.spyOn(global, 'fetch' as never).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url !== '/api/admin-speeches-gmail-sync') {
          throw new Error(`Unexpected fetch call: ${url}`)
        }

        if (init?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              sync: { found: 2, processed: 1, failed: 0, skipped: 1 },
            }),
          } as never
        }

        getCount += 1
        return {
          ok: true,
          json: async () => ({
            ok: true,
            status: {
              processing: 0,
              processed: getCount === 1 ? 3 : 4,
              failed: 0,
              failures: [],
            },
          }),
        } as never
      }
    )

    render(<GmailSpeechSyncPanel />)

    expect(await screen.findByText('3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Run sync now' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin-speeches-gmail-sync',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'sync' }),
        })
      )
    })

    expect(await screen.findByText('Latest on-demand run')).toBeInTheDocument()
    expect(screen.getByText('2 found')).toBeInTheDocument()
    expect(screen.getByText('1 processed')).toBeInTheDocument()
    expect(screen.getByText('0 failed')).toBeInTheDocument()
    expect(screen.getByText('1 skipped')).toBeInTheDocument()
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })

  it('shows sanitized failures and sends an explicit retry command', async () => {
    const user = userEvent.setup()
    const fetchMock = jest.spyOn(global, 'fetch' as never).mockImplementation(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              sync: { found: 1, processed: 1, failed: 0, skipped: 0 },
            }),
          } as never
        }

        return {
          ok: true,
          json: async () => ({
            ok: true,
            status: {
              processing: 0,
              processed: 2,
              failed: 1,
              failures: [{
                speakerKey: 'carlos',
                errorCode: 'processing_failed',
                error: 'Speech message could not be processed',
                updatedAt: '2026-08-14T12:00:00.000Z',
              }],
            },
          }),
        } as never
      }
    )

    render(<GmailSpeechSyncPanel />)

    expect(await screen.findByText(/Carlos: Speech message could not be processed/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry failed' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin-speeches-gmail-sync',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'retry' }),
        })
      )
    })
  })
})
