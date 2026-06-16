export type Appetizer = 'ceviche' | 'gaspacho' | ''
export type MainCourse = 'bar' | 'tournedos' | ''
export type FinalRsvpEventAnswer = 'yes' | 'no' | 'arriving_late' | ''

export type FinalRsvpEvents = {
  welcome: FinalRsvpEventAnswer
  ceremony: FinalRsvpEventAnswer
  brunch: FinalRsvpEventAnswer
}

/**
 * A single person in the party.
 * - isChild: if true (under 12), they receive a children's meal — no menu selection needed.
 * - appetizer / main: only required when isChild is false.
 */
export type FinalRsvpGuest = {
  name: string
  isChild: boolean
  appetizer?: Appetizer
  main?: MainCourse
}

export type FinalRsvp = {
  id: string
  timestamp: number
  firstName: string
  email: string
  events: FinalRsvpEvents
  /** Index 0 is always the primary guest. Subsequent entries are additional party members. */
  guests: FinalRsvpGuest[]
  stayingAtVenue: boolean | null
  accommodationAddress?: string
  accommodationAddressPlaceId?: string
  songRequest?: string
  arrivalDate?: string
  departureDate?: string
  photographyConsent?: boolean
  additionalNotes?: string
}

export type AddressSuggestion = {
  description: string
  placeId: string
}
