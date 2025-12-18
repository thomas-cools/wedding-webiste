import React, { useEffect, useState } from 'react'
import {
  Box,
  Stack,
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

export default function RsvpForm() {
  const toast = useToast()
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [likelihood, setLikelihood] = useState<Likelihood | ''>('')
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
      // validate guests immediately
      setTimeout(() => validateField('guests'), 0)
      return next
    })
  }

  function setEventAnswer(ev: keyof Events, answer: EventAnswer) {
    setEvents(prev => ({ ...prev, [ev]: answer }))
    // live-validate events
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

    // If the guest indicates they expect to attend (definitely/highly_likely), require at least one event selection
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
        // also revalidate events when likelihood changes
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
    // live-validate events and guests when related fields change
    if (errors.events) validateField('events')
    if (errors.guests) validateField('guests')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, likelihood, guests])


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      // focus the first invalid field
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
      email: email.trim(),
      likelihood: likelihood as Likelihood,
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

    // Submit to Netlify Forms (works when deployed to Netlify)
    const formData = new FormData()
    formData.append('form-name', 'rsvp')
    formData.append('firstName', entry.firstName)
    formData.append('email', entry.email)
    formData.append('likelihood', entry.likelihood)
    formData.append('events', JSON.stringify(entry.events))
    formData.append('accommodation', entry.accommodation || '')
    formData.append('travelPlan', entry.travelPlan || '')
    formData.append('guests', JSON.stringify(entry.guests))
    formData.append('dietary', entry.dietary || '')
    formData.append('songRequest', entry.songRequest || '')
    formData.append('franceTips', String(entry.franceTips || false))
    formData.append('additionalNotes', entry.additionalNotes || '')

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData as unknown as Record<string, string>).toString(),
    }).catch(() => {
      // Silently fail for local development - localStorage backup below
    })

    // Also save to localStorage (backup + local dev)
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...entry }
      saveRsvps(list)
      setStatus('updated')
      toast({ title: 'Response updated', description: 'Thanks! Your RSVP has been updated.', status: 'info', duration: 4000, isClosable: true })
    } else {
      list.push(entry)
      saveRsvps(list)
      setStatus('saved')
      toast({ title: 'Response saved', description: 'Thanks! Your RSVP has been recorded.', status: 'success', duration: 4000, isClosable: true })
    }

    // notify admin panel (if open)
    window.dispatchEvent(new CustomEvent('rsvp:submitted', { detail: entry }))

    setTimeout(() => setStatus(null), 2_500)
  }

  return (
    <>
      <Box as="section" py={4} maxW="container.sm" mx="auto">
        {/* Section Header */}
        <Box textAlign="center" mb={12}>
          <Text 
            fontSize="xs" 
            textTransform="uppercase" 
            letterSpacing="0.35em" 
            color="primary.soft"
            fontWeight="500"
            mb={4}
          >
            Kindly Respond
          </Text>
          <Heading 
            as="h2" 
            fontFamily="heading"
            fontSize={["3xl", "4xl"]}
            fontWeight="400"
            mb={4}
          >
            RSVP
          </Heading>
          <Box my={6}>
            <Box as="hr" borderColor="primary.soft" w="120px" mx="auto" opacity={0.5} />
          </Box>
          <Text color="neutral.dark" fontSize="md" maxW="500px" mx="auto" lineHeight="1.8">
            Please let us know if you'll be joining us for our wedding celebration in Burgundy. 
            We kindly request your response by August 1, 2026.
          </Text>
        </Box>

        <Box
          as="form"
          name="rsvp"
          method="POST"
          data-netlify="true"
          onSubmit={handleSubmit}
          bg="neutral.light"
          p={[8, 12]}
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
          <input type="hidden" name="songRequest" />
          <input type="hidden" name="franceTips" />
          <input type="hidden" name="additionalNotes" />
          <Stack spacing={8}>
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel>Your Name</FormLabel>
              <Input 
                name="firstName" 
                value={firstName} 
                onChange={e => { setFirstName(e.target.value); if (errors.firstName) validateField('firstName') }} 
                onBlur={() => validateField('firstName')} 
                placeholder="Full name as you'd like it on the place card" 
              />
              <FormErrorMessage>{errors.firstName}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email Address</FormLabel>
              <Input 
                name="email" 
                type="email" 
                value={email} 
                onChange={e => { setEmail(e.target.value); if (errors.email) validateField('email') }} 
                onBlur={() => validateField('email')} 
                placeholder="your@email.com" 
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.likelihood}>
              <FormLabel>Will You Be Joining Us?</FormLabel>
              <Select 
                name="likelihood" 
                value={likelihood} 
                onChange={e => { setLikelihood(e.target.value as Likelihood); validateField('likelihood') }} 
                onBlur={() => validateField('likelihood')} 
                placeholder="Please select"
              >
                <option value="definitely">Joyfully Accept</option>
                <option value="highly_likely">Likely to Attend</option>
                <option value="maybe">Not Yet Certain</option>
                <option value="no">Regretfully Decline</option>
              </Select>
              <FormHelperText fontSize="sm" color="neutral.muted">
                If attending, please indicate which events below.
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
                  <FormLabel mb={6}>Events You Plan to Attend</FormLabel>

                  <Stack spacing={6}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                        Welcome Dinner · Friday Evening
                      </FormLabel>
                      <Select 
                        name="events.welcome" 
                        value={events.welcome} 
                        onChange={e => { setEventAnswer('welcome', e.target.value as EventAnswer); validateField('events') }} 
                        placeholder="Please select"
                      >
                        <option value="yes">Will Attend</option>
                        <option value="arriving_late">Arriving Late</option>
                        <option value="no">Unable to Attend</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                        Wedding Ceremony & Reception · Saturday
                      </FormLabel>
                      <Select 
                        name="events.ceremony" 
                        value={events.ceremony} 
                        onChange={e => { setEventAnswer('ceremony', e.target.value as EventAnswer); validateField('events') }} 
                        placeholder="Please select"
                      >
                        <option value="yes">Will Attend</option>
                        <option value="no">Unable to Attend</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                        Farewell Brunch · Sunday Morning
                      </FormLabel>
                      <Select 
                        name="events.brunch" 
                        value={events.brunch} 
                        onChange={e => { setEventAnswer('brunch', e.target.value as EventAnswer); validateField('events') }} 
                        placeholder="Please select"
                      >
                        <option value="yes">Will Attend</option>
                        <option value="no">Unable to Attend</option>
                      </Select>
                    </FormControl>

                    {errors.events && <Text color="primary.deep" fontSize="sm">{errors.events}</Text>}
                  </Stack>
                </Box>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Accommodation</FormLabel>
              <Select value={accommodation} onChange={e => setAccommodation(e.target.value as Accommodation)} placeholder="Please select">
                <option value="venue">Staying at the Château</option>
                <option value="own">Arranging Own Accommodation</option>
                <option value="recommend">Would Like Recommendations</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Travel Arrangements</FormLabel>
              <Select value={travelPlan} onChange={e => setTravelPlan(e.target.value as TravelPlan)} placeholder="Please select">
                <option value="rent_car">Renting a Car</option>
                <option value="need_shuttle">Interested in Shuttle Service</option>
                <option value="no_plan">Still Planning</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Dietary Requirements</FormLabel>
              <Input value={dietary} onChange={e => setDietary(e.target.value)} placeholder="Vegetarian, allergies, etc." />
            </FormControl>

            <FormControl>
              <FormLabel>Song Request</FormLabel>
              <Input value={songRequest} onChange={e => setSongRequest(e.target.value)} placeholder="A song that will get you dancing" />
            </FormControl>

            <Checkbox 
              isChecked={franceTips} 
              onChange={e => setFranceTips(e.target.checked)}
              colorScheme="gray"
            >
              <Text fontSize="sm">First time in France? Send me local recommendations.</Text>
            </Checkbox>

            <Box>
              <FormLabel>Additional Guests</FormLabel>
              <Stack spacing={4}>
                {guests.map((g, i) => (
                  <HStack key={i} spacing={4}>
                    <Input 
                      value={g.name} 
                      onChange={e => updateGuest(i, { name: e.target.value })} 
                      placeholder={`Guest ${i + 1} name`} 
                      flex={2}
                    />
                    <Input 
                      value={g.dietary || ''} 
                      onChange={e => updateGuest(i, { dietary: e.target.value })} 
                      placeholder="Dietary" 
                      flex={1}
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeGuest(i)}>Remove</Button>
                  </HStack>
                ))}

                <Button onClick={addGuest} variant="ghost" size="sm" alignSelf="flex-start">
                  + Add Guest
                </Button>
                {errors.guests && <Text color="primary.deep" fontSize="sm">{errors.guests}</Text>}
              </Stack>
            </Box>

            <FormControl>
              <FormLabel>Additional Notes</FormLabel>
              <Textarea 
                rows={3} 
                onChange={e => setAdditionalNotes(e.target.value)} 
                value={additionalNotes} 
                placeholder="Anything else we should know" 
              />
            </FormControl>

            <Button 
              type="submit" 
              variant="primary" 
              width="full"
              size="lg"
              mt={4}
            >
              Submit Response
            </Button>

            {status === 'saved' && (
              <Text textAlign="center" color="primary.deep" fontSize="sm">
                Thank you for your response. We look forward to celebrating with you.
              </Text>
            )}
            {status === 'updated' && (
              <Text textAlign="center" color="primary.soft" fontSize="sm">
                Your response has been updated. Thank you.
              </Text>
            )}
          </Stack>
        </Box>
      </Box>
    </>
  )
}
