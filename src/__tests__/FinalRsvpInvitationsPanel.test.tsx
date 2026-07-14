import { render, screen, fireEvent, waitFor } from '../test-utils'
import { FinalRsvpInvitationsPanel } from '../components/Admin/FinalRsvpInvitationsPanel'
import type { AdminRsvp, UseAdminRsvpsReturn } from '../components/Admin/useAdminRsvps'

// Mock toast
jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => jest.fn(),
  }
})

jest.mock('../utils/adminAuth', () => ({
  getAdminAuthHeaders: () => ({}),
}))

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
  const setGuestLocale = jest.fn()

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
    setGuestLocale,
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

describe('FinalRsvpInvitationsPanel — recipient checkbox selection', () => {
  const mockFetch = jest.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ totalCount: 0, confirmedGuests: [], sampleHtml: '', finalRsvpUrl: '' }),
    })
    global.fetch = mockFetch
  })

  function makeTwoGuestAdminData(overrides: Partial<UseAdminRsvpsReturn> = {}) {
    const rsvps = [
      makeRsvp({ id: '1', firstName: 'Alice', email: 'alice@example.com' }),
      makeRsvp({ id: '2', firstName: 'Bob', email: 'bob@example.com' }),
    ]
    return makeAdminData({ rsvps, filteredRsvps: rsvps, ...overrides })
  }

  it('renders the recipients table with every confirmed guest checked by default', () => {
    const adminData = makeTwoGuestAdminData()
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Invitations (2)' })).toBeInTheDocument()
  })

  it('unchecking a recipient row excludes them from the send count', () => {
    const adminData = makeTwoGuestAdminData()
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    const rowCheckboxes = screen.getAllByRole('checkbox').slice(1) // first is the header "select all" checkbox
    fireEvent.click(rowCheckboxes[0]!)

    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Invitations (1)' })).toBeInTheDocument()
  })

  it('"Select None" then "Select All" restores the full recipient list', () => {
    const adminData = makeTwoGuestAdminData()
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    fireEvent.click(screen.getByRole('button', { name: 'Select None' }))
    expect(screen.getByText('0 of 2 selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Invitations (0)' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument()
  })

  it('only sends to checked recipients, excluding unchecked ones', async () => {
    const adminData = makeTwoGuestAdminData()
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    const rowCheckboxes = screen.getAllByRole('checkbox').slice(1)
    fireEvent.click(rowCheckboxes[1]!) // uncheck Bob

    fireEvent.click(screen.getByRole('button', { name: 'Preview (Dry Run)' }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    const body = JSON.parse((mockFetch.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.guests).toHaveLength(1)
    expect(body.guests[0].name).toBe('Alice')
  })

  it('calls setGuestLocale when a recipient row\'s locale select is changed', () => {
    const setGuestLocale = jest.fn()
    const adminData = makeTwoGuestAdminData({ setGuestLocale })
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    const localeSelects = screen.getAllByDisplayValue('EN') as HTMLSelectElement[]
    fireEvent.change(localeSelects[0]!, { target: { value: 'es' } })

    expect(setGuestLocale).toHaveBeenCalledWith('1', 'es')
  })

  it('shows an "Opened" badge when the recipient has opened a final RSVP invitation email', () => {
    const emailOpensMap = new Map([
      ['alice@example.com', [{ id: 'o1', recipientEmail: 'alice@example.com', campaign: 'final_rsvp_invitation', openedAt: '2026-01-02T00:00:00.000Z' }]],
    ])
    const adminData = makeTwoGuestAdminData({ emailOpensMap })
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    expect(screen.getByText('Opened')).toBeInTheDocument()
  })
})

describe('FinalRsvpInvitationsPanel — email language selector', () => {
  const mockFetch = jest.fn()

  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ totalCount: 1, confirmedGuests: [], sampleHtml: '', finalRsvpUrl: '' }),
    })
    global.fetch = mockFetch
  })

  it('renders a global "Email Language" selector defaulting to English', () => {
    const adminData = makeAdminData()
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    expect(screen.getByText('Email Language')).toBeInTheDocument()
    expect(screen.getByDisplayValue('English')).toBeInTheDocument()
  })

  it('updates the selected email language when changed', () => {
    const adminData = makeAdminData()
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    const localeSelect = screen.getByDisplayValue('English')
    fireEvent.change(localeSelect, { target: { value: 'es' } })

    expect(screen.getByDisplayValue('Español')).toBeInTheDocument()
  })

  it('still uses each recipient\'s own effective locale (not the global selector) when building the dry-run payload', async () => {
    const localeOverrides = new Map([['1', 'nl']])
    const adminData = makeAdminData({
      localeOverrides,
      getEffectiveLocale: (rsvp: AdminRsvp) => localeOverrides.get(rsvp.id) || rsvp.locale || 'en',
    })
    render(<FinalRsvpInvitationsPanel adminData={adminData} />)

    fireEvent.click(screen.getByRole('button', { name: 'Preview (Dry Run)' }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    const body = JSON.parse((mockFetch.mock.calls[0]![1] as RequestInit).body as string)
    expect(body.guests[0].locale).toBe('nl')
  })
})

