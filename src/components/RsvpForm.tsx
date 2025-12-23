import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Stack,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Checkbox,
  Button,
  FormErrorMessage,
  FormHelperText,
  Heading,
  Text,
  HStack,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

type Guest = { name: string; dietary?: string }

type Likelihood = 'definitely' | 'highly_likely' | 'maybe' | 'no'

type EventAnswer = 'yes' | 'no' | 'arriving_late' | ''

type Events = {
  welcome: EventAnswer
  ceremony: EventAnswer
  brunch: EventAnswer
}

type Accommodation = 'venue' | 'own' | 'recommend' | ''

type TravelPlan = 'rent_car' | 'need_shuttle' | 'no_plan' | ''

type Rsvp = {
  id: string
  firstName: string
  email: string
  mailingAddress?: string
  mailingAddressPlaceId?: string
  likelihood: Likelihood
  events?: Events
  accommodation?: Accommodation
  travelPlan?: TravelPlan
  guests: Guest[]
  dietary?: string
  franceTips?: boolean
  additionalNotes?: string
  timestamp: number
}

const STORAGE_KEY = 'rsvps'

function loadRsvps(): Rsvp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRsvps(list: Rsvp[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function RsvpForm() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const mailingAddressInputRef = useRef<HTMLInputElement | null>(null)
  const mailingAddressAutocompleteContainerRef = useRef<HTMLDivElement | null>(null)
  const isApplyingMailingAddressSelectionRef = useRef(false)
  const errorsRef = useRef<Record<string, string>>({})
  const validateFieldRef = useRef<(field: string) => void>(() => {})
  const [googlePlacesLoaded, setGooglePlacesLoaded] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [mailingAddress, setMailingAddress] = useState('')
  const [mailingAddressPlaceId, setMailingAddressPlaceId] = useState('')
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
  const [status, setStatus] = useState<null | 'saved' | 'updated'>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    errorsRef.current = errors
  }, [errors])

  const googleMapsApiKey = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.__VITE_GOOGLE_MAPS_API_KEY__ || ''
  }, [])

  // Load Google Maps JS + Places library once when an API key is present.
  // This keeps the field fully functional without Google (manual typing fallback).
  useEffect(() => {
    if (!googleMapsApiKey) return
    if (typeof window === 'undefined' || !document?.head) return

    // If already present, do nothing.
    if (window.google?.maps?.places) {
      setGooglePlacesLoaded(true)
      return
    }

    const existing = document.getElementById('google-maps-places') as HTMLScriptElement | null
    if (existing) return

    const script = document.createElement('script')
    script.id = 'google-maps-places'
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&libraries=places&v=weekly`
    script.addEventListener('load', () => setGooglePlacesLoaded(true))
    script.addEventListener('error', () => setGooglePlacesLoaded(false))
    document.head.appendChild(script)
  }, [googleMapsApiKey])

  // Attach Places Autocomplete to the mailing address field.
  // Prefer the newer PlaceAutocompleteElement when available; fallback to legacy Autocomplete.
  useEffect(() => {
    if (!googleMapsApiKey) return
    if (!googlePlacesLoaded) return

    let cancelled = false
    let legacyListener: { remove: () => void } | null = null
    let placeAutocompleteEl: HTMLElement | null = null
    let onLegacyScriptLoad: (() => void) | null = null

    const cleanup = () => {
      legacyListener?.remove()
      legacyListener = null

      if (placeAutocompleteEl) {
        placeAutocompleteEl.remove()
        placeAutocompleteEl = null
      }

      if (onLegacyScriptLoad) {
        const script = document.getElementById('google-maps-places') as HTMLScriptElement | null
        script?.removeEventListener('load', onLegacyScriptLoad)
        onLegacyScriptLoad = null
      }
    }

    const attachPlaceAutocompleteElement = () => {
      if (cancelled) return
      const container = mailingAddressAutocompleteContainerRef.current
      if (!container) return

      const PlaceAutocompleteElement = window.google?.maps?.places?.PlaceAutocompleteElement
      if (!PlaceAutocompleteElement) return

      container.innerHTML = ''
      placeAutocompleteEl = new PlaceAutocompleteElement() as unknown as HTMLElement
      placeAutocompleteEl.id = 'mailingAddress-autocomplete'
      placeAutocompleteEl.setAttribute('aria-label', t('rsvp.form.mailingAddress'))
      // Force light mode to avoid OS dark-mode styling (the component uses Shadow DOM and
      // otherwise may render as a black input even when the app is light-themed).
      placeAutocompleteEl.setAttribute(
        'style',
        'width: 100%; color-scheme: light; font-family: var(--chakra-fonts-body); font-size: var(--chakra-fontSizes-md);'
      )
      try {
        ;(placeAutocompleteEl as any).style.colorScheme = 'light'
        ;(placeAutocompleteEl as any).style.fontFamily = 'var(--chakra-fonts-body)'
        ;(placeAutocompleteEl as any).style.fontSize = 'var(--chakra-fontSizes-md)'
      } catch {
        // ignore
      }
      // Best-effort: some versions support a placeholder attribute.
      placeAutocompleteEl.setAttribute('placeholder', t('rsvp.form.mailingAddressPlaceholder'))

      const syncValueFromElement = () => {
        if (cancelled || !placeAutocompleteEl) return
        const nextValue = String((placeAutocompleteEl as any).value || '')
        setMailingAddress(nextValue)

        // Clear placeId only when the user manually edits.
        // The component may emit input/change events after selecting a suggestion;
        // don't clear the placeId in that case.
        if (isApplyingMailingAddressSelectionRef.current) {
          isApplyingMailingAddressSelectionRef.current = false
        } else {
          setMailingAddressPlaceId(prev => (prev ? '' : prev))
        }

        if (errorsRef.current.mailingAddress) {
          validateFieldRef.current('mailingAddress')
        }
      }

      const onPlaceSelect = async (ev: Event) => {
        if (cancelled || !placeAutocompleteEl) return

        const maybePlace = (ev as any)?.place || (ev as any)?.detail?.place
        if (!maybePlace) return

        // In the new Places API, selected places can be field-lazy.
        try {
          if (typeof maybePlace.fetchFields === 'function') {
            await maybePlace.fetchFields({ fields: ['formattedAddress', 'id', 'displayName'] })
          }
        } catch {
          // ignore
        }

        const formatted =
          maybePlace.formattedAddress || maybePlace.formatted_address || maybePlace.displayName || ''
        const placeId = maybePlace.id || maybePlace.place_id || ''

        // Mark that we're applying a suggestion so sync handlers don't clear placeId.
        isApplyingMailingAddressSelectionRef.current = true

        if (typeof formatted === 'string' && formatted.trim()) {
          setMailingAddress(formatted)
          if (errorsRef.current.mailingAddress) {
            setTimeout(() => validateFieldRef.current('mailingAddress'), 0)
          }
        }
        if (typeof placeId === 'string' && placeId.trim()) {
          setMailingAddressPlaceId(placeId)
        }
      }

      // Keep state updated for manual typing, not just selections.
      placeAutocompleteEl.addEventListener('input', syncValueFromElement)
      placeAutocompleteEl.addEventListener('change', syncValueFromElement)
      // Selection event for PlaceAutocompleteElement.
      placeAutocompleteEl.addEventListener('gmp-placeselect', onPlaceSelect as any)
      // Some builds may use a prefixed event name.
      placeAutocompleteEl.addEventListener('gmpx-placeselect', onPlaceSelect as any)
      // Validate on blur.
      placeAutocompleteEl.addEventListener('focusout', () => validateFieldRef.current('mailingAddress'))

      container.appendChild(placeAutocompleteEl)

      return () => {
        placeAutocompleteEl?.removeEventListener('input', syncValueFromElement)
        placeAutocompleteEl?.removeEventListener('change', syncValueFromElement)
        placeAutocompleteEl?.removeEventListener('gmp-placeselect', onPlaceSelect as any)
        placeAutocompleteEl?.removeEventListener('gmpx-placeselect', onPlaceSelect as any)
      }
    }

    const attachLegacyAutocomplete = () => {
      if (cancelled) return
      const input = mailingAddressInputRef.current
      if (!input) return

      if (!window.google?.maps?.places?.Autocomplete) return

      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['address'],
        fields: ['formatted_address', 'place_id', 'address_components'],
      })

      legacyListener = autocomplete.addListener('place_changed', () => {
        if (cancelled) return
        const place = autocomplete.getPlace?.()
        const formatted = place?.formatted_address
        const placeId = place?.place_id

        if (typeof formatted === 'string' && formatted.trim()) {
          setMailingAddress(formatted)
          if (errorsRef.current.mailingAddress) {
            setTimeout(() => validateFieldRef.current('mailingAddress'), 0)
          }
        }
        if (typeof placeId === 'string' && placeId.trim()) {
          setMailingAddressPlaceId(placeId)
        }
      })
    }

    const attach = () => {
      if (cancelled) return
      const places = window.google?.maps?.places
      if (!places) return

      if (places.PlaceAutocompleteElement) {
        const maybeCleanup = attachPlaceAutocompleteElement()
        return maybeCleanup
      }

      // Fallback for existing customers / legacy behavior.
      if (places.Autocomplete) {
        attachLegacyAutocomplete()
      }
    }

    // If the script is already loaded, attach immediately. Otherwise, wait.
    if (window.google?.maps?.places) {
      attach()
    } else {
      const script = document.getElementById('google-maps-places') as HTMLScriptElement | null
      onLegacyScriptLoad = () => attach()
      script?.addEventListener('load', onLegacyScriptLoad)
    }

    return () => {
      cancelled = true
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsApiKey, googlePlacesLoaded, t])

  useEffect(() => {
    // If user previously saved by email, prefill
    if (!email) return
    const list = loadRsvps()
    const found = list.find(r => r.email === email)
    if (found) {
      setFirstName(found.firstName)
      setLikelihood(found.likelihood)
      // support older saved shape where events might be an array
      if (found.events && Array.isArray(found.events)) {
        const arr = found.events as string[]
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
      // Backward-compatible guest prefill:
      // - If one guest exists, treat it as the plus one
      // - If multiple guests exist, first is plus one, remainder are children
      const savedGuests = (found.guests || []).filter(g => g && typeof g.name === 'string')
      if (savedGuests.length >= 1) {
        setHasPlusOne(true)
        setPlusOne({ name: savedGuests[0].name || '', dietary: savedGuests[0].dietary || '' })
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

  function addChild() {
    setChildren(prev => {
      const next = [...prev, { name: '', dietary: '' }]
      setTimeout(() => validateChildren(next), 0)
      return next
    })
  }

  function setEventAnswer(ev: keyof Events, answer: EventAnswer) {
    setEvents(prev => ({ ...prev, [ev]: answer }))
    // live-validate events
    setTimeout(() => validateField('events'), 0)
  }

  function updateChild(index: number, fields: Partial<Guest>) {
    setChildren(prev => {
      const next = prev.map((c, i) => (i === index ? { ...c, ...fields } : c))
      setTimeout(() => validateChildren(next), 0)
      return next
    })
  }

  function removeChild(index: number) {
    setChildren(prev => {
      const next = prev.filter((_, i) => i !== index)
      setTimeout(() => validateChildren(next), 0)
      return next
    })
  }

  function validate() {
    const errs: Record<string, string> = {}

    if (!firstName.trim()) errs.firstName = t('rsvp.validation.nameRequired')
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = t('rsvp.validation.emailRequired')
    if (!mailingAddress.trim()) errs.mailingAddress = t('rsvp.validation.addressRequired')
    if (!likelihood) errs.likelihood = t('rsvp.validation.likelihoodRequired')

    // If the guest indicates they expect to attend (definitely/highly_likely), require at least one event selection
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
  }

  function validateField(field: string) {
    const copy = { ...errors }
    switch (field) {
      case 'firstName':
        if (!firstName.trim()) copy.firstName = t('rsvp.validation.nameRequired')
        else delete copy.firstName
        break
      case 'email':
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) copy.email = t('rsvp.validation.emailRequired')
        else delete copy.email
        break
      case 'mailingAddress':
        if (!mailingAddress.trim()) copy.mailingAddress = t('rsvp.validation.addressRequired')
        else delete copy.mailingAddress
        break
      case 'likelihood':
        if (!likelihood) copy.likelihood = t('rsvp.validation.likelihoodRequired')
        else delete copy.likelihood
        // also revalidate events when likelihood changes
        if (likelihood === 'definitely' || likelihood === 'highly_likely') {
          const anyEvent = Object.values(events).some(v => v === 'yes' || v === 'arriving_late')
          if (!anyEvent) copy.events = t('rsvp.validation.eventRequired')
          else delete copy.events
        } else {
          delete copy.events
        }
        break
      case 'events':
        if (likelihood === 'definitely' || likelihood === 'highly_likely') {
          const anyEvent = Object.values(events).some(v => v === 'yes' || v === 'arriving_late')
          if (!anyEvent) copy.events = t('rsvp.validation.eventRequired')
          else delete copy.events
        } else {
          delete copy.events
        }
        break
      case 'plusOne':
        if (hasPlusOne && !plusOne.name.trim()) copy.plusOne = t('rsvp.validation.plusOneNameRequired')
        else delete copy.plusOne
        break
      case 'children':
        if (!hasChildren) {
          delete copy.children
        } else if (children.length === 0) {
          copy.children = t('rsvp.validation.childrenRequired')
        } else if (children.some(c => !c.name.trim())) {
          copy.children = t('rsvp.validation.childNameRequired')
        } else {
          delete copy.children
        }
        break
      default:
        break
    }
    setErrors(copy)
    return copy
  }

  function validateChildren(childList: Guest[]) {
    const copy = { ...errors }
    if (!hasChildren) {
      delete copy.children
    } else if (childList.length === 0) {
      copy.children = t('rsvp.validation.childrenRequired')
    } else if (childList.some(c => !c.name.trim())) {
      copy.children = t('rsvp.validation.childNameRequired')
    } else {
      delete copy.children
    }
    setErrors(copy)
  }

  useEffect(() => {
    // live-validate events, plus one, and children when related fields change
    if (errors.events) validateField('events')
    if (errors.plusOne) validateField('plusOne')
    if (errors.children) validateField('children')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, likelihood, hasPlusOne, plusOne, hasChildren, children])


  // Send confirmation email via Netlify Function
  async function sendConfirmationEmail(rsvpData: Omit<Rsvp, 'id' | 'timestamp'> & { locale: string }) {
    try {
      const response = await fetch('/.netlify/functions/send-rsvp-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpData),
      })
      
      if (!response.ok) {
        console.error('Failed to send confirmation email:', await response.text())
      }
    } catch (error) {
      // Silently fail - email is a nice-to-have, not critical
      console.error('Error sending confirmation email:', error)
    }
  }

  async function validateMailingAddress(address: string) {
    try {
      const response = await fetch('/.netlify/functions/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.ok) return null
      return data as {
        ok: true
        formattedAddress: string | null
        verdict: {
          addressComplete?: boolean
          hasUnconfirmedComponents?: boolean
          hasInferredComponents?: boolean
          hasReplacedComponents?: boolean
          missingComponentTypes?: string[]
        } | null
      }
    } catch {
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      // focus the first invalid field
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

    // Best-effort address validation (warn and allow submit).
    // If validation fails or isn't configured, we silently continue.
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
        toast({
          title: 'Address may be incomplete',
          description: 'Please double-check your mailing address (street number, unit, postal code, country). We will still accept your RSVP.',
          status: 'warning',
          duration: 6000,
          isClosable: true,
          variant: 'solid',
          position: 'top',
        })
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

    // Submit to Netlify Forms (works when deployed to Netlify)
    const formData = new FormData()
    formData.append('form-name', 'rsvp')
    formData.append('firstName', entry.firstName)
    formData.append('email', entry.email)
    formData.append('mailingAddress', entry.mailingAddress || '')
    formData.append('mailingAddressPlaceId', entry.mailingAddressPlaceId || '')
    formData.append('likelihood', entry.likelihood)
    formData.append('events', JSON.stringify(entry.events))
    formData.append('accommodation', entry.accommodation || '')
    formData.append('travelPlan', entry.travelPlan || '')
    formData.append('guests', JSON.stringify(entry.guests))
    formData.append('dietary', entry.dietary || '')
    formData.append('franceTips', String(entry.franceTips || false))
    formData.append('additionalNotes', entry.additionalNotes || '')

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData as unknown as Record<string, string>).toString(),
    }).catch(() => {
      // Silently fail for local development - localStorage backup below
    })

    // Send confirmation email to user
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

    // Also save to localStorage (backup + local dev)
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...entry }
      saveRsvps(list)
      setStatus('updated')
      toast({ 
        title: t('rsvp.success.updatedTitle'), 
        description: t('rsvp.success.updatedMessage'), 
        status: 'info', 
        duration: 4000, 
        isClosable: true,
        variant: 'solid',
        position: 'top',
      })
    } else {
      list.push(entry)
      saveRsvps(list)
      setStatus('saved')
      toast({ 
        title: t('rsvp.success.savedTitle'), 
        description: t('rsvp.success.savedMessage'), 
        status: 'success', 
        duration: 4000, 
        isClosable: true,
        variant: 'solid',
        position: 'top',
      })
    }

    // notify admin panel (if open)
    window.dispatchEvent(new CustomEvent('rsvp:submitted', { detail: entry }))

    setTimeout(() => setStatus(null), 2_500)
  }

  return (
    <>
      <Box as="section" py={4} maxW="container.sm" mx="auto" px={[4, 0]}>
        {/* Section Header */}
        <Box textAlign="center" mb={[8, 12]}>
          <Text 
            fontSize="xs" 
            textTransform="uppercase" 
            letterSpacing="0.35em" 
            color="primary.soft"
            fontWeight="500"
            mb={4}
          >
            {t('rsvp.label')}
          </Text>
          <Heading 
            as="h2" 
            fontFamily="heading"
            fontSize={["2xl", "3xl", "4xl"]}
            fontWeight="400"
            mb={4}
          >
            {t('rsvp.title')}
          </Heading>
          <Box my={6}>
            <Box as="hr" borderColor="primary.soft" w="120px" mx="auto" opacity={0.5} />
          </Box>
          <Text color="neutral.dark" fontSize={["sm", "md"]} maxW="500px" mx="auto" lineHeight="1.8" px={[2, 0]}>
            {t('rsvp.description')}
          </Text>
        </Box>

        <Box
          as="form"
          name="rsvp"
          method="POST"
          data-netlify="true"
          onSubmit={handleSubmit}
          bg="neutral.light"
          p={[5, 8, 12]}
        >
          {/* Hidden field for Netlify Forms */}
          <input type="hidden" name="form-name" value="rsvp" />
          {/* Hidden fields for Netlify to detect form structure at build time */}
          <input type="hidden" name="firstName" />
          <input type="hidden" name="email" />
          <input type="hidden" name="likelihood" />
          <input type="hidden" name="events" />
          <input type="hidden" name="accommodation" />
          <input type="hidden" name="travelPlan" />
          <input type="hidden" name="guests" />
          <input type="hidden" name="dietary" />
          <input type="hidden" name="mailingAddress" />
          <input type="hidden" name="mailingAddressPlaceId" />
          <input type="hidden" name="franceTips" />
          <input type="hidden" name="additionalNotes" />
          <Stack spacing={8}>
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel>{t('rsvp.form.yourName')}</FormLabel>
              <Input 
                name="firstName" 
                value={firstName} 
                onChange={e => { setFirstName(e.target.value); if (errors.firstName) validateField('firstName') }} 
                onBlur={() => validateField('firstName')} 
                placeholder={t('rsvp.form.namePlaceholder')} 
              />
              <FormErrorMessage>{errors.firstName}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>{t('rsvp.form.email')}</FormLabel>
              <Input 
                name="email" 
                type="email" 
                value={email} 
                onChange={e => { setEmail(e.target.value); if (errors.email) validateField('email') }} 
                onBlur={() => validateField('email')} 
                placeholder={t('rsvp.form.emailPlaceholder')} 
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.mailingAddress}>
              <FormLabel>{t('rsvp.form.mailingAddress')}</FormLabel>
              {googleMapsApiKey && googlePlacesLoaded && window.google?.maps?.places?.PlaceAutocompleteElement ? (
                <Box
                  ref={mailingAddressAutocompleteContainerRef}
                  className="mailingAddress-autocompleteWrapper"
                  borderBottom="1px solid"
                  borderColor="primary.soft"
                  borderRadius={0}
                  px={0}
                  pt={3}
                  pb={4}
                  minH="48px"
                  fontFamily="body"
                  fontSize="md"
                  lineHeight="1.6"
                  _focusWithin={{
                    borderColor: 'primary.deep',
                  }}
                  sx={{
                    // Force light rendering for the embedded Google web component.
                    // This prevents OS dark mode from making it a black field.
                    colorScheme: 'light',
                  }}
                />
              ) : (
                <Input 
                  ref={mailingAddressInputRef}
                  name="mailingAddress"
                  value={mailingAddress}
                  onChange={e => {
                    setMailingAddress(e.target.value)
                    // If the user manually edits after selecting a suggestion, clear the placeId.
                    if (mailingAddressPlaceId) setMailingAddressPlaceId('')
                    if (errors.mailingAddress) validateField('mailingAddress')
                  }}
                  onBlur={() => validateField('mailingAddress')}
                  placeholder={t('rsvp.form.mailingAddressPlaceholder')}
                />
              )}
              <FormErrorMessage>{errors.mailingAddress}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.likelihood}>
              <FormLabel>{t('rsvp.form.willYouJoin')}</FormLabel>
              <Select 
                name="likelihood" 
                value={likelihood} 
                onChange={e => { setLikelihood(e.target.value as Likelihood); validateField('likelihood') }} 
                onBlur={() => validateField('likelihood')} 
                placeholder={t('rsvp.form.pleaseSelect')}
              >
                <option value="definitely">{t('rsvp.form.joyfullyAccept')}</option>
                <option value="highly_likely">{t('rsvp.form.likelyAttend')}</option>
                <option value="maybe">{t('rsvp.form.notYetCertain')}</option>
                <option value="no">{t('rsvp.form.regretfullyDecline')}</option>
              </Select>
              <FormHelperText fontSize="sm" color="neutral.muted">
                {t('rsvp.form.attendHint')}
              </FormHelperText>
              <FormErrorMessage>{errors.likelihood}</FormErrorMessage>
            </FormControl>

            {likelihood && likelihood !== 'no' && (
              <FormControl isInvalid={!!errors.events}>
                <Box 
                  p={6} 
                  bg="white"
                  borderWidth="1px"
                  borderColor="primary.soft"
                >
                  <FormLabel mb={6}>{t('rsvp.form.eventsTitle')}</FormLabel>

                  <Stack spacing={6}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                        {t('rsvp.form.welcomeDinner')}
                      </FormLabel>
                      <Select 
                        name="events.welcome" 
                        value={events.welcome} 
                        onChange={e => { setEventAnswer('welcome', e.target.value as EventAnswer); validateField('events') }} 
                        placeholder={t('rsvp.form.pleaseSelect')}
                      >
                        <option value="yes">{t('rsvp.form.willAttend')}</option>
                        <option value="arriving_late">{t('rsvp.form.arrivingLate')}</option>
                        <option value="no">{t('rsvp.form.unableToAttend')}</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                        {t('rsvp.form.weddingDay')}
                      </FormLabel>
                      <Select 
                        name="events.ceremony" 
                        value={events.ceremony} 
                        onChange={e => { setEventAnswer('ceremony', e.target.value as EventAnswer); validateField('events') }} 
                        placeholder={t('rsvp.form.pleaseSelect')}
                      >
                        <option value="yes">{t('rsvp.form.willAttend')}</option>
                        <option value="no">{t('rsvp.form.unableToAttend')}</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                        {t('rsvp.form.farewellBrunch')}
                      </FormLabel>
                      <Select 
                        name="events.brunch" 
                        value={events.brunch} 
                        onChange={e => { setEventAnswer('brunch', e.target.value as EventAnswer); validateField('events') }} 
                        placeholder={t('rsvp.form.pleaseSelect')}
                      >
                        <option value="yes">{t('rsvp.form.willAttend')}</option>
                        <option value="no">{t('rsvp.form.unableToAttend')}</option>
                      </Select>
                    </FormControl>

                    {errors.events && <Text color="primary.deep" fontSize="sm">{errors.events}</Text>}
                  </Stack>
                </Box>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>{t('rsvp.form.accommodation')}</FormLabel>
              <Select value={accommodation} onChange={e => setAccommodation(e.target.value as Accommodation)} placeholder={t('rsvp.form.pleaseSelect')}>
                <option value="venue">{t('rsvp.form.stayingChateau')}</option>
                <option value="own">{t('rsvp.form.arrangingOwn')}</option>
                <option value="recommend">{t('rsvp.form.wouldLikeRec')}</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('rsvp.form.travel')}</FormLabel>
              <Select value={travelPlan} onChange={e => setTravelPlan(e.target.value as TravelPlan)} placeholder={t('rsvp.form.pleaseSelect')}>
                <option value="rent_car">{t('rsvp.form.rentingCar')}</option>
                <option value="need_shuttle">{t('rsvp.form.shuttleService')}</option>
                <option value="no_plan">{t('rsvp.form.stillPlanning')}</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>{t('rsvp.form.dietary')}</FormLabel>
              <Input value={dietary} onChange={e => setDietary(e.target.value)} placeholder={t('rsvp.form.dietaryPlaceholder')} />
            </FormControl>



            <Checkbox 
              isChecked={franceTips} 
              onChange={e => setFranceTips(e.target.checked)}
              colorScheme="gray"
            >
              <Text fontSize="sm">{t('rsvp.form.franceTips')}</Text>
            </Checkbox>

            <Box>
              <FormLabel>{t('rsvp.form.plusOneSection')}</FormLabel>
              <Stack spacing={4}>
                <Checkbox
                  isChecked={hasPlusOne}
                  onChange={e => {
                    const next = e.target.checked
                    setHasPlusOne(next)
                    if (!next) {
                      setPlusOne({ name: '', dietary: '' })
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.plusOne
                        return copy
                      })
                    } else {
                      setTimeout(() => validateField('plusOne'), 0)
                    }
                  }}
                  colorScheme="gray"
                >
                  <Text fontSize="sm">{t('rsvp.form.hasPlusOne')}</Text>
                </Checkbox>

                {hasPlusOne && (
                  <Box p={4} bg="white" borderWidth="1px" borderColor="primary.soft" borderRadius="md">
                    <Stack spacing={3}>
                      <Input
                        name="plusOne.name"
                        value={plusOne.name}
                        onChange={e => {
                          setPlusOne(p => ({ ...p, name: e.target.value }))
                          if (errors.plusOne) validateField('plusOne')
                        }}
                        onBlur={() => validateField('plusOne')}
                        placeholder={t('rsvp.form.plusOneNamePlaceholder')}
                      />
                      <Input
                        name="plusOne.dietary"
                        value={plusOne.dietary || ''}
                        onChange={e => setPlusOne(p => ({ ...p, dietary: e.target.value }))}
                        placeholder={t('rsvp.form.plusOneDietaryPlaceholder')}
                      />
                      {errors.plusOne && <Text color="primary.deep" fontSize="sm">{errors.plusOne}</Text>}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>

            <Box>
              <FormLabel>{t('rsvp.form.childrenSection')}</FormLabel>
              <Stack spacing={4}>
                <Checkbox
                  isChecked={hasChildren}
                  onChange={e => {
                    const next = e.target.checked
                    setHasChildren(next)
                    if (!next) {
                      setChildren([])
                      setErrors(prev => {
                        const copy = { ...prev }
                        delete copy.children
                        return copy
                      })
                    } else {
                      setTimeout(() => validateField('children'), 0)
                    }
                  }}
                  colorScheme="gray"
                >
                  <Text fontSize="sm">{t('rsvp.form.hasChildren')}</Text>
                </Checkbox>

                {hasChildren && (
                  <>
                    {children.map((c, i) => (
                      <Box key={i} p={4} bg="white" borderWidth="1px" borderColor="primary.soft" borderRadius="md">
                        <Stack spacing={3}>
                          <Input
                            name={`children.${i}.name`}
                            value={c.name}
                            onChange={e => updateChild(i, { name: e.target.value })}
                            placeholder={t('rsvp.form.childName', { number: i + 1 })}
                          />
                          <Flex direction={["column", "row"]} gap={3}>
                            <Input
                              value={c.dietary || ''}
                              onChange={e => updateChild(i, { dietary: e.target.value })}
                              placeholder={t('rsvp.form.childDietaryPlaceholder')}
                              flex={1}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeChild(i)}
                              colorScheme="red"
                              alignSelf={["stretch", "center"]}
                            >
                              {t('rsvp.form.remove')}
                            </Button>
                          </Flex>
                        </Stack>
                      </Box>
                    ))}

                    <Button onClick={addChild} variant="ghost" size="sm" alignSelf="flex-start">
                      {t('rsvp.form.addChild')}
                    </Button>
                    {errors.children && <Text color="primary.deep" fontSize="sm">{errors.children}</Text>}
                  </>
                )}
              </Stack>
            </Box>

            <FormControl>
              <FormLabel>{t('rsvp.form.additionalNotes')}</FormLabel>
              <Textarea 
                rows={3} 
                onChange={e => setAdditionalNotes(e.target.value)} 
                value={additionalNotes} 
                placeholder={t('rsvp.form.notesPlaceholder')} 
              />
            </FormControl>

            <Button 
              type="submit" 
              variant="primary" 
              width="full"
              size="lg"
              mt={4}
            >
              {t('rsvp.form.submit')}
            </Button>

            {status === 'saved' && (
              <Text textAlign="center" color="primary.deep" fontSize="sm">
                {t('rsvp.success.thankYouSaved')}
              </Text>
            )}
            {status === 'updated' && (
              <Text textAlign="center" color="primary.soft" fontSize="sm">
                {t('rsvp.success.thankYouUpdated')}
              </Text>
            )}
          </Stack>
        </Box>
      </Box>
    </>
  )
}
