import type { Rsvp, AddressSuggestion, AddressValidationResult } from './types'

const STORAGE_KEY = 'rsvps'

/**
 * Load all RSVPs from localStorage
 */
export function loadRsvps(): Rsvp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save RSVPs to localStorage
 */
export function saveRsvps(list: Rsvp[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/**
 * Fetch address autocomplete suggestions from Netlify function
 */
export async function fetchAddressSuggestions(
  input: string,
  language: string,
  signal?: AbortSignal
): Promise<{ suggestions: AddressSuggestion[]; rateLimited: boolean }> {
  try {
    const response = await fetch('/.netlify/functions/places-autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, language }),
      signal,
    })

    if (response.status === 429) {
      return { suggestions: [], rateLimited: true }
    }

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) {
      return { suggestions: [], rateLimited: false }
    }

    const predictions = Array.isArray(data.predictions) ? data.predictions : []
    return { suggestions: predictions, rateLimited: false }
  } catch {
    return { suggestions: [], rateLimited: false }
  }
}

/**
 * Validate a mailing address via Netlify function
 */
export async function validateMailingAddress(
  address: string
): Promise<AddressValidationResult | null> {
  try {
    const response = await fetch('/.netlify/functions/validate-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })

    const data = await response.json()
    if (!response.ok || !data?.ok) return null
    return data as AddressValidationResult
  } catch {
    return null
  }
}

/**
 * Send confirmation email via Netlify function
 */
export async function sendConfirmationEmail(
  rsvpData: Omit<Rsvp, 'id' | 'timestamp'> & { locale: string }
): Promise<void> {
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

/**
 * Submit RSVP to Netlify Forms
 */
export async function submitToNetlifyForms(entry: Rsvp): Promise<void> {
  const formBody = new URLSearchParams()
  formBody.set('form-name', 'rsvp')
  formBody.set('firstName', entry.firstName)
  formBody.set('email', entry.email)
  formBody.set('mailingAddress', entry.mailingAddress || '')
  formBody.set('mailingAddressPlaceId', entry.mailingAddressPlaceId || '')
  formBody.set('likelihood', entry.likelihood)
  formBody.set('events', JSON.stringify(entry.events))
  formBody.set('accommodation', entry.accommodation || '')
  formBody.set('travelPlan', entry.travelPlan || '')
  formBody.set('guests', JSON.stringify(entry.guests))
  formBody.set('dietary', entry.dietary || '')
  formBody.set('franceTips', String(entry.franceTips || false))
  formBody.set('additionalNotes', entry.additionalNotes || '')

  await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  }).catch(() => {
    // Silently fail for local development - localStorage backup handles persistence
  })
}
