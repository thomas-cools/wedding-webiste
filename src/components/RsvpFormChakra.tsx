import React, { useEffect, useState } from 'react'
import {
  Box,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Textarea,
  Checkbox,
  FormErrorMessage,
  Heading,
  Text,
  HStack,
  IconButton,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'

// Types (same as original component)
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
  lastName: string
  email: string
  likelihood: Likelihood
  events?: Events
  accommodation?: Accommodation
  travelPlan?: TravelPlan
  guests: Guest[]
  dietary?: string
  songRequest?: string
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

export default function RsvpFormChakra() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [likelihood, setLikelihood] = useState<Likelihood>('')
  const [events, setEvents] = useState<Events>({ welcome: '', ceremony: '', brunch: '' })
  const [accommodation, setAccommodation] = useState<Accommodation>('')
  const [travelPlan, setTravelPlan] = useState<TravelPlan>('')
  const [guests, setGuests] = useState<Guest[]>([])
  const [dietary, setDietary] = useState('')
  const [songRequest, setSongRequest] = useState('')
  const [franceTips, setFranceTips] = useState(false)
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [status, setStatus] = useState<null | 'saved' | 'updated'>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!email) return
    const list = loadRsvps()
    const found = list.find(r => r.email === email)
    if (found) {
      setFirstName(found.firstName)
      setLastName(found.lastName)
      setLikelihood(found.likelihood)
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
      setGuests(found.guests)
      setDietary(found.dietary || '')
      setSongRequest(found.songRequest || '')
      setFranceTips(!!found.franceTips)
      setAdditionalNotes(found.additionalNotes || '')
    }
  }, [email])

  function addGuest() {
    setGuests(prev => {
      const next = [...prev, { name: '' }]
      setTimeout(() => validateField('guests'), 0)
      return next
    })
  }

  function setEventAnswer(ev: keyof Events, answer: EventAnswer) {
    setEvents(prev => ({ ...prev, [ev]: answer }))
    setTimeout(() => validateField('events'), 0)
  }

  function updateGuest(index: number, fields: Partial<Guest>) {
    setGuests(prev => {
      const next = prev.map((g, i) => (i === index ? { ...g, ...fields } : g))
      setTimeout(() => validateField('guests'), 0)
      return next
    })
  }

  function removeGuest(index: number) {
    setGuests(prev => {
      const next = prev.filter((_, i) => i !== index)
      setTimeout(() => validateField('guests'), 0)
      return next
    })
  }

  function validate() {
    const errs: Record<string, string> = {}

    if (!firstName.trim()) errs.firstName = 'Please enter your full name.'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email.'
    if (!likelihood) errs.likelihood = 'Please indicate how likely you are to join us.'

    if (likelihood === 'definitely' || likelihood === 'highly_likely') {
      const anyEvent = Object.values(events).some(v => v === 'yes' || v === 'arriving_late')
      if (!anyEvent) errs.events = 'Please select at least one event if you expect to join us.'
    }

    if (guests.some(g => !g.name.trim())) errs.guests = 'Please provide guest names or remove empty guests.'

    setErrors(errs)
    return errs
  }

  function validateField(field: string) {
    const copy = { ...errors }
    switch (field) {
      case 'firstName':
        if (!firstName.trim()) copy.firstName = 'Please enter your full name.'
        else delete copy.firstName
        break
      case 'email':
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) copy.email = 'Please enter a valid email.'
        else delete copy.email
        break
      case 'likelihood':
        if (!likelihood) copy.likelihood = 'Please indicate how likely you are to join us.'
        else delete copy.likelihood
        if (likelihood === 'definitely' || likelihood === 'highly_likely') {
          const anyEvent = Object.values(events).some(v => v === 'yes' || v === 'arriving_late')
          if (!anyEvent) copy.events = 'Please select at least one event if you expect to join us.'
          else delete copy.events
        } else {
          delete copy.events
        }
        break
      case 'events':
        if (likelihood === 'definitely' || likelihood === 'highly_likely') {
          const anyEvent = Object.values(events).some(v => v === 'yes' || v === 'arriving_late')
          if (!anyEvent) copy.events = 'Please select at least one event if you expect to join us.'
          else delete copy.events
        } else {
          delete copy.events
        }
        break
      case 'guests':
        if (guests.some(g => !g.name.trim())) copy.guests = 'Please provide guest names or remove empty guests.'
        else delete copy.guests
        break
      default:
        break
    }
    setErrors(copy)
    return copy
  }

  useEffect(() => {
    if (errors.events) validateField('events')
    if (errors.guests) validateField('guests')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, likelihood, guests])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0]
      let el: HTMLElement | null = null
      if (firstKey === 'firstName') el = document.querySelector('[name="firstName"]')
      else if (firstKey === 'email') el = document.querySelector('[name="email"]')
      else if (firstKey === 'likelihood') el = document.querySelector('[name="likelihood"]')
      else if (firstKey === 'events') el = document.querySelector('[name="events.welcome"]') || document.querySelector('[name="events.ceremony"]')
      else if (firstKey === 'guests') el = document.querySelector('input[placeholder*="Guest"]') as HTMLElement | null
      el?.focus()
      return
    }

    const list = loadRsvps()
    const existingIndex = list.findIndex(r => r.email === email)
    const entry: Rsvp = {
      id: String(Date.now()),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      likelihood,
      events: likelihood !== 'no' ? events : { welcome: '', ceremony: '', brunch: '' },
      accommodation: accommodation || undefined,
      travelPlan: travelPlan || undefined,
      guests: guests.filter(g => g.name.trim()),
      dietary: dietary.trim() || undefined,
      songRequest: songRequest.trim() || undefined,
      franceTips: franceTips || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      timestamp: Date.now(),
    }

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...entry }
      saveRsvps(list)
      setStatus('updated')
    } else {
      list.push(entry)
      saveRsvps(list)
      setStatus('saved')
    }

    window.dispatchEvent(new CustomEvent('rsvp:submitted', { detail: entry }))

    setTimeout(() => setStatus(null), 2_500)
  }

  return (
    <Box>
      <Box textAlign="center" mb={6}>
        <Text fontSize="sm" textTransform="uppercase" color="secondary">Save the Date 📅</Text>
        <Heading as="h2" fontFamily="heading" size="lg" mt={2}>Sofia &amp; Lucas — Château de Varennes</Heading>
        <Text mt={2} color="gray.600">Oct 17 — Oct 19, 2026 • Please help us estimate numbers so we can plan the perfect weekend. Formal invitations to follow.</Text>
      </Box>

      <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="md" boxShadow="sm" maxW="780px" mx="auto">
        <Stack spacing={4}>
          <FormControl isInvalid={!!errors.firstName}>
            <FormLabel>Full Name (you + +1 if applicable) 👋</FormLabel>
            <Input name="firstName" value={firstName} onChange={e => { setFirstName(e.target.value); if (errors.firstName) validateField('firstName') }} onBlur={() => validateField('firstName')} placeholder="Full Name" />
            {errors.firstName && <FormErrorMessage>{errors.firstName}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email Address ✉️</FormLabel>
            <Input name="email" value={email} onChange={e => { setEmail(e.target.value); if (errors.email) validateField('email') }} onBlur={() => validateField('email')} placeholder="Email" />
            {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
          </FormControl>

          <FormControl isInvalid={!!errors.likelihood}>
            <FormLabel>How likely are you to join us? 📅</FormLabel>
            <Select name="likelihood" value={likelihood} onChange={e => { setLikelihood(e.target.value as Likelihood); validateField('likelihood') }} onBlur={() => validateField('likelihood') } placeholder="Select likelihood">
              <option value="definitely">✅ Definitely! Packing my bags.</option>
              <option value="highly_likely">👍 Highly Likely (90%)</option>
              <option value="maybe">🤔 Maybe / Still figuring out</option>
              <option value="no">😢 Sadly, cannot make it</option>
            </Select>
            <Text fontSize="sm" color="gray.500">If you pick <strong>Definitely</strong> or <strong>Highly Likely</strong>, please indicate which events you expect to attend.</Text>
            {errors.likelihood && <FormErrorMessage>{errors.likelihood}</FormErrorMessage>}
          </FormControl>

          {likelihood !== 'no' && (
            <FormControl isInvalid={!!errors.events}>
              <FormLabel>Which events do you think you will attend? 🎟️</FormLabel>

              <FormControl mt={2}>
                <FormLabel fontSize="sm">Welcome Dinner (The Night Before) 🍽️</FormLabel>
                <Select name="events.welcome" value={events.welcome} onChange={e => setEventAnswer('welcome', e.target.value as EventAnswer)} placeholder="--">
                  <option value="yes">Yes, count me in.</option>
                  <option value="arriving_late">No / Arriving late</option>
                  <option value="no">No</option>
                </Select>
              </FormControl>

              <FormControl mt={3}>
                <FormLabel fontSize="sm">The Wedding Day (Ceremony & Reception) 💍</FormLabel>
                <Select name="events.ceremony" value={events.ceremony} onChange={e => setEventAnswer('ceremony', e.target.value as EventAnswer)} placeholder="--">
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </FormControl>

              <FormControl mt={3}>
                <FormLabel fontSize="sm">Recovery Brunch & Pool Party (The Day After) 🥐🏊</FormLabel>
                <Select name="events.brunch" value={events.brunch} onChange={e => setEventAnswer('brunch', e.target.value as EventAnswer)} placeholder="--">
                  <option value="yes">Yes, I'll be there for the croissants and swim.</option>
                  <option value="no">No, heading home early.</option>
                </Select>
              </FormControl>

              {errors.events && <FormErrorMessage mt={2}>{errors.events}</FormErrorMessage>}
            </FormControl>
          )}

          <FormControl>
            <FormLabel>Accommodation Preferences 🛏️</FormLabel>
            <Select value={accommodation} onChange={e => setAccommodation(e.target.value as Accommodation)} placeholder="--">
              <option value="venue">I plan to stay at the main venue.</option>
              <option value="own">I will book my own Airbnb/Hotel nearby.</option>
              <option value="recommend">I would like recommendations.</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Travel Plans (optional) 🚗🚌</FormLabel>
            <Select value={travelPlan} onChange={e => setTravelPlan(e.target.value as TravelPlan)} placeholder="--">
              <option value="rent_car">I intend to rent a car.</option>
              <option value="need_shuttle">I'd be interested in shuttle service if provided.</option>
              <option value="no_plan">No firm plans yet.</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Dietary Restrictions 🥗</FormLabel>
            <Input value={dietary} onChange={e => setDietary(e.target.value)} placeholder="e.g., vegetarian, gluten-free" />
          </FormControl>

          <FormControl>
            <FormLabel>Song Request 🎶</FormLabel>
            <Input value={songRequest} onChange={e => setSongRequest(e.target.value)} placeholder="What song will get you on the dancefloor?" />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <Checkbox id="franceTips" isChecked={franceTips} onChange={e => setFranceTips(e.target.checked)}>🇫🇷 First time in France? Send me tips to local vineyards/sights</Checkbox>
          </FormControl>

          <Box>
            <FormLabel>Guests / +1</FormLabel>
            <Stack spacing={2}>
              {guests.map((g, i) => (
                <HStack key={i} spacing={2}>
                  <Input placeholder={`Guest #${i + 1} name`} value={g.name} onChange={e => updateGuest(i, { name: e.target.value })} />
                  <Input placeholder="Dietary" value={g.dietary || ''} onChange={e => updateGuest(i, { dietary: e.target.value })} />
                  <IconButton aria-label="Remove" icon={<DeleteIcon />} size="sm" onClick={() => removeGuest(i)} />
                </HStack>
              ))}
              <Button leftIcon={<AddIcon />} size="sm" onClick={addGuest}>Add Guest / +1</Button>
              {errors.guests && <FormErrorMessage>{errors.guests}</FormErrorMessage>}
            </Stack>
          </Box>

          <FormControl>
            <FormLabel>Any additional notes</FormLabel>
            <Textarea rows={3} onChange={e => setAdditionalNotes(e.target.value)} value={additionalNotes} placeholder="Additional info for planning (optional)" />
          </FormControl>

          <Button type="submit" bg="primary.soft" color="neutral.dark" _hover={{ bg: 'primary.deep', color: 'white' }} width="100%">Send Save-the-Date</Button>

          {status === 'saved' && <Text color="green.500">✅ Response saved. Thank you!</Text>}
          {status === 'updated' && <Text color="blue.500">🔄 Response updated. Thank you!</Text>}
        </Stack>
      </Box>
    </Box>
  )
}
