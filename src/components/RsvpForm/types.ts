export type Guest = { name: string; age?: string; dietary?: string }

export type Likelihood = 'definitely' | 'highly_likely' | 'maybe' | 'no'

export type EventAnswer = 'yes' | 'no' | 'arriving_late' | ''

export type Events = {
  welcome: EventAnswer
  ceremony: EventAnswer
  brunch: EventAnswer
}

export type Accommodation = 'venue' | 'own' | 'recommend' | ''

export type TravelPlan = 'rent_car' | 'need_shuttle' | 'no_plan' | ''

export type Rsvp = {
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

export type AddressSuggestion = {
  description: string
  placeId: string
}

export type AddressValidationResult = {
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

export type FormStatus = null | 'saved' | 'updated'
