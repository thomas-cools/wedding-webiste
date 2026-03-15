import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAdminAuthHeaders } from '../../utils/adminAuth'

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
  guests: Array<{ name: string; age?: string; dietary?: string }>
  dietary: string
  franceTips: boolean
  additionalNotes: string
  submittedAt: string
  locale: string
}

export interface AdminDrinkPrefs {
  id: string
  firstName: string
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
  drinkPrefsMap: Map<string, AdminDrinkPrefs>
  emailOpensMap: Map<string, EmailOpen[]>
}

const EMPTY_STATS: RsvpStats = {
  total: 0,
  definitely: 0,
  highlyLikely: 0,
  maybe: 0,
  declined: 0,
  totalAttendees: 0,
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
  const [drinkPrefsMap, setDrinkPrefsMap] = useState<Map<string, AdminDrinkPrefs>>(new Map())
  const [emailOpensMap, setEmailOpensMap] = useState<Map<string, EmailOpen[]>>(new Map())

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

      // Drink preferences — map by email
      if (drinksRes?.ok) {
        const drinksData = await drinksRes.json()
        const map = new Map<string, AdminDrinkPrefs>()
        for (const dp of drinksData.drinkPrefs || []) {
          if (dp.email) map.set(dp.email.toLowerCase(), dp)
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
  }
}
