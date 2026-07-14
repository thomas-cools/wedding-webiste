import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'
import { getAllGuestOverrides } from './utils/rsvp-guest-overrides'
import { getAllEmailOverrides } from './utils/rsvp-email-overrides'

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
  guests: Array<{
    name: string
    age?: string
    dietary?: string
    /** True if this guest appears to be someone who also submitted their own RSVP separately. */
    isDuplicate?: boolean
    /** Email of the separate RSVP this guest matches, when isDuplicate is true. */
    duplicateOfEmail?: string
  }>
  dietary: string
  franceTips: boolean
  additionalNotes: string
  submittedAt: string
  locale: string
  /** IDs of other RSVPs that listed this person as one of their guests. */
  matchedAsGuestIn?: string[]
  /** Set when an admin has manually edited this party's guest list. */
  guestsManuallyEditedAt?: string
  /** Set when an admin has corrected this party's email address. */
  emailCorrectedAt?: string
}

function parseJsonField<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/** Lowercases, strips accents, and collapses whitespace for name comparison. */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Standard Levenshtein edit distance between two strings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev.splice(0, prev.length, ...curr)
  }
  return prev[b.length]
}

/** Exact match after normalization, or Levenshtein distance <= 1 for names of length >= 3 (catches typos/accents). */
function isNameMatch(a: string, b: string): boolean {
  const normA = normalizeName(a)
  const normB = normalizeName(b)
  if (!normA || !normB) return false
  if (normA === normB) return true
  if (normA.length < 3 || normB.length < 3) return false
  return levenshtein(normA, normB) <= 1
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

    // Load email corrections up front (keyed by the stable submission id) so
    // dedup-by-email below groups submissions under the corrected address.
    // Non-essential enhancement — a Blobs failure must not break the core
    // RSVP dashboard, so log and continue without corrections instead.
    let emailOverrides = new Map<string, { email: string; updatedAt: string }>()
    try {
      emailOverrides = await getAllEmailOverrides()
    } catch (error) {
      console.error('Failed to load email overrides, continuing without them:', error)
    }

    // Normalize all submissions, deduplicate by email (keep latest)
    const byEmail = new Map<string, AdminRsvp>()
    for (const sub of submissions) {
      const rsvp = normalizeSubmission(sub)
      const emailOverride = emailOverrides.get(sub.id)
      if (emailOverride) {
        rsvp.email = emailOverride.email
        rsvp.emailCorrectedAt = emailOverride.updatedAt
      }
      if (!rsvp.email) continue

      const existing = byEmail.get(rsvp.email)
      if (!existing || new Date(rsvp.submittedAt) > new Date(existing.submittedAt)) {
        byEmail.set(rsvp.email, rsvp)
      }
    }

    const rsvps = Array.from(byEmail.values())

    // Apply admin-made guest-list edits (Netlify Forms submissions are
    // read-only, so edits are persisted separately in Netlify Blobs and
    // merged in here, before duplicate-detection/stats run). Guest overrides
    // are a non-essential enhancement, so a Blobs failure must not break the
    // core RSVP dashboard — log and continue without overrides instead.
    try {
      const guestOverrides = await getAllGuestOverrides()
      for (const rsvp of rsvps) {
        const override = guestOverrides.get(rsvp.email)
        if (override) {
          rsvp.guests = override.guests
          rsvp.guestsManuallyEditedAt = override.updatedAt
        }
      }
    } catch (error) {
      console.error('Failed to load guest overrides, continuing without them:', error)
    }

    // Second pass: detect people who submitted their own RSVP separately after
    // already being listed as someone else's guest (e.g. a partner or plus-one).
    // Matches are flagged (not removed) so admins can manually verify, and are
    // excluded from headcount stats to avoid double counting.
    const byNormalizedName = new Map<string, AdminRsvp>()
    for (const rsvp of rsvps) {
      const key = normalizeName(rsvp.firstName)
      if (key) byNormalizedName.set(key, rsvp)
    }

    for (const rsvp of rsvps) {
      for (const guest of rsvp.guests) {
        for (const other of rsvps) {
          if (other.email === rsvp.email) continue
          if (isNameMatch(guest.name, other.firstName)) {
            guest.isDuplicate = true
            guest.duplicateOfEmail = other.email
            other.matchedAsGuestIn = [...(other.matchedAsGuestIn ?? []), rsvp.id]
            break
          }
        }
      }
    }

    // Compute summary stats
    const partySize = (r: AdminRsvp) => 1 + r.guests.filter((g) => !g.isDuplicate).length
    const attending = rsvps.filter((r) => r.likelihood !== 'no')
    const stats = {
      total: rsvps.length,
      definitely: rsvps.filter((r) => r.likelihood === 'definitely').length,
      highlyLikely: rsvps.filter((r) => r.likelihood === 'highly_likely').length,
      maybe: rsvps.filter((r) => r.likelihood === 'maybe').length,
      declined: rsvps.filter((r) => r.likelihood === 'no').length,
      totalAttendees: attending.reduce((sum, r) => sum + partySize(r), 0),
      attendingWelcome: attending
        .filter((r) => r.events?.welcome === 'yes')
        .reduce((sum, r) => sum + partySize(r), 0),
      attendingCeremony: attending
        .filter((r) => r.events?.ceremony === 'yes')
        .reduce((sum, r) => sum + partySize(r), 0),
      attendingBrunch: attending
        .filter((r) => r.events?.brunch === 'yes')
        .reduce((sum, r) => sum + partySize(r), 0),
      possibleDuplicates: rsvps.filter(
        (r) => r.guests.some((g) => g.isDuplicate) || (r.matchedAsGuestIn?.length ?? 0) > 0
      ).length,
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
