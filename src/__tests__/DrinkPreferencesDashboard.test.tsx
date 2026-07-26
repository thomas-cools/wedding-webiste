import { render, screen } from '../test-utils'
import { DrinkPreferencesDashboard } from '../components/Admin/DrinkPreferencesDashboard'
import type { AdminDrinkPrefs, RsvpStats, UseAdminRsvpsReturn } from '../components/Admin/useAdminRsvps'

function makePrefs(overrides: Partial<AdminDrinkPrefs> = {}): AdminDrinkPrefs {
  return {
    id: '1',
    firstName: 'Alice',
    guestName: 'Alice',
    email: 'alice@example.com',
    wine: [],
    beer: [],
    cocktail: [],
    favoriteCocktail: '',
    nonAlcoholic: [],
    comments: '',
    submittedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeAdminData(overrides: Partial<UseAdminRsvpsReturn> = {}): UseAdminRsvpsReturn {
  const localeOverrides = new Map<string, string>()
  const stats: RsvpStats = {
    total: 0,
    definitely: 0,
    highlyLikely: 0,
    maybe: 0,
    declined: 0,
    totalAttendees: 0,
    attendingWelcome: 0,
    attendingCeremony: 0,
    attendingBrunch: 0,
    possibleDuplicates: 0,
  }

  return {
    rsvps: [],
    stats,
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
    addManualParty: jest.fn(),
    updateManualParty: jest.fn(),
    deleteManualPartyById: jest.fn(),
    ...overrides,
  }
}

describe('DrinkPreferencesDashboard', () => {
  it('shows loading skeletons while isLoading is true', () => {
    const adminData = makeAdminData({ isLoading: true })
    render(<DrinkPreferencesDashboard adminData={adminData} />)

    expect(screen.queryByText('Respondents')).not.toBeInTheDocument()
  })

  it('shows an empty-state message when there are no submissions', () => {
    const adminData = makeAdminData()
    render(<DrinkPreferencesDashboard adminData={adminData} />)

    expect(screen.getByText('No drink preference submissions yet.')).toBeInTheDocument()
  })

  it("renders each guest's favorite drink (favoriteCocktail) in the per-guest table", () => {
    const drinkPrefsMap = new Map<string, AdminDrinkPrefs[]>([
      [
        'alice@example.com',
        [makePrefs({ id: '1', guestName: 'Alice', favoriteCocktail: 'Old Fashioned' })],
      ],
    ])
    const adminData = makeAdminData({ drinkPrefsMap })
    render(<DrinkPreferencesDashboard adminData={adminData} />)

    expect(screen.getAllByText('Old Fashioned').length).toBeGreaterThan(0)
  })

  it('shows an em dash in the Go-to Drink column when favoriteCocktail is empty', () => {
    const drinkPrefsMap = new Map<string, AdminDrinkPrefs[]>([
      ['bob@example.com', [makePrefs({ id: '2', guestName: 'Bob', email: 'bob@example.com', favoriteCocktail: '' })]],
    ])
    const adminData = makeAdminData({ drinkPrefsMap })
    render(<DrinkPreferencesDashboard adminData={adminData} />)

    const cell = screen.getByText('Bob').closest('tr')
    expect(cell).not.toBeNull()
    expect(cell!.textContent).toContain('—')
  })

  it('lists non-empty favorite drinks in the "Go-to Drinks" summary section', () => {
    const drinkPrefsMap = new Map<string, AdminDrinkPrefs[]>([
      [
        'alice@example.com',
        [
          makePrefs({ id: '1', guestName: 'Alice', favoriteCocktail: 'Espresso Martini' }),
          makePrefs({ id: '2', guestName: 'Bob', email: 'alice@example.com', favoriteCocktail: '' }),
        ],
      ],
    ])
    const adminData = makeAdminData({ drinkPrefsMap })
    render(<DrinkPreferencesDashboard adminData={adminData} />)

    expect(screen.getByText('Go-to Drinks (1)')).toBeInTheDocument()
    expect(screen.getAllByText('Espresso Martini').length).toBeGreaterThan(0)
  })

  it('counts unique households as respondents and all entries as total guests', () => {
    const drinkPrefsMap = new Map<string, AdminDrinkPrefs[]>([
      [
        'alice@example.com',
        [
          makePrefs({ id: '1', guestName: 'Alice' }),
          makePrefs({ id: '2', guestName: 'Bob', email: 'alice@example.com' }),
        ],
      ],
    ])
    const adminData = makeAdminData({ drinkPrefsMap })
    render(<DrinkPreferencesDashboard adminData={adminData} />)

    expect(screen.getByText('Respondents')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // 1 household
    expect(screen.getByText('2')).toBeInTheDocument() // 2 total guests
  })

  it('shows guest comments when present', () => {
    const drinkPrefsMap = new Map<string, AdminDrinkPrefs[]>([
      ['alice@example.com', [makePrefs({ id: '1', guestName: 'Alice', comments: 'So excited!' })]],
    ])
    const adminData = makeAdminData({ drinkPrefsMap })
    render(<DrinkPreferencesDashboard adminData={adminData} />)

    expect(screen.getByText('So excited!')).toBeInTheDocument()
  })
})
