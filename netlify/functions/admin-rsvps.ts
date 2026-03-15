import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'

/**
 * Admin endpoint to fetch all RSVP submissions from Netlify Forms API.
 *
 * GET /api/admin-rsvps — Protected by admin JWT
 *
 * Returns normalized RSVP data with parsed JSON fields (guests, events).
 * Filtering/sorting is done client-side.
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

export interface AdminRsvp {
  id: string
  firstName: string
  email: string
  mailingAddress: string
  likelihood: string
  events: {
    welcome: string
    ceremony: string
    brunch: string
  }
  accommodation: string
  travelPlan: string
  guests: Array<{ name: string; age?: string; dietary?: string }>
  dietary: string
  franceTips: boolean
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

function normalizeSubmission(sub: NetlifyFormSubmission): AdminRsvp {
  const d = sub.data
  return {
    id: sub.id,
    firstName: (d.firstName || d.first_name || '').trim(),
    email: (d.email || '').trim().toLowerCase(),
    mailingAddress: (d.mailingAddress || d.mailing_address || '').trim(),
    likelihood: (d.likelihood || '').trim().toLowerCase(),
    events: parseJsonField(d.events, { welcome: '', ceremony: '', brunch: '' }),
    accommodation: (d.accommodation || '').trim(),
    travelPlan: (d.travelPlan || d.travel_plan || '').trim(),
    guests: parseJsonField(d.guests, []),
    dietary: (d.dietary || '').trim(),
    franceTips: d.franceTips === 'true' || d.france_tips === 'true',
    additionalNotes: (d.additionalNotes || d.additional_notes || '').trim(),
    submittedAt: sub.created_at,
    locale: (d.locale || 'en').trim().toLowerCase().split('-')[0],
  }
}

async function fetchAllRsvpSubmissions(
  siteId: string,
  token: string
): Promise<NetlifyFormSubmission[]> {
  // 1. Find the RSVP form
  const formsRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!formsRes.ok) {
    throw new Error(`Failed to fetch forms: ${formsRes.status}`)
  }

  const forms: NetlifyForm[] = await formsRes.json()
  const rsvpForm = forms.find((f) => f.name === 'rsvp')

  if (!rsvpForm) {
    throw new Error(
      'RSVP form not found. Available: ' + forms.map((f) => f.name).join(', ')
    )
  }

  // 2. Paginate through all submissions
  const allSubmissions: NetlifyFormSubmission[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const res = await fetch(
      `https://api.netlify.com/api/v1/forms/${rsvpForm.id}/submissions?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch submissions page ${page}: ${res.status}`)
    }

    const subs: NetlifyFormSubmission[] = await res.json()
    if (subs.length === 0) break

    allSubmissions.push(...subs)
    if (subs.length < perPage) break
    page++
  }

  return allSubmissions
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'GET') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  // Verify admin JWT
  const payload = verifyAdminRequest(
    event.headers as Record<string, string | undefined>
  )
  if (!payload) {
    return adminUnauthorized()
  }

  // Check env vars
  const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN
  const SITE_ID = process.env.SITE_ID

  if (!NETLIFY_API_TOKEN || !SITE_ID) {
    console.error('Missing NETLIFY_API_TOKEN or SITE_ID env vars')
    return adminJson(500, {
      ok: false,
      error: 'Server configuration error',
    })
  }

  try {
    const submissions = await fetchAllRsvpSubmissions(SITE_ID, NETLIFY_API_TOKEN)

    // Normalize all submissions, deduplicate by email (keep latest)
    const byEmail = new Map<string, AdminRsvp>()
    for (const sub of submissions) {
      const rsvp = normalizeSubmission(sub)
      if (!rsvp.email) continue

      const existing = byEmail.get(rsvp.email)
      if (!existing || new Date(rsvp.submittedAt) > new Date(existing.submittedAt)) {
        byEmail.set(rsvp.email, rsvp)
      }
    }

    const rsvps = Array.from(byEmail.values())

    // Compute summary stats
    const stats = {
      total: rsvps.length,
      definitely: rsvps.filter((r) => r.likelihood === 'definitely').length,
      highlyLikely: rsvps.filter((r) => r.likelihood === 'highly_likely').length,
      maybe: rsvps.filter((r) => r.likelihood === 'maybe').length,
      declined: rsvps.filter((r) => r.likelihood === 'no').length,
      totalAttendees: rsvps
        .filter((r) => r.likelihood !== 'no')
        .reduce((sum, r) => sum + 1 + r.guests.length, 0),
    }

    return adminJson(200, { ok: true, rsvps, stats })
  } catch (error) {
    console.error('Failed to fetch RSVPs:', error)
    return adminJson(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to fetch RSVPs',
    })
  }
}
