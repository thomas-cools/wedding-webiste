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

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface UseDrinkPreferencesFormReturn {
  firstName: string
  setFirstName: (v: string) => void
  email: string
  setEmail: (v: string) => void
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
}

export interface UseDrinkPreferencesFormOptions {
  onSuccess?: () => void
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

export function useDrinkPreferencesForm(
  options: UseDrinkPreferencesFormOptions = {}
): UseDrinkPreferencesFormReturn {
  const { t, i18n } = useTranslation()

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [wine, setWine] = useState<WineChoice[]>([])
  const [beer, setBeer] = useState<BeerChoice[]>([])
  const [cocktail, setCocktail] = useState<CocktailChoice[]>([])
  const [favoriteCocktail, setFavoriteCocktail] = useState('')
  const [nonAlcoholic, setNonAlcoholic] = useState<NonAlcoholicChoice[]>([])
  const [comments, setComments] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [status, setStatus] = useState<FormStatus>('idle')

  const toggleWine = useCallback((v: WineChoice) => {
    setWine((prev) => {
      const next = toggleInArray(prev, v)
      // Clear drinks error if we just added something
      if (next.length > 0) {
        setErrors((e) => { const n = { ...e }; delete n.drinks; return n })
      }
      return next
    })
  }, [])

  const toggleBeer = useCallback((v: BeerChoice) => {
    setBeer((prev) => {
      const next = toggleInArray(prev, v)
      if (next.length > 0) {
        setErrors((e) => { const n = { ...e }; delete n.drinks; return n })
      }
      return next
    })
  }, [])

  const toggleCocktail = useCallback((v: CocktailChoice) => {
    setCocktail((prev) => {
      const next = toggleInArray(prev, v)
      if (next.length > 0) {
        setErrors((e) => { const n = { ...e }; delete n.drinks; return n })
      }
      return next
    })
  }, [])

  const toggleNonAlcoholic = useCallback((v: NonAlcoholicChoice) => {
    setNonAlcoholic((prev) => {
      const next = toggleInArray(prev, v)
      if (next.length > 0) {
        setErrors((e) => { const n = { ...e }; delete n.drinks; return n })
      }
      return next
    })
  }, [])

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
            if (wine.length === 0 && beer.length === 0 && cocktail.length === 0 && nonAlcoholic.length === 0) {
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
    [firstName, email, wine, beer, cocktail, nonAlcoholic, t]
  )

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) {
      newErrors.firstName = t('drinkPreferences.validation.nameRequired')
    }
    const emailVal = email.trim()
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = t('drinkPreferences.validation.emailRequired')
    }
    if (wine.length === 0 && beer.length === 0 && cocktail.length === 0 && nonAlcoholic.length === 0) {
      newErrors.drinks = t('drinkPreferences.validation.atLeastOneDrink')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [firstName, email, wine, beer, cocktail, nonAlcoholic, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setHasAttemptedSubmit(true)

      if (!validateAll()) return

      setStatus('submitting')

      const entry: DrinkPreferencesData = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        firstName: firstName.trim(),
        email: email.trim(),
        wine: [...wine],
        beer: [...beer],
        cocktail: [...cocktail],
        favoriteCocktail: favoriteCocktail.trim(),
        nonAlcoholic: [...nonAlcoholic],
        comments: comments.trim(),
        timestamp: Date.now(),
      }

      // Save locally
      const existing = loadDrinkPreferences()
      const idx = existing.findIndex(
        (r) => r.email.toLowerCase() === entry.email.toLowerCase()
      )
      if (idx >= 0) {
        existing[idx] = entry
      } else {
        existing.push(entry)
      }
      saveDrinkPreferences(existing)

      // Submit to Netlify Forms (fire and forget in production)
      void submitDrinkPreferencesToNetlify(entry)

      // Send notification email to couple
      void sendDrinkNotificationEmail({
        ...entry,
        locale: i18n.language,
      })

      setStatus('success')
      options.onSuccess?.()
    },
    [
      firstName,
      email,
      wine,
      beer,
      cocktail,
      nonAlcoholic,
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
    wine,
    toggleWine,
    beer,
    toggleBeer,
    cocktail,
    toggleCocktail,
    favoriteCocktail,
    setFavoriteCocktail,
    nonAlcoholic,
    toggleNonAlcoholic,
    comments,
    setComments,
    errors,
    validateField,
    hasAttemptedSubmit,
    status,
    handleSubmit,
  }
}
