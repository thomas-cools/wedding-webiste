import type { FinalRsvp, AddressSuggestion } from './types'

/**
 * Submit final RSVP to Netlify Forms (for data capture)
 */
export async function submitToNetlifyForms(entry: FinalRsvp, locale?: string): Promise<void> {
  const formBody = new URLSearchParams()
  formBody.set('form-name', 'final-rsvp')
  formBody.set('firstName', entry.firstName)
  formBody.set('email', entry.email)
  formBody.set('guests', JSON.stringify(entry.guests))
  formBody.set('accommodationType', entry.accommodationType || '')
  formBody.set('accommodationAddress', entry.accommodationAddress || '')
  formBody.set('accommodationAddressPlaceId', entry.accommodationAddressPlaceId || '')
  formBody.set('hotelName', entry.hotelName || '')
  formBody.set('transportationPreference', entry.transportationPreference || '')
  formBody.set('songRequest', entry.songRequest || '')
  formBody.set('photographyConsent', String(entry.photographyConsent ?? ''))
  formBody.set('additionalNotes', entry.additionalNotes || '')
  formBody.set('locale', locale || 'en')

  await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  }).catch(() => {
    // Silently fail for local development
  })
}

/**
 * Send confirmation email via Netlify function
 */
export async function sendConfirmationEmail(
  data: Omit<FinalRsvp, 'id' | 'timestamp'> & { locale: string }
): Promise<void> {
  try {
    const response = await fetch('/.netlify/functions/send-final-rsvp-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      console.error('Failed to send final RSVP confirmation email:', await response.text())
    }
  } catch (error) {
    console.error('Error sending final RSVP confirmation email:', error)
  }
}

/**
 * Fetch address autocomplete suggestions (reuses places-autocomplete function)
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
    if (response.status === 429) return { suggestions: [], rateLimited: true }
    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.ok) return { suggestions: [], rateLimited: false }
    const predictions = Array.isArray(data.predictions) ? data.predictions : []
    return { suggestions: predictions, rateLimited: false }
  } catch {
    return { suggestions: [], rateLimited: false }
  }
}
