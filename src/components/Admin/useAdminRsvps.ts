import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAdminAuthHeaders } from '../../utils/adminAuth'

export interface AdminFinalRsvpGuest {
  name: string
  events: { welcome: string; ceremony: string; brunch: string }
  isChild: boolean
  appetizer?: string
  main?: string
  allergies?: string
}

export interface AdminFinalRsvp {
  id: string
  firstName: string
  email: string
  guests: AdminFinalRsvpGuest[]
  accommodationType: string
  accommodationAddress: string
  hotelName: string
  transportationPreference: string
  songRequest: string
  photographyConsent: boolean | null
  additionalNotes: string
  submittedAt: string
  locale: string
}

export interface FinalRsvpStats {
  total: number
  attendingWelcome: number
  attendingCeremony: number
  attendingBrunch: number
  ceviche: number
  gaspacho: number
  barFillet: number
  tournedos: number
  veganMain: number
  childrenMeals: number
  photographyConsented: number
  interestedInTaxi: number
}

export interface AdminRsvp {
  id: string
  firstName: string
  email: string
  mailingAddress: string
  likelihood: string
  events: {
    welcome: string
    ceremony: string
    brunch: string
  }
  accommodation: string
  travelPlan: string
  guests: Array<{
    name: string
    age?: string
    dietary?: string
    /** True if this guest appears to be someone who also submitted their own RSVP separately. */
    isDuplicate?: boolean
    /** Email of the separate RSVP this guest matches, when isDuplicate is true. */
    duplicateOfEmail?: string
  }>
  dietary: string
  franceTips: boolean
  additionalNotes: string
  submittedAt: string
  locale: string
  /** IDs of other RSVPs that listed this person as one of their guests. */
  matchedAsGuestIn?: string[]
}

export interface AdminDrinkPrefs {
  id: string
  firstName: string
  guestName: string
  email: string
  wine: string[]
  beer: string[]
  cocktail: string[]
  favoriteCocktail: string
  nonAlcoholic: string[]
  comments: string
  submittedAt: string
}

export interface EmailOpen {
  id: string
  recipientEmail: string
  campaign: string
  openedAt: string
}

export interface RsvpStats {
  total: number
  definitely: number
  highlyLikely: number
  maybe: number
  declined: number
  totalAttendees: number
  attendingWelcome: number
  attendingCeremony: number
  attendingBrunch: number
  possibleDuplicates: number
}

export type SortColumn = 'name' | 'email' | 'likelihood' | 'partySize' | 'date' | ''
export type SortDirection = 'asc' | 'desc'

export interface UseAdminRsvpsReturn {
  rsvps: AdminRsvp[]
  stats: RsvpStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
  // Client-side filtering
  search: string
  setSearch: (s: string) => void
  likelihoodFilters: Set<string>
  toggleLikelihoodFilter: (value: string) => void
  clearLikelihoodFilters: () => void
  filteredRsvps: AdminRsvp[]
  // Sorting
  sortColumn: SortColumn
  sortDirection: SortDirection
  setSort: (column: SortColumn) => void
  // Selection
  selectedIds: Set<string>
  toggleSelected: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  // Per-guest locale overrides
  localeOverrides: Map<string, string>
  setGuestLocale: (id: string, locale: string) => void
  getEffectiveLocale: (rsvp: AdminRsvp) => string
  // Drink preferences & email opens
  drinkPrefsMap: Map<string, AdminDrinkPrefs[]>
  emailOpensMap: Map<string, EmailOpen[]>
  // Final RSVPs
  finalRsvps: AdminFinalRsvp[]
  finalRsvpStats: FinalRsvpStats | null
  finalRsvpsLoading: boolean
  finalRsvpsError: string | null
  fetchFinalRsvps: () => void
  exportFinalRsvpsCsv: () => void
}

const EMPTY_STATS: RsvpStats = {
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

export function useAdminRsvps(): UseAdminRsvpsReturn {
  const [rsvps, setRsvps] = useState<AdminRsvp[]>([])
  const [stats, setStats] = useState<RsvpStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [likelihoodFilters, setLikelihoodFilters] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<SortColumn>('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [localeOverrides, setLocaleOverrides] = useState<Map<string, string>>(new Map())
  const [drinkPrefsMap, setDrinkPrefsMap] = useState<Map<string, AdminDrinkPrefs[]>>(new Map())
  const [emailOpensMap, setEmailOpensMap] = useState<Map<string, EmailOpen[]>>(new Map())
  const [finalRsvps, setFinalRsvps] = useState<AdminFinalRsvp[]>([])
  const [finalRsvpStats, setFinalRsvpStats] = useState<FinalRsvpStats | null>(null)
  const [finalRsvpsLoading, setFinalRsvpsLoading] = useState(false)
  const [finalRsvpsError, setFinalRsvpsError] = useState<string | null>(null)

  const fetchRsvps = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const headers = getAdminAuthHeaders()
      const [rsvpRes, drinksRes, opensRes] = await Promise.all([
        fetch('/api/admin-rsvps', { headers }),
        fetch('/api/admin-drink-preferences', { headers }).catch(() => null),
        fetch('/api/admin-email-opens', { headers }).catch(() => null),
      ])

      if (!rsvpRes.ok) {
        if (rsvpRes.status === 401) {
          setError('Session expired. Please log in again.')
        } else {
          const data = await rsvpRes.json().catch(() => ({}))
          setError(data.error || `Failed to fetch RSVPs (${rsvpRes.status})`)
        }
        return
      }

      const rsvpData = await rsvpRes.json()
      setRsvps(rsvpData.rsvps || [])
      setStats(rsvpData.stats || EMPTY_STATS)

      // Drink preferences — group by email (multiple guests per party)
      if (drinksRes?.ok) {
        const drinksData = await drinksRes.json()
        const map = new Map<string, AdminDrinkPrefs[]>()
        for (const dp of drinksData.drinkPrefs || []) {
          if (!dp.email) continue
          const key = dp.email.toLowerCase()
          const list = map.get(key) || []
          list.push(dp)
          map.set(key, list)
        }
        setDrinkPrefsMap(map)
      }

      // Email opens — group by email
      if (opensRes?.ok) {
        const opensData = await opensRes.json()
        const map = new Map<string, EmailOpen[]>()
        for (const eo of opensData.emailOpens || []) {
          if (!eo.recipientEmail) continue
          const key = eo.recipientEmail.toLowerCase()
          const list = map.get(key) || []
          list.push(eo)
          map.set(key, list)
        }
        setEmailOpensMap(map)
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRsvps()
  }, [fetchRsvps])

  const toggleLikelihoodFilter = useCallback((value: string) => {
    setLikelihoodFilters((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const clearLikelihoodFilters = useCallback(() => {
    setLikelihoodFilters(new Set())
  }, [])

  const setSort = useCallback((column: SortColumn) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return column
    })
  }, [])

  // Client-side filtering + sorting
  const filteredRsvps = useMemo(() => {
    const LIKELIHOOD_ORDER: Record<string, number> = {
      definitely: 0,
      highly_likely: 1,
      maybe: 2,
      no: 3,
    }

    const filtered = rsvps.filter((r) => {
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = r.firstName.toLowerCase().includes(q)
        const emailMatch = r.email.toLowerCase().includes(q)
        const guestMatch = r.guests.some((g) =>
          g.name.toLowerCase().includes(q)
        )
        if (!nameMatch && !emailMatch && !guestMatch) return false
      }

      if (likelihoodFilters.size > 0 && !likelihoodFilters.has(r.likelihood)) {
        return false
      }

      return true
    })

    if (!sortColumn) return filtered

    const dir = sortDirection === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortColumn) {
        case 'name':
          return dir * a.firstName.localeCompare(b.firstName)
        case 'email':
          return dir * a.email.localeCompare(b.email)
        case 'likelihood':
          return dir * ((LIKELIHOOD_ORDER[a.likelihood] ?? 99) - (LIKELIHOOD_ORDER[b.likelihood] ?? 99))
        case 'partySize':
          return dir * ((1 + a.guests.length) - (1 + b.guests.length))
        case 'date':
          return dir * (new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
        default:
          return 0
      }
    })
  }, [rsvps, search, likelihoodFilters, sortColumn, sortDirection])

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredRsvps.map((r) => r.id)))
  }, [filteredRsvps])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const setGuestLocale = useCallback((id: string, locale: string) => {
    setLocaleOverrides((prev) => {
      const next = new Map(prev)
      next.set(id, locale)
      return next
    })
  }, [])

  const getEffectiveLocale = useCallback(
    (rsvp: AdminRsvp) => localeOverrides.get(rsvp.id) || rsvp.locale || 'en',
    [localeOverrides]
  )

  const fetchFinalRsvps = useCallback(async () => {
    setFinalRsvpsLoading(true)
    setFinalRsvpsError(null)
    try {
      const res = await fetch('/api/admin-final-rsvps', { headers: getAdminAuthHeaders() })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFinalRsvpsError(data.error || `Failed to fetch final RSVPs (${res.status})`)
        return
      }
      const data = await res.json()
      setFinalRsvps(data.finalRsvps || [])
      setFinalRsvpStats(data.stats || null)
    } catch {
      setFinalRsvpsError('Network error. Please check your connection.')
    } finally {
      setFinalRsvpsLoading(false)
    }
  }, [])

  const APPETIZER_LABELS: Record<string, string> = {
    ceviche: 'Ceviche de Bar',
    gaspacho: 'Gaspacho fumé (V)',
  }
  const MAIN_LABELS: Record<string, string> = {
    bar: 'Filet de Bar',
    tournedos: 'Tournedos de boeuf',
    vegan: 'Vegetable Tartlet',
  }

  const exportFinalRsvpsCsv = useCallback(() => {
    const ACCOMMODATION_TYPE_LABELS: Record<string, string> = {
      chateau: 'Chateau',
      airbnb: 'Airbnb',
      hotel: 'Hotel',
    }
    const accommodationTypeLabel = (r: AdminFinalRsvp) => ACCOMMODATION_TYPE_LABELS[r.accommodationType] || ''
    const accommodationDetail = (r: AdminFinalRsvp) =>
      r.accommodationType === 'airbnb' ? r.accommodationAddress : r.accommodationType === 'hotel' ? r.hotelName : ''
    const TRANSPORTATION_LABELS: Record<string, string> = {
      taxi: 'Taxi',
      own: 'Own Arrangement',
    }
    const transportationLabel = (r: AdminFinalRsvp) =>
      r.accommodationType !== 'chateau' ? (TRANSPORTATION_LABELS[r.transportationPreference] || '') : ''

    const rows: string[][] = []
    // Header
    rows.push([
      'Primary Name', 'Email', 'Welcome Dinner', 'Ceremony & Reception', 'Farewell Brunch',
      'Guest Name', 'Age Group', 'Appetizer', 'Main Course', 'Allergies',
      'Song Request', 'Accommodation Type', 'Accommodation Detail', 'Transportation Preference',
      'Photography Consent', 'Submitted At',
    ])

    for (const r of finalRsvps) {
      if (r.guests.length === 0) {
        rows.push([
          r.firstName, r.email,
          '', '', '',
          '', '', '', '', '',
          r.songRequest, accommodationTypeLabel(r),
          accommodationDetail(r), transportationLabel(r),
          r.photographyConsent === true ? 'Yes' : r.photographyConsent === false ? 'No' : '',
          r.submittedAt,
        ])
      } else {
        r.guests.forEach((g, i) => {
          rows.push([
            i === 0 ? r.firstName : '',
            i === 0 ? r.email : '',
            g.events.welcome, g.events.ceremony, g.events.brunch,
            g.name,
            g.isChild ? 'Child (<12)' : 'Adult',
            g.isChild ? "Children's Meal" : APPETIZER_LABELS[g.appetizer || ''] || g.appetizer || '',
            g.isChild ? "Children's Meal" : MAIN_LABELS[g.main || ''] || g.main || '',
            g.allergies || '',
            i === 0 ? r.songRequest : '',
            i === 0 ? accommodationTypeLabel(r) : '',
            i === 0 ? accommodationDetail(r) : '',
            i === 0 ? transportationLabel(r) : '',
            i === 0 ? (r.photographyConsent === true ? 'Yes' : r.photographyConsent === false ? 'No' : '') : '',
            i === 0 ? r.submittedAt : '',
          ])
        })
      }
    }

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `final-rsvps-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [finalRsvps])

  return {
    rsvps,
    stats,
    isLoading,
    error,
    refetch: fetchRsvps,
    search,
    setSearch,
    likelihoodFilters,
    toggleLikelihoodFilter,
    clearLikelihoodFilters,
    filteredRsvps,
    sortColumn,
    sortDirection,
    setSort,
    selectedIds,
    toggleSelected,
    selectAll,
    clearSelection,
    localeOverrides,
    setGuestLocale,
    getEffectiveLocale,
    drinkPrefsMap,
    emailOpensMap,
    finalRsvps,
    finalRsvpStats,
    finalRsvpsLoading,
    finalRsvpsError,
    fetchFinalRsvps,
    exportFinalRsvpsCsv,
  }
}
