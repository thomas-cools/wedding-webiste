import { render, screen, fireEvent, waitFor } from '../test-utils'
import { RsvpDashboard } from '../components/Admin/RsvpDashboard'
import type { AdminRsvp, UseAdminRsvpsReturn } from '../components/Admin/useAdminRsvps'

// Local override: the global @chakra-ui/icons mock (setupTests.ts) doesn't include
// DownloadIcon/CloseIcon, which this component (and the RsvpDetailModal it renders)
// now use for the export menu and the guest-edit remove-row buttons.
jest.mock('@chakra-ui/icons', () => {
  const React = require('react')
  return {
    WarningIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'warning-icon', ...props }),
    DownloadIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'download-icon', ...props }),
    ChevronDownIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'chevron-down-icon', ...props }),
    CloseIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'close-icon', ...props }),
  }
})

function makeRsvp(overrides: Partial<AdminRsvp> = {}): AdminRsvp {
  return {
    id: '1',
    firstName: 'Alice',
    email: 'alice@example.com',
    mailingAddress: '',
    likelihood: 'definitely',
    events: { welcome: 'yes', ceremony: 'yes', brunch: 'yes' },
    accommodation: 'venue',
    travelPlan: 'no_plan',
    guests: [],
    dietary: '',
    franceTips: false,
    additionalNotes: '',
    submittedAt: '2026-01-01T00:00:00.000Z',
    locale: 'en',
    ...overrides,
  }
}

function makeAdminData(overrides: Partial<UseAdminRsvpsReturn> = {}): UseAdminRsvpsReturn {
  const rsvps = [makeRsvp()]
  const localeOverrides = new Map<string, string>()

  return {
    rsvps,
    stats: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    search: '',
    setSearch: jest.fn(),
    likelihoodFilters: new Set(),
    toggleLikelihoodFilter: jest.fn(),
    clearLikelihoodFilters: jest.fn(),
    filteredRsvps: rsvps,
    sortColumn: '',
    sortDirection: 'asc',
    setSort: jest.fn(),
    selectedIds: new Set(),
    toggleSelected: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    localeOverrides,
    setGuestLocale: jest.fn(),
    getEffectiveLocale: (rsvp: AdminRsvp) => localeOverrides.get(rsvp.id) || rsvp.locale || 'en',
    drinkPrefsMap: new Map(),
    emailOpensMap: new Map(),
    finalRsvps: [],
    finalRsvpStats: null,
    finalRsvpsLoading: false,
    finalRsvpsError: null,
    fetchFinalRsvps: jest.fn(),
    exportFinalRsvpsCsv: jest.fn(),
    exportFinalRsvpsMarkdown: jest.fn(),
    exportRsvpsCsv: jest.fn(),
    exportRsvpsMarkdown: jest.fn(),
    updateRsvpGuests: jest.fn(),
    updateRsvpEmail: jest.fn(),
    ...overrides,
  }
}

describe('RsvpDashboard — export menu', () => {
  it('calls exportRsvpsCsv when "Export as CSV" is clicked', () => {
    const adminData = makeAdminData()
    render(<RsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    fireEvent.click(screen.getByText('Export as CSV'))

    expect(adminData.exportRsvpsCsv).toHaveBeenCalledTimes(1)
  })

  it('calls exportRsvpsMarkdown when "Export as Markdown" is clicked', () => {
    const adminData = makeAdminData()
    render(<RsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    fireEvent.click(screen.getByText('Export as Markdown'))

    expect(adminData.exportRsvpsMarkdown).toHaveBeenCalledTimes(1)
  })

  it('disables the export menu button when there are no filtered RSVPs', () => {
    const adminData = makeAdminData({ rsvps: [], filteredRsvps: [] })
    render(<RsvpDashboard adminData={adminData} />)

    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
  })

  it('does not affect the "results" count text next to it', () => {
    const adminData = makeAdminData()
    render(<RsvpDashboard adminData={adminData} />)

    expect(screen.getByText('1 result')).toBeInTheDocument()
  })
})

describe('RsvpDashboard — guest editing', () => {
  it('opens the detail modal for the clicked party', () => {
    const adminData = makeAdminData()
    render(<RsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByText('Alice'))

    expect(screen.getByRole('button', { name: 'Edit Guests' })).toBeInTheDocument()
  })

  it('adds a new guest row and saves via updateRsvpGuests', async () => {
    const updateRsvpGuests = jest.fn().mockResolvedValue(true)
    const adminData = makeAdminData({ updateRsvpGuests })
    render(<RsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByText('Alice'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Guests' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Add Guest' }))

    fireEvent.change(screen.getByPlaceholderText('Guest name'), { target: { value: 'New Guest' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateRsvpGuests).toHaveBeenCalledWith('alice@example.com', [{ name: 'New Guest' }])
    })
  })

  it('removes a guest row before saving', async () => {
    const updateRsvpGuests = jest.fn().mockResolvedValue(true)
    const rsvp = makeRsvp({ guests: [{ name: 'Bob' }, { name: 'Carol' }] })
    const adminData = makeAdminData({ rsvps: [rsvp], filteredRsvps: [rsvp], updateRsvpGuests })
    render(<RsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByText('Alice'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Guests' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove guest' })[0]!)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateRsvpGuests).toHaveBeenCalledWith('alice@example.com', [{ name: 'Carol' }])
    })
  })

  it('shows an "Edited" badge in the table when a party has been manually edited', () => {
    const rsvp = makeRsvp({ guestsManuallyEditedAt: '2026-01-05T00:00:00.000Z' })
    const adminData = makeAdminData({ rsvps: [rsvp], filteredRsvps: [rsvp] })
    render(<RsvpDashboard adminData={adminData} />)

    expect(screen.getByText('Edited')).toBeInTheDocument()
  })
})

describe('RsvpDashboard — email editing', () => {
  it('saves a corrected email via updateRsvpEmail', async () => {
    const updateRsvpEmail = jest.fn().mockResolvedValue(true)
    const adminData = makeAdminData({ updateRsvpEmail })
    render(<RsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByText('Alice'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    const emailInput = screen.getByDisplayValue('alice@example.com')
    fireEvent.change(emailInput, { target: { value: 'alice-fixed@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateRsvpEmail).toHaveBeenCalledWith('1', 'alice@example.com', 'alice-fixed@example.com')
    })
  })

  it('rejects an invalid email without calling updateRsvpEmail', async () => {
    const updateRsvpEmail = jest.fn().mockResolvedValue(true)
    const adminData = makeAdminData({ updateRsvpEmail })
    render(<RsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByText('Alice'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    const emailInput = screen.getByDisplayValue('alice@example.com')
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateRsvpEmail).not.toHaveBeenCalled()
  })

  it('shows a "Corrected" badge in the table when a party\'s email has been fixed', () => {
    const rsvp = makeRsvp({ emailCorrectedAt: '2026-01-05T00:00:00.000Z' })
    const adminData = makeAdminData({ rsvps: [rsvp], filteredRsvps: [rsvp] })
    render(<RsvpDashboard adminData={adminData} />)

    expect(screen.getByText('Corrected')).toBeInTheDocument()
  })
})
