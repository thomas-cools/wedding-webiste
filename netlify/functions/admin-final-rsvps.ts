import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'

/**
 * Admin endpoint to fetch all final RSVP submissions from Netlify Forms API.
 *
 * GET /api/admin-final-rsvps — Protected by admin JWT
 */

interface NetlifyForm {
  id: string
  name: string
  submission_count: number
}

interface NetlifyFormSubmission {
  id: string
  created_at: string
  data: Record<string, string | undefined>
}

export interface AdminFinalRsvpGuest {
  name: string
  events: {
    welcome: string
    ceremony: string
    brunch: string
  }
  isChild: boolean
  appetizer?: string
  main?: string
  allergies?: string
}

export interface AdminFinalRsvp {
  id: string
  firstName: string
  email: string
  guests: AdminFinalRsvpGuest[]
  accommodationType: string
  accommodationAddress: string
  hotelName: string
  transportationPreference: string
  songRequest: string
  photographyConsent: boolean | null
  additionalNotes: string
  submittedAt: string
  locale: string
}

function parseJsonField<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function parseBooleanField(value: string | undefined): boolean | null {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

function normalizeSubmission(sub: NetlifyFormSubmission): AdminFinalRsvp {
  const d = sub.data
  // Legacy submissions (before per-guest attendance) stored a single party-level
  // `events` field. Fall back to it for any guest missing their own `events`.
  const legacyEvents = parseJsonField<{ welcome: string; ceremony: string; brunch: string } | undefined>(d.events, undefined)
  const rawGuests = parseJsonField<AdminFinalRsvpGuest[]>(d.guests, [])
  const guests = rawGuests.map((g) => ({
    ...g,
    events: g.events || legacyEvents || { welcome: '', ceremony: '', brunch: '' },
  }))
  return {
    id: sub.id,
    firstName: (d.firstName || '').trim(),
    email: (d.email || '').trim().toLowerCase(),
    guests,
    accommodationType: (d.accommodationType || '').trim(),
    accommodationAddress: (d.accommodationAddress || '').trim(),
    hotelName: (d.hotelName || '').trim(),
    transportationPreference: (d.transportationPreference || '').trim(),
    songRequest: (d.songRequest || '').trim(),
    photographyConsent: parseBooleanField(d.photographyConsent),
    additionalNotes: (d.additionalNotes || '').trim(),
    submittedAt: sub.created_at,
    locale: (d.locale || 'en').trim().toLowerCase().split('-')[0],
  }
}

async function fetchAllFinalRsvpSubmissions(
  siteId: string,
  token: string
): Promise<NetlifyFormSubmission[]> {
  const formsRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!formsRes.ok) {
    throw new Error(`Failed to fetch forms: ${formsRes.status}`)
  }
  const forms: NetlifyForm[] = await formsRes.json()
  const finalRsvpForm = forms.find((f) => f.name === 'final-rsvp')
  if (!finalRsvpForm) {
    throw new Error('final-rsvp form not found. Available: ' + forms.map((f) => f.name).join(', '))
  }

  const allSubmissions: NetlifyFormSubmission[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const res = await fetch(
      `https://api.netlify.com/api/v1/forms/${finalRsvpForm.id}/submissions?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`Failed to fetch submissions page ${page}: ${res.status}`)
    const subs: NetlifyFormSubmission[] = await res.json()
    if (subs.length === 0) break
    allSubmissions.push(...subs)
    if (subs.length < perPage) break
    page++
  }
  return allSubmissions
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return adminCorsResponse()
  if (event.httpMethod !== 'GET') return adminJson(405, { ok: false, error: 'Method not allowed' })

  const payload = verifyAdminRequest(event.headers as Record<string, string | undefined>)
  if (!payload) return adminUnauthorized()

  const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN
  const SITE_ID = process.env.SITE_ID
  if (!NETLIFY_API_TOKEN || !SITE_ID) {
    console.error('Missing NETLIFY_API_TOKEN or SITE_ID env vars')
    return adminJson(500, { ok: false, error: 'Server configuration error' })
  }

  try {
    const submissions = await fetchAllFinalRsvpSubmissions(SITE_ID, NETLIFY_API_TOKEN)

    // Deduplicate by email — keep latest submission
    const byEmail = new Map<string, AdminFinalRsvp>()
    for (const sub of submissions) {
      const rsvp = normalizeSubmission(sub)
      if (!rsvp.email) continue
      const existing = byEmail.get(rsvp.email)
      if (!existing || new Date(rsvp.submittedAt) > new Date(existing.submittedAt)) {
        byEmail.set(rsvp.email, rsvp)
      }
    }

    const finalRsvps = Array.from(byEmail.values())

    // Compute summary stats
    const allGuests = finalRsvps.flatMap((r) => r.guests)
    const adultGuests = allGuests.filter((g) => !g.isChild)

    const stats = {
      total: finalRsvps.length,
      attendingWelcome: allGuests.filter((g) => g.events.welcome === 'yes' || g.events.welcome === 'arriving_late').length,
      attendingCeremony: allGuests.filter((g) => g.events.ceremony === 'yes' || g.events.ceremony === 'arriving_late').length,
      attendingBrunch: allGuests.filter((g) => g.events.brunch === 'yes' || g.events.brunch === 'arriving_late').length,
      ceviche: adultGuests.filter((g) => g.appetizer === 'ceviche').length,
      gaspacho: adultGuests.filter((g) => g.appetizer === 'gaspacho').length,
      barFillet: adultGuests.filter((g) => g.main === 'bar').length,
      tournedos: adultGuests.filter((g) => g.main === 'tournedos').length,
      veganMain: adultGuests.filter((g) => g.main === 'vegan').length,
      childrenMeals: allGuests.filter((g) => g.isChild).length,
      photographyConsented: finalRsvps.filter((r) => r.photographyConsent === true).length,
      interestedInTaxi: finalRsvps.filter((r) => r.accommodationType !== 'chateau' && r.transportationPreference === 'taxi').length,
    }

    return adminJson(200, { ok: true, finalRsvps, stats })
  } catch (error) {
    console.error('Failed to fetch final RSVPs:', error)
    return adminJson(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to fetch final RSVPs',
    })
  }
}
