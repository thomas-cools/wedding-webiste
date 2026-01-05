import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  Guest,
  Likelihood,
  EventAnswer,
  Events,
  Accommodation,
  TravelPlan,
  Rsvp,
  AddressSuggestion,
  FormStatus,
} from './types'
import {
  loadRsvps,
  saveRsvps,
  fetchAddressSuggestions,
  validateMailingAddress,
  sendConfirmationEmail,
  submitToNetlifyForms,
} from './rsvpApi'

export interface UseRsvpFormReturn {
  // Form fields
  firstName: string
  setFirstName: (value: string) => void
  email: string
  setEmail: (value: string) => void
  mailingAddress: string
  setMailingAddress: (value: string) => void
  mailingAddressPlaceId: string
  setMailingAddressPlaceId: (value: string) => void
  likelihood: Likelihood | ''
  setLikelihood: (value: Likelihood | '') => void
  events: Events
  setEventAnswer: (event: keyof Events, answer: EventAnswer) => void
  accommodation: Accommodation
  setAccommodation: (value: Accommodation) => void
  travelPlan: TravelPlan
  setTravelPlan: (value: TravelPlan) => void
  dietary: string
  setDietary: (value: string) => void
  franceTips: boolean
  setFranceTips: (value: boolean) => void
  additionalNotes: string
  setAdditionalNotes: (value: string) => void

  // Plus one
  hasPlusOne: boolean
  setHasPlusOne: (value: boolean) => void
  plusOne: Guest
  setPlusOne: (value: Guest | ((prev: Guest) => Guest)) => void

  // Children
  hasChildren: boolean
  setHasChildren: (value: boolean) => void
  children: Guest[]
  addChild: () => void
  updateChild: (index: number, fields: Partial<Guest>) => void
  removeChild: (index: number) => void

  // Address autocomplete
  mailingAddressSuggestions: AddressSuggestion[]
  mailingAddressSuggestionsOpen: boolean
  setMailingAddressSuggestionsOpen: (value: boolean) => void
  mailingAddressAutocompleteLimited: boolean
  selectAddressSuggestion: (suggestion: AddressSuggestion) => void

  // Validation
  errors: Record<string, string>
  validateField: (field: string, value?: any) => void
  hasAttemptedSubmit: boolean

  // Submission
  status: FormStatus
  handleSubmit: (e: React.FormEvent) => Promise<void>

  // Refs for autocomplete callback
  errorsRef: React.MutableRefObject<Record<string, string>>
  validateFieldRef: React.MutableRefObject<(field: string) => void>
}

export interface UseRsvpFormOptions {
  onSuccess?: (entry: Rsvp, isUpdate: boolean) => void
  onAddressWarning?: () => void
}

export function useRsvpForm(options: UseRsvpFormOptions = {}): UseRsvpFormReturn {
  const { t, i18n } = useTranslation()

  // Form state
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [mailingAddress, setMailingAddress] = useState('')
  const [mailingAddressPlaceId, setMailingAddressPlaceId] = useState('')
  const [mailingAddressSuggestions, setMailingAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [mailingAddressSuggestionsOpen, setMailingAddressSuggestionsOpen] = useState(false)
  const [mailingAddressAutocompleteLimited, setMailingAddressAutocompleteLimited] = useState(false)
  const [likelihood, setLikelihood] = useState<Likelihood | ''>('')
  const [events, setEvents] = useState<Events>({ welcome: '', ceremony: '', brunch: '' })
  const [accommodation, setAccommodation] = useState<Accommodation>('')
  const [travelPlan, setTravelPlan] = useState<TravelPlan>('')
  const [hasPlusOne, setHasPlusOne] = useState(false)
  const [plusOne, setPlusOne] = useState<Guest>({ name: '', dietary: '' })
  const [hasChildren, setHasChildren] = useState(false)
  const [children, setChildren] = useState<Guest[]>([])
  const [dietary, setDietary] = useState('')
  const [franceTips, setFranceTips] = useState(false)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [status, setStatus] = useState<FormStatus>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  // Refs for callback stability
  const errorsRef = useRef<Record<string, string>>({})
  const validateFieldRef = useRef<(field: string) => void>(() => {})
  // Track the last selected address to prevent autocomplete after selection
  const selectedAddressRef = useRef<string | null>(null)

  useEffect(() => {
    errorsRef.current = errors
  }, [errors])

  // Address autocomplete effect
  useEffect(() => {
    const query = mailingAddress.trim()
    
    // Skip autocomplete if this address was just selected from suggestions
    if (selectedAddressRef.current === query) {
      return
    }
    
    // Clear the selected address ref when user starts typing something different
    if (selectedAddressRef.current && query !== selectedAddressRef.current) {
      selectedAddressRef.current = null
    }
    
    if (query.length < 3) {
      setMailingAddressSuggestions([])
      setMailingAddressSuggestionsOpen(false)
      setMailingAddressAutocompleteLimited(false)
      return
    }

    let cancelled = false
    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      const { suggestions, rateLimited } = await fetchAddressSuggestions(
        query,
        i18n.language,
        ctrl.signal
      )

      if (cancelled) return

      if (rateLimited) {
        setMailingAddressAutocompleteLimited(true)
        setMailingAddressSuggestions([])
        setMailingAddressSuggestionsOpen(false)
      } else {
        setMailingAddressAutocompleteLimited(false)
        setMailingAddressSuggestions(suggestions)
        setMailingAddressSuggestionsOpen(suggestions.length > 0)
      }
    }, 250)

    return () => {
      cancelled = true
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [mailingAddress, i18n.language])

  // Prefill from localStorage when email changes
  useEffect(() => {
    if (!email) return
    const list = loadRsvps()
    const found = list.find(r => r.email === email)
    if (found) {
      setFirstName(found.firstName)
      setLikelihood(found.likelihood)
      // Support older saved shape where events might be an array
      if (found.events && Array.isArray(found.events)) {
        const arr = found.events as unknown as string[]
        setEvents({
          welcome: arr.includes('welcome') ? 'yes' : '',
          ceremony: arr.includes('ceremony') ? 'yes' : '',
          brunch: arr.includes('brunch') ? 'yes' : '',
        })
      } else {
        setEvents((found.events as Events) || { welcome: '', ceremony: '', brunch: '' })
      }
      setAccommodation(found.accommodation || '')
      setTravelPlan(found.travelPlan || '')

      const savedGuests = (found.guests || []).filter(g => g && typeof g.name === 'string')
      if (savedGuests.length >= 1) {
        setHasPlusOne(true)
        setPlusOne({ name: savedGuests[0]!.name || '', dietary: savedGuests[0]!.dietary || '' })
      } else {
        setHasPlusOne(false)
        setPlusOne({ name: '', dietary: '' })
      }
      if (savedGuests.length >= 2) {
        setHasChildren(true)
        setChildren(savedGuests.slice(1).map(g => ({ name: g.name || '', dietary: g.dietary || '' })))
      } else {
        setHasChildren(false)
        setChildren([])
      }
      setDietary(found.dietary || '')
      setMailingAddress(found.mailingAddress || '')
      setFranceTips(!!found.franceTips)
      setAdditionalNotes(found.additionalNotes || '')
    }
  }, [email])

  // Validation functions
  const validate = useCallback(() => {
    const errs: Record<string, string> = {}

    if (!firstName.trim()) errs.firstName = t('rsvp.validation.nameRequired')
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = t('rsvp.validation.emailRequired')
    if (!likelihood) errs.likelihood = t('rsvp.validation.likelihoodRequired')

    if (likelihood !== 'no') {
      if (!mailingAddress.trim()) errs.mailingAddress = t('rsvp.validation.addressRequired')
    }

    if (likelihood === 'definitely' || likelihood === 'highly_likely') {
      const anyEvent = Object.values(events).some(v => v === 'yes' || v === 'arriving_late')
      if (!anyEvent) errs.events = t('rsvp.validation.eventRequired')
    }

    if (hasPlusOne && !plusOne.name.trim()) errs.plusOne = t('rsvp.validation.plusOneNameRequired')
    if (hasChildren) {
      if (children.length === 0) errs.children = t('rsvp.validation.childrenRequired')
      else if (children.some(c => !c.name.trim())) errs.children = t('rsvp.validation.childNameRequired')
    }

    setErrors(errs)
    return errs
  }, [firstName, email, mailingAddress, likelihood, events, hasPlusOne, plusOne, hasChildren, children, t])

  const validateField = useCallback((field: string, value?: any) => {
    setErrors(prevErrors => {
      const copy = { ...prevErrors }
      switch (field) {
        case 'firstName':
          const nameVal = value !== undefined ? value : firstName
          if (!nameVal.trim()) copy.firstName = t('rsvp.validation.nameRequired')
          else delete copy.firstName
          break
        case 'email':
          const emailVal = value !== undefined ? value : email
          if (!emailVal.trim() || !/\S+@\S+\.\S+/.test(emailVal)) copy.email = t('rsvp.validation.emailRequired')
          else delete copy.email
          break
        case 'mailingAddress':
          const addressVal = value !== undefined ? value : mailingAddress
          if (likelihood !== 'no' && !addressVal.trim()) copy.mailingAddress = t('rsvp.validation.addressRequired')
          else delete copy.mailingAddress
          break
        case 'likelihood':
          const likelihoodVal = value !== undefined ? value : likelihood
          if (!likelihoodVal) copy.likelihood = t('rsvp.validation.likelihoodRequired')
          else delete copy.likelihood
          if (!(likelihoodVal === 'definitely' || likelihoodVal === 'highly_likely')) {
            delete copy.events
          }
          if (likelihoodVal === 'no') {
            delete copy.mailingAddress
          }
          break
        case 'events':
          const eventsVal = value !== undefined ? value : events
          if (likelihood === 'definitely' || likelihood === 'highly_likely') {
            const anyEvent = Object.values(eventsVal).some((v: any) => v === 'yes' || v === 'arriving_late')
            if (!anyEvent) copy.events = t('rsvp.validation.eventRequired')
            else delete copy.events
          } else {
            delete copy.events
          }
          break
        case 'plusOne':
          const plusOneVal = value !== undefined ? value : plusOne
          if (hasPlusOne && !plusOneVal.name.trim()) copy.plusOne = t('rsvp.validation.plusOneNameRequired')
          else delete copy.plusOne
          break
        case 'children':
          const childrenVal = value !== undefined ? value : children
          if (!hasChildren) {
            delete copy.children
          } else if (childrenVal.length === 0) {
            copy.children = t('rsvp.validation.childrenRequired')
          } else if (childrenVal.some((c: any) => !c.name.trim())) {
            copy.children = t('rsvp.validation.childNameRequired')
          } else {
            delete copy.children
          }
          break
      }
      return copy
    })
  }, [firstName, email, mailingAddress, likelihood, events, hasPlusOne, plusOne, hasChildren, children, t])

  // Keep validateFieldRef in sync
  useEffect(() => {
    validateFieldRef.current = validateField
  }, [validateField])

  const validateChildren = useCallback((childList: Guest[]) => {
    setErrors(prevErrors => {
      const copy = { ...prevErrors }
      if (!hasChildren) {
        delete copy.children
      } else if (childList.length === 0) {
        copy.children = t('rsvp.validation.childrenRequired')
      } else if (childList.some(c => !c.name.trim())) {
        copy.children = t('rsvp.validation.childNameRequired')
      } else {
        delete copy.children
      }
      return copy
    })
  }, [hasChildren, t])

  // Live validation for certain fields
  useEffect(() => {
    if (hasAttemptedSubmit && errors.events) validateField('events')
    if (errors.plusOne) validateField('plusOne')
    if (errors.children) validateField('children')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, likelihood, hasPlusOne, plusOne, hasChildren, children])

  // Child management
  const addChild = useCallback(() => {
    setChildren(prev => {
      const next = [...prev, { name: '', dietary: '' }]
      setTimeout(() => validateChildren(next), 0)
      return next
    })
  }, [validateChildren])

  const updateChild = useCallback((index: number, fields: Partial<Guest>) => {
    setChildren(prev => {
      const next = prev.map((c, i) => (i === index ? { ...c, ...fields } : c))
      setTimeout(() => validateChildren(next), 0)
      return next
    })
  }, [validateChildren])

  const removeChild = useCallback((index: number) => {
    setChildren(prev => {
      const next = prev.filter((_, i) => i !== index)
      setTimeout(() => validateChildren(next), 0)
      return next
    })
  }, [validateChildren])

  // Event answer helper
  const setEventAnswer = useCallback((ev: keyof Events, answer: EventAnswer) => {
    setEvents(prev => ({ ...prev, [ev]: answer }))
    if (hasAttemptedSubmit) setTimeout(() => validateField('events'), 0)
  }, [hasAttemptedSubmit, validateField])

  // Address suggestion selection
  const selectAddressSuggestion = useCallback((suggestion: AddressSuggestion) => {
    // Mark this address as selected to prevent autocomplete from firing
    selectedAddressRef.current = suggestion.description
    setMailingAddress(suggestion.description)
    setMailingAddressPlaceId(suggestion.placeId)
    setMailingAddressSuggestions([])
    setMailingAddressSuggestionsOpen(false)
    if (errorsRef.current.mailingAddress) {
      window.setTimeout(() => validateFieldRef.current('mailingAddress'), 0)
    }
  }, [])

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setHasAttemptedSubmit(true)
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      // Focus the first invalid field
      const firstKey = Object.keys(errs)[0]
      let el: HTMLElement | null = null
      if (firstKey === 'firstName') el = document.querySelector('[name="firstName"]')
      else if (firstKey === 'email') el = document.querySelector('[name="email"]')
      else if (firstKey === 'mailingAddress')
        el =
          (document.getElementById('mailingAddress-autocomplete') as HTMLElement | null) ||
          (document.querySelector('[name="mailingAddress"]') as HTMLElement | null)
      else if (firstKey === 'likelihood') el = document.querySelector('[name="likelihood"]')
      else if (firstKey === 'events') el = document.querySelector('[name="events.welcome"]') || document.querySelector('[name="events.ceremony"]')
      else if (firstKey === 'plusOne') el = document.querySelector('[name="plusOne.name"]') as HTMLElement | null
      else if (firstKey === 'children') el = document.querySelector('[name="children.0.name"]') as HTMLElement | null
      el?.focus()
      return
    }

    // Best-effort address validation
    const originalAddress = mailingAddress.trim()
    let finalMailingAddress = originalAddress

    const addressResult = await validateMailingAddress(originalAddress)
    if (addressResult?.ok) {
      const formatted = addressResult.formattedAddress
      if (typeof formatted === 'string' && formatted.trim() && formatted.trim() !== originalAddress) {
        finalMailingAddress = formatted.trim()
        setMailingAddress(finalMailingAddress)
      }

      const verdict = addressResult.verdict
      const missing = verdict?.missingComponentTypes || []
      const shouldWarn =
        verdict?.addressComplete === false ||
        verdict?.hasUnconfirmedComponents === true ||
        missing.length > 0

      if (shouldWarn) {
        options.onAddressWarning?.()
      }
    }

    const list = loadRsvps()
    const existingIndex = list.findIndex(r => r.email === email)

    const combinedGuests: Guest[] = []
    if (hasPlusOne && plusOne.name.trim()) {
      combinedGuests.push({ name: plusOne.name.trim(), dietary: (plusOne.dietary || '').trim() || undefined })
    }
    if (hasChildren) {
      children
        .filter(c => c.name.trim())
        .forEach(c => combinedGuests.push({ name: c.name.trim(), dietary: (c.dietary || '').trim() || undefined }))
    }

    const entry: Rsvp = {
      id: String(Date.now()),
      firstName: firstName.trim(),
      email: email.trim(),
      mailingAddress: finalMailingAddress,
      mailingAddressPlaceId: mailingAddressPlaceId || undefined,
      likelihood: likelihood as Likelihood,
      events: likelihood !== 'no' ? events : { welcome: '', ceremony: '', brunch: '' },
      accommodation: accommodation || undefined,
      travelPlan: travelPlan || undefined,
      guests: combinedGuests,
      dietary: dietary.trim() || undefined,
      franceTips: franceTips || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      timestamp: Date.now(),
    }

    // Submit to Netlify Forms
    await submitToNetlifyForms(entry)

    // Send confirmation email
    sendConfirmationEmail({
      locale: i18n.language,
      firstName: entry.firstName,
      email: entry.email,
      mailingAddress: entry.mailingAddress,
      likelihood: entry.likelihood,
      events: entry.events,
      accommodation: entry.accommodation,
      travelPlan: entry.travelPlan,
      guests: entry.guests,
      dietary: entry.dietary,
      franceTips: entry.franceTips,
      additionalNotes: entry.additionalNotes,
    })

    // Save to localStorage
    const isUpdate = existingIndex >= 0
    if (isUpdate) {
      list[existingIndex] = { ...list[existingIndex], ...entry }
    } else {
      list.push(entry)
    }
    saveRsvps(list)
    setStatus(isUpdate ? 'updated' : 'saved')

    // Notify admin panel (if open)
    window.dispatchEvent(new CustomEvent('rsvp:submitted', { detail: entry }))

    // Call success callback
    options.onSuccess?.(entry, isUpdate)

    setTimeout(() => setStatus(null), 2500)
  }, [
    validate,
    mailingAddress,
    mailingAddressPlaceId,
    email,
    hasPlusOne,
    plusOne,
    hasChildren,
    children,
    firstName,
    likelihood,
    events,
    accommodation,
    travelPlan,
    dietary,
    franceTips,
    additionalNotes,
    i18n.language,
    options,
  ])

  return {
    // Form fields
    firstName,
    setFirstName,
    email,
    setEmail,
    mailingAddress,
    setMailingAddress,
    mailingAddressPlaceId,
    setMailingAddressPlaceId,
    likelihood,
    setLikelihood,
    events,
    setEventAnswer,
    accommodation,
    setAccommodation,
    travelPlan,
    setTravelPlan,
    dietary,
    setDietary,
    franceTips,
    setFranceTips,
    additionalNotes,
    setAdditionalNotes,

    // Plus one
    hasPlusOne,
    setHasPlusOne,
    plusOne,
    setPlusOne,

    // Children
    hasChildren,
    setHasChildren,
    children,
    addChild,
    updateChild,
    removeChild,

    // Address autocomplete
    mailingAddressSuggestions,
    mailingAddressSuggestionsOpen,
    setMailingAddressSuggestionsOpen,
    mailingAddressAutocompleteLimited,
    selectAddressSuggestion,

    // Validation
    errors,
    validateField,
    hasAttemptedSubmit,

    // Submission
    status,
    handleSubmit,

    // Refs
    errorsRef,
    validateFieldRef,
  }
}
