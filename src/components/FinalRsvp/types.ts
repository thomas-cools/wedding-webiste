export type Appetizer = 'ceviche' | 'gaspacho' | ''
export type MainCourse = 'bar' | 'tournedos' | 'vegan' | ''
export type FinalRsvpEventAnswer = 'yes' | 'no' | 'arriving_late' | ''
export type AccommodationType = 'chateau' | 'airbnb' | 'hotel' | ''
export type TransportationPreference = 'taxi' | 'own' | ''

export type FinalRsvpEvents = {
  welcome: FinalRsvpEventAnswer
  ceremony: FinalRsvpEventAnswer
  brunch: FinalRsvpEventAnswer
}

/**
 * A single person in the party.
 * - events: this guest's own per-day attendance answer (welcome/ceremony/brunch).
 *   Guests within the same party can differ — e.g. one attends the ceremony, another doesn't.
 * - isChild: if true (under 12), they receive a children's meal — no menu selection needed.
 * - appetizer / main: only required when isChild is false.
 * - allergies: free-text food or other precautions, shown for every guest (including children).
 */
export type FinalRsvpGuest = {
  name: string
  events: FinalRsvpEvents
  isChild: boolean
  appetizer?: Appetizer
  main?: MainCourse
  allergies?: string
}

export type FinalRsvp = {
  id: string
  timestamp: number
  firstName: string
  email: string
  /** Index 0 is always the primary guest. Subsequent entries are additional party members. */
  guests: FinalRsvpGuest[]
  accommodationType: AccommodationType
  /** Only used when accommodationType === 'airbnb' */
  accommodationAddress?: string
  accommodationAddressPlaceId?: string
  /** Only used when accommodationType === 'hotel' */
  /** Only used when accommodationType is 'airbnb' or 'hotel' (i.e. not staying at the venue) */
  transportationPreference?: TransportationPreference
  hotelName?: string
  songRequest?: string
  photographyConsent?: boolean
  additionalNotes?: string
}

export type AddressSuggestion = {
  description: string
  placeId: string
}
