import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  FinalRsvp,
  FinalRsvpGuest,
  FinalRsvpEventAnswer,
  Appetizer,
  MainCourse,
  AddressSuggestion,
  AccommodationType,
  TransportationPreference,
} from './types'
import { submitToNetlifyForms, sendConfirmationEmail, fetchAddressSuggestions } from './finalRsvpApi'

export interface UseFinalRsvpFormOptions {
  initialPartyMembers?: string[]  // index 0 = primary guest name
  initialEmail?: string
  onSuccess?: () => void
  onAddressWarning?: () => void
  onValidationError?: () => void
}

export interface UseFinalRsvpFormReturn {
  firstName: string
  email: string
  guests: FinalRsvpGuest[]
  updateGuest: (index: number, fields: Partial<FinalRsvpGuest>) => void
  setGuestEventAnswer: (index: number, event: keyof FinalRsvpGuest['events'], answer: FinalRsvpEventAnswer) => void
  accommodationType: AccommodationType
  setAccommodationType: (value: AccommodationType) => void
  accommodationAddress: string
  setAccommodationAddress: (value: string) => void
  accommodationAddressPlaceId: string
  setAccommodationAddressPlaceId: (value: string) => void
  accommodationSuggestions: AddressSuggestion[]
  accommodationSuggestionsOpen: boolean
  setAccommodationSuggestionsOpen: (value: boolean) => void
  accommodationAutocompleteLimited: boolean
  selectAccommodationSuggestion: (s: AddressSuggestion) => void
  hotelName: string
  setHotelName: (value: string) => void
  transportationPreference: TransportationPreference
  setTransportationPreference: (value: TransportationPreference) => void
  songRequest: string
  setSongRequest: (value: string) => void
  photographyConsent: boolean | null
  setPhotographyConsent: (value: boolean | null) => void
  additionalNotes: string
  setAdditionalNotes: (value: string) => void
  errors: Record<string, string>
  validateField: (field: string, value?: unknown) => void
  hasAttemptedSubmit: boolean
  isSubmitting: boolean
  handleSubmit: (e: React.FormEvent) => Promise<void>
}

export function useFinalRsvpForm({
  initialPartyMembers = [],
  initialEmail = '',
  onSuccess,
  onAddressWarning,
  onValidationError,
}: UseFinalRsvpFormOptions = {}): UseFinalRsvpFormReturn {
  const { t, i18n } = useTranslation()

  const firstName = initialPartyMembers[0] || ''
  const email = initialEmail

  // Initialize guests from party members
  const [guests, setGuests] = useState<FinalRsvpGuest[]>(() =>
    initialPartyMembers.map((name) => ({
      name,
      events: { welcome: '', ceremony: '', brunch: '' },
      isChild: false,
      appetizer: '' as Appetizer,
      main: '' as MainCourse,
      allergies: '',
    }))
  )

  const [accommodationType, setAccommodationType] = useState<AccommodationType>('')
  const [accommodationAddress, setAccommodationAddress] = useState('')
  const [accommodationAddressPlaceId, setAccommodationAddressPlaceId] = useState('')
  const [accommodationSuggestions, setAccommodationSuggestions] = useState<AddressSuggestion[]>([])
  const [accommodationSuggestionsOpen, setAccommodationSuggestionsOpen] = useState(false)
  const [accommodationAutocompleteLimited, setAccommodationAutocompleteLimited] = useState(false)
  const [hotelName, setHotelName] = useState('')
  const [transportationPreference, setTransportationPreference] = useState<TransportationPreference>('')
  const [songRequest, setSongRequest] = useState('')
  const [photographyConsent, setPhotographyConsent] = useState<boolean | null>(null)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const needsTransportation = accommodationType === 'airbnb' || accommodationType === 'hotel'

  const selectedAddressRef = useRef<string | null>(null)

  // Address autocomplete
  useEffect(() => {
    const query = accommodationAddress.trim()
    if (selectedAddressRef.current === query) return
    if (selectedAddressRef.current && query !== selectedAddressRef.current) {
      selectedAddressRef.current = null
    }
    if (query.length < 3) {
      setAccommodationSuggestions([])
      setAccommodationSuggestionsOpen(false)
      setAccommodationAutocompleteLimited(false)
      return
    }

    let cancelled = false
    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      const { suggestions, rateLimited } = await fetchAddressSuggestions(query, i18n.language, ctrl.signal)
      if (cancelled) return
      if (rateLimited) {
        setAccommodationAutocompleteLimited(true)
        setAccommodationSuggestions([])
        setAccommodationSuggestionsOpen(false)
      } else {
        setAccommodationAutocompleteLimited(false)
        setAccommodationSuggestions(suggestions)
        setAccommodationSuggestionsOpen(suggestions.length > 0)
      }
    }, 250)

    return () => {
      cancelled = true
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [accommodationAddress, i18n.language])

  const updateGuest = useCallback((index: number, fields: Partial<FinalRsvpGuest>) => {
    setGuests((prev) => prev.map((g, i) => i === index ? { ...g, ...fields } : g))
  }, [])

  const setGuestEventAnswer = useCallback((index: number, event: keyof FinalRsvpGuest['events'], answer: FinalRsvpEventAnswer) => {
    setGuests((prev) => prev.map((g, i) => i === index ? { ...g, events: { ...g.events, [event]: answer } } : g))
  }, [])

  const selectAccommodationSuggestion = useCallback((s: AddressSuggestion) => {
    selectedAddressRef.current = s.description
    setAccommodationAddress(s.description)
    setAccommodationAddressPlaceId(s.placeId)
    setAccommodationSuggestions([])
    setAccommodationSuggestionsOpen(false)
    setErrors((prev) => { const copy = { ...prev }; delete copy.accommodationAddress; return copy })
  }, [])

  const validate = useCallback(() => {
    const errs: Record<string, string> = {}

    // Each guest must answer attendance for every day
    guests.forEach((g, i) => {
      const answered = Object.values(g.events).every((v) => v === 'yes' || v === 'no' || v === 'arriving_late')
      if (!answered) {
        errs[`guest_${i}_events`] = t('finalRsvp.validation.guestEventsRequired', { name: g.name || t('finalRsvp.form.guest', { number: i + 1 }) })
      }
    })

    if (accommodationType === '') {
      errs.accommodationType = t('finalRsvp.validation.accommodationRequired')
    }

    if (accommodationType === 'airbnb' && !accommodationAddress.trim()) {
      errs.accommodationAddress = t('finalRsvp.validation.accommodationAddressRequired')
    }

    if (accommodationType === 'hotel' && !hotelName.trim()) {
      errs.hotelName = t('finalRsvp.validation.hotelNameRequired')
    }

    if (needsTransportation && !transportationPreference) {
      errs.transportationPreference = t('finalRsvp.validation.transportationRequired')
    }

    // Validate menu choices for adults
    guests.forEach((g, i) => {
      if (!g.isChild) {
        if (!g.appetizer) errs[`guest_${i}_appetizer`] = t('finalRsvp.validation.appetizerRequired')
        if (!g.main) errs[`guest_${i}_main`] = t('finalRsvp.validation.mainRequired')
      }
    })

    setErrors(errs)
    return errs
  }, [accommodationType, accommodationAddress, hotelName, needsTransportation, transportationPreference, guests, t])

  const validateField = useCallback((field: string, value?: unknown) => {
    setErrors((prev) => {
      const copy = { ...prev }
      if (field === 'accommodationAddress') {
        const val = value !== undefined ? String(value) : accommodationAddress
        if (accommodationType === 'airbnb' && !val.trim()) {
          copy.accommodationAddress = t('finalRsvp.validation.accommodationAddressRequired')
        } else {
          delete copy.accommodationAddress
        }
      }
      if (field === 'hotelName') {
        const val = value !== undefined ? String(value) : hotelName
        if (accommodationType === 'hotel' && !val.trim()) {
          copy.hotelName = t('finalRsvp.validation.hotelNameRequired')
        } else {
          delete copy.hotelName
        }
      }
      return copy
    })
  }, [accommodationAddress, hotelName, accommodationType, t])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setHasAttemptedSubmit(true)

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      onValidationError?.()
      return
    }

    // Warn if accommodation address might be incomplete
    if (accommodationType === 'airbnb' && accommodationAddress.trim() && !accommodationAddressPlaceId) {
      onAddressWarning?.()
    }

    setIsSubmitting(true)
    try {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const timestamp = Date.now()
      const locale = i18n.language

      const entry: FinalRsvp = {
        id,
        timestamp,
        firstName,
        email,
        guests,
        accommodationType,
        accommodationAddress: accommodationType === 'airbnb' ? (accommodationAddress.trim() || undefined) : undefined,
        accommodationAddressPlaceId: accommodationType === 'airbnb' ? (accommodationAddressPlaceId || undefined) : undefined,
        hotelName: accommodationType === 'hotel' ? (hotelName.trim() || undefined) : undefined,
        transportationPreference: needsTransportation ? (transportationPreference || undefined) : undefined,
        songRequest: songRequest.trim() || undefined,
        photographyConsent: photographyConsent ?? undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      }

      await Promise.all([
        submitToNetlifyForms(entry, locale),
        sendConfirmationEmail({ ...entry, locale }),
      ])

      onSuccess?.()
    } finally {
      setIsSubmitting(false)
    }
  }, [
    validate, accommodationType, accommodationAddress, accommodationAddressPlaceId, hotelName,
    needsTransportation, transportationPreference,
    onAddressWarning, onValidationError, firstName, email, guests, songRequest,
    photographyConsent, additionalNotes,
    i18n.language, onSuccess,
  ])

  return {
    firstName,
    email,
    guests,
    updateGuest,
    setGuestEventAnswer,
    accommodationType,
    setAccommodationType,
    accommodationAddress,
    setAccommodationAddress,
    accommodationAddressPlaceId,
    setAccommodationAddressPlaceId,
    accommodationSuggestions,
    accommodationSuggestionsOpen,
    setAccommodationSuggestionsOpen,
    accommodationAutocompleteLimited,
    selectAccommodationSuggestion,
    hotelName,
    setHotelName,
    transportationPreference,
    setTransportationPreference,
    songRequest,
    setSongRequest,
    photographyConsent,
    setPhotographyConsent,
    additionalNotes,
    setAdditionalNotes,
    errors,
    validateField,
    hasAttemptedSubmit,
    isSubmitting,
    handleSubmit,
  }
}
