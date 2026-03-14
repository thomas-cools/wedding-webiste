import { useState, useEffect, useCallback } from 'react'
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
}

export interface RsvpStats {
  total: number
  definitely: number
  highlyLikely: number
  maybe: number
  declined: number
  totalAttendees: number
}

interface UseAdminRsvpsReturn {
  rsvps: AdminRsvp[]
  stats: RsvpStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
  // Client-side filtering
  search: string
  setSearch: (s: string) => void
  likelihoodFilter: string
  setLikelihoodFilter: (f: string) => void
  filteredRsvps: AdminRsvp[]
  selectedIds: Set<string>
  toggleSelected: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
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
  const [likelihoodFilter, setLikelihoodFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchRsvps = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin-rsvps', {
        headers: getAdminAuthHeaders(),
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError('Session expired. Please log in again.')
        } else {
          const data = await res.json().catch(() => ({}))
          setError(data.error || `Failed to fetch RSVPs (${res.status})`)
        }
        return
      }

      const data = await res.json()
      setRsvps(data.rsvps || [])
      setStats(data.stats || EMPTY_STATS)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRsvps()
  }, [fetchRsvps])

  // Client-side filtering
  const filteredRsvps = rsvps.filter((r) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase()
      const nameMatch = r.firstName.toLowerCase().includes(q)
      const emailMatch = r.email.toLowerCase().includes(q)
      const guestMatch = r.guests.some((g) =>
        g.name.toLowerCase().includes(q)
      )
      if (!nameMatch && !emailMatch && !guestMatch) return false
    }

    // Likelihood filter
    if (likelihoodFilter && r.likelihood !== likelihoodFilter) {
      return false
    }

    return true
  })

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

  return {
    rsvps,
    stats,
    isLoading,
    error,
    refetch: fetchRsvps,
    search,
    setSearch,
    likelihoodFilter,
    setLikelihoodFilter,
    filteredRsvps,
    selectedIds,
    toggleSelected,
    selectAll,
    clearSelection,
  }
}
