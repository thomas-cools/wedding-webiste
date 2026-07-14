import { render, screen, fireEvent } from '../test-utils'
import { FinalRsvpDashboard } from '../components/Admin/FinalRsvpDashboard'
import type { AdminFinalRsvp, UseAdminRsvpsReturn } from '../components/Admin/useAdminRsvps'

// Local override: the global @chakra-ui/icons mock (setupTests.ts) doesn't include
// DownloadIcon, which this component now uses for the export menu.
jest.mock('@chakra-ui/icons', () => {
  const React = require('react')
  return {
    DownloadIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'download-icon', ...props }),
    ViewIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'view-icon', ...props }),
    WarningIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'warning-icon', ...props }),
    ChevronDownIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'chevron-down-icon', ...props }),
  }
})

function makeFinalRsvp(overrides: Partial<AdminFinalRsvp> = {}): AdminFinalRsvp {
  return {
    id: '1',
    firstName: 'Alice',
    email: 'alice@example.com',
    guests: [],
    accommodationType: 'chateau',
    accommodationAddress: '',
    hotelName: '',
    transportationPreference: '',
    songRequest: '',
    photographyConsent: true,
    additionalNotes: '',
    submittedAt: '2026-01-01T00:00:00.000Z',
    locale: 'en',
    ...overrides,
  }
}

function makeAdminData(overrides: Partial<UseAdminRsvpsReturn> = {}): UseAdminRsvpsReturn {
  const localeOverrides = new Map<string, string>()

  return {
    rsvps: [],
    stats: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    search: '',
    setSearch: jest.fn(),
    likelihoodFilters: new Set(),
    toggleLikelihoodFilter: jest.fn(),
    clearLikelihoodFilters: jest.fn(),
    filteredRsvps: [],
    sortColumn: '',
    sortDirection: 'asc',
    setSort: jest.fn(),
    selectedIds: new Set(),
    toggleSelected: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    localeOverrides,
    setGuestLocale: jest.fn(),
    getEffectiveLocale: () => 'en',
    drinkPrefsMap: new Map(),
    emailOpensMap: new Map(),
    finalRsvps: [makeFinalRsvp()],
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

describe('FinalRsvpDashboard — export menu', () => {
  it('calls exportFinalRsvpsCsv when "Export as CSV" is clicked', () => {
    const adminData = makeAdminData()
    render(<FinalRsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    fireEvent.click(screen.getByText('Export as CSV'))

    expect(adminData.exportFinalRsvpsCsv).toHaveBeenCalledTimes(1)
  })

  it('calls exportFinalRsvpsMarkdown when "Export as Markdown" is clicked', () => {
    const adminData = makeAdminData()
    render(<FinalRsvpDashboard adminData={adminData} />)

    fireEvent.click(screen.getByRole('button', { name: /export/i }))
    fireEvent.click(screen.getByText('Export as Markdown'))

    expect(adminData.exportFinalRsvpsMarkdown).toHaveBeenCalledTimes(1)
  })

  it('disables the export menu button when there are no final RSVPs', () => {
    const adminData = makeAdminData({ finalRsvps: [] })
    render(<FinalRsvpDashboard adminData={adminData} />)

    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
  })
})
