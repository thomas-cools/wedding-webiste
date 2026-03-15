import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  DrinkPreferencesData,
  WineChoice,
  BeerChoice,
  CocktailChoice,
  NonAlcoholicChoice,
} from './types'
import {
  loadDrinkPreferences,
  saveDrinkPreferences,
  submitDrinkPreferencesToNetlify,
  sendDrinkNotificationEmail,
} from './drinkPreferencesApi'
import type { GuestData } from './useDrinkToken'

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface GuestFormState {
  guestName: string
  wine: WineChoice[]
  beer: BeerChoice[]
  cocktail: CocktailChoice[]
  favoriteCocktail: string
  nonAlcoholic: NonAlcoholicChoice[]
}

export interface UseDrinkPreferencesFormReturn {
  firstName: string
  setFirstName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  isPreFilled: boolean
  partyMembers: string[]
  activeGuestIndex: number
  setActiveGuestIndex: (i: number) => void
  // Active guest drink state
  wine: WineChoice[]
  toggleWine: (v: WineChoice) => void
  beer: BeerChoice[]
  toggleBeer: (v: BeerChoice) => void
  cocktail: CocktailChoice[]
  toggleCocktail: (v: CocktailChoice) => void
  favoriteCocktail: string
  setFavoriteCocktail: (v: string) => void
  nonAlcoholic: NonAlcoholicChoice[]
  toggleNonAlcoholic: (v: NonAlcoholicChoice) => void
  comments: string
  setComments: (v: string) => void
  errors: Record<string, string>
  validateField: (field: string, value?: string) => void
  hasAttemptedSubmit: boolean
  status: FormStatus
  handleSubmit: (e: React.FormEvent) => Promise<void>
  guestErrors: Record<number, string[]>
}

export interface UseDrinkPreferencesFormOptions {
  onSuccess?: () => void
  guestData?: GuestData | null
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

function createEmptyGuestState(guestName: string): GuestFormState {
  return { guestName, wine: [], beer: [], cocktail: [], favoriteCocktail: '', nonAlcoholic: [] }
}

export function useDrinkPreferencesForm(
  options: UseDrinkPreferencesFormOptions = {}
): UseDrinkPreferencesFormReturn {
  const { t, i18n } = useTranslation()
  const guestData = options.guestData ?? null
  const isPreFilled = guestData !== null
  const partyMembers = guestData?.partyMembers ?? []
  const isMultiGuest = partyMembers.length > 1

  const [firstName, setFirstName] = useState(guestData?.primaryName ?? '')
  const [email, setEmail] = useState(guestData?.email ?? '')

  // Multi-guest state: one form state per party member
  const [guestStates, setGuestStates] = useState<GuestFormState[]>(() => {
    if (isMultiGuest) {
      // Load any previously saved preferences from localStorage
      const saved = loadDrinkPreferences()
      return partyMembers.map((name) => {
        const prev = saved.find(
          (s) =>
            s.email.toLowerCase() === (guestData?.email ?? '').toLowerCase() &&
            s.guestName.toLowerCase() === name.toLowerCase()
        )
        if (prev) {
          return {
            guestName: name,
            wine: prev.wine,
            beer: prev.beer,
            cocktail: prev.cocktail,
            favoriteCocktail: prev.favoriteCocktail,
            nonAlcoholic: prev.nonAlcoholic,
          }
        }
        return createEmptyGuestState(name)
      })
    }
    return [createEmptyGuestState(guestData?.primaryName ?? '')]
  })

  const [activeGuestIndex, setActiveGuestIndex] = useState(0)
  const [comments, setComments] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [guestErrors, setGuestErrors] = useState<Record<number, string[]>>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [status, setStatus] = useState<FormStatus>('idle')

  // Helpers to get/set active guest fields
  const activeGuest = guestStates[activeGuestIndex] ?? guestStates[0]

  const updateActiveGuest = useCallback(
    (updater: (state: GuestFormState) => GuestFormState) => {
      setGuestStates((prev) => {
        const next = [...prev]
        next[activeGuestIndex] = updater(next[activeGuestIndex])
        return next
      })
    },
    [activeGuestIndex]
  )

  const clearDrinksError = useCallback(() => {
    setErrors((e) => { const n = { ...e }; delete n.drinks; return n })
    setGuestErrors((prev) => {
      const next = { ...prev }
      delete next[activeGuestIndex]
      return next
    })
  }, [activeGuestIndex])

  const toggleWine = useCallback((v: WineChoice) => {
    updateActiveGuest((g) => {
      const next = toggleInArray(g.wine, v)
      if (next.length > 0) clearDrinksError()
      return { ...g, wine: next }
    })
  }, [updateActiveGuest, clearDrinksError])

  const toggleBeer = useCallback((v: BeerChoice) => {
    updateActiveGuest((g) => {
      const next = toggleInArray(g.beer, v)
      if (next.length > 0) clearDrinksError()
      return { ...g, beer: next }
    })
  }, [updateActiveGuest, clearDrinksError])

  const toggleCocktail = useCallback((v: CocktailChoice) => {
    updateActiveGuest((g) => {
      const next = toggleInArray(g.cocktail, v)
      if (next.length > 0) clearDrinksError()
      return { ...g, cocktail: next }
    })
  }, [updateActiveGuest, clearDrinksError])

  const toggleNonAlcoholic = useCallback((v: NonAlcoholicChoice) => {
    updateActiveGuest((g) => {
      const next = toggleInArray(g.nonAlcoholic, v)
      if (next.length > 0) clearDrinksError()
      return { ...g, nonAlcoholic: next }
    })
  }, [updateActiveGuest, clearDrinksError])

  const setFavoriteCocktail = useCallback((v: string) => {
    updateActiveGuest((g) => ({ ...g, favoriteCocktail: v }))
  }, [updateActiveGuest])

  const validateField = useCallback(
    (field: string, value?: string) => {
      setErrors((prev) => {
        const next = { ...prev }
        switch (field) {
          case 'firstName':
            if (!(value ?? firstName).trim()) {
              next.firstName = t('drinkPreferences.validation.nameRequired')
            } else {
              delete next.firstName
            }
            break
          case 'email': {
            const v = (value ?? email).trim()
            if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
              next.email = t('drinkPreferences.validation.emailRequired')
            } else {
              delete next.email
            }
            break
          }
          case 'drinks': {
            const g = guestStates[activeGuestIndex]
            if (g.wine.length === 0 && g.beer.length === 0 && g.cocktail.length === 0 && g.nonAlcoholic.length === 0) {
              next.drinks = t('drinkPreferences.validation.atLeastOneDrink')
            } else {
              delete next.drinks
            }
            break
          }
        }
        return next
      })
    },
    [firstName, email, guestStates, activeGuestIndex, t]
  )

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    const newGuestErrors: Record<number, string[]> = {}

    if (!firstName.trim()) {
      newErrors.firstName = t('drinkPreferences.validation.nameRequired')
    }
    const emailVal = email.trim()
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = t('drinkPreferences.validation.emailRequired')
    }

    // Validate each guest has at least one drink preference
    let anyGuestMissingDrinks = false
    guestStates.forEach((g, i) => {
      if (g.wine.length === 0 && g.beer.length === 0 && g.cocktail.length === 0 && g.nonAlcoholic.length === 0) {
        anyGuestMissingDrinks = true
        newGuestErrors[i] = [t('drinkPreferences.validation.atLeastOneDrink')]
      }
    })
    if (anyGuestMissingDrinks) {
      newErrors.drinks = t('drinkPreferences.validation.atLeastOneDrink')
    }

    setErrors(newErrors)
    setGuestErrors(newGuestErrors)
    return Object.keys(newErrors).length === 0
  }, [firstName, email, guestStates, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setHasAttemptedSubmit(true)

      if (!validateAll()) return

      setStatus('submitting')

      const trimmedFirstName = firstName.trim()
      const trimmedEmail = email.trim()
      const existing = loadDrinkPreferences()
      const submissions: DrinkPreferencesData[] = []
      // Shared submission ID links all guests from the same form submission
      const submissionId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

      for (const guestState of guestStates) {
        const entry: DrinkPreferencesData = {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          firstName: trimmedFirstName,
          guestName: isMultiGuest ? guestState.guestName : trimmedFirstName,
          submissionId,
          email: trimmedEmail,
          wine: [...guestState.wine],
          beer: [...guestState.beer],
          cocktail: [...guestState.cocktail],
          favoriteCocktail: guestState.favoriteCocktail.trim(),
          nonAlcoholic: [...guestState.nonAlcoholic],
          comments: comments.trim(),
          timestamp: Date.now(),
        }

        // Save locally — dedup by email + guestName
        const idx = existing.findIndex(
          (r) =>
            r.email.toLowerCase() === entry.email.toLowerCase() &&
            (r.guestName ?? r.firstName).toLowerCase() === entry.guestName.toLowerCase()
        )
        if (idx >= 0) {
          existing[idx] = entry
        } else {
          existing.push(entry)
        }

        submissions.push(entry)
      }

      saveDrinkPreferences(existing)

      // Submit all guests sequentially with a delay to avoid Netlify dropping
      // concurrent POSTs and to stay within notification rate limits
      for (let i = 0; i < submissions.length; i++) {
        const entry = submissions[i]
        try {
          await submitDrinkPreferencesToNetlify(entry)
        } catch { /* best-effort */ }
        try {
          await sendDrinkNotificationEmail({ ...entry, locale: i18n.language })
        } catch { /* best-effort */ }
        if (i < submissions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250))
        }
      }

      setStatus('success')
      options.onSuccess?.()
    },
    [
      firstName,
      email,
      guestStates,
      isMultiGuest,
      comments,
      validateAll,
      i18n.language,
      options,
    ]
  )

  return {
    firstName,
    setFirstName,
    email,
    setEmail,
    isPreFilled,
    partyMembers,
    activeGuestIndex,
    setActiveGuestIndex,
    wine: activeGuest.wine,
    toggleWine,
    beer: activeGuest.beer,
    toggleBeer,
    cocktail: activeGuest.cocktail,
    toggleCocktail,
    favoriteCocktail: activeGuest.favoriteCocktail,
    setFavoriteCocktail,
    nonAlcoholic: activeGuest.nonAlcoholic,
    toggleNonAlcoholic,
    comments,
    setComments,
    errors,
    validateField,
    hasAttemptedSubmit,
    status,
    handleSubmit,
    guestErrors,
  }
}
